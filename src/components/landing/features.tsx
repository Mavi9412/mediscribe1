import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileText, Keyboard, Languages } from 'lucide-react';

const features = [
    {
        icon: <Bot />,
        title: 'Intelligent Transcription',
        description: 'Capture every detail with our highly accurate, real-time transcription service that understands medical terminology.'
    },
    {
        icon: <FileText />,
        title: 'Automated SOAP Notes',
        description: 'From patient conversation to a structured, EMR-ready SOAP note in seconds. Our AI handles the heavy lifting.'
    },
    {
        icon: <Keyboard />,
        title: 'Custom Templates & Macros',
        description: 'Build your own templates and text-expansion shortcuts to fit your unique workflow and save even more time.'
    },
    {
        icon: <Languages />,
        title: 'HIPAA-Grade Security',
        description: 'Your data is protected with end-to-end encryption and robust security protocols, ensuring patient privacy.'
    }
];

export const FeaturesSection = () => {
    return (
        <section id="features" className="py-24 sm:py-32">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 flex justify-center">
                        <p className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                            Our Features
                        </p>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Everything you need. Nothing you don't.
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                        We built MediScribe AI because we believe clinicians should be healers, not typists. Our platform is designed to reduce administrative burden and prevent burnout.
                    </p>
                </div>

                <div className="mx-auto mt-16 grid max-w-none grid-cols-1 gap-8 sm:mt-20 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                                    {feature.icon}
                                </div>
                                <CardTitle className="pt-4">{feature.title}</CardTitle>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
