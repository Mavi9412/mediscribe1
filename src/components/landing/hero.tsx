import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export const HeroSection = () => {
    return (
        <section id="hero" className="relative isolate overflow-hidden pt-14">
            {/* Background Gradient */}
            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>
            
            <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                        <span className="text-gradient-hero">Never write clinical notes</span> again.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                       Our HIPAA-compliant AI medical scribe automates your documentation, so you can focus on what matters most: your patients.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-4">
                        <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto shadow-lg shadow-primary/30')}>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Start Your Free Trial
                        </Link>
                        <Link href="#how-it-works" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}>
                            Learn More &rarr;
                        </Link>
                    </div>
                    <ul className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 100% HIPAA Compliant</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Works for any EHR</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AES-256 Encryption</li>
                    </ul>
                </div>

                 <div className="mt-16 flow-root sm:mt-24">
                    <div className="rounded-xl bg-background/5 p-2 shadow-2xl shadow-primary/20 ring-1 ring-inset ring-primary/10 lg:rounded-2xl lg:p-4">
                    <Image
                        src="https://placehold.co/1200x600.png"
                        alt="App screenshot"
                        width={2432}
                        height={1442}
                        className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                        data-ai-hint="dashboard mockup"
                    />
                    </div>
                </div>
            </div>
        </section>
    );
}
