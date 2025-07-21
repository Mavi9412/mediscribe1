
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { generateComprehensiveNote } from "@/ai/flows/generate-comprehensive-note"
import { summarizeNote } from "@/ai/flows/summarize-note"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Sparkles, Mic, Upload, ArrowLeft, Crown } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, query, where, getDocs,getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useCollection } from "react-firebase-hooks/firestore"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const templateContents: Record<string, string> = {
  soap: `### Subjective

**Chief Complaint:**
- 

**History of Present Illness:**
- 

### Objective

**Vitals:**
- 
**Physical Exam:**
- 

### Assessment
- 

### Plan
- `,
  hp: `### Chief Complaint
- 

### History of Present Illness
- 

### Past Medical History
- 
        
### Past Surgical History
- 

### Medications
- 

### Allergies
- 

### Family History
- 

### Social History
- 

### Review of Systems
- **General:** 
- **HEENT:** 
- **Cardiovascular:** 
- **Respiratory:** 
- **Gastrointestinal:** 
- **Genitourinary:** 
- **Musculoskeletal:** 
- **Skin:** 
- **Neurological:** 
- **Psychiatric:** 

### Objective

**Vitals:**
- **BP:** 
- **HR:** 
- **RR:** 
- **Temp:** 
- **O2 Sat:** 

**Physical Exam:**
- **General:** 
- **HEENT:** 
- **Neck:** 
- **Chest/Lungs:** 
- **Heart:** 
- **Abdomen:** 
- **Extremities:** 
- **Skin:** 
- **Neurologic:** 

### Assessment
- 

### Plan
- `,
  followup: `### Subjective
        
**Interval History:**
- Review of patient's progress since last visit.
- Any new symptoms or concerns.
- Medication tolerance and adherence.

### Objective

**Vitals:**
- **BP:**
- **HR:**

**Focused Physical Exam:**
- [Relevant exam findings]

### Assessment
- [Updated assessment based on interval history and exam]

### Plan
- [Adjustments to treatment plan]
- [Medication refills or changes]
- [Patient education]
- [Follow-up instructions]`,
  physical_exam: `### General Appearance
- 

### Vitals
- **BP:** 
- **HR:** 
- **RR:** 
- **Temp:** 
- **O2 Sat:** 

### HEENT (Head, Eyes, Ears, Nose, Throat)
- **Head:** 
- **Eyes:** 
- **Ears:** 
- **Nose:** 
- **Throat:** 

### Neck
- 

### Cardiovascular
- 

### Chest/Lungs
- 

### Abdomen
- 

### Extremities
- 

### Skin
- 

### Neurologic
- 

### Musculoskeletal
- `,
  procedure_note: `### Procedure
- 

### Indications
- 

### Anesthesia
- 

### Description of Procedure
- 

### Findings
- 

### Complications
- 

### Post-procedure Instructions
- `,
  or_report: `### Preoperative Diagnosis
- 

### Postoperative Diagnosis
- 

### Procedure
- 

### Surgeon(s)
- 

### Anesthesia
- 

### Findings
- 

### Specimens
- 

### Drains
- 

### Estimated Blood Loss
- 

### Complications
- 

### Disposition
- `,
  specialty_consult: `### Reason for Consultation
- 

### History of Present Illness
- 

### Past Medical History
- 

### Medications
- 

### Physical Examination
- 

### Assessment
- 

### Recommendations
- `,
  allied_health: `### Subjective
- Patient's report of pain, function, etc.

### Objective
- **Observation:** 
- **Range of Motion:** 
- **Strength:** 
- **Special Tests:** 

### Assessment
- Professional diagnosis.

### Plan
- Treatment provided today.
- Plan for future sessions.
- Home exercise program.`,
  diagnostic_report: `### Examination
- [e.g., CT Scan of the Abdomen with Contrast]

### Clinical History
- 

### Comparison
- [e.g., Prior study from YYYY-MM-DD]

### Technique
- 

### Findings
- 

### Impression
- `,
  disability_form: `### Patient Information
- **Name:** 
- **Date of Birth:** 

### Diagnosis
- 

### Date of Onset of Disability
- 

### Functional Limitations
- **Lifting/Carrying:** 
- **Standing/Walking:** 
- **Sitting:** 
- **Reaching/Handling:** 

### Prognosis
- 

### Treating Physician's Signature
- `,
  consult_letter: `Dear Dr. [Referring Physician Name],

Thank you for referring [Patient Name] for consultation regarding [Reason for Referral].

### History
- [Brief summary of patient's history]

### Examination Findings
- [Key findings from physical exam]

### Assessment
- [Your assessment and diagnosis]

### Plan & Recommendations
- [Your recommendations for treatment and follow-up]

I will see the patient back in [Timeframe] for follow-up. Please do not hesitate to contact me if you have any further questions.

Sincerely,
[Your Name]`,
};

