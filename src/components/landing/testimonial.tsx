import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

export const TestimonialSection = () => {
    return (
        <section id="testimonial" className="py-24 sm:py-32">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8">
                <figure className="mx-auto max-w-4xl text-center">
                    <p className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                        “MediScribe AI has been a game-changer. I’m spending at least an hour less on notes every day, which means more time with my family.”
                    </p>
                    <figcaption className="mt-10">
                        <Avatar className="mx-auto h-20 w-20">
                            <AvatarImage src="https://placehold.co/100x100.png" alt="Dr. A. Khan" data-ai-hint="doctor portrait" />
                            <AvatarFallback>AK</AvatarFallback>
                        </Avatar>
                        <div className="mt-4 flex items-center justify-center space-x-3 text-base">
                            <div className="font-semibold text-foreground">Dr. A. Khan</div>
                            <svg viewBox="0 0 2 2" width={3} height={3} aria-hidden="true" className="fill-gray-900">
                                <circle cx={1} cy={1} r={1} />
                            </svg>
                            <div className="text-muted-foreground">Cardiologist</div>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </section>
    )
}
