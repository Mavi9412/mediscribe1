
"use client";

import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignupContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';
  const isPro = plan === 'pro';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isPro ? "Start Your Pro Trial" : "Create a Free Account"}
        </CardTitle>
        <CardDescription>
          {isPro
            ? "Unlock all features with your Pro account."
            : "Enter your information to create an account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm plan={plan} />
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
