'use server';
/**
 * @fileOverview Extracts metadata from a medical transcript.
 *
 * - extractNoteMetadata - A function that extracts metadata from a transcript.
 * - ExtractNoteMetadataInput - The input type for the extractNoteMetadata function.
 * - ExtractNoteMetadataOutput - The return type for the extractNoteMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractNoteMetadataInputSchema = z.object({
  transcript: z
    .string()
    .describe('The medical transcript to extract metadata from.'),
});
export type ExtractNoteMetadataInput = z.infer<
  typeof ExtractNoteMetadataInputSchema
>;

const ExtractNoteMetadataOutputSchema = z.object({
  title: z.string().describe("A concise and relevant title for the medical note, like 'SOAP Note - [Patient Name]' or 'Follow-up - [Patient Name]'."),
  patientName: z.string().describe("The full name of the patient mentioned in the transcript. If no name is found, return 'Unknown Patient'."),
  tag: z.string().describe("A single, relevant medical specialty or tag for the note, such as 'Cardiology', 'Pediatrics', or 'General'. If no specialty is clear, return 'General'.")
});
export type ExtractNoteMetadataOutput = z.infer<
  typeof ExtractNoteMetadataOutputSchema
>;

export async function extractNoteMetadata(
  input: ExtractNoteMetadataInput
): Promise<ExtractNoteMetadataOutput> {
  return extractNoteMetadataFlow(input);
}

const metadataPrompt = ai.definePrompt({
  name: 'extractNoteMetadataPrompt',
  input: {schema: ExtractNoteMetadataInputSchema},
  output: {schema: ExtractNoteMetadataOutputSchema},
  prompt: `You are an expert at analyzing medical transcripts. Your task is to extract specific metadata from the following transcript.

Based on the content of the transcript, please provide:
1.  A suitable 'title' for the note.
2.  The 'patientName'.
3.  A relevant 'tag' or specialty.

Do not add any extra commentary. Provide only the JSON object with the requested fields.

Transcript:
{{{transcript}}}
`,
});

const extractNoteMetadataFlow = ai.defineFlow(
  {
    name: 'extractNoteMetadataFlow',
    inputSchema: ExtractNoteMetadataInputSchema,
    outputSchema: ExtractNoteMetadataOutputSchema,
  },
  async input => {
    const {output} = await metadataPrompt(input);
    return output!;
  }
);
