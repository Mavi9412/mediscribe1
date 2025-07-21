
'use server';
/**
 * @fileOverview Generates a sample medical note based on a template and a mock transcript.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoteFromTemplateInputSchema = z.object({
  templateContent: z.string().describe('The Markdown template structure for the note.'),
  transcript: z.string().describe('A mock patient-doctor conversation transcript.'),
});
export type GenerateNoteFromTemplateInput = z.infer<typeof GenerateNoteFromTemplateInputSchema>;

const GenerateNoteFromTemplateOutputSchema = z.object({
  note: z.string().describe('The generated sample note as a single Markdown string, filled out according to the template and transcript.'),
});
export type GenerateNoteFromTemplateOutput = z.infer<typeof GenerateNoteFromTemplateOutputSchema>;


export async function generateNoteFromTemplate(
  input: GenerateNoteFromTemplateInput
): Promise<GenerateNoteFromTemplateOutput> {
  return generateNoteFromTemplateFlow(input);
}


const notePreviewPrompt = ai.definePrompt({
  name: 'generateNoteFromTemplatePrompt',
  input: {schema: GenerateNoteFromTemplateInputSchema},
  output: {schema: GenerateNoteFromTemplateOutputSchema},
  prompt: `You are an expert AI medical assistant. Your task is to generate a sample medical note.
You will be given a Markdown template and a mock conversation transcript.
Your goal is to fill out the template using information from the transcript to create a realistic-looking sample note.

**Output instructions:**
- Your final output must be a JSON object with a single key: "note".
- The value of the "note" key must be a single string containing the completed medical note.
- The note itself should be formatted in Markdown, following the structure of the provided template.
- Do not add any extra commentary.

Template:
---
{{{templateContent}}}
---

Transcript:
---
{{{transcript}}}
---
`,
});

const generateNoteFromTemplateFlow = ai.defineFlow(
  {
    name: 'generateNoteFromTemplateFlow',
    inputSchema: GenerateNoteFromTemplateInputSchema,
    outputSchema: GenerateNoteFromTemplateOutputSchema,
  },
  async input => {
    const {output} = await notePreviewPrompt(input);
    return output!;
  }
);
