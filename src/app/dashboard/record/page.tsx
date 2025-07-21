
"use client"
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Mic, Save, ArrowRight, Settings, Edit, Trash2, Copy, Loader2, Pause } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAuth } from '@/hooks/use-auth'
import { addDoc, collection, serverTimestamp, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCollection } from 'react-firebase-hooks/firestore'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

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

interface Template {
  id: string;
  name: string;
  content: string;
  ownerId: string;
}

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

export default function RecordPage() {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [elapsedTime, setElapsedTime] = useState(0)
    const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState("soap")
    const router = useRouter()
    const searchParams = useSearchParams();
    const { toast } = useToast()
    const { user } = useAuth()
    
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    
    const [detailLevel, setDetailLevel] = useState('Default');
    const [noteFormat, setNoteFormat] = useState('Default');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>("");
    const startTimeRef = useRef<number>(0);

    const templatesRef = collection(db, "templates");
    const templatesQuery = user ? query(templatesRef, where("ownerId", "==", user.uid)) : null;
    const [templatesSnapshot] = useCollection(templatesQuery);

    const userTemplates = useMemo(() => {
        if (!templatesSnapshot) return [];
        return templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
    }, [templatesSnapshot]);


    useEffect(() => {
        if (user) {
            const loadSettings = async () => {
                const profileRef = doc(db, "userProfiles", user.uid);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    const settings = profileSnap.data();
                    setDetailLevel(settings.noteDetailLevel || 'Default');
                    setNoteFormat(settings.noteFormat || 'Default');
                    
                    // Prioritize URL param, then settings, then default
                    const templateParam = searchParams.get('template');
                    setSelectedTemplate(templateParam || settings.defaultTemplate || 'soap');
                } else {
                    const templateParam = searchParams.get('template');
                    setSelectedTemplate(templateParam || 'soap');
                }
            };
            loadSettings();
        } else {
            const templateParam = searchParams.get('template');
            setSelectedTemplate(templateParam || 'soap');
        }
    }, [user, searchParams]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSpeechRecognitionSupported(false);
            toast({
                variant: "destructive",
                title: "Speech Recognition Not Supported",
                description: "Your browser does not support live transcription. Please try Chrome or Safari.",
            });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
            startTimeRef.current = Date.now();
            startTimer();
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    const transcriptChunk = event.results[i][0].transcript.trim();
                    if (transcriptChunk) {
                        finalTranscriptRef.current += `[${formatTime(elapsedSeconds)}] ${transcriptChunk}\n\n`;
                    }
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscriptRef.current + interimTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            toast({
                variant: "destructive",
                title: "Transcription Error",
                description: `An error occurred: ${event.error}`,
            });
        };

        recognition.onend = () => {
            setIsRecording(false);
            stopTimer();
            setTranscript(finalTranscriptRef.current);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [toast]);

    const startTimer = () => {
        setElapsedTime(0);
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `0:${mins}:${secs}`;
    };

    const handleRecordToggle = () => {
        if (!isSpeechRecognitionSupported) return;

        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            // Start a fresh recording session
            setTranscript("");
            finalTranscriptRef.current = "";
            setIsEditingTranscript(false);
            recognitionRef.current?.start();
        }
    }

    const handleProceedToNewNote = () => {
        if (!transcript || transcript.trim().length === 0) {
            toast({
                title: "Transcript is empty",
                description: "Please record or enter a transcript before proceeding.",
                variant: "destructive"
            })
            return
        }

        let noteContent = "";
        if (selectedTemplate.startsWith('custom-')) {
            const templateId = selectedTemplate.replace('custom-', '');
            const customTemplate = userTemplates.find(t => t.id === templateId);
            if (customTemplate) {
                noteContent = customTemplate.content;
            }
        } else {
            noteContent = templateContents[selectedTemplate];
        }

        localStorage.setItem("currentTranscript", transcript);
        if (noteContent) {
           localStorage.setItem("generatedNote", noteContent);
        }
        localStorage.setItem("noteDetailLevel", detailLevel);
        localStorage.setItem("noteFormat", noteFormat);
        
        router.push(`/dashboard/notes/new?template=${selectedTemplate}`);
    }

    const handleCopyTranscript = () => {
        if (!transcript) {
            toast({ title: "Nothing to copy", variant: "destructive" });
            return;
        }
        navigator.clipboard.writeText(transcript);
        toast({ title: "Transcript copied!", description: "The transcript has been copied to your clipboard." });
    };

    const handleClearTranscript = () => {
        setTranscript("");
        finalTranscriptRef.current = "";
        setElapsedTime(0);
        if (isRecording) {
            recognitionRef.current?.stop();
        }
        toast({ title: "Transcript Cleared" });
    };

    const toggleEditTranscript = () => {
        if (isEditingTranscript) {
            // When "saving" from edit mode, update the ref to match the edited state
            finalTranscriptRef.current = transcript;
        }
        setIsEditingTranscript(!isEditingTranscript);
    }

    const handleSaveDraft = async () => {
        if (!user || !transcript.trim() || isRecording) {
            toast({
                variant: "destructive",
                title: "Cannot save draft",
                description: "There is no transcript to save or a recording is in progress.",
            });
            return;
        }

        setIsSavingDraft(true);
        try {
            await addDoc(collection(db, "notes"), {
                ownerId: user.uid,
                title: `Draft: ${new Date().toLocaleString()}`,
                patient: "Unknown",
                tag: "General",
                note: "",
                transcript: transcript,
                summary: transcript.substring(0, 150) + "...",
                date: serverTimestamp(),
                isDraft: true,
                isArchived: false,
            });

            toast({ title: "Draft saved successfully!" });
            setTranscript("");
            finalTranscriptRef.current = "";
            setElapsedTime(0);

        } catch (error) {
            console.error("Error saving draft:", error);
            toast({ variant: "destructive", title: "Save failed", description: "Could not save the draft. Please try again." });
        } finally {
            setIsSavingDraft(false);
        }
    }


  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col rounded-lg border bg-card">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b p-2 gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full sm:w-[280px] border-0 font-semibold shadow-none focus:ring-0">
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
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm"><Settings className="mr-2 h-4 w-4"/>Preferences</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Note Preferences</h4>
                            <p className="text-sm text-muted-foreground">
                                Override your default preferences for this session.
                            </p>
                        </div>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Detail Level</Label>
                                <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
                                    {Object.keys(detailLevelDescriptions).map((level) => (
                                        <Button
                                            key={level}
                                            type="button"
                                            variant={detailLevel === level ? "secondary" : "ghost"}
                                            onClick={() => setDetailLevel(level)}
                                            className={cn("h-8 text-sm", detailLevel === level && "shadow-sm bg-background hover:bg-background/90")}
                                        >
                                            {level}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground px-1">{detailLevelDescriptions[detailLevel]}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
                                    {Object.keys(noteFormatDescriptions).map((format) => (
                                        <Button
                                            key={format}
                                            type="button"
                                            variant={noteFormat === format ? "secondary" : "ghost"}
                                            onClick={() => setNoteFormat(format)}
                                            className={cn("h-8 text-sm", noteFormat === format && "shadow-sm bg-background hover:bg-background/90")}
                                        >
                                            {format}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground px-1">{noteFormatDescriptions[noteFormat]}</p>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Left Panel: Transcript */}
        <div className="flex h-full flex-col bg-card p-4">
           <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">Transcript</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleEditTranscript} disabled={isRecording}>
                        {isEditingTranscript ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!transcript}><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This will clear the current transcript. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearTranscript}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyTranscript} disabled={!transcript}><Copy className="h-4 w-4" /></Button>
                    { !isRecording && transcript && !isEditingTranscript && <div className="text-sm font-semibold text-green-600">Transcript complete</div> }
                </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 text-sm">
                {isEditingTranscript ? (
                    <Textarea
                        className="h-full min-h-[300px] resize-none border-0 p-0 font-mono shadow-none focus-visible:ring-0"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="You can edit the transcript here..."
                    />
                ) : transcript ? (
                    <p className="whitespace-pre-wrap font-mono">{transcript}</p>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        {isRecording ? "Listening..." : "Click the record button to start."}
                    </div>
                )}
            </div>
            <div className="pt-2 font-mono text-sm text-muted-foreground">
                {isRecording || elapsedTime > 0 ? formatTime(elapsedTime) : '0:00:00'}
            </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="flex w-full flex-wrap items-center justify-around gap-4 border-t p-4 sm:justify-between">
        <Button 
            onClick={handleSaveDraft} 
            disabled={isRecording || transcript.trim().length === 0 || isSavingDraft} 
            variant="outline"
            className="order-2 w-full sm:order-1 sm:w-auto"
        >
            {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as Draft
        </Button>
        <Button
            size="icon"
            className={cn(
                "order-1 sm:order-2 rounded-full transition-all duration-300 ease-in-out",
                isRecording
                    ? "h-16 w-48 bg-red-600 hover:bg-red-700 p-1.5"
                    : "h-16 w-16 bg-red-500 hover:bg-red-600"
            )}
            onClick={handleRecordToggle}
            disabled={!isSpeechRecognitionSupported}
        >
            {isRecording ? (
                <div className="flex items-center justify-between w-full h-full">
                    <div className="flex items-center gap-2 pl-6 text-white">
                        <div className="h-6 w-px bg-white/50" />
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-black/20 rounded-full shadow-md">
                        <Pause className="w-6 h-6 text-white" />
                    </div>
                </div>
            ) : (
                <Mic className="w-8 h-8" />
            )}
        </Button>
        <Button 
            onClick={handleProceedToNewNote} 
            disabled={isRecording || transcript.trim().length === 0} 
            className="order-3 w-full sm:w-auto rounded-full bg-gray-900 text-white hover:bg-gray-800"
        >
            <ArrowRight className="mr-2 h-4 w-4" />
            Generate Note
        </Button>
      </div>
    </div>
  )
}

    