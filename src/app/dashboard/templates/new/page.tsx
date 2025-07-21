
"use client"

import React, { useState, useEffect, useRef } from "react"
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Bold, Italic, List, ListOrdered, Check, ChevronsUpDown, X, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { generateTemplateContent } from "@/ai/flows/generate-template-content"

const templateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  additionalInstructions: z.string().optional(),
  content: z.string().min(1, "Template must have content.").min(10, "Template content must be at least 10 characters."),
  categories: z.array(z.string()).optional(),
  headings: z.array(z.string()).optional(),
})

const RichTextToolbar = dynamic(() => Promise.resolve(({
  className,
  onFormat,
  onStyleChange,
}: {
  className?: string
  onFormat: (format: 'bold' | 'italic' | 'ul' | 'ol') => void
  onStyleChange: (style: string) => void
}) => (
  <div className={cn("flex items-center gap-1 rounded-t-md border border-b-0 bg-muted p-1", className)}>
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onFormat('bold')}><Bold className="h-4 w-4" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onFormat('italic')}><Italic className="h-4 w-4" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onFormat('ul')}><List className="h-4 w-4" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onFormat('ol')}><ListOrdered className="h-4 w-4" /></Button>
    <div className="ml-auto">
      <Select defaultValue="paragraph" onValueChange={onStyleChange}>
        <SelectTrigger className="w-[120px] h-8 text-sm">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
)), { ssr: false, loading: () => <div className="h-[42px] w-full rounded-t-md border border-b-0 bg-muted p-1" /> });


