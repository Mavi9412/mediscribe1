
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Search, Loader2, PlusCircle, Trash2, Activity, CirclePlay, CircleSlash, Archive, ArchiveRestore } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, query, where, Timestamp, writeBatch, getDocs, doc, addDoc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Note {
  id: string
  patient: string
  date: Timestamp
  ownerId: string
  isDraft?: boolean
}

interface PatientDetails {
  id: string
  name: string
  age?: number
  gender?: 'Male' | 'Female' | 'Other'
  photoURL?: string;
  ownerId: string
  createdAt?: Timestamp
  status?: 'active' | 'inactive'
  statusMode?: 'auto' | 'manual'
  isArchived?: boolean;
}

interface Patient extends PatientDetails {
  lastVisit?: Timestamp
  noteCount: number
  finalStatus: 'active' | 'inactive'
}

const newPatientSchema = z.object({
  name: z.string().min(2, { message: "Patient name must be at least 2 characters." }),
});

export default function PatientsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("all")

  const [cutoffDate, setCutoffDate] = useState(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo;
  });

  useEffect(() => {
    if (user) {
      const loadSettings = async () => {
        const profileRef = doc(db, "userProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const settings = profileSnap.data();
          const duration = settings.patientStatusDuration || 6;
          const unit = settings.patientStatusUnit || 'months';
          
          const newCutoffDate = new Date();
          if (unit === 'days') newCutoffDate.setDate(newCutoffDate.getDate() - duration);
          else if (unit === 'months') newCutoffDate.setMonth(newCutoffDate.getMonth() - duration);
          else if (unit === 'years') newCutoffDate.setFullYear(newCutoffDate.getFullYear() - duration);
          
          setCutoffDate(newCutoffDate);
        }
      };
      loadSettings();
    }
  }, [user]);

  const patientsRef = collection(db, "patients")
  const patientsQuery = user ? query(patientsRef, where("ownerId", "==", user.uid)) : null
  const [patientDetailsSnapshot, isLoadingPatientDetails, errorPatientDetails] = useCollection(patientsQuery)
  
  const notesRef = collection(db, "notes")
  const notesQuery = user ? query(notesRef, where("ownerId", "==", user.uid), where("isDraft", "!=", true)) : null
  const [notesSnapshot, isLoadingNotes, errorNotes] = useCollection(notesQuery)

  const form = useForm<z.infer<typeof newPatientSchema>>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: {
      name: "",
    },
  });

  const patientsData = useMemo(() => {
    const allPatients = new Map<string, Partial<Patient>>();

    notesSnapshot?.docs.forEach(doc => {
        const note = doc.data() as Note;
        if (!note.patient) return;

        const existing = allPatients.get(note.patient) || { name: note.patient, noteCount: 0 };
        existing.noteCount = (existing.noteCount || 0) + 1;
        if (!existing.lastVisit || (note.date && note.date > existing.lastVisit!)) {
            existing.lastVisit = note.date;
        }
        allPatients.set(note.patient, existing);
    });

    patientDetailsSnapshot?.docs.forEach(doc => {
        const details = { id: doc.id, ...doc.data() } as PatientDetails;
        const existing = allPatients.get(details.name) || { name: details.name, noteCount: 0 };
        allPatients.set(details.name, { ...existing, ...details });
    });

    return Array.from(allPatients.values())
        .map(p => {
            let finalStatus: 'active' | 'inactive' = 'inactive';
            if (p.statusMode === 'manual') {
                finalStatus = p.status || 'inactive';
            } else { // Automatic mode
                finalStatus = p.lastVisit && p.lastVisit.toDate() > cutoffDate ? 'active' : 'inactive';
            }
            return { ...p, noteCount: p.noteCount || 0, finalStatus, isArchived: p.isArchived || false } as Patient
        })
        .sort((a, b) => (b.lastVisit?.toMillis() || 0) - (a.lastVisit?.toMillis() || 0));

  }, [notesSnapshot, patientDetailsSnapshot, cutoffDate]);

  async function onCreatePatient(values: z.infer<typeof newPatientSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }

    const patientExists = patientsData.some(p => p.name.toLowerCase() === values.name.toLowerCase());
    if (patientExists) {
        toast({
            variant: "destructive",
            title: "Patient already exists",
            description: `A patient with the name "${values.name}" is already in your list.`,
        });
        return;
    }
    
    setIsCreating(true);
    try {
      const patientData = {
        name: values.name,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        isArchived: false,
      };
      await addDoc(collection(db, "patients"), patientData);

      toast({ title: "Patient created successfully." });
      router.push(`/dashboard/patients/${encodeURIComponent(values.name)}`);
      setCreateOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({ variant: "destructive", title: "Failed to create patient." });
    } finally {
      setIsCreating(false);
    }
  }

  const handleDeletePatient = async () => {
    if (!patientToDelete || !user) return;

    try {
      const batch = writeBatch(db);

      const notesToDeleteQuery = query(
        collection(db, "notes"),
        where("ownerId", "==", user.uid),
        where("patient", "==", patientToDelete.name)
      );
      const notesToDeleteSnapshot = await getDocs(notesToDeleteQuery);
      notesToDeleteSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (patientToDelete.id) {
        batch.delete(doc(db, "patients", patientToDelete.id));
      }

      await batch.commit();

      toast({
        title: "Patient Deleted",
        description: `Successfully deleted ${patientToDelete.name} and all associated notes.`,
      });
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the patient and their notes. Please try again.",
      });
    } finally {
        setPatientToDelete(null);
    }
  };

  const handleToggleArchive = async (patient: Patient) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }
    if (!patient.id) {
        toast({ variant: "destructive", title: "Patient record not found." });
        return;
    }

    const patientRef = doc(db, "patients", patient.id);
    try {
        await updateDoc(patientRef, { isArchived: !patient.isArchived });
        toast({
            title: `Patient ${patient.isArchived ? "Restored" : "Archived"}`,
            description: `${patient.name} has been ${patient.isArchived ? "restored" : "archived"}.`,
        });
    } catch (error) {
        console.error("Error archiving patient:", error);
        toast({ variant: "destructive", title: "Action Failed", description: "Could not update the patient's archive status." });
    }
};

  const handleSetStatus = async (patient: Patient, mode: 'auto' | 'manual', newStatus?: 'active' | 'inactive') => {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }

    const docRef = patient.id ? doc(db, "patients", patient.id) : doc(db, "patients", `${user.uid}_${patient.name.replace(/ /g, '_')}`);
    
    const dataToSet: any = { statusMode: mode };

    if (mode === 'manual' && newStatus) {
      dataToSet.status = newStatus;
    } else if (mode === 'auto') {
      dataToSet.status = null;
    }

    if (!patient.id) {
      dataToSet.name = patient.name;
      dataToSet.ownerId = user.uid;
      dataToSet.createdAt = serverTimestamp();
    }

    try {
      await setDoc(docRef, dataToSet, { merge: true });
      toast({ title: "Patient status updated." });
    } catch (error) {
      console.error("Error updating patient status:", error);
      toast({ variant: "destructive", title: "Failed to update status." });
    }
  };

  const filteredPatients = useMemo(() => {
    return patientsData.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTab;
        switch (activeTab) {
            case 'active':
                matchesTab = !patient.isArchived && patient.finalStatus === 'active';
                break;
            case 'inactive':
                matchesTab = !patient.isArchived && patient.finalStatus === 'inactive';
                break;
            case 'archived':
                matchesTab = patient.isArchived;
                break;
            case 'all':
            default:
                matchesTab = !patient.isArchived;
                break;
        }

        return matchesSearch && matchesTab;
    });
  }, [patientsData, searchTerm, activeTab])

  const isLoading = isLoadingNotes || isLoadingPatientDetails;
  const error = errorNotes || errorPatientDetails;

  if (error) return <p className="text-destructive">Error: {error.message}</p>

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="font-medium">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))
    }

    if (filteredPatients.length > 0) {
      return filteredPatients.map(patient => (
        <TableRow key={patient.name} onClick={() => router.push(`/dashboard/patients/${encodeURIComponent(patient.name)}`)} className="cursor-pointer">
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9" data-ai-hint="person avatar">
                <AvatarImage src={patient.photoURL} />
                <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="font-medium">{patient.name}</div>
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">{patient.age ?? 'N/A'}</TableCell>
          <TableCell className="hidden lg:table-cell">{patient.gender ?? 'N/A'}</TableCell>
          <TableCell>
              <Badge variant={patient.finalStatus === 'active' ? 'default' : 'secondary'} className={cn('capitalize', patient.finalStatus === 'active' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-600 bg-gray-50 text-gray-700')}>
                  {patient.finalStatus}
              </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">{patient.lastVisit?.toDate().toLocaleDateString() ?? 'N/A'}</TableCell>
          <TableCell className="hidden lg:table-cell">{patient.noteCount}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" onClick={e => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => router.push(`/dashboard/patients/${encodeURIComponent(patient.name)}`)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push(`/dashboard/notes/new?patient=${encodeURIComponent(patient.name)}`)}>Add New Note</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onSelect={() => handleSetStatus(patient, 'manual', 'active')}><CirclePlay className="mr-2 h-4 w-4" />Mark as Active</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSetStatus(patient, 'manual', 'inactive')}><CircleSlash className="mr-2 h-4 w-4" />Mark as Inactive</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSetStatus(patient, 'auto')}>Use Automatic</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onSelect={() => handleToggleArchive(patient)}>
                  {patient.isArchived ? "Restore" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPatientToDelete(patient)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))
    }

    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
            {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : "No patients found. Create a patient to get started."}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">A list of all patients in your records, generated from your notes.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Patient
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Age</TableHead>
                <TableHead className="hidden lg:table-cell">Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Visit</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredPatients.length}</strong> of <strong>{patientsData.length}</strong> patients.
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Patient</DialogTitle>
                <DialogDescription>
                    Enter the name for the new patient. You'll be taken to their detail page after creation.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreatePatient)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Patient Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Jane Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isCreating}>
                             {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Patient
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!patientToDelete} onOpenChange={() => setPatientToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the patient{" "}
                <strong>{patientToDelete?.name}</strong> and all of their associated notes.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
