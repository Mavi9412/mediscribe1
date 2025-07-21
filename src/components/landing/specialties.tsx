
import { BrainCircuit, Heart, Stethoscope, Bone, Baby, FileText, Siren, Flower2, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const specialties = [
    {
        icon: <Heart className="w-8 h-8 text-red-500" />,
        name: 'Cardiology',
        slug: 'cardiology',
        description: 'Streamline cardiac documentation with specialized cardiovascular terminology and templates.',
        timeReduction: '72% time reduction',
    },
    {
        icon: <BrainCircuit className="w-8 h-8 text-pink-500" />,
        name: 'Neurology',
        slug: 'neurology',
        description: 'Enhanced neurological assessment documentation with field-specific terminology.',
        timeReduction: '68% time reduction',
    },
    {
        icon: <Stethoscope className="w-8 h-8 text-blue-500" />,
        name: 'Primary Care',
        slug: 'primary-care',
        description: 'Comprehensive documentation tools for diverse primary care patient encounters.',
        timeReduction: '75% time reduction',
    },
    {
        icon: <Bone className="w-8 h-8 text-gray-500" />,
        name: 'Orthopedics',
        slug: 'orthopedics',
        description: 'Specialized musculoskeletal documentation with anatomical precision and accuracy.',
        timeReduction: '65% time reduction',
    },
    {
        icon: <ShieldAlert className="w-8 h-8 text-purple-500" />,
        name: 'Psychiatry',
        slug: 'psychiatry',
        description: 'Sensitive and accurate mental health documentation with behavioral health terminology.',
        timeReduction: '82% time reduction',
    },
    {
        icon: <Baby className="w-8 h-8 text-yellow-500" />,
        name: 'Pediatrics',
        slug: 'pediatrics',
        description: 'Age-appropriate documentation tools designed specifically for pediatric practice.',
        timeReduction: '75% time reduction',
    },
    {
        icon: <FileText className="w-8 h-8 text-indigo-500" />,
        name: 'Internal Medicine',
        slug: 'internal-medicine',
        description: 'Documentation that understands abbreviations, medical terminology along with templates for chronic disease management and multi-problem visits.',
        timeReduction: '70% time reduction',
    },
    {
        icon: <Flower2 className="w-8 h-8 text-rose-500" />,
        name: 'Allergy & Immunology',
        slug: 'allergy-immunology',
        description: 'Structured note templates for allergy testing, immunotherapy visits, along with features for simplified patient intake.',
        timeReduction: '76% time reduction',
    },
    {
        icon: <Siren className="w-8 h-8 text-red-600" />,
        name: 'Emergency Medicine',
        slug: 'emergency-medicine',
        description: 'Dictate or record on the go, together with ability to add medical reassessments and generate discharge summaries instantly.',
        timeReduction: '80% time reduction',
    },
];


export const SpecialtiesSection = () => {
  return (
    <section id="specialties" className="py-24 sm:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
                <div className="mb-4 flex justify-center">
                    <p className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                        Explore by Specialty
                    </p>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    A clinical assistant for every field.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Our AI is not a one-size-fits-all solution. We have meticulously trained our models to understand the unique language, workflows, and documentation needs of different medical specialties.
                </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-none grid-cols-1 gap-8 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
                {specialties.map((specialty) => (
                    <Link key={specialty.name} href={`/specialties/${specialty.slug}`} className="block hover:shadow-lg transition-shadow duration-300 group rounded-lg">
                        <Card className="h-full">
                            <CardContent className="p-6 text-center flex flex-col items-center h-full">
                                <div className="relative mb-6">
                                    <div className="absolute -inset-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors" />
                                    <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-background border">
                                        {specialty.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold">{specialty.name}</h3>
                                <p className="mt-2 text-sm text-muted-foreground flex-grow">{specialty.description}</p>
                                <div className="mt-4 text-sm font-semibold text-primary">
                                    {specialty.timeReduction} &rarr;
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    </section>
  );
};
