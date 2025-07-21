
const YCombinatorIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto text-gray-500 hover:text-gray-800 transition-colors">
    <title>Y Combinator</title>
    <path d="M24 22.525H0v-21h24v21zM2.25 20.275h19.5v-16.5H2.25v16.5zM12 14.162l3.488-4.5h2.262v6.613h-2.25V11.2l-3.5 4.563-3.5-4.563v5.075H6v-6.613h2.262l3.738 4.5z" fill="currentColor"/>
  </svg>
)

const HealthSystemIcon = ({ name }: { name: string }) => (
    <div className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m14.5 9-5 5"/>
            <path d="m9.5 9 5 5"/>
        </svg>
        <span className="text-lg font-medium">{name}</span>
    </div>
)

export const TrustedBySection = () => {
    return (
        <section className="py-12 sm:py-16">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8">
                <h2 className="text-center text-lg font-semibold leading-8 text-muted-foreground">
                    Trusted by the world's most innovative health systems
                </h2>
                <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-3 lg:mx-0 lg:max-w-none lg:grid-cols-5">
                    <YCombinatorIcon />
                    <HealthSystemIcon name="Veridia Health" />
                    <HealthSystemIcon name="San Amaro" />
                    <HealthSystemIcon name="Nexus Clinic" />
                    <HealthSystemIcon name="Apex Medical" />
                </div>
            </div>
        </section>
    )
}
