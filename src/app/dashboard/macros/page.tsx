
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Keyboard, Pencil, Trash2, PlusCircle, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, deleteDoc, doc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Macro {
  id: string;
  name: string;
  trigger: string;
  content: string;
  ownerId?: string;
}

export default function MacrosPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { user, userProfile } = useAuth()
    const isPro = userProfile?.plan === 'pro';

    const macrosRef = collection(db, "macros");
    const q = user ? query(macrosRef, where("ownerId", "==", user.uid)) : null;
    const [macrosSnapshot, isLoading, error] = useCollection(q);
    const userMacros = macrosSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Macro)) || [];

    const handleEditMacro = (macroId: string) => {
        router.push(`/dashboard/macros/new?id=${macroId}`);
    }

    const handleDeleteMacro = async (macroId: string) => {
        try {
            await deleteDoc(doc(db, "macros", macroId));
            toast({ title: "Macro deleted successfully." });
        } catch (err) {
            console.error("Error deleting macro:", err);
            toast({ variant: "destructive", title: "Error deleting macro." });
        }
    };

    const CreateMacroButton = () => {
        if (isPro) {
            return (
                <Button asChild>
                    <Link href="/dashboard/macros/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Macro
                    </Link>
                </Button>
            )
        }
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0}>
                             <Button disabled>
                                <Lock className="mr-2 h-4 w-4" />
                                New Macro (Pro)
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Upgrade to Pro to create custom macros.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Macros</h1>
                    <p className="text-muted-foreground">Create and manage text shortcuts to speed up your note-taking.</p>
                </div>
                <CreateMacroButton />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </>
                ) : userMacros.length > 0 ? (
                    userMacros.map(macro => (
                        <Card key={macro.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {macro.name}
                                    </CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleEditMacro(macro.id)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete this macro.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMacro(macro.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription>
                                    Trigger: <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{macro.trigger}</code>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{macro.content}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16 rounded-lg border-2 border-dashed">
                        {error && <p className="text-destructive">Error: {error.message}</p>}
                        {!isLoading && !error && (
                            <>
                                <Keyboard className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium">No macros created yet.</h3>
                                <p className="mt-1 text-sm">Upgrade to Pro to create your first macro.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
