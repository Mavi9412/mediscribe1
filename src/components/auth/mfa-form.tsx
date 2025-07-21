
"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { MultiFactorResolver, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth';

const mfaSchema = z.object({
  code: z.string().length(6, { message: 'Verification code must be 6 digits.' }),
});

interface MfaFormProps {
  resolver: MultiFactorResolver;
  onCancel: () => void;
}

export function MfaForm({ resolver, onCancel }: MfaFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof mfaSchema>>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      code: '',
    },
  });
  
  useEffect(() => {
    const sendVerificationCode = async () => {
      // The first hint is the first available second factor.
      if (resolver.hints.length > 0) {
        const phoneInfoOptions = {
          multiFactorHint: resolver.hints[0],
          session: resolver.session,
        };
        try {
          const phoneAuthProvider = new PhoneAuthProvider(auth);
          const verId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions);
          setVerificationId(verId);
        } catch (error) {
          console.error('Error sending verification code:', error);
          toast({
            variant: 'destructive',
            title: 'Failed to Send Code',
            description: 'Could not send verification code. Please try logging in again.',
          });
          onCancel();
        }
      }
    };
    sendVerificationCode();
  }, [resolver, toast, onCancel]);

  async function onSubmit(values: z.infer<typeof mfaSchema>) {
    if (!verificationId) {
      toast({ variant: 'destructive', title: 'Verification Error', description: 'Verification ID is missing. Please try again.' });
      return;
    }
    setIsLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, values.code);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await resolver.resolveSignIn(multiFactorAssertion);
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'The verification code is invalid. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input placeholder="123456" {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="ghost" type="button" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
            </Button>
        </div>
      </form>
    </Form>
  );
}
