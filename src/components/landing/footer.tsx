import { Stethoscope } from "lucide-react"
import Link from "next/link"

export const LandingFooter = () => {
    return (
        <footer className="border-t bg-secondary">
            <div className="container mx-auto max-w-7xl px-6 py-12 lg:px-8">
                 <div className="flex items-center justify-center space-x-3">
                    <Stethoscope className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold">MediScribe AI</span>
                </div>
                <nav className="mt-8 flex flex-col items-center sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6" aria-label="Footer">
                    <Link href="#features" className="text-sm leading-6 text-muted-foreground hover:text-foreground">Features</Link>
                    <Link href="#pricing" className="text-sm leading-6 text-muted-foreground hover:text-foreground">Pricing</Link>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-foreground">About</Link>
                    <Link href="#" className="text-sm leading-6 text-muted-foreground hover:text-foreground">Contact</Link>
                </nav>
                <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
                    &copy; {new Date().getFullYear()} MediScribe AI. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
