
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, getMultiFactorResolver, MultiFactorResolver } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { MfaForm } from "./mfa-form";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMfaResolver(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/dashboard");
    } catch (error: any) {
      let title = "Login Failed";
      let description = "An unexpected error occurred. Please try again.";
      
      if (error.code === 'auth/multi-factor-required') {
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);
        toast({
          title: "Verification Required",
          description: "A verification code has been sent to your phone.",
        });
      } else if (error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.code === 'auth/api-key-not-valid') {
          title = "Invalid Firebase API Key";
          description = "The provided Firebase API Key is not valid. Please check your .env file and Firebase project settings.";
      } else {
        toast({
          variant: "destructive",
          title: title,
          description: description,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (mfaResolver) {
    return <MfaForm resolver={mfaResolver} onCancel={() => setMfaResolver(null)} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>
      </form>
    </Form>
  );
}
