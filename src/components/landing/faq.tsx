import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
    {
        question: "Is MediScribe AI HIPAA compliant?",
        answer: "Yes, absolutely. We are fully HIPAA compliant and take data security very seriously. All patient data is encrypted in transit and at rest, and we have strict access controls in place to ensure patient privacy."
    },
    {
        question: "Does this integrate with my existing EHR system?",
        answer: "MediScribe AI is designed to be EHR-agnostic. You can easily copy and paste the generated notes into any EHR system. We are also working on direct integrations with popular EHRs like Epic and Cerner."
    },
    {
        question: "Can I create my own templates?",
        answer: "Yes! Our Pro plan allows you to create unlimited custom templates to match your specific workflow and documentation needs. You can even upload an existing form (like a PDF or image) and our AI will 'automagically' convert it into a digital template."
    },
    {
        question: "Is there a free trial?",
        answer: "Yes, our Free plan allows you to generate up to 5 notes per month, so you can experience the core features of MediScribe AI without any commitment. You can upgrade to our Pro plan at any time to unlock unlimited notes and advanced features."
    }
]

export const FaqSection = () => {
    return (
        <section id="faq" className="bg-secondary py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Have a different question? <a href="mailto:support@mediscribe.ai" className="text-primary hover:underline">Contact us</a>.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-3xl">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, i) => (
                             <AccordionItem key={i} value={`item-${i}`}>
                                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
