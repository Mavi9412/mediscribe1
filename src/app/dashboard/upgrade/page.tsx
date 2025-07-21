
"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
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

export default function UpgradePage() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const isPro = userProfile?.plan === 'pro';

    const handlePlanChange = async (plan: 'pro' | 'free') => {
        if (!user) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }
        setIsProcessing(true);
        try {
            const profileRef = doc(db, "userProfiles", user.uid);
            await setDoc(profileRef, { plan }, { merge: true });
            if (plan === 'pro') {
                toast({ title: "Upgrade Successful!", description: "Welcome to the Pro plan. All features are now unlocked." });
            } else {
                 toast({ title: "Plan Canceled", description: "You have been downgraded to the Free plan." });
            }
        } catch (error) {
            console.error("Error changing plan:", error);
            toast({ variant: "destructive", title: "Action Failed", description: "Could not update your plan. Please try again." });
        } finally {
            setIsProcessing(false);
        }
    };


    const freeFeatures = [
        '5 AI Notes per month',
        'Live Transcription',
        'Default Templates'
    ];
    const proFeatures = [
        'Everything in Free, plus:',
        'Unlimited AI Notes',
        'Custom Templates & Automagic Upload',
        'Macros & Shortcuts',
        'Priority Support'
    ];

    if (!userProfile) {
        return <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-96 w-full" />
        </div>
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">
                    {isPro ? "You are on the Pro Plan!" : "Upgrade to MediScribe AI Pro"}
                </h1>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                    {isPro ? "Thank you for your support. You have access to all features." : "Unlock all features and supercharge your workflow. No limits, just productivity."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Card className={cn(isPro ? "opacity-60" : "")}>
                    <CardHeader>
                        <CardTitle>Free Plan</CardTitle>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">$0</span>
                            <span className="text-muted-foreground">/ month</span>
                        </div>
                        <CardDescription>For individuals getting started.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {freeFeatures.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span className="text-sm text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                       {!isPro && (
                             <Button className="w-full" variant="outline" disabled>
                                Your Current Plan
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <Card className={cn("border-2 border-primary shadow-lg", isPro ? "ring-2 ring-primary" : "")}>
                     <CardHeader>
                        <CardTitle>Pro Plan</CardTitle>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">$49</span>
                             <span className="text-muted-foreground">/ month</span>
                        </div>
                        <CardDescription>For professionals who need more power.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3">
                            {proFeatures.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-primary" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full" variant="destructive" disabled={isProcessing}>
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                        Cancel Subscription
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will downgrade your plan to Free. You will lose access to Pro features at the end of your current billing cycle. This action can be undone by upgrading again.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Pro Plan</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handlePlanChange('free')} className="bg-destructive hover:bg-destructive/90">
                                        Yes, Cancel
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button className="w-full" size="lg" onClick={() => handlePlanChange('pro')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                                Upgrade to Pro
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
