
"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  FileText,
  PlusCircle,
  Upload,
  Users,
  Pencil,
  Calendar,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from '@/hooks/use-auth'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

interface Note {
  id: string;
  title: string;
  patient: string;
  date: Timestamp;
  lastEdited?: Timestamp;
  isDraft?: boolean;
}

export default function Dashboard() {
    const { user, isLoading: isLoadingUser } = useAuth();
    
    const notesRef = collection(db, "notes");
    const notesQuery = user ? query(notesRef, where("ownerId", "==", user.uid)) : null;
    const [notesSnapshot, isLoadingNotes] = useCollection(notesQuery);

    const stats = useMemo(() => {
        if (!notesSnapshot) return null;
        
        const notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));

        // Notes today vs yesterday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const notesToday = notes.filter(n => !n.isDraft && n.date?.toDate() >= today);
        const notesYesterday = notes.filter(n => !n.isDraft && n.date?.toDate() >= yesterday && n.date?.toDate() < today);

        const notesTodayCount = notesToday.length;
        
        let comparisonText = `${notesTodayCount > 0 ? '+' : ''}${notesTodayCount} from yesterday`;
        if (notesTodayCount > notesYesterday.length) {
            comparisonText = `+${notesTodayCount - notesYesterday.length} from yesterday`;
        } else if (notesTodayCount < notesYesterday.length) {
            comparisonText = `-${notesYesterday.length - notesTodayCount} from yesterday`;
        }

        // Notes this month vs last month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        
        const notesThisMonth = notes.filter(n => !n.isDraft && n.date?.toDate() >= startOfMonth);
        const notesThisMonthCount = notesThisMonth.length;
        
        const notesLastMonth = notes.filter(n => !n.isDraft && n.date?.toDate() >= startOfLastMonth && n.date?.toDate() < startOfMonth);
        const notesLastMonthCount = notesLastMonth.length;
        
        let notesThisMonthComparisonText = "No change from last month";
        if (notesLastMonthCount > 0) {
            if (notesThisMonthCount !== notesLastMonthCount) {
                const percentageChange = ((notesThisMonthCount - notesLastMonthCount) / notesLastMonthCount) * 100;
                notesThisMonthComparisonText = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}% from last month`;
            }
        } else if (notesThisMonthCount > 0) {
            notesThisMonthComparisonText = `+${notesThisMonthCount} since last month`;
        }


        // Recent Activity (Drafts and New Notes)
        const recentActivityNotes = notes
            .sort((a, b) => {
                const timeA = a.lastEdited?.toMillis() || a.date?.toMillis() || 0;
                const timeB = b.lastEdited?.toMillis() || b.date?.toMillis() || 0;
                return timeB - timeA;
            })
            .slice(0, 5);
            
        return {
            notesTodayCount,
            comparisonText,
            notesThisMonthCount,
            notesThisMonthComparisonText,
            recentActivityNotes
        }
    }, [notesSnapshot]);

    const isLoading = isLoadingUser || isLoadingNotes;

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="mt-2 h-5 w-80" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="mt-2 h-4 w-1/3" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="mt-2 h-4 w-1/3" /></CardContent></Card>
                </div>
                <div className="grid gap-4">
                    <Card className="col-span-4"><CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="mt-2 h-4 w-1/3" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /><Skeleton className="mt-4 h-10 w-full" /></CardContent></Card>
                </div>
            </div>
        )
    }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName?.split(' ')[0] || 'Doctor'}!</h1>
            <p className="text-muted-foreground">Here's a quick overview of your work.</p>
        </div>
        <Button asChild>
            <Link href="/dashboard/patients"><Users /> View Patients</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notes Created Today
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.notesTodayCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.comparisonText ?? "No data from yesterday"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notes This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.notesThisMonthCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.notesThisMonthComparisonText ?? "No data from last month"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                    Your most recently created or updated notes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {stats && stats.recentActivityNotes.length > 0 ? (
                    <ul className="space-y-4">
                        {stats.recentActivityNotes.map((note, index) => (
                            <li key={note.id} className={cn(
                                "flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between",
                                index < stats.recentActivityNotes.length - 1 && "pb-4 border-b sm:border-none sm:pb-0"
                            )}>
                                <div className="flex flex-col">
                                    <span className="font-medium">{note.title}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {note.patient} -{' '}
                                        {note.isDraft
                                            ? `Draft: ${note.date.toDate().toLocaleString()}`
                                            : note.lastEdited
                                            ? `Edited: ${note.lastEdited.toDate().toLocaleString()}`
                                            : `Created: ${note.date.toDate().toLocaleString()}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                                     {note.isDraft ? (
                                        <>
                                            <Badge variant="secondary">Draft</Badge>
                                            <Button asChild variant="outline" size="sm" className="grow sm:grow-0">
                                                <Link href={`/dashboard/notes/new?id=${note.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </>
                                     ) : (
                                        <Button asChild variant="outline" size="sm" className="grow sm:grow-0">
                                            <Link href={`/dashboard/notes/${note.id}`}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                View
                                            </Link>
                                        </Button>
                                     )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No recent activity yet. Create a note to get started!</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
