import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export const CtaSection = () => {
    return (
        <section id="cta" className="py-24 sm:py-32">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8 text-center">
                 <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Ready to reclaim your time?
                </h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    Join thousands of clinicians who are automating their documentation and reducing burnout.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'shadow-lg shadow-primary/30')}>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start Your Free Trial
                    </Link>
                </div>
            </div>
        </section>
    );
}
