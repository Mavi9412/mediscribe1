
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, doc, getDoc, query, serverTimestamp, setDoc, where } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { updateProfile } from "firebase/auth"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Template {
  id: string;
  name: string;
}

const profileSettingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  medicalField: z.string().optional(),
  speciality: z.string().optional(),
  additionalInfo: z.string().optional(),
  allowPersonalInfo: z.boolean().default(false),
  
  defaultTemplate: z.string().optional(),
  noteDetailLevel: z.enum(['Concise', 'Default', 'Detailed']).optional(),
  noteFormat: z.enum(['Bullet Point', 'Default', 'Narrative']).optional(),
  defaultModel: z.string().optional(),

  patientStatusDuration: z.coerce.number().min(1).optional(),
  patientStatusUnit: z.enum(['days', 'months', 'years']).optional(),

  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  clinicPhone: z.string().optional(),
  clinicEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  emrSystem: z.string().optional(),
  additionalClinicInfo: z.string().optional(),
  allowClinicInfo: z.boolean().default(false),

  enable2FA: z.boolean().default(false),
  phoneNumber: z.string().optional(),
});

type ProfileSettingsForm = z.infer<typeof profileSettingsSchema>;

const detailLevelDescriptions: Record<string, string> = {
  'Concise': 'Generates a brief, summary-level note.',
  'Default': 'A balanced level of detail suitable for most encounters.',
  'Detailed': 'Produces a comprehensive, in-depth note covering all aspects.'
};

