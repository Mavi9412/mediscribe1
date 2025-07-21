
"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter, useSearchParams } from "next/navigation"
import { UploadCloud, File, X, Loader2 } from "lucide-react"
import { transcribeAudio } from "@/ai/flows/transcribe-audio"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { collection, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCollection } from 'react-firebase-hooks/firestore'


interface Template {
  id: string;
  name: string;
  ownerId: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [transcriptionComplete, setTranscriptionComplete] = useState<boolean>(false)
  const [selectedTemplate, setSelectedTemplate] = useState("soap")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams();
  const { user } = useAuth()
  
  const templatesRef = collection(db, "templates");
  const templatesQuery = user ? query(templatesRef, where("ownerId", "==", user.uid)) : null;
  const [templatesSnapshot] = useCollection(templatesQuery);

  const userTemplates = useMemo(() => {
    if (!templatesSnapshot) return [];
    return templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
  }, [templatesSnapshot]);

  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
        setSelectedTemplate(templateParam);
    } else if (user) {
        const loadSettings = async () => {
            const profileRef = doc(db, "userProfiles", user.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                const settings = profileSnap.data();
                setSelectedTemplate(settings.defaultTemplate || 'soap');
            }
        };
        loadSettings();
    }
  }, [user, searchParams]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (acceptedFiles[0].size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
        });
        return;
      }
      setFiles(acceptedFiles)
      setTranscriptionComplete(false)
      setIsTranscribing(false)
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [] },
    multiple: false,
  })

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleProcessFile = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an audio file to upload.",
      })
      return
    }

    setIsTranscribing(true)
    setTranscriptionComplete(false)

    try {
      const audioDataUri = await fileToBase64(files[0])
      const result = await transcribeAudio({ audioDataUri })
      
      localStorage.setItem("currentTranscript", result.transcript)
      setIsTranscribing(false)
      setTranscriptionComplete(true)
      toast({
        title: "Transcription complete!",
        description: "Your audio file has been successfully transcribed.",
      })
    } catch (error: any) {
      console.error("Transcription failed:", error)
      setIsTranscribing(false)
      toast({
        variant: "destructive",
        title: "Transcription Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      })
    }
  }

  const handleGenerateNote = () => {
    router.push(`/dashboard/notes/new?template=${selectedTemplate}`)
  }

  const removeFile = () => {
    setFiles([])
    setIsTranscribing(false)
    setTranscriptionComplete(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Audio</h1>
          <p className="text-muted-foreground">
            Select a template, then upload your audio file for transcription.
          </p>
        </div>
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-full sm:w-[280px]">
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
                </SelectGroup>
            </SelectContent>
        </Select>
      </div>

      <Card className="flex min-h-[400px] flex-col items-center justify-center">
        <CardContent className="w-full p-6">
          {files.length === 0 ? (
            <div
              {...getRootProps()}
              className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors hover:border-primary/80 ${
                isDragActive ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {isDragActive
                  ? "Drop the file here..."
                  : "Drag 'n' drop an audio file here, or click to select"}
              </p>
              <p className="text-sm text-muted-foreground">
                MP3, WAV, M4A supported (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="w-full text-center">
              <div className="relative flex items-center justify-center rounded-md border bg-secondary/50 p-4">
                <File className="mr-4 h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">{files[0].name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={removeFile}
                  disabled={isTranscribing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isTranscribing && (
                <div className="mt-6 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Transcribing your audio, please wait...</p>
                    <p className="text-xs text-muted-foreground">(This may take a few moments)</p>
                </div>
              )}

              {transcriptionComplete && (
                <div className="mt-6 rounded-md border bg-secondary p-4">
                    <h3 className="font-semibold text-secondary-foreground">Transcription Ready!</h3>
                    <p className="text-sm mt-2 text-muted-foreground">Your audio has been transcribed. You can now generate a note.</p>
                </div>
              )}

              <div className="mt-8">
                {!isTranscribing && !transcriptionComplete && (
                  <Button onClick={handleProcessFile}>
                    Transcribe File
                  </Button>
                )}
                {transcriptionComplete && (
                    <Button onClick={handleGenerateNote}>
                        Generate Note
                    </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
