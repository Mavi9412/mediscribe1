import { FileUp, Mic, Sparkles } from "lucide-react";

const steps = [
    {
        icon: <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary"><Mic /></div>,
        name: 'Step 1: Record or Upload',
        description: 'Use our app to record the patient conversation in real-time or upload a pre-recorded audio file.'
    },
    {
        icon: <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary"><Sparkles /></div>,
        name: 'Step 2: AI Generation',
        description: 'Our AI transcribes the audio, extracts key medical information, and structures it into a professional note using your chosen template.'
    },
    {
        icon: <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary"><FileUp /></div>,
        name: 'Step 3: Review & Export',
        description: 'Quickly review the generated note, make any edits, and then copy it into your EHR system with a single click.'
    }
];

export const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="bg-secondary py-24 sm:py-32">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 flex justify-center">
                        <p className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                            How It Works
                        </p>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        From conversation to completed note in 3 simple steps.
                    </h2>
                </div>

                <div className="relative mt-16">
                    {/* Horizontal line for desktop */}
                    <div aria-hidden="true" className="absolute inset-0 hidden items-center md:flex">
                        <div className="w-full border-t border-dashed border-gray-300" />
                    </div>
                     {/* Vertical line for mobile */}
                    <div aria-hidden="true" className="absolute inset-0 flex justify-center md:hidden">
                        <div className="h-full border-l border-dashed border-gray-300" />
                    </div>
                    <div className="relative flex flex-col items-center gap-16 md:flex-row md:justify-between md:gap-0">
                         {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center">
                                <div className="relative z-10">
                                    <div className="w-20 h-20 flex items-center justify-center rounded-full bg-secondary">
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">{step.name}</h3>
                                <p className="mt-1 text-sm text-muted-foreground max-w-xs">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