const noteFormatDescriptions: Record<string, string> = {
  'Bullet Point': 'Uses lists and bullet points for easy scanning.',
  'Default': 'A mix of prose and lists for a standard note.',
  'Narrative': 'Writes the note in full sentences and paragraphs.'
};

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const templatesRef = collection(db, "templates");
  const templatesQuery = user ? query(templatesRef, where("ownerId", "==", user.uid)) : null;
  const [templatesSnapshot, isLoadingTemplates] = useCollection(templatesQuery);

  const userTemplates = useMemo(() => {
    if (!templatesSnapshot) return [];
    return templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
  }, [templatesSnapshot]);

  const form = useForm<ProfileSettingsForm>({
    resolver: zodResolver(profileSettingsSchema),
  });
  
  const loadData = useCallback(async () => {
    if (user) {
      setIsLoadingData(true);
      const nameParts = user.displayName?.split(" ") || ["", ""];
      
      const profileRef = doc(db, "userProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      let profileData: Partial<ProfileSettingsForm> = {};
      if (profileSnap.exists()) {
        profileData = profileSnap.data();
      }
      
      const defaultValues: ProfileSettingsForm = {
        firstName: "",
        lastName: "",
        medicalField: "",
        speciality: "",
        additionalInfo: "",
        allowPersonalInfo: false,
        defaultTemplate: "soap",
        noteDetailLevel: 'Default',
        noteFormat: 'Default',
        defaultModel: 'gemini-1.5-flash',
        patientStatusDuration: 6,
        patientStatusUnit: 'months',
        clinicName: "",
        clinicAddress: "",
        clinicPhone: "",
        clinicEmail: "",
        emrSystem: "",
        additionalClinicInfo: "",
        allowClinicInfo: false,
        enable2FA: false,
        phoneNumber: "",
      };

      const initialValues = {
        ...defaultValues,
        ...profileData,
        firstName: profileData.firstName || nameParts[0] || "",
        lastName: profileData.lastName || nameParts.slice(1).join(" ") || "",
      };

      form.reset(initialValues);
      setIsLoadingData(false);
    }
  }, [user, form]);


  useEffect(() => {
    if (!isAuthLoading) {
        loadData();
    }
  }, [user, isAuthLoading, loadData]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);


  const onSubmit = async (values: ProfileSettingsForm) => {
    if (!user || !auth.currentUser) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }
    setIsSaving(true);
    try {
      const newDisplayName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      if (auth.currentUser.displayName !== newDisplayName) {
        await updateProfile(auth.currentUser, { displayName: newDisplayName });
      }
      
      const profileRef = doc(db, "userProfiles", user.uid);
      await setDoc(profileRef, { ...values, ownerId: user.uid, updatedAt: serverTimestamp() }, { merge: true });

      toast({ title: "Settings saved successfully!" });
      // Reload data to set the new initial state
      await loadData();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ variant: "destructive", title: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const enable2FA = form.watch("enable2FA");
  const noteDetailLevel = form.watch("noteDetailLevel");
  const noteFormat = form.watch("noteFormat");
  
  const isLoading = isAuthLoading || isLoadingData || isLoadingTemplates;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and app preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>This information can be used by the AI to personalize your notes if you allow it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="medicalField" render={({ field }) => (
                <FormItem><FormLabel>Medical Field</FormLabel><FormControl><Input placeholder="e.g., Physician" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="speciality" render={({ field }) => (
                <FormItem><FormLabel>Specialty</FormLabel><FormControl><Input placeholder="e.g., Cardiology" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="additionalInfo" render={({ field }) => (
              <FormItem><FormLabel>Additional Info about You</FormLabel><FormControl><Textarea placeholder="e.g. My NPI is 123456" {...field} /></FormControl><FormDescription>Add any other personal details you want the AI to know.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="allowPersonalInfo" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>Use Personal Info in Notes</FormLabel>
                    <FormDescription>Allow MediScribe AI to use your profile information when generating notes.</FormDescription>
                </div>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account's security options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enable2FA"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Two-Factor Authentication (2FA)</FormLabel>
                    <FormDescription>
                      Secure your account with an additional verification step using your phone.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {enable2FA && (
              <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 555-5555" {...field} />
                      </FormControl>
                      <FormDescription>
                        A verification code will be sent to this number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" disabled>Verify Phone Number</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>AI & Note Preferences</CardTitle><CardDescription>Customize your default note-taking experience.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
             <FormField control={form.control} name="defaultTemplate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Template</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="No default template" /></SelectTrigger></FormControl>
                      <SelectContent>
                         {userTemplates.length > 0 && (<SelectGroup><SelectLabel>Your Templates</SelectLabel>{userTemplates.map((t) => (<SelectItem key={t.id} value={`custom-${t.id}`}>{t.name}</SelectItem>))}</SelectGroup>)}
                          {(userTemplates.length > 0) && <SelectSeparator />}
                          <SelectGroup>
                              <SelectLabel>Standard Templates</SelectLabel>
                              <SelectItem value="soap">Standard SOAP Note</SelectItem>
                              <SelectItem value="hp">Initial Consultation H&P</SelectItem>
                              <SelectItem value="followup">Follow-up Visit Note</SelectItem>
                              <SelectItem value="physical_exam">Physical Examination</SelectItem>
                              <SelectItem value="procedure_note">Procedure Note</SelectItem>
                              <SelectItem value="or_report">OR Report</SelectItem>
                              <SelectItem value="specialty_consult">Specialty-Specific Consult</SelectItem>
                              <SelectItem value="allied_health">Allied-Health Note</SelectItem>
                              <SelectItem value="diagnostic_report">Diagnostic Report</SelectItem>
                              <SelectItem value="disability_form">Disability Form</SelectItem>
                              <SelectItem value="consult_letter">Consult Letter</SelectItem>
                          </SelectGroup>
                      </SelectContent>
                    </Select>
                  <FormDescription>This template will be selected by default on the record and new note pages.</FormDescription><FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="noteDetailLevel" render={({ field }) => (
                <FormItem><FormLabel>Default Note Detail Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Concise">Concise</SelectItem><SelectItem value="Default">Default</SelectItem><SelectItem value="Detailed">Detailed</SelectItem></SelectContent>
                  </Select>
                  <FormDescription>{detailLevelDescriptions[noteDetailLevel || 'Default']}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="noteFormat" render={({ field }) => (
                <FormItem><FormLabel>Default Note Format</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Bullet Point">Bullet Point</SelectItem><SelectItem value="Default">Default</SelectItem><SelectItem value="Narrative">Narrative</SelectItem></SelectContent>
                  </Select>
                  <FormDescription>{noteFormatDescriptions[noteFormat || 'Default']}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
             <FormField control={form.control} name="defaultModel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Default AI Model</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a default model" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormDescription>Choose the default model for generating notes.</FormDescription><FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
                <FormLabel>Patient Status Automation</FormLabel>
                <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
                  <span className="text-sm">Define an 'active' patient as someone with a note in the last</span>
                  <FormField control={form.control} name="patientStatusDuration" render={({ field }) => (
                    <FormItem className="w-20"><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                   <FormField control={form.control} name="patientStatusUnit" render={({ field }) => (
                    <FormItem className="w-28">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="days">Days</SelectItem><SelectItem value="months">Months</SelectItem><SelectItem value="years">Years</SelectItem></SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <FormDescription>This rule determines the automatic "active" or "inactive" status for patients.</FormDescription>
             </FormItem>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Clinic Information</CardTitle><CardDescription>Add your clinic's details to be used in letterheads or specific templates.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="clinicName" render={({ field }) => (
              <FormItem><FormLabel>Clinic Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="clinicAddress" render={({ field }) => (
              <FormItem><FormLabel>Clinic Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="clinicPhone" render={({ field }) => (
                <FormItem><FormLabel>Clinic Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="clinicEmail" render={({ field }) => (
                <FormItem><FormLabel>Clinic Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="emrSystem" render={({ field }) => (
                <FormItem><FormLabel>EMR System Name</FormLabel><FormControl><Input placeholder="e.g. Epic, Cerner" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="additionalClinicInfo" render={({ field }) => (
              <FormItem><FormLabel>Additional Clinic Info</FormLabel><FormControl><Textarea placeholder="e.g. Clinic hours, fax number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="allowClinicInfo" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>Use Clinic Info in Notes</FormLabel>
                        <FormDescription>Allow MediScribe AI to use your clinic information when generating notes.</FormDescription>
                    </div>
              </FormItem>
            )} />
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      </form>
    </Form>
  )
}