export default function NewTemplatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const { user } = useAuth()
  
  const [headingsOpen, setHeadingsOpen] = useState(false)
  const [currentHeadingInput, setCurrentHeadingInput] = useState("")
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>([])
  
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [currentCategoryInput, setCurrentCategoryInput] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const contentRef = useRef<HTMLTextAreaElement>(null)

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      additionalInstructions: "",
      content: "",
      categories: [],
      headings: [],
    },
  })
  
  useEffect(() => {
    form.setValue("categories", selectedCategories, { shouldValidate: true, shouldDirty: true });
  }, [selectedCategories, form]);

  useEffect(() => {
    form.setValue("headings", selectedHeadings, { shouldValidate: true, shouldDirty: true });
  }, [selectedHeadings, form]);


  const headingsList = [
    { value: "### Patient Identifying Information", label: "Patient Identifying Information" },
    { value: "### Chief Complaint", label: "Chief Complaint" },
    { value: "### History of Present Illness", label: "History of Present Illness" },
    { value: "### Review of Systems", label: "Review of Systems" },
    { value: "### Past Medical History", label: "Past Medical History" },
    { value: "### Medications", label: "Medications" },
    { value: "### Allergies", label: "Allergies" },
    { value: "### Family History", label: "Family History" },
    { value: "### Social History", label: "Social History" },
    { value: "### Physical Exam", label: "Physical Exam" },
    { value: "### Assessment", label: "Assessment" },
    { value: "### Plan", label: "Plan" },
  ];

  const categoriesList = [
    "Addiction Medicine", "Adolescent Medicine", "Anesthesiology", "Audiology", "Cardiac Surgery", "Cardiology",
    "Chiropractic", "Clinical Immunology & Allergy", "Clinical Pharmacology and Toxicology", "Critical Care Medicine",
    "Dentistry", "Dermatology", "Developmental Pediatrics", "Dietetics/Nutrition", "Emergency Medicine",
    "Endocrinology and Metabolism", "Family Medicine", "Gastroenterology", "General Internal Medicine",
    "General Surgery", "Genetics", "Geriatrics", "Hematology", "Infectious Diseases", "Internal Medicine",
    "Kinesiology", "Massage Therapy", "Medical Laboratory Technology", "Medical Radiation Technology",
    "Neonatal-Perinatal Medicine", "Nephrology", "Neurology", "Neuropathology", "Neurosurgery", "Nuclear Medicine",
    "Nursing", "Obstetrics and Gynecology", "Occupational Medicine", "Occupational Therapy", "Oncology",
    "Ophthalmology", "Orthopedic Surgery", "Otolaryngology – Head and Neck Surgery", "Pain Medicine", "Palliative Care",
    "Pathology", "Pediatrics", "Pharmacy", "Physical Medicine & Rehabilitation", "Physiotherapy", "Plastic Surgery",
    "Podiatry", "Prosthetics and Orthotics", "Psychiatry", "Public Health and Preventive Medicine", "Radiation Oncology",
    "Radiology", "Recreational Therapy", "Respirology", "Respiratory Therapy", "Rheumatology", "Social Work",
    "Speech-Language Pathology", "Sports Medicine", "Thoracic Surgery", "Urology", "Vascular Surgery"
  ];

  const handleAddHeading = (heading: string) => {
    const formattedHeading = heading.startsWith("### ") ? heading : `### ${heading}`;
    if (formattedHeading.length > 4 && !selectedHeadings.includes(formattedHeading)) {
        setSelectedHeadings(prev => [...prev, formattedHeading]);
        toast({ title: "Heading added" });
    }
    setCurrentHeadingInput("");
  };
  
  const handleRemoveHeading = (headingToRemove: string) => {
    setSelectedHeadings(prev => prev.filter(h => h !== headingToRemove));
    toast({ title: "Heading removed" });
  };
  
  const handleClearAllHeadings = () => {
    setSelectedHeadings([]);
    toast({ title: "All headings cleared" });
  }

  const handleAddCategory = (category: string) => {
    if (category.trim().length > 0 && !selectedCategories.includes(category.trim())) {
      setSelectedCategories(prev => [...prev, category.trim()]);
      toast({ title: "Category added" });
    }
    setCurrentCategoryInput("");
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== categoryToRemove));
    toast({ title: "Category removed" });
  }

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  useEffect(() => {
    const templateId = searchParams.get('id')
    setEditingTemplateId(templateId)

    const loadTemplate = async (id: string) => {
        setIsLoading(true);
        const docRef = doc(db, "templates", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const templateData = docSnap.data();
            form.reset({
                name: templateData.name,
                description: templateData.description,
                additionalInstructions: templateData.additionalInstructions || "",
                content: templateData.content,
                categories: templateData.categories || [],
                headings: templateData.headings || [],
            });
            setSelectedCategories(templateData.categories || []);
            setSelectedHeadings(templateData.headings || []);
        } else {
            toast({ variant: 'destructive', title: 'Template not found.'});
            router.push('/dashboard/templates');
        }
        setIsLoading(false);
    }

    if (templateId) {
        loadTemplate(templateId);
    } else {
        const name = localStorage.getItem("newTemplateName");
        const description = localStorage.getItem("newTemplateDescription");
        const content = localStorage.getItem("newTemplateContent");

        if (name && description && content) {
            form.reset({
                name,
                description,
                content,
                categories: [],
                headings: [],
            });
            
            const extractedHeadings = content.match(/### (.*)/g) || [];
            setSelectedHeadings(extractedHeadings);

            localStorage.removeItem("newTemplateName");
            localStorage.removeItem("newTemplateDescription");
            localStorage.removeItem("newTemplateContent");
        }
        setIsLoading(false);
    }
  }, [searchParams, router, toast, form])
  
  const handleGenerateContent = async () => {
    const values = form.getValues();
    if (!values.name || !values.description) {
      toast({ variant: 'destructive', title: 'Name and Description are required to generate content.' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateTemplateContent({
        name: values.name,
        description: values.description,
        additionalInstructions: values.additionalInstructions,
        headings: selectedHeadings,
        categories: selectedCategories,
      });
      form.setValue('content', result.content, { shouldValidate: true, shouldDirty: true });
      toast({ title: 'AI has generated the template content.' });
    } catch (error) {
      console.error("Error generating template content:", error);
      toast({ variant: 'destructive', title: 'AI Generation Failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyFormat = (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    onValueChange: (value: string) => void,
    format: 'bold' | 'italic' | 'ul' | 'ol'
  ) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    let newText: string;
    let selectionStartOffset = 0;

    if (format === 'bold') {
      newText = `**${selectedText}**`
      selectionStartOffset = 2
    } else if (format === 'italic') {
      newText = `*${selectedText}*`
      selectionStartOffset = 1
    } else if (format === 'ul') {
      if (selectedText) {
        const lines = selectedText.split('\n')
        newText = lines.map(line => line.trim() ? `- ${line}` : line).join('\n')
      } else {
        newText = '- '
        selectionStartOffset = 2
      }
    } else if (format === 'ol') {
      if (selectedText) {
        const lines = selectedText.split('\n')
        let counter = 1;
        newText = lines.map(line => line.trim() ? `${counter++}. ${line}` : line).join('\n')
      } else {
        newText = '1. '
        selectionStartOffset = 3
      }
    } else {
        return; // Should not happen
    }
    
    const updatedValue =
      textarea.value.substring(0, start) +
      newText +
      textarea.value.substring(end)
    
    onValueChange(updatedValue)

    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start, start + newText.length)
      } else {
        textarea.setSelectionRange(start + selectionStartOffset, end + selectionStartOffset)
      }
    }, 0)
  }

  const applyStyle = (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    onValueChange: (value: string) => void,
    style: string
  ) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    
    let lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1
    const lineEnd = textarea.value.indexOf('\n', start);
    const finalLineEnd = lineEnd === -1 ? textarea.value.length : lineEnd

    const currentLine = textarea.value.substring(lineStart, finalLineEnd)
    
    const cleanedLine = currentLine.replace(/^#+\s*/, '')
    let prefix = ''

    if (style === 'h1') prefix = '# '
    if (style === 'h2') prefix = '## '
    if (style === 'h3') prefix = '### '

    const newLine = prefix + cleanedLine

    const updatedValue = 
      textarea.value.substring(0, lineStart) +
      newLine +
      textarea.value.substring(finalLineEnd)

    onValueChange(updatedValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + newLine.length)
    }, 0)
  }

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to save." });
        return;
    }
    setIsSaving(true)
    try {
      const dataToSave = {
        name: values.name,
        description: values.description,
        additionalInstructions: values.additionalInstructions,
        content: values.content, // This now directly uses the value from the form state, which is updated by AI and manual edits
        categories: values.categories,
        headings: values.headings,
        ownerId: user.uid,
      };

      if (editingTemplateId) {
        await setDoc(doc(db, "templates", editingTemplateId), dataToSave, { merge: true });
        toast({ title: "Template updated successfully!" });
      } else {
        await addDoc(collection(db, "templates"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Template created successfully!" });
      }
      router.push("/dashboard/templates");
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save the template. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const pageTitle = editingTemplateId ? "Edit Template" : "New Template"
  const saveButtonText = editingTemplateId ? "Update Template" : "Create Template"

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Template Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                  <FormLabel>Document type</FormLabel>
                  <Select>
                      <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="soap">SOAP Note</SelectItem>
                          <SelectItem value="initial-evaluation">Initial Evaluation</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="procedure-note">Procedure Note</SelectItem>
                          <SelectItem value="discharge-summary">Discharge Summary</SelectItem>
                          <SelectItem value="patient-handout">Patient Information Handout</SelectItem>
                      </SelectContent>
                  </Select>
              </FormItem>
          </div>
          
           <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    className="h-24"
                    placeholder="A short description of what this template is for. This will be used by the AI to generate content."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="additionalInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional instructions</FormLabel>
                <FormControl>
                  <Textarea
                    className="h-24"
                    placeholder="e.g., Please write in a professional, human-sounding voice. This will be used by the AI to generate content."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="headings"
            render={() => (
               <FormItem>
                <FormLabel>Headings</FormLabel>
                <Popover open={headingsOpen} onOpenChange={setHeadingsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={headingsOpen}
                      className="flex w-full items-center justify-between rounded-md border p-2 min-h-11 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-1">
                          {selectedHeadings.map((heading) => (
                              <Badge
                                key={heading}
                                variant="secondary"
                                className="pl-2 pr-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveHeading(heading);
                                }}
                              >
                                {truncate(heading.replace('### ', ''), 20)}
                                <X className="ml-1 h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                              </Badge>
                          ))}
                          {selectedHeadings.length === 0 && (
                              <span className="text-muted-foreground">Type or select headings to guide the AI...</span>
                          )}
                      </div>

                      <div className="flex items-center">
                        {selectedHeadings.length > 0 && (
                            <X 
                                className="h-4 w-4 shrink-0 opacity-50 mr-2 cursor-pointer" 
                                onClick={(e) => { e.stopPropagation(); handleClearAllHeadings(); }}
                            />
                        )}
                        <span className="w-px h-4 bg-border mx-2"></span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search headings..."
                          value={currentHeadingInput}
                          onValueChange={setCurrentHeadingInput}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && currentHeadingInput.trim()) {
                              e.preventDefault();
                              handleAddHeading(currentHeadingInput);
                              setHeadingsOpen(false);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>No results found. Press Enter to add.</CommandEmpty>
                          <CommandGroup>
                            {headingsList.filter(h => !selectedHeadings.includes(h.value)).map((heading) => (
                              <CommandItem
                                key={heading.value}
                                value={heading.label}
                                onSelect={() => {
                                  handleAddHeading(heading.value);
                                  setHeadingsOpen(false);
                                }}
                              >
                                {heading.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>These headings will guide the AI content generation.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
           />

           <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <FormLabel>Template Content</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateContent} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate with AI
                  </Button>
                </div>
                <RichTextToolbar
                   onFormat={(format) => applyFormat(contentRef, (v) => field.onChange(v), format)}
                   onStyleChange={(style) => applyStyle(contentRef, (v) => field.onChange(v), style)}
                />
                <FormControl>
                  <Textarea
                    className="h-64 rounded-t-none border-t-0"
                    placeholder="Your template content will appear here. You can also edit it manually."
                    {...field}
                    ref={(e) => {
                      field.ref(e)
                      if(e) contentRef.current = e
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem>
                <FormLabel>Categories</FormLabel>
                  <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded={categoriesOpen}
                        className="flex w-full items-center justify-between rounded-md border p-2 min-h-11 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-1">
                          {selectedCategories.map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="pl-2 pr-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCategory(category);
                              }}
                            >
                              {truncate(category, 20)}
                              <X className="ml-1 h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                            </Badge>
                          ))}
                          {selectedCategories.length === 0 && (
                            <span className="text-muted-foreground">Select or type categories...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search categories..."
                          value={currentCategoryInput}
                          onValueChange={setCurrentCategoryInput}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && currentCategoryInput.trim()) {
                              e.preventDefault();
                              handleAddCategory(currentCategoryInput);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {currentCategoryInput.trim() ? "No results. Press Enter to add." : "No results found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {categoriesList.filter(c => !selectedCategories.includes(c)).map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => {
                                  handleAddCategory(category);
                                  setCategoriesOpen(false);
                                }}
                              >
                                {category}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                 <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {saveButtonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