const templateNames: Record<string, string> = {
  soap: "Standard SOAP Note",
  hp: "Initial Consultation H&P",
  followup: "Follow-up Visit Note",
  physical_exam: "Physical Examination",
  procedure_note: "Procedure Note",
  or_report: "OR Report",
  specialty_consult: "Specialty-Specific Consult",
  allied_health: "Allied-Health Note",
  diagnostic_report: "Diagnostic Report",
  disability_form: "Disability Form",
  consult_letter: "Consult Letter",
};

interface Note {
  id: string;
  title: string;
  patient: string;
  tag: string;
  date: Timestamp;
  lastEdited?: Timestamp;
  summary: string;
  note: string;
  transcript: string;
  isDraft?: boolean;
}

interface Template {
  id: string;
  name: string;
  content: string;
  ownerId: string;
}

interface Macro {
  id: string;
  name: string;
  trigger: string;
  content: string;
  ownerId: string;
}

export default function NewNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, userProfile, isLoading: isAuthLoading } = useAuth()

  const [transcript, setTranscript] = useState("")
  const [generatedNote, setGeneratedNote] = useState("")
  const [title, setTitle] = useState("")
  const [patient, setPatient] = useState("")
  const [tag, setTag] = useState("")
  const [template, setTemplate] = useState("soap")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const [isUpgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  const initialGenerationRef = useRef(false);

  const templatesRef = collection(db, "templates");
  const templatesQuery = user ? query(templatesRef, where("ownerId", "==", user.uid)) : null;
  const [templatesSnapshot, isLoadingTemplates] = useCollection(templatesQuery);

  const userTemplates = useMemo(() => {
    if (!templatesSnapshot) return [];
    return templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
  }, [templatesSnapshot]);

  const macrosRef = collection(db, "macros");
  const userMacrosQuery = user ? query(macrosRef, where("ownerId", "==", user.uid)) : null;
  const [macrosSnapshot] = useCollection(userMacrosQuery);

  const userMacros = useMemo(() => {
    if (!macrosSnapshot) return [];
    return macrosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Macro));
  }, [macrosSnapshot]);

  const isLoading = isAuthLoading || isLoadingNote || isLoadingTemplates;

  useEffect(() => {
    const noteId = searchParams.get('id');
    const patientParam = searchParams.get('patient');
    
    if (patientParam) {
      setPatient(patientParam);
    }
    setEditingNoteId(noteId);

    const loadNote = async (id: string) => {
      setIsLoadingNote(true);
      const docRef = doc(db, "notes", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const noteData = docSnap.data() as Omit<Note, 'id'>;
        setTitle(noteData.title);
        setPatient(noteData.patient);
        setTag(noteData.tag);
        setTranscript(noteData.transcript);
        setGeneratedNote(noteData.note);
      } else {
        toast({ variant: 'destructive', title: 'Note not found.'});
        router.push('/dashboard/notes');
      }
      setIsLoadingNote(false);
    };
    
    if (noteId) {
      loadNote(noteId);
    } else {
      setIsLoadingNote(false);
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (isLoading || editingNoteId) return;

    const savedTranscript = localStorage.getItem("currentTranscript");
    
    // Set template from URL param or user profile default.
    const templateParam = searchParams.get('template') || userProfile?.defaultTemplate || "soap";
    setTemplate(templateParam);
    handleTemplateChange(templateParam);

    if (savedTranscript) {
      setTranscript(savedTranscript);

      // Only run auto-generation once, and if there's a transcript.
      if (!initialGenerationRef.current) {
        initialGenerationRef.current = true;
        handleGenerateNote(savedTranscript, templateParam);
        localStorage.removeItem("currentTranscript");
      }
    }
  }, [isLoading, editingNoteId, userProfile, searchParams]);


  const handleTemplateChange = (templateKey: string) => {
    setTemplate(templateKey);
    let templateContentForNote = "";
    let templateNameForTitle = "";

    if (templateKey.startsWith('custom-')) {
        const templateId = templateKey.replace('custom-', '');
        const selectedTemplate = userTemplates.find(t => t.id === templateId);
        if (selectedTemplate) {
            templateContentForNote = selectedTemplate.content;
            templateNameForTitle = selectedTemplate.name;
        }
    } else {
        templateContentForNote = templateContents[templateKey as keyof typeof templateContents];
        templateNameForTitle = templateNames[templateKey as keyof typeof templateNames];
    }
    
    setGeneratedNote(templateContentForNote);
    if (templateNameForTitle) {
      setTitle(`${templateNameForTitle} - ${patient || '[Patient Name]'}`);
    }
  };

  const handleGenerateNote = async (transcriptToUse?: string, templateToUse?:string) => {
    const currentTranscript = transcriptToUse || transcript;
    const currentTemplate = templateToUse || template;
    
    if (!currentTranscript) {
      toast({
        variant: "destructive",
        title: "No transcript available",
        description: "Please provide a transcript first.",
      })
      return
    }
    setIsGenerating(true)

    let templateName: string | undefined;
    let templateContent: string | undefined;

    if (currentTemplate.startsWith('custom-')) {
        const templateId = currentTemplate.replace('custom-', '');
        const selectedTemplate = userTemplates.find(t => t.id === templateId);
        if (selectedTemplate) {
            templateName = selectedTemplate.name;
            templateContent = selectedTemplate.content;
        } else if (!isLoadingTemplates) {
            toast({ variant: 'destructive', title: 'Custom template not found.' });
            setIsGenerating(false);
            return;
        }
    } else {
        templateName = templateNames[currentTemplate as keyof typeof templateNames];
        templateContent = templateContents[currentTemplate as keyof typeof templateContents];
    }

    try {
      const result = await generateComprehensiveNote({ 
        transcript: currentTranscript,
        templateName,
        templateContent,
        detailLevel: userProfile?.noteDetailLevel || 'Default',
        noteFormat: userProfile?.noteFormat || 'Default',
        model: userProfile?.defaultModel || 'gemini-1.5-flash',
      });
      
      setGeneratedNote(result.note);
      setTitle(result.title);
      if (!patient) {
        setPatient(result.patientName);
      }
      setTag(result.tag);

      toast({
        title: "Note Generated!",
        description: "The AI has generated a note and auto-filled the details.",
      })
    } catch (error) {
      console.error("Failed to generate note:", error)
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating the note.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentValue = e.target.value;
    const triggerSuffix = " "; // Use space as the trigger character

    const matchedMacro = userMacros.find(macro => 
      currentValue.endsWith(`${macro.trigger}${triggerSuffix}`)
    );

    if (matchedMacro) {
      const baseValue = currentValue.substring(0, currentValue.length - (matchedMacro.trigger.length + triggerSuffix.length));
      const newValue = `${baseValue}${matchedMacro.content}`;
      setGeneratedNote(newValue);
      toast({ title: `Macro "${matchedMacro.name}" expanded.` });
    } else {
      setGeneratedNote(currentValue);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "You must be logged in to save." });
      return;
    }
    if (!title || !patient || !generatedNote) {
        toast({ variant: "destructive", title: "Missing required fields.", description: "Please provide a title, patient name, and note content." });
        return;
    }

    setIsSaving(true);

    try {
        if (!editingNoteId && userProfile.plan === 'free') {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const notesCollection = collection(db, 'notes');
            const q = query(notesCollection, 
                where('ownerId', '==', user.uid), 
                where('date', '>=', startOfMonth),
                where('date', '<=', endOfMonth)
            );
            const countSnapshot = await getCountFromServer(q);
            const notesThisMonth = countSnapshot.data().count;

            if (notesThisMonth >= 5) {
                setUpgradeDialogOpen(true);
                setIsSaving(false);
                return;
            }
        }
        
        // Generate summary using AI flow
        const summaryResult = await summarizeNote({ noteContent: generatedNote });
        const summary = summaryResult.summary;

      if (editingNoteId) {
        const noteData = {
          title,
          patient,
          tag: tag || "General",
          note: generatedNote,
          transcript: transcript || "",
          summary,
          lastEdited: serverTimestamp(),
          isDraft: false,
        };
        await setDoc(doc(db, "notes", editingNoteId), noteData, { merge: true });
        toast({ title: "Note updated successfully!" });
      } else {
        const noteData = {
          ownerId: user.uid,
          title,
          patient,
          tag: tag || "General",
          note: generatedNote,
          transcript: transcript || "",
          summary,
          date: serverTimestamp(),
          isDraft: false,
        };
        const newNoteRef = await addDoc(collection(db, "notes"), noteData);
        
        // Create a notification for the new note
        await addDoc(collection(db, "notifications"), {
            ownerId: user.uid,
            type: 'note_generated',
            title: 'New Note Generated',
            description: `Your note for patient ${patient} is ready.`,
            link: `/dashboard/notes/${newNoteRef.id}`,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        
        toast({ title: "Note saved successfully!" });
      }
      router.push("/dashboard/notes");
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ variant: "destructive", title: "Save failed", description: "Could not save the note. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const pageTitle = editingNoteId ? "Edit Note" : "Create New Note";
  const pageDescription = editingNoteId ? "Make changes to your existing medical note." : "Generate a structured medical note from a transcript.";
  const saveButtonText = editingNoteId ? "Update Note" : "Save Note";
  const hasGeneratedNote = generatedNote && !generatedNote.startsWith("###");
  const generateButtonText = hasGeneratedNote ? "Regenerate" : "Generate";


  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
             <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Source Transcript</CardTitle>
                    <CardDescription>The conversation transcript to be converted into a note.</CardDescription>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                    <Button asChild variant="outline" className="hover:bg-red-600 hover:border-red-600 hover:text-white">
                        <Link href={`/dashboard/record?template=${template}`}><Mic className="mr-2 h-4 w-4" /> Record</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/upload?template=${template}`}><Upload className="mr-2 h-4 w-4" /> Upload</Link>
                    </Button>
                </div>
              </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="h-80 font-code text-sm"
              placeholder="Your transcript will appear here. You can also paste one manually."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Note Details
                    </CardTitle>
                    <CardDescription>Provide metadata for your note. Details can be auto-filled from the transcript.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="template">Template</Label>
                      <Select value={template} onValueChange={handleTemplateChange}>
                          <SelectTrigger id="template">
                              <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                              {userTemplates.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Your Templates</SelectLabel>
                                  {userTemplates.map((t) => (
                                    <SelectItem key={t.id} value={`custom-${t.id}`}>{t.name}</SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {userTemplates.length > 0 && <SelectSeparator />}
                              <SelectGroup>
                                <SelectLabel>Standard Templates</SelectLabel>
                                <SelectItem value="soap">Standard SOAP Note</SelectItem>
                                <SelectItem value="hp">Initial Consultation H&amp;P</SelectItem>
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
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="title">Note Title</Label>
                        <Input id="title" placeholder="e.g., SOAP Note - John Doe" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="patient">Patient Name</Label>
                        <Input id="patient" placeholder="e.g., John Doe" value={patient} onChange={e => setPatient(e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="tag">Tag / Specialty</Label>
                        <Input id="tag" placeholder="e.g., Cardiology" value={tag} onChange={e => setTag(e.target.value)} />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Note</CardTitle>
          <CardDescription>Review the AI-generated note below. You can edit it before saving.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-96">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">AI is generating your note...</p>
              </div>
            ) : null}
            <Textarea
              className="h-full text-sm"
              value={generatedNote}
              onChange={handleNoteChange}
              placeholder="Your note will appear here. Type a macro trigger (e.g., .fu) and press space to expand it."
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button onClick={() => handleGenerateNote()} variant="outline" disabled={isGenerating || !transcript} className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {generateButtonText}
            </Button>
            <Button onClick={handleSaveNote} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saveButtonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <AlertDialog open={isUpgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Crown className="text-amber-500"/> Free Plan Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
                You've reached your monthly limit of 5 free notes. Please upgrade to the Pro plan to create unlimited notes and unlock all features.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/dashboard/upgrade')}>
                Upgrade to Pro
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
