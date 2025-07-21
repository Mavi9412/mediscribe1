
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const macroSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  trigger: z.string().min(1, "Trigger is required."),
  content: z.string().min(1, "Expanded content is required."),
})

export default function NewMacroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null)
  const { user } = useAuth()

  const form = useForm<z.infer<typeof macroSchema>>({
    resolver: zodResolver(macroSchema),
    defaultValues: {
      name: "",
      trigger: "",
      content: "",
    },
  })

  useEffect(() => {
    const macroId = searchParams.get('id')
    setEditingMacroId(macroId)

    const loadMacro = async (id: string) => {
        setIsLoading(true);
        const docRef = doc(db, "macros", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const macroData = docSnap.data();
            form.reset({
                name: macroData.name,
                trigger: macroData.trigger,
                content: macroData.content,
            });
        } else {
            toast({ variant: 'destructive', title: 'Macro not found.'});
            router.push('/dashboard/macros');
        }
        setIsLoading(false);
    }

    if (macroId) {
        loadMacro(macroId);
    } else {
        setIsLoading(false);
    }
  }, [searchParams, router, toast, form])

  const onSubmit = async (values: z.infer<typeof macroSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to save." });
        return;
    }
    setIsSaving(true)
    try {
      const dataToSave = {
        name: values.name,
        trigger: values.trigger,
        content: values.content,
        ownerId: user.uid,
      };

      if (editingMacroId) {
        await setDoc(doc(db, "macros", editingMacroId), dataToSave, { merge: true });
        toast({ title: "Macro updated successfully!" });
      } else {
        await addDoc(collection(db, "macros"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Macro created successfully!" });
      }
      router.push("/dashboard/macros");
    } catch (error) {
      console.error("Error saving macro:", error)
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save the macro. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const pageTitle = editingMacroId ? "Edit Macro" : "New Macro";
  const pageDescription = editingMacroId ? "Update your text expansion macro." : "Create a new text macro to use in your notes.";
  const saveButtonText = editingMacroId ? "Update Macro" : "Create Macro";

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Macro Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Follow-up Plan" {...field} />
                                    </FormControl>
                                    <FormDescription>A descriptive name for your macro.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="trigger"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trigger</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., .followup" {...field} />
                                    </FormControl>
                                    <FormDescription>The shortcut you'll type to expand the content. Using a prefix like '.' or '/' is recommended.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expanded Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            className="h-32"
                                            placeholder="The text that will be inserted when the trigger is used."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {saveButtonText}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  )
}
