'use server';
/**
 * @fileOverview Generates a medical note from a patient transcript.
 *
 * - generateNoteFromTranscript - A function that generates a medical note from a transcript.
 * - GenerateNoteFromTranscriptInput - The input type for the generateNoteFromTranscript function.
 * - GenerateNoteFromTranscriptOutput - The return type for the generateNoteFromTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoteFromTranscriptInputSchema = z.object({
  transcript: z
    .string()
    .describe('The patient transcript to generate a medical note from.'),
  medicalContext: z
    .string()
    .optional()
    .describe('Additional medical context for the note.'),
});
export type GenerateNoteFromTranscriptInput = z.infer<
  typeof GenerateNoteFromTranscriptInputSchema
>;

const GenerateNoteFromTranscriptOutputSchema = z.object({
  note: z.string().describe('The generated medical note.'),
});
export type GenerateNoteFromTranscriptOutput = z.infer<
  typeof GenerateNoteFromTranscriptOutputSchema
>;

export async function generateNoteFromTranscript(
  input: GenerateNoteFromTranscriptInput
): Promise<GenerateNoteFromTranscriptOutput> {
  return generateNoteFromTranscriptFlow(input);
}

const medicalNotePrompt = ai.definePrompt({
  name: 'medicalNotePrompt',
  input: {schema: GenerateNoteFromTranscriptInputSchema},
  output: {schema: GenerateNoteFromTranscriptOutputSchema},
  prompt: `You are an expert AI medical assistant. Your task is to convert a raw conversation transcript into a structured, human-readable SOAP note. The final output should be a single block of formatted text, not a JSON object.

**Template Configuration:**
- **Document type:** SOAP Note
- **Headings:** Use Markdown for headings (e.g., "### Subjective"). The main headings are Subjective, Objective, Assessment, and Plan.
- **Additional instructions:**
  - In the subjective section, write the subjective history for each issue separately (in a list, using dashes '-').
  - In the assessment and plan section, write the assessment and plan for each issue separately (in a list, using dashes '-').
  - Do not hallucinate or make up any information if not explicitly mentioned.
  - Do not make up vital signs, height, or weight, or objective exams that are not performed.
  - If information is not provided for a section, state 'Not Provided' under the relevant heading.
  - Do not mention the date or patient name at the beginning of the note itself.
  - Please make sure the note is very accurate and does not hallucinate at all.
  - Write in a professional, human-sounding voice as though a human wrote the note.
  - Do not add additional diagnoses or findings arbitrarily.
  - Never hallucinate, assume, infer, or create any data that is not explicitly included in the medical context.

**Output Format:**
The output must be a single string of text formatted with Markdown. It should look like a professional medical document. **DO NOT output a JSON object or wrap the content in JSON format.**

**Example Structure:**
### Subjective
**Chief Complaint:**
- [Complaint]

**History of Present Illness:**
- [Details]

### Objective
**Vitals:**
- [Vitals if provided, otherwise 'Not Provided']

**Physical Exam:**
- [Exam findings if provided, otherwise 'Not Provided']

### Assessment
- [Diagnosis 1]
- [Diagnosis 2]

### Plan
- [Plan for Diagnosis 1]
- [Plan for Diagnosis 2]

---

Here is the transcript you need to process:
{{{transcript}}}

{{#if medicalContext}}
Here is additional context provided by the user:
{{{medicalContext}}}
{{/if}}
`,
});

const generateNoteFromTranscriptFlow = ai.defineFlow(
  {
    name: 'generateNoteFromTranscriptFlow',
    inputSchema: GenerateNoteFromTranscriptInputSchema,
    outputSchema: GenerateNoteFromTranscriptOutputSchema,
  },
  async input => {
    const {output} = await medicalNotePrompt(input);
    return output!;
  }
);
