**Revising Responsive Implementation**

I'm currently focusing on implementing the responsive design changes for the `NotesPage`. Right now, I am adjusting the `CardHeader` and main controls using flexbox to achieve the desired behavior across different screen sizes. The plan is to change the layout from a column to a row on larger screens and adjust alignment and spacing accordingly.


**Codifying Responsiveness Adjustments**

I'm currently implementing the refactoring of the `NotesPage`'s visual structure. I am directly applying the `flexbox` and `grid` adjustments to the relevant elements like the `CardHeader` and `CardContent` now. The aim is to ensure smooth transitions and appropriate element behavior on screens of different sizes. I'm using specific utility classes for this purpose.


**Initiating Code Refactoring**

The code is being segmented into manageable units to apply the responsiveness changes. Starting with the `CardHeader`, flexbox properties are applied to the container to alter element arrangement on larger screens. Input fields and buttons are being adjusted to fit the available space and use `w-full` and `w-auto` for width control on different screen sizes.


Okay, here's the refactored `NotesPage` component with the responsiveness improvements applied. I've added comments to highlight the changes.

```typescript
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, PlusCircle, Trash2, ListFilter, Calendar as CalendarIcon, LayoutGrid, List, X, Download, FileJson, Pencil, Loader2, FolderPlus, Move, Check, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"

import { useAuth } from "@/hooks/use-auth"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, deleteDoc, doc, query, where, Timestamp, updateDoc, writeBatch, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area" // Correctly import ScrollArea and ScrollBar
// import { summarizeNote } from "@/ai/flows/summarize-note" // Not used in this component, can be removed if not needed.

interface Note {
    id: string;
    title: string;
    patient: string;
    summary: string;
    date: Timestamp;
    lastEdited?: Timestamp;
    tag: string;
    transcript: string;
    note: string;
    ownerId: string;
    isArchived?: boolean;
    isDraft?: boolean;
}

interface Folder {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
}

interface TagStyle {
    className: string;
}

const tagStyles: Record<string, TagStyle> = {
    Endocrinology: { className: 'bg-green-500 hover:bg-green-600 border-green-600' },
    General: { className: 'bg-blue-500 hover:bg-blue-600 border-blue-600' },
    Pulmonology: { className: 'bg-cyan-500 hover:bg-cyan-600 border-cyan-600' },
    Cardiology: { className: 'bg-red-500 hover:bg-red-600 border-red-600' },
    Pediatrics: { className: 'bg-amber-500 hover:bg-amber-600 border-amber-600' },
    Neurology: { className: 'bg-purple-500 hover:bg-purple-600 border-purple-600' },
};
const defaultTagStyle: TagStyle = { className: 'bg-slate-500 hover:bg-slate-600 border-slate-600' };


export default function NotesPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState("all")
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Filter states
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Folder management state
    const [isCreateFolderOpen, setCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isSavingFolder, setIsSavingFolder] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isSavingRename, setIsSavingRename] = useState(false);
    const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
    const [newFolderRenameValue, setNewFolderRenameValue] = useState("");
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

    // Temporary filter states for popover
    const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);
    const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);

    const inputRef = useRef<HTMLInputElement>(null);

    const notesRef = collection(db, "notes");
    const notesQuery = user ? query(notesRef, where("ownerId", "==", user.uid)) : null;
    const [notesSnapshot, isLoadingNotes, errorNotes] = useCollection(notesQuery);

    const foldersRef = collection(db, "folders");
    const foldersQuery = user ? query(foldersRef, where("ownerId", "==", user.uid)) : null;
    const [foldersSnapshot, isLoadingFolders, errorFolders] = useCollection(foldersQuery);

    // Load and save view preference
    useEffect(() => {
        const savedView = localStorage.getItem("notesView");
        if (savedView === 'list' || savedView === 'grid') {
            setView(savedView as 'grid' | 'list');
        }
    }, []);

    // Sync temp state when popover opens
    useEffect(() => {
        if (isFilterOpen) {
            setTempSelectedTags(selectedTags);
            setTempDateRange(dateRange);
        }
    }, [isFilterOpen, selectedTags, dateRange]);

    const handleSetView = (newView: 'grid' | 'list') => {
        setView(newView);
        localStorage.setItem("notesView", newView);
    }

    const sortedNotes = useMemo(() => {
        const notesData = notesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)) || [];
        return notesData.sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0));
    }, [notesSnapshot]);

    const folders = useMemo(() => {
        const folderData = foldersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder)) || [];
        return folderData.sort((a, b) => a.name.localeCompare(b.name));
    }, [foldersSnapshot]);

    const allTags = useMemo(() => {
        // Collect tags from notes and existing folders
        const tagsFromNotes = sortedNotes.map(note => note.tag);
        const tagsFromFolders = folders.map(folder => folder.name);

        // Combine unique tags and map to their styles
        const uniqueTagNames = Array.from(new Set([...tagsFromNotes, ...tagsFromFolders]));

        return uniqueTagNames.map(tagName => ({
            name: tagName,
            ...(tagStyles[tagName] || defaultTagStyle)
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [sortedNotes, folders]);


    const handleClearTempTags = () => { // Renamed for clarity within popover
        setTempSelectedTags([]);
        // toast({ title: "All tags cleared" }); // Maybe don't toast on temp clear
    };

    const handleApplyFilters = () => {
        setSelectedTags(tempSelectedTags);
        setDateRange(tempDateRange);
        setIsFilterOpen(false);
        toast({ title: "Filters applied." });
    };

    const handleClearAllFilters = () => {
        setSelectedTags([]);
        setDateRange(undefined);
        setTempSelectedTags([]);
        setTempDateRange(undefined);
        // setIsFilterOpen(false); // Optionally close popover
        toast({ title: "All filters cleared." });

    };

    const handleToggleNoteSelection = (noteId: string) => {
        setSelectedNotes(prev =>
            prev.includes(noteId)
                ? prev.filter(id => id !== noteId)
                : [...prev, noteId]
        );
    };

    const filteredNotes = useMemo(() => {
        return sortedNotes.filter(note => {
            const matchesSearch =
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.tag.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTagFilter = selectedTags.length === 0 || selectedTags.includes(note.tag);

            const noteDate = note.date?.toDate();
            const matchesDate = !dateRange || !noteDate || (
                (!dateRange.from || noteDate >= dateRange.from) &&
                (!dateRange.to || noteDate <= dateRange.to)
            );

            let matchesTabFilter;
            if (activeTab === 'all') {
                matchesTabFilter = !note.isArchived;
            } else if (activeTab === 'archived') {
                matchesTabFilter = note.isArchived;
            } else if (activeTab === 'drafts') {
                matchesTabFilter = !!note.isDraft && !note.isArchived;
            } else { // It's a folder tab
                matchesTabFilter = note.tag === activeTab && !note.isArchived && !note.isDraft;
            }

            return matchesSearch && matchesTagFilter && matchesDate && matchesTabFilter;
        });
    }, [sortedNotes, searchTerm, selectedTags, dateRange, activeTab]);

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedNotes(filteredNotes.map(n => n.id));
        } else {
            setSelectedNotes([]);
        }
    };

    const handleBulkAction = async (action: 'move' | 'archive' | 'delete', value?: string) => {
        if (selectedNotes.length === 0 || !user) return;

        setIsBulkProcessing(true);
        const batch = writeBatch(db);

        selectedNotes.forEach(noteId => {
            const noteRef = doc(db, "notes", noteId);
            if (action === 'move' && value) {
                batch.update(noteRef, { tag: value, isArchived: false, isDraft: false, lastEdited: serverTimestamp() });
            } else if (action === 'archive') {
                // Determine if we are archiving or restoring based on current tab
                const isArchiving = activeTab !== 'archived';
                batch.update(noteRef, { isArchived: isArchiving, lastEdited: serverTimestamp() });
            } else if (action === 'delete') {
                batch.delete(noteRef);
            }
        });

        try {
            await batch.commit();
            const count = selectedNotes.length;
            let message = '';
            if (action === 'move') message = `${count} note(s) moved to "${value}".`;
            if (action === 'archive') message = `${count} note(s) ${activeTab !== 'archived' ? 'archived' : 'restored'}.`;
            if (action === 'delete') message = `${count} note(s) deleted.`;
            toast({ title: 'Success', description: message });
            setSelectedNotes([]);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast({ variant: 'destructive', title: 'Error', description: `Could not perform action. Please try again.` });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await deleteDoc(doc(db, "notes", noteId));
            toast({ title: "Note deleted successfully." });
        } catch (err) {
            console.error("Error deleting note:", err);
            toast({ variant: "destructive", title: "Error deleting note", description: "Could not delete the note. Please try again." });
        }
    };

    const handleToggleArchive = async (note: Note) => {
        const noteRef = doc(db, "notes", note.id);
        try {
            await updateDoc(noteRef, {
                isArchived: !note.isArchived,
                lastEdited: serverTimestamp()
            });
            toast({ title: `Note ${note.isArchived ? "restored" : "archived"} successfully.` });
        } catch (err) {
            console.error("Error updating note:", err);
            toast({ variant: "destructive", title: "Update failed", description: "Could not update the note. Please try again." });
        }
    };

    const handleEditNote = (noteToEdit: Note) => {
        router.push(`/dashboard/notes/new?id=${noteToEdit.id}`);
    };

    const handleOpenInNewTab = (noteId: string) => {
        window.open(`/dashboard/notes/${noteId}`, '_blank');
    };

    const handleDownloadPdf = async (note: Note) => {
        if (!note) return;
        toast({ title: 'Preparing PDF...', description: 'Your download will start shortly.' });

        try {
            const { marked } = await import('marked');
            const { default: jsPDF } = await import('jspdf');
            const { default: html2canvas } = await import('html2canvas');

            const htmlString = await marked.parse(note.note);

            const tempContainer = document.createElement('div');
            // Add styles to mimic the detail page for consistent rendering
            tempContainer.className = "prose prose-sm max-w-none rounded-md border bg-secondary/30 p-4 dark:prose-invert";
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '800px'; // A standard page width for rendering
            tempContainer.innerHTML = `<h1>${note.title}</h1>
                               <p><strong>Patient:</strong> ${note.patient}</p>
                               <p><strong>Date:</strong> ${note.date?.toDate().toLocaleDateString()}</p>
                               <hr>
                               ${htmlString}`;

            document.body.appendChild(tempContainer);

            const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15; // mm

            // Calculate image dimensions to fit within PDF with margins
            const imgWidth = pdfWidth - (2 * margin);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let currentY = margin;

            // Add content page by page
            if (imgHeight < pdfHeight - (2 * margin)) {
                // If content fits on one page
                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
            } else {
                // If content spans multiple pages
                let heightLeft = imgHeight;
                let position = 0;

                while (heightLeft > 0) {
                    pdf.addImage(imgData, 'PNG', margin, currentY + position, imgWidth, imgHeight);
                    position -= pdfHeight - (2 * margin); // Move up by page height, keeping top margin
                    heightLeft -= (pdfHeight - (2 * margin));
                    if (heightLeft > 0) {
                        pdf.addPage();
                    }
                }
            }


            pdf.save(`Note-${note.title.replace(/ /g, '_') || 'export'}.pdf`);
        } catch (error) {
            console.error("PDF export failed:", error);
            toast({ variant: 'destructive', title: 'Error exporting PDF', description: 'Could not generate the PDF. Please try again.' });
        } finally {
            const tempContainer = document.querySelector('.prose.prose-sm'); // Select by class name
            if (tempContainer && document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        }
    };

    const handleExportJson = (note: Note) => {
        if (!note) return;
        const exportableNote = {
            ...note,
            date: note.date?.toDate().toISOString(),
            lastEdited: note.lastEdited?.toDate().toISOString() ?? undefined,
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(exportableNote, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `Note-${note.title.replace(/ /g, '_') || 'export'}.json`;
        link.click();
    };

    const handleSaveNewFolder = async () => {
        if (!newFolderName.trim() || !user) {
            toast({ variant: "destructive", title: "Folder name cannot be empty." });
            return;
        }
        if (folders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase())) {
            toast({ variant: "destructive", title: "Folder with this name already exists." });
            return;
        }

        setIsSavingFolder(true);
        try {
            await addDoc(collection(db, "folders"), {
                name: newFolderName.trim(),
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Folder created successfully." });
            setNewFolderName("");
            setCreateFolderOpen(false);
        } catch (error) {
            console.error("Error creating folder:", error);
            toast({ variant: "destructive", title: "Error creating folder." });
        } finally {
            setIsSavingFolder(false);
        }
    };

    const handleOpenRenameDialog = (folder: Folder) => {
        setFolderToRename(folder);
        setNewFolderRenameValue(folder.name);
        setIsRenameDialogOpen(true);
    };

    const handleRenameFolder = async () => {
        if (!user || !folderToRename || !newFolderRenameValue.trim()) {
            setIsRenameDialogOpen(false);
            return;
        }
        if (folderToRename.name === newFolderRenameValue.trim()) {
            toast({ title: "No change", description: "Folder name is the same." });
            setIsRenameDialogOpen(false);
            return;
        }
        if (folders.some(f => f.name.toLowerCase() === newFolderRenameValue.trim().toLowerCase() && f.id !== folderToRename.id)) {
            toast({ variant: "destructive", title: "Folder with this new name already exists." });
            return;
        }

        setIsSavingRename(true);

        try {
            const batch = writeBatch(db);

            const folderRef = doc(db, "folders", folderToRename.id);
            batch.update(folderRef, { name: newFolderRenameValue.trim() });

            // Query for notes with the old tag name
            const notesToUpdateQuery = query(collection(db, "notes"), where("ownerId", "==", user.uid), where("tag", "==", folderToRename.name));
            const notesSnapshot = await getDocs(notesToUpdateQuery);
            notesSnapshot.forEach(noteDoc => {
                batch.update(noteDoc.ref, { tag: newFolderRenameValue.trim(), lastEdited: serverTimestamp() });
            });

            await batch.commit();
            toast({ title: `Folder renamed to "${newFolderRenameValue.trim()}".` });
            // Update active tab if the renamed folder was selected
            if (activeTab === folderToRename.name) {
                setActiveTab(newFolderRenameValue.trim());
            }
        } catch (error: any) {
            console.error("Error renaming folder:", error);
            const isIndexError = error.message?.includes("firestore/failed-precondition");
            toast({
                variant: "destructive",
                title: "Error Renaming Folder",
                description: isIndexError
                    ? "A required database index is missing for this operation. Please create it in your Firebase console (notes collection: ownerId asc, tag asc)."
                    : "Could not rename the folder. Please try again."
            });
        } finally {
            setIsSavingRename(false);
            setIsRenameDialogOpen(false);
            setFolderToRename(null);
            setNewFolderRenameValue("");
        }
    };

    const handleConfirmDeleteFolder = async () => {
        if (!folderToDelete || !user) return;

        try {
            const batch = writeBatch(db);

            const folderRef = doc(db, "folders", folderToDelete.id);
            batch.delete(folderRef);

            // Query for notes with the old tag name
            const notesToUpdateQuery = query(collection(db, "notes"), where("ownerId", "==", user.uid), where("tag", "==", folderToDelete.name));
            const notesSnapshot = await getDocs(notesToUpdateQuery);
            notesSnapshot.forEach(noteDoc => {
                batch.update(noteDoc.ref, { tag: "General", lastEdited: serverTimestamp() });
            });

            await batch.commit();
            toast({ title: `Folder "${folderToDelete.name}" deleted. Notes moved to "General".` });
            // If the deleted folder's tab was active, switch to "all"
            if (activeTab === folderToDelete.name) {
                setActiveTab("all");
            }
        } catch (error: any) {
            console.error("Error deleting folder:", error);
            const isIndexError = error.message?.includes("firestore/failed-precondition");
            toast({
                variant: "destructive",
                title: "Error Deleting Folder",
                description: isIndexError
                    ? "A required database index is missing for this operation. Please create it in your Firebase console (notes collection: ownerId asc, tag asc)."
                    : "Could not delete the folder. Please try again."
            });
        } finally {
            setFolderToDelete(null);
        }
    };

    const renderActionsMenu = (noteDoc: Note) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-haspopup="true"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when opening dropdown
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}> {/* Prevent closing dropdown when clicking sub-items */}
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => router.push(`/dashboard/notes/${noteDoc.id}`)}>View</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleOpenInNewTab(noteDoc.id)}>Open in new tab</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleEditNote(noteDoc)}>Edit</DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => handleDownloadPdf(noteDoc)}>
                            <Download className="mr-2 h-4 w-4" /> As PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExportJson(noteDoc)}>
                            <FileJson className="mr-2 h-4 w-4" /> As JSON
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onSelect={() => handleToggleArchive(noteDoc)}>
                    <Move className="mr-2 h-4 w-4" /> {noteDoc.isArchived ? "Restore" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive-foreground focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the note.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNote(noteDoc.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const isLoading = isLoadingNotes || isLoadingFolders;
    const error = errorNotes || errorFolders;

    const renderEmptyState = () => (
        <div className="text-center text-muted-foreground py-10">
            {error && <p className="text-destructive">Error: {error.message}</p>}
            {!isLoading && !error && (
                <>
                    <p>No notes found for the selected filters. Try adjusting your search.</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Button size="sm" asChild>
                            <Link href="/dashboard/notes/new">
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Note
                            </Link>
                        </Button>
                    </div>
                </>
            )}
        </div>
    );

    const unselectedTags = allTags.filter(tag => !tempSelectedTags.includes(tag.name));

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
                <p className="text-muted-foreground">Browse, search, and manage all your generated notes.</p>
            </div>

            <Card>
                {/* Responsive CardHeader: Uses p-4 px-0 on mobile, p-6 px-0 from sm, ensures full-width */}
                <CardHeader className="overflow-hidden p-4 sm:p-6 pb-0 sm:pb-0">
                    {/* Flex container for search, filter, and view toggles */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full flex-1 min-w-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search notes..."
                                className="w-full rounded-lg bg-background pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Right side controls: Filter and View toggles */}
                        <div className="flex items-center gap-2 w-full sm:w-auto"> {/* W-full on mobile, auto on sm+ */}
                            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 gap-1 w-full sm:w-auto"> {/* W-full on mobile, auto on sm+ */}
                                        <ListFilter className="h-3.5 w-3.5" />
                                        {/* sr-only on mobile, visible on sm breakpoint */}
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                            Filter
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="font-medium leading-none">Filter Options</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Refine your notes by tag or date range.
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-sm font-medium">By Tag</h5>
                                                    {tempSelectedTags.length > 0 && (
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-red-500 hover:text-red-600" onClick={handleClearTempTags}>
                                                            Clear All
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 min-h-[30px]"> {/* min-h for consistent form */}
                                                    {tempSelectedTags.map((tagName) => {
                                                        const tag = allTags.find(t => t.name === tagName) || { name: tagName, ...defaultTagStyle };
                                                        return (
                                                            <Badge key={tag.name} className={cn("flex items-center gap-1 py-1 text-xs text-white", tag.className)}>
                                                                <span className="mr-1.5">{tag.name}</span>
                                                                <button
                                                                    aria-label={`Remove ${tag.name} filter`}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setTempSelectedTags(current => current.filter(t => t !== tag.name));
                                                                        // toast({title: "Tag removed"}); // Again, maybe don't toast on temp state change
                                                                    }}
                                                                    className="rounded-full text-white/70 outline-none ring-offset-background hover:text-white focus:ring-2 focus:ring-ring"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                                <Command id="tags" className="overflow-visible bg-transparent">
                                                    <div className="group flex items-center rounded-md border px-2">
                                                        <CommandInput
                                                            ref={inputRef}
                                                            placeholder="Search or select tags..."
                                                            className="h-9 w-full rounded-md border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                                                        />
                                                    </div>
                                                    <div className="relative mt-1">
                                                        <CommandList>
                                                            <CommandEmpty className="py-0 text-center text-sm">No tags found.</CommandEmpty>
                                                            {unselectedTags.length > 0 && (
                                                                <CommandGroup>
                                                                    {unselectedTags.map((tag) => (
                                                                        <CommandItem
                                                                            key={tag.name}
                                                                            value={tag.name}
                                                                            onSelect={() => {
                                                                                setTempSelectedTags(prev => [...prev, tag.name]);
                                                                                // toast({title: "Tag added"});
                                                                                inputRef.current?.focus();
                                                                            }}
                                                                            className="flex cursor-pointer items-center justify-between"
                                                                        >
                                                                            <span>{tag.name}</span>
                                                                            {tempSelectedTags.includes(tag.name) && <Check className="h-4 w-4" />}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </div>
                                                </Command>
                                            </div>
                                            <div className="space-y-2">
                                                <h5 className="text-sm font-medium">By Date</h5>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="date-range"
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !tempDateRange && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {tempDateRange?.from ? (
                                                                tempDateRange.to ? (
                                                                    <>
                                                                        {format(tempDateRange.from, "LLL dd, y")} -{" "}
                                                                        {format(tempDateRange.to, "LLL dd, y")}
                                                                    </>
                                                                ) : (
                                                                    format(tempDateRange.from, "LLL dd, y")
                                                                )
                                                            ) : (
                                                                <span>Pick a date range</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="end">
                                                        <Calendar
                                                            initialFocus
                                                            mode="range"
                                                            defaultMonth={tempDateRange?.from}
                                                            selected={tempDateRange}
                                                            onSelect={setTempDateRange}
                                                            numberOfMonths={1}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <Button variant="ghost" onClick={handleClearAllFilters}>Clear All Filters</Button>
                                            <Button onClick={handleApplyFilters}>Apply Filters</Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="flex items-center gap-1 rounded-md border bg-muted p-0.5">
                                <Button variant={view === 'grid' ? 'accent' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleSetView('grid')}>
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button variant={view === 'list' ? 'accent' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleSetView('list')}>
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Responsive for Create buttons: Stacks on mobile, aligns horizontally on sm+ */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto" onClick={() => setCreateFolderOpen(true)}>
                            <FolderPlus className="h-3.5 w-3.5" />
                            {/* sr-only on mobile, visible on sm breakpoint */}
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Create Folder
                            </span>
                        </Button>
                        <Button size="sm" className="h-9 gap-1 w-full sm:w-auto" asChild>
                            <Link href="/dashboard/notes/new">
                                <PlusCircle className="h-3.5 w-3.5" />
                                {/* sr-only on mobile, visible on sm breakpoint */}
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Create Note
                                </span>
                            </Link>
                        </Button>
                    </div>

                    {/* Responsive Tabs: Scrollable on mobile */}
                    <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setSelectedNotes([]) }} className="w-full">
                        <ScrollArea className="w-full whitespace-nowrap pt-4 px-0 sm:pr-0 -ml-4 sm:ml-0">
                            <TabsList className="mt-4 border-b bg-transparent p-0 flex items-center justify-start flex-nowrap"> {/* flex-nowrap to keep tabs from wrapping */}
                                <TabsTrigger value="all" className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">All</TabsTrigger>
                                <TabsTrigger value="drafts" className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Drafts</TabsTrigger>
                                <TabsTrigger value="archived" className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Archived</TabsTrigger>
                                {folders.map(folder => (
                                    <div key={folder.id} className="group relative">
                                        <TabsTrigger
                                            value={folder.name}
                                            className="relative rounded-none border-b-2 border-transparent bg-transparent py-3 pl-4 pr-8 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                                        >
                                            {folder.name}
                                        </TabsTrigger>
                                        {/* Dropdown for folder actions - only visible on hover/focus of group */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                                                    onClick={(e) => e.stopPropagation()} // Prevent tab change when opening dropdown
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onSelect={() => handleOpenRenameDialog(folder)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setFolderToDelete(folder)} className="text-destructive focus:bg-destructive-foreground focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" className="invisible" /> {/* Invisible scrollbar */}
                        </ScrollArea>
                    </Tabs>
                </CardHeader>
                {/* CardContent Responsive: No horizontal padding on mobile (px-0), then p-6 on sm+ */}
                <CardContent className="px-0 sm:p-6 pt-0">
                    {/* Bulk Action Bar: Stacks on mobile, aligns horizontally on sm+ */}
                    {selectedNotes.length > 0 && (
                        <div className="my-4 flex flex-col sm:flex-row h-auto sm:h-12 items-start sm:items-center justify-between gap-4 rounded-md border bg-muted/50 p-2 sm:px-4 mx-4 sm:mx-0"> {/* mx-4 on mobile, mx-0 on sm+ */}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="bulk-select-all-top"
                                    checked={selectedNotes.length === filteredNotes.length && filteredNotes.length > 0}
                                    onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
                                />
                                <span className="text-sm font-semibold">{selectedNotes.length} selected</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto"> {/* W-full on mobile, auto on sm+ */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={isBulkProcessing} className="flex-1 sm:flex-initial"> {/* flex-1 on mobile, initial on sm+ */}
                                            <Move className="mr-2 h-4 w-4" /> Move to
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Select a folder</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {folders.map(folder => (
                                            <DropdownMenuItem key={folder.id} onSelect={() => handleBulkAction('move', folder.name)}>
                                                {folder.name}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuItem onSelect={() => handleBulkAction('move', 'General')}>
                                            General
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')} disabled={isBulkProcessing} className="flex-1 sm:flex-initial"> {/* flex-1 on mobile, initial on sm+ */}
                                    {activeTab === 'archived' ? 'Restore' : 'Archive'}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isBulkProcessing} className="flex-1 sm:flex-initial"><Trash2 className="mr-2 h-4 w-4" />Delete</Button> {/* flex-1 on mobile, initial on sm+ */}
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete {selectedNotes.length} selected note(s). This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleBulkAction('delete')} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {isBulkProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                            </div>
                        </div>
                    )}
                    {isLoading ? (
                        view === 'grid' ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 sm:p-0"> {/* p-4 on mobile, p-0 on sm+ due to parent padding */}
                                <Skeleton className="h-56 w-full" />
                                <Skeleton className="h-56 w-full" />
                                <Skeleton className="h-56 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-2 p-4 sm:p-0"> {/* p-4 on mobile, p-0 on sm+ due to parent padding */}
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        )
                    ) : view === 'grid' ? (
                        filteredNotes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 p-4 sm:p-0 md:grid-cols-2 lg:grid-cols-3"> {/* p-4 on mobile, p-0 on sm+ due to parent padding */}
                                {filteredNotes.map(noteDoc => (
                                    <Card key={noteDoc.id} className="relative">
                                        <div className="absolute top-2 left-2 z-10">
                                            <Checkbox
                                                id={`select-${noteDoc.id}`}
                                                checked={selectedNotes.includes(noteDoc.id)}
                                                onCheckedChange={() => handleToggleNoteSelection(noteDoc.id)}
                                                className="bg-background/80"
                                            />
                                        </div>
                                        <div onClick={() => router.push(`/dashboard/notes/${noteDoc.id}`)} className="cursor-pointer">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <CardTitle className="text-lg leading-tight pr-8">{noteDoc.title}</CardTitle>
                                                </div>
                                                <CardDescription>{noteDoc.patient} - {noteDoc.date?.toDate().toLocaleDateString()}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground line-clamp-3">{noteDoc.summary}</p>
                                            </CardContent>
                                        </div>
                                        <div className="absolute top-2 right-2 z-10">{renderActionsMenu(noteDoc)}</div>
                                        <CardFooter className="flex justify-between items-center">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">{noteDoc.tag}</Badge>
                                                {noteDoc.isArchived && <Badge variant="secondary">Archived</Badge>}
                                                {noteDoc.isDraft && <Badge variant="secondary">Draft</Badge>}
                                            </div>
                                            <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/notes/${noteDoc.id}`)}>View</Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            renderEmptyState()
                        )
                    ) : (
                        <div className="overflow-x-auto"> {/* Enable horizontal scroll for table on small screens */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                id="select-all-table"
                                                checked={filteredNotes.length > 0 && selectedNotes.length === filteredNotes.length}
                                                onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
                                            />
                                        </TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="hidden sm:table-cell">Patient</TableHead> {/* Hidden on mobile, visible on sm+ */}
                                        <TableHead className="hidden md:table-cell">Date</TableHead> {/* Hidden on mobile and sm, visible on md+ */}
                                        <TableHead>Tag</TableHead>
                                        <TableHead className="w-[80px] text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredNotes.length > 0 ? (
                                        filteredNotes.map(noteDoc => (
                                            <TableRow key={noteDoc.id} data-state={selectedNotes.includes(noteDoc.id) && "selected"}>
                                                <TableCell>
                                                    <Checkbox
                                                        id={`select-row-${noteDoc.id}`}
                                                        checked={selectedNotes.includes(noteDoc.id)}
                                                        onCheckedChange={() => handleToggleNoteSelection(noteDoc.id)}
                                                    />
                                                </TableCell>
                                                <TableCell onClick={() => router.push(`/dashboard/notes/${noteDoc.id}`)} className="font-medium cursor-pointer">{noteDoc.title}</TableCell>
                                                <TableCell onClick={() => router.push(`/dashboard/notes/${noteDoc.id}`)} className="hidden sm:table-cell cursor-pointer">{noteDoc.patient}</TableCell> {/* Hidden on mobile, visible on sm+ */}
                                                <TableCell onClick={() => router.push(`/dashboard/notes/${noteDoc.id}`)} className="hidden md:table-cell cursor-pointer">{noteDoc.date?.toDate().toLocaleDateString()}</TableCell> {/* Hidden on mobile and sm, visible on md+ */}
                                                <TableCell onClick={() => router.push(`/dashboard/notes/${noteDoc.id}`)} className="cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{noteDoc.tag}</Badge>
                                                        {noteDoc.isArchived && <Badge variant="secondary">Archived</Badge>}
                                                        {noteDoc.isDraft && <Badge variant="secondary">Draft</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {renderActionsMenu(noteDoc)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center"> {/* Adjusted colspan for hidden columns */}
                                                No notes found for the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Folder Dialog */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setCreateFolderOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new folder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            id="new-folder-name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            placeholder="e.g., Follow-ups"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveNewFolder} disabled={isSavingFolder || !newFolderName.trim()}>
                            {isSavingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the folder "{folderToRename?.name}". This will update all notes in this folder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            id="folder-name"
                            value={newFolderRenameValue}
                            onChange={e => setNewFolderRenameValue(e.target.value)}
                            placeholder="e.g., Follow-ups"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleRenameFolder}
                            disabled={isSavingRename || !newFolderRenameValue.trim() || newFolderRenameValue.trim() === folderToRename?.name}
                        >
                            {isSavingRename ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Delete Confirmation */}
            <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{folderToDelete?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the folder and move all its notes to the "General" folder. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

