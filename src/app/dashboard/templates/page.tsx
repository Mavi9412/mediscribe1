
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, FileText, Pencil, Trash2, Copy, UploadCloud, Loader2, PlusCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { generateTemplateFromImage } from "@/ai/flows/generate-template-from-image"
import { useAuth } from "@/hooks/use-auth"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, deleteDoc, doc, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  ownerId?: string;
}

const defaultTemplates: (Omit<Template, 'id' | 'ownerId'> & { key: string })[] = [
    {
        key: 'soap',
        name: 'SOAP Note (Standard)',
        description: 'A widely used template for general clinical visits, structured around Subjective, Objective, Assessment, and Plan.',
        content: `### Subjective

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
    },
    {
        key: 'physical_exam',
        name: 'Physical Examination',
        description: 'A detailed template for documenting clinical examination findings in a systematic format.',
        content: `### General Appearance
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
    },
    {
        key: 'procedure_note',
        name: 'Procedure Note',
        description: 'Designed to document both minor and major clinical procedures performed in or outside the clinic.',
        content: `### Procedure
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
    },
    {
        key: 'or_report',
        name: 'OR Report',
        description: 'A comprehensive template for operative and surgical procedure notes, ensuring all steps and outcomes are recorded.',
        content: `### Preoperative Diagnosis
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
    },
    {
        key: 'specialty_consult',
        name: 'Specialty-Specific Consults',
        description: 'Templates tailored to specific medical fields like cardiology, psychiatry, orthopedics, etc., offering relevant headings and prompts.',
        content: `### Reason for Consultation
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
    },
    {
        key: 'allied_health',
        name: 'Allied-Health Notes',
        description: 'Templates designed for physiotherapists, occupational therapists, speech-language pathologists, and other allied health professionals.',
        content: `### Subjective
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
    },
    {
        key: 'diagnostic_report',
        name: 'Diagnostic Radiology / Pathology Reports',
        description: 'Used for structured documentation of imaging results, lab tests, and pathology findings.',
        content: `### Examination
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
    },
    {
        key: 'disability_form',
        name: 'Disability & Form Filling',
        description: 'Templates that help clinicians efficiently complete standard forms such as disability assessments, including auto-fill capabilities.',
        content: `### Patient Information
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
    },
    {
        key: 'consult_letter',
        name: 'Consult Letters',
        description: 'Streamlined templates for creating referral letters and communication between healthcare providers.',
        content: `Dear Dr. [Referring Physician Name],

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
    },
];


export default function TemplatesPage() {
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()
    const { user, userProfile } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isPro = userProfile?.plan === 'pro';

    const templatesRef = collection(db, "templates");
    const q = user ? query(templatesRef, where("ownerId", "==", user.uid)) : null;
    const [templatesSnapshot, isLoading, error] = useCollection(q);
    const userTemplates = templatesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)) || [];

    const handleEditTemplate = (templateId: string) => {
        router.push(`/dashboard/templates/new?id=${templateId}`);
    }

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await deleteDoc(doc(db, "templates", templateId));
            toast({ title: "Template deleted successfully." });
        } catch (err) {
            console.error("Error deleting template:", err);
            toast({ variant: "destructive", title: "Error deleting template." });
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
             toast({
                variant: "destructive",
                title: "File too large",
                description: "Please upload a file smaller than 10MB.",
            });
            return;
        }

        setIsUploading(true);

        try {
            const formDataUri = await fileToBase64(file);
            const result = await generateTemplateFromImage({ formDataUri });

            localStorage.setItem("newTemplateName", result.name);
            localStorage.setItem("newTemplateDescription", result.description);
            localStorage.setItem("newTemplateContent", result.content);

            toast({
                title: "Template Generated!",
                description: "Your form has been converted. You can now save it.",
            });
            router.push("/dashboard/templates/new");

        } catch (error) {
            console.error("Failed to generate template from form:", error);
            toast({
                variant: "destructive",
                title: "Conversion Failed",
                description: "There was an error converting your form file.",
            });
        } finally {
            setIsUploading(false);
            if (event.target) {
                event.target.value = "";
            }
        }
    };
    
    const CreateTemplateButton = () => {
        if (isPro) {
            return (
                <Button asChild>
                    <Link href="/dashboard/templates/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Template
                    </Link>
                </Button>
            );
        }
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <span tabIndex={0}>
                            <Button disabled>
                                <Lock className="mr-2 h-4 w-4" />
                                Create New Template (Pro)
                            </Button>
                         </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Upgrade to Pro to create your own templates.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    };
    
    const AutomagicUploadCard = () => {
        const buttonContent = <><UploadCloud className="mr-2 h-4 w-4" /> Upload Form</>;

        if (isPro) {
             return (
                 <Card className="flex flex-col border-primary border-2 shadow-lg relative">
                    {isUploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Converting your form...</p>
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Custom Template Upload
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                            Use our "Automagic" upload feature to convert existing Word, PDF, or scanned forms into reusable templates with AI.
                        </p>
                    </CardContent>
                    <CardFooter>
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,application/pdf,.doc,.docx"
                        />
                        <Button className="w-full" onClick={handleUploadClick} disabled={isUploading}>
                            {buttonContent}
                        </Button>
                    </CardFooter>
                </Card>
             )
        }
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Card className="flex flex-col border-dashed shadow-none relative">
                            <div className="absolute inset-0 bg-secondary/50 z-10"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                                    <UploadCloud className="h-5 w-5" />
                                    Custom Template Upload (Pro)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">
                                    Use our "Automagic" upload feature to convert existing Word, PDF, or scanned forms into reusable templates with AI.
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled>
                                    <Lock className="mr-2 h-4 w-4" /> Upload Form
                                </Button>
                            </CardFooter>
                        </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Upgrade to Pro to use Automagic Template Upload.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }


    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Note Templates</h1>
                    <p className="text-muted-foreground">Create and manage reusable note templates to speed up your workflow.</p>
                </div>
                <CreateTemplateButton />
            </div>
            
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Your Templates</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-52 w-full" />
                        <Skeleton className="h-52 w-full" />
                        <Skeleton className="h-52 w-full" />
                    </>
                ) : userTemplates.length > 0 ? (
                    userTemplates.map(template => (
                        <Card key={template.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                        {template.name}
                                    </CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleEditTemplate(template.id)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/notes/new?template=custom-${template.id}`}><Copy className="mr-2 h-4 w-4" />Use Template</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete this template.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/dashboard/notes/new?template=custom-${template.id}`}>Use Template</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16 rounded-lg border-2 border-dashed">
                        {error && <p className="text-destructive">Error: {error.message}</p>}
                        {!isLoading && !error && (
                            <>
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium">No custom templates created yet.</h3>
                                <p className="mt-1 text-sm">Upgrade to Pro to create your own templates, or use a default below.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Separator className="my-4" />

            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Default Templates</h2>
                <p className="text-muted-foreground">Use these standard templates to get started quickly.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AutomagicUploadCard />
                {defaultTemplates.map((template) => (
                    <Card key={template.key} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-primary" />
                                {template.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
                        </CardContent>
                        <CardFooter>
                             <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboard/notes/new?template=${template.key}`}>Use Template</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
