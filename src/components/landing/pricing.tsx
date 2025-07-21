import { Check, Crown } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const freeFeatures = [
    '5 AI Notes per month',
    'Live Transcription',
    'Default Templates',
    'Standard Support'
];

const proFeatures = [
    'Unlimited AI Notes',
    'Custom Templates & Automagic Upload',
    'Macros & Shortcuts',
    'Priority Support'
];

export const PricingSection = () => {
    return (
        <section id="pricing" className="py-24 sm:py-32">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                     <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Simple, transparent pricing.
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Choose the plan that's right for you. No hidden fees, cancel anytime.
                    </p>
                </div>
                
                 <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Free</CardTitle>
                            <div className="flex items-baseline gap-x-2">
                                <span className="text-5xl font-bold tracking-tight">$0</span>
                                <span className="text-sm font-semibold leading-6 text-muted-foreground">/month</span>
                            </div>
                            <CardDescription>Get started with the basics for free. Perfect for light use.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ul role="list" className="space-y-3 text-sm leading-6 text-muted-foreground">
                                {freeFeatures.map((feature) => (
                                    <li key={feature} className="flex gap-x-3">
                                        <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/signup?plan=free" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}>
                                Get Started
                            </Link>
                        </CardFooter>
                    </Card>

                    <Card className="ring-2 ring-primary">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl">Pro</CardTitle>
                                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold leading-5 text-primary">
                                    Most Popular
                                </div>
                            </div>
                            <div className="flex items-baseline gap-x-2">
                                <span className="text-5xl font-bold tracking-tight">$49</span>
                                <span className="text-sm font-semibold leading-6 text-muted-foreground">/month</span>
                            </div>
                            <CardDescription>Unlock all features for maximum productivity and customization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul role="list" className="space-y-3 text-sm leading-6 text-muted-foreground">
                                {proFeatures.map((feature) => (
                                    <li key={feature} className="flex gap-x-3">
                                        <Crown className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                             <Link href="/signup?plan=pro" className={cn(buttonVariants({ size: 'lg' }), 'w-full shadow-lg shadow-primary/30')}>
                                Upgrade to Pro
                            </Link>
                        </CardFooter>
                    </Card>
                 </div>
            </div>
        </section>
    );
}
