
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { LandingHeader } from '@/components/landing/header';
import { HeroSection } from '@/components/landing/hero';
import { TrustedBySection } from '@/components/landing/trusted-by';
import { FeaturesSection } from '@/components/landing/features';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { ComparisonSection } from '@/components/landing/comparison';
import { TestimonialSection } from '@/components/landing/testimonial';
import { PricingSection } from '@/components/landing/pricing';
import { FaqSection } from '@/components/landing/faq';
import { CtaSection } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';
import { SpecialtiesSection } from '@/components/landing/specialties';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <TrustedBySection />
        <FeaturesSection />
        <SpecialtiesSection />
        <HowItWorksSection />
        <ComparisonSection />
        <TestimonialSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
