
"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCollection, useDocument } from "react-firebase-hooks/firestore"
import { collection, query, where, Timestamp, doc, setDoc, serverTimestamp, deleteField, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, PlusCircle, Loader2, Edit, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Note {
  id: string
  title: string
  patient: string
  summary: string
  date?: Timestamp
  tag: string
}

interface Patient {
  id: string
  name: string
  age?: number
  gender?: 'Male' | 'Female' | 'Other'
  photoURL?: string
  ownerId: string
  createdAt?: Timestamp
  status?: 'active' | 'inactive'
  statusMode?: 'auto' | 'manual'
}

const patientFormSchema = z.object({
  age: z.coerce.number().min(0, "Age must be a positive number.").max(120).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  statusMode: z.enum(['auto', 'manual']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [cutoffDate, setCutoffDate] = useState(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo;
  });

  const patientName = useMemo(() => {
    const idParam = params.id as string;
    return idParam ? decodeURIComponent(idParam) : "";
  }, [params.id])

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
  const patientQuery = user && patientName ? query(patientsRef, where("ownerId", "==", user.uid), where("name", "==", patientName)) : null
  const [patientSnapshot, isLoadingPatient, errorPatient] = useCollection(patientQuery)
  
  const patient = useMemo(() => {
    if (!patientSnapshot || patientSnapshot.empty) return null
    const doc = patientSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Patient
  }, [patientSnapshot])

  const notesRef = collection(db, "notes")
  const notesQuery = user && patientName ? query(notesRef, where("ownerId", "==", user.uid), where("patient", "==", patientName)) : null
  const [notesSnapshot, isLoadingNotes, errorNotes] = useCollection(notesQuery)
  const notes = notesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note))

  const { finalStatus } = useMemo(() => {
    if (!notes && !patient) return { finalStatus: 'inactive' };

    const lastVisit = notes
        ?.map(n => n.date?.toDate())
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

    const effectiveStatusMode = patient?.statusMode || 'auto';
    let finalStatus: 'active' | 'inactive' = 'inactive';

    if (effectiveStatusMode === 'manual') {
        finalStatus = patient?.status || 'inactive';
    } else {
        finalStatus = lastVisit && lastVisit > cutoffDate ? 'active' : 'inactive';
    }
    
    return { finalStatus };
  }, [patient, notes, cutoffDate]);

  const form = useForm<z.infer<typeof patientFormSchema>>({
    resolver: zodResolver(patientFormSchema),
  });
  
  const statusMode = form.watch('statusMode');

  useEffect(() => {
    if (patient) {
      form.reset({
        age: patient.age,
        gender: patient.gender,
        statusMode: patient.statusMode || 'auto',
        status: patient.status || 'inactive',
      });
    }
  }, [patient, form]);

  async function onUpdatePatient(values: z.infer<typeof patientFormSchema>) {
    if (!user || !patientName) return;
    setIsSaving(true);
    
    const dataToSave: { [key: string]: any } = {};

    if (values.age !== undefined && !isNaN(values.age)) {
        dataToSave.age = values.age;
    } else {
        dataToSave.age = deleteField();
    }
    
    if (values.gender) {
        dataToSave.gender = values.gender;
    } else {
        dataToSave.gender = deleteField();
    }

    if (values.statusMode) {
        dataToSave.statusMode = values.statusMode;
    }
    
    if (values.statusMode === 'manual' && values.status) {
        dataToSave.status = values.status;
    } else {
        dataToSave.status = deleteField();
    }
    
    const patientDataForDb = {
      ...dataToSave,
      name: patientName,
      ownerId: user.uid,
      createdAt: patient?.createdAt || serverTimestamp()
    };
    
    const docRef = patient ? doc(db, "patients", patient.id) : doc(db, "patients", `${user.uid}_${patientName.replace(/ /g, '_')}`);

    try {
      await setDoc(docRef, patientDataForDb, { merge: true });
      toast({ title: "Patient details updated." });
      setIsEditOpen(false);
    } catch(err) {
      console.error("Failed to update patient", err);
      toast({ variant: 'destructive', title: 'Error updating patient' });
    } finally {
      setIsSaving(false);
    }
  }

  const error = errorPatient || errorNotes;
  if (error) {
    const isIndexError = error.message.includes("firestore/failed-precondition") || error.message.includes("indexes?create_composite");
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Data</CardTitle>
          <CardDescription>
            {isIndexError 
              ? "A required database index is missing. Please create it in your Firebase project console to enable this feature."
              : "An unexpected error occurred."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-destructive font-mono bg-destructive/10 p-4 rounded-md text-sm">
            {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!isClient || isLoadingPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <Card><CardHeader><Skeleton className="h-6 w-1/3"/></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    )
  }
  
  const displayAge = patient?.age ?? 'N/A';
  const displayGender = patient?.gender ?? 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border" data-ai-hint="person avatar">
                <AvatarImage src={patient?.photoURL} />
                <AvatarFallback className="text-3xl">{patientName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
              </Avatar>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{patientName}</h1>
                <div className="flex items-center flex-wrap gap-2 text-muted-foreground mt-1">
                    <span>{displayAge} years old, {displayGender}</span>
                    <Badge variant={finalStatus === 'active' ? 'default' : 'secondary'} className={cn('capitalize', finalStatus === 'active' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-600 bg-gray-50 text-gray-700')}>
                        {finalStatus}
                    </Badge>
                </div>
            </div>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto"><Edit className="mr-2 h-4 w-4" /> Edit Patient</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Patient Details</DialogTitle>
                        <DialogDescription>
                            Update the patient's information below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onUpdatePatient)} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="statusMode"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Status Mode</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex items-center space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="auto" /></FormControl>
                                    <FormLabel className="font-normal">Automatic</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="manual" /></FormControl>
                                    <FormLabel className="font-normal">Manual</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {statusMode === 'manual' && (
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Manual Status</FormLabel>
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex items-center space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="active" /></FormControl>
                                        <FormLabel className="font-normal">Active</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="inactive" /></FormControl>
                                        <FormLabel className="font-normal">Inactive</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Button asChild className="w-full sm:w-auto">
                <Link href={`/dashboard/notes/new?patient=${encodeURIComponent(patientName)}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Note
                </Link>
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Clinical Notes</CardTitle>
          <CardDescription>All clinical notes associated with {patientName}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNotes ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : notes && notes.length > 0 ? (
            <div className="space-y-4">
              {notes.sort((a,b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0)).map(note => (
                <Link key={note.id} href={`/dashboard/notes/${note.id}`} className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex-grow">
                      <h3 className="font-semibold">{note.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{note.summary}</p>
                    </div>
                    <div className="text-left sm:text-right text-sm text-muted-foreground flex-shrink-0 sm:ml-4">
                       <p>{note.date?.toDate().toLocaleDateString() ?? 'No Date'}</p>
                       <Badge variant="outline" className="mt-1">{note.tag}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No Notes Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">This patient doesn't have any notes yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
    

    
