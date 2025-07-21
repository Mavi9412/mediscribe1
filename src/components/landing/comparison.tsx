
import { Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const comparisonData = [
  { feature: 'Real-time Transcription', mediscribe: true, otherScribes: true, manual: false },
  { feature: 'Automated Note Generation', mediscribe: true, otherScribes: true, manual: false },
  { feature: 'Custom Template Builder', mediscribe: true, otherScribes: false, manual: false },
  { feature: '"Automagic" Form Upload', mediscribe: true, otherScribes: false, manual: false },
  { feature: 'EHR Copy/Paste', mediscribe: true, otherScribes: true, manual: true },
  { feature: 'Time Savings per week', mediscribe: '5+ hours', otherScribes: '3-4 hours', manual: '0 hours' },
  { feature: 'HIPAA Compliance', mediscribe: true, otherScribes: true, manual: true },
];

export const ComparisonSection = () => {
  return (
    <section id="comparison" className="py-24 sm:py-32">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How we stack up
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
                See why clinicians choose MediScribe AI over other solutions for their documentation needs.
            </p>
        </div>

        <Card className="mt-16">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px] sm:w-[300px] p-4">Feature</TableHead>
                    <TableHead className="text-center p-4">
                        <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-primary">MediScribe AI</span>
                            <Badge variant="default" className="border-primary text-primary-foreground">Recommended</Badge>
                        </div>
                    </TableHead>
                    <TableHead className="text-center p-4">Other AI Scribes</TableHead>
                    <TableHead className="text-center p-4">Manual Scribing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((item) => (
                    <TableRow key={item.feature} className="even:bg-muted/40">
                      <TableCell className="font-medium p-4">{item.feature}</TableCell>
                      <TableCell className="text-center p-4">
                        {typeof item.mediscribe === 'boolean' ? (
                          item.mediscribe ? <Check className="mx-auto h-5 w-5 text-green-600" /> : <X className="mx-auto h-5 w-5 text-red-500" />
                        ) : (
                          <span className="font-semibold text-primary">{item.mediscribe}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center p-4">
                        {typeof item.otherScribes === 'boolean' ? (
                          item.otherScribes ? <Check className="mx-auto h-5 w-5 text-green-600" /> : <X className="mx-auto h-5 w-5 text-red-500" />
                        ) : (
                          <span className="text-muted-foreground">{item.otherScribes}</span>
                        )}
                      </TableCell>
                       <TableCell className="text-center p-4">
                        {typeof item.manual === 'boolean' ? (
                          item.manual ? <Check className="mx-auto h-5 w-5 text-green-600" /> : <X className="mx-auto h-5 w-5 text-red-500" />
                        ) : (
                           <span className="text-muted-foreground">{item.manual}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
