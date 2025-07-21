
"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import {
  Bell,
  FileText,
  Home,
  Package,
  Mic,
  Settings,
  Upload,
  Users,
  Stethoscope,
  Keyboard,
  Crown,
  PlusCircle,
  ChevronDown,
  Loader2,
  FileClock,
  CircleUserRound,
  Check,
  Trash2,
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuFooter,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCollection } from "react-firebase-hooks/firestore"
import { collection, query, where, Timestamp, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
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

function LoadingLink({ href, className, children, setLoading, ...props }: Omit<React.ComponentProps<typeof Link>, 'onClick' | 'setLoading'> & { setLoading: (loading: boolean) => void; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const currentPathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.toString() !== currentPathname) {
      setLoading(true);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
    props.onClick?.(e);
  };

  return <Link href={href} className={className} {...props} onClick={handleClick}>{children}</Link>;
}

interface Notification {
  id: string;
  type: 'note_generated' | 'patient_added' | 'template_updated';
  title: string;
  description: string;
  link?: string;
  isRead: boolean;
  createdAt: Timestamp;
  ownerId: string;
}

const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
        case 'note_generated': return <FileClock className="text-blue-500" />;
        case 'patient_added': return <CircleUserRound className="text-green-500" />;
        case 'template_updated': return <FileText className="text-purple-500" />;
        default: return <Bell className="text-gray-500" />;
    }
}

function NotificationPanel() {
  const { user } = useAuth();
  const notificationsRef = collection(db, "notifications");
  const notificationsQuery = user ? query(notificationsRef, where("ownerId", "==", user.uid)) : null;
  const [snapshot, loading] = useCollection(notificationsQuery);

  const notifications = useMemo(() => {
    if (!snapshot) return [];
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    return data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
    });
  }, [snapshot]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.isRead) {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { isRead: true });
      }
    });
    await batch.commit();
  };

  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
        const docRef = doc(db, "notifications", n.id);
        batch.delete(docRef);
    });
    await batch.commit();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/90"></span>
                  </span>
              )}
              <span className="sr-only">Toggle notifications</span>
          </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
             <div className="p-4 text-sm text-center text-muted-foreground">Loading...</div>
          ) : notifications.length > 0 ? (
              notifications.slice(0, 5).map(notification => (
                  <DropdownMenuItem key={notification.id} className={cn("flex items-start gap-3 p-2", !notification.isRead && "bg-blue-50 dark:bg-blue-900/20")}>
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground self-start">
                        {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                  </DropdownMenuItem>
              ))
          ) : (
              <p className="p-4 text-sm text-center text-muted-foreground">No new notifications</p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuFooter className="p-1">
              <div className="flex justify-between items-center gap-2">
                  <Button variant="link" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark all as read
                  </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="link" size="sm" className="text-destructive hover:text-destructive/90" disabled={notifications.length === 0}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear all
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This will permanently delete all your notifications. This action cannot be undone.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                                  Delete All
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
          </DropdownMenuFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);
  
  const isCreatePage = pathname.startsWith('/dashboard/record') || pathname.startsWith('/dashboard/upload') || pathname === '/dashboard/notes/new';

  return (
    <AuthProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <LoadingLink href="/dashboard" className="flex items-center gap-2" setLoading={setIsLoading}>
              <Stethoscope className="size-7 text-primary" />
              <h1 className="text-xl font-semibold font-headline">MediScribe AI</h1>
            </LoadingLink>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                  <div className={cn("flex w-full px-1", isCreatePage && "bg-primary/90 rounded-md")}>
                    <Button
                        variant="default"
                        size="default"
                        className="w-full justify-start rounded-r-none"
                        asChild
                    >
                        <LoadingLink href="/dashboard/notes/new" className="flex-1" setLoading={setIsLoading}>
                             <PlusCircle />
                            <span>Create Note</span>
                        </LoadingLink>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button
                            variant="default"
                            size="default"
                            className="rounded-l-none border-l border-primary-foreground/20 px-2"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                                <ChevronDown className="h-4 w-4 text-primary-foreground" />
                            </div>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--sidebar-width)] -translate-x-2">
                            <DropdownMenuItem asChild>
                                <LoadingLink href="/dashboard/record" setLoading={setIsLoading}><Mic className="mr-2"/>Record Session</LoadingLink>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <LoadingLink href="/dashboard/upload" setLoading={setIsLoading}><Upload className="mr-2"/>Upload Audio</LoadingLink>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <LoadingLink href="/dashboard" setLoading={setIsLoading}><Home />Dashboard</LoadingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/notes")}>
                  <LoadingLink href="/dashboard/notes" setLoading={setIsLoading}><FileText />Notes</LoadingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/patients")}>
                  <LoadingLink href="/dashboard/patients" setLoading={setIsLoading}><Users />Patients</LoadingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/templates")}>
                  <LoadingLink href="/dashboard/templates" setLoading={setIsLoading}><Package />Templates</LoadingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/macros")}>
                  <LoadingLink href="/dashboard/macros" setLoading={setIsLoading}><Keyboard />Macros</LoadingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild className="w-full justify-start h-auto p-2 bg-primary/10 text-primary hover:bg-primary/20" isActive={pathname.startsWith("/dashboard/upgrade")}>
                      <LoadingLink href="/dashboard/upgrade" setLoading={setIsLoading}>
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">Upgrade to Pro</span>
                                <span className="text-xs text-primary/80">Unlock all features</span>
                            </div>
                        </div>
                      </LoadingLink>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/settings")}>
                      <LoadingLink href="/dashboard/settings" setLoading={setIsLoading}><Settings />Settings</LoadingLink>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="relative flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 sm:h-16 sm:px-6 no-print">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Can add breadcrumbs or page title here */}
            </div>
            <div className="flex items-center gap-2">
              <div className="sm:hidden">
                <DropdownMenu>
                  <div className="flex rounded-md">
                      <Button asChild size="sm" className="gap-1 rounded-r-none">
                        <Link href="/dashboard/notes/new">
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Note</span>
                        </Link>
                      </Button>
                      <DropdownMenuTrigger asChild>
                          <Button size="sm" className="rounded-l-none border-l px-2">
                              <ChevronDown className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                          <Link href="/dashboard/record"><Mic className="mr-2"/>Record</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link href="/dashboard/upload"><Upload className="mr-2"/>Upload</Link>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <NotificationPanel />
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <AuthGuard>
              <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                {children}
              </Suspense>
            </AuthGuard>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  )
}
