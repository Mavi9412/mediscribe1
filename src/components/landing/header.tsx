
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Stethoscope, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';


export const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#specialties", label: "Specialties" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className={cn("sticky top-0 z-50 w-full transition-all duration-300", isScrolled ? "bg-background/95 backdrop-blur-sm border-b" : "bg-transparent")}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn("flex h-16 items-center justify-between")}>
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Stethoscope className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-foreground">MediScribe AI</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
             {navLinks.map((link) => (
               <Link
                key={link.href}
                href={link.href}
                className={cn(buttonVariants({ variant: 'ghost' }), "text-muted-foreground")}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), 'hidden rounded-full sm:inline-flex')}>
              Log In
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ variant: 'default' }), 'rounded-full shadow-lg shadow-primary/30')}>
              Try For Free
            </Link>
             <div className="md:hidden">
               <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                   <SheetHeader className="sr-only">
                     <SheetTitle>Mobile Menu</SheetTitle>
                     <SheetDescription>Main navigation links for MediScribe AI.</SheetDescription>
                   </SheetHeader>
                   <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center p-4 border-b">
                         <Link href="/" className="flex items-center gap-2">
                          <Stethoscope className="h-7 w-7 text-primary" />
                          <span className="text-xl font-bold">MediScribe AI</span>
                        </Link>
                        <SheetClose asChild>
                          <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                          </Button>
                        </SheetClose>
                      </div>
                      <nav className="flex flex-col gap-4 p-4">
                        {navLinks.map((link) => (
                           <SheetClose asChild key={link.href}>
                             <Link
                              href={link.href}
                              className="text-lg text-muted-foreground hover:text-foreground"
                            >
                              {link.label}
                            </Link>
                           </SheetClose>
                        ))}
                         <SheetClose asChild>
                            <Link href="/login" className="text-lg text-muted-foreground hover:text-foreground pt-4 border-t mt-2">
                              Log In
                            </Link>
                          </SheetClose>
                      </nav>
                   </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
