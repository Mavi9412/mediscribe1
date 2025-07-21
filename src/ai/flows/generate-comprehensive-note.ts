
'use server';
/**
 * @fileOverview Generates a comprehensive medical note and extracts metadata from a transcript.
 *
 * - generateComprehensiveNote - A function that generates a note and its metadata.
 * - GenerateComprehensiveNoteInput - The input type.
 * - GenerateComprehensiveNoteOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateComprehensiveNoteInputSchema = z.object({
  transcript: z
    .string()
    .describe('The patient transcript to generate a medical note from.'),
  medicalContext: z
    .string()
    .optional()
    .describe('Additional medical context for the note.'),
  templateContent: z
    .string()
    .optional()
    .describe('The markdown template to use for the note structure.'),
  templateName: z
    .string()
    .optional()
    .describe('The name of the template being used, e.g., "SOAP Note" or "Initial Consultation".'),
  detailLevel: z
    .string()
    .optional()
    .describe("The desired level of detail for the note: 'Concise', 'Default', or 'Detailed'."),
  noteFormat: z
    .string()
    .optional()
    .describe("The desired format for the note: 'Bullet Point' or 'Narrative'."),
  model: z.string().optional().describe('The AI model to use for generation.'),
});
export type GenerateComprehensiveNoteInput = z.infer<
  typeof GenerateComprehensiveNoteInputSchema
>;

const GenerateComprehensiveNoteOutputSchema = z.object({
    note: z.string().describe(`The generated medical note in Markdown format. The output should be a single block of formatted text, not a JSON object within this field. It should follow the structure provided by the template, if any.`),
    title: z.string().describe("A concise and relevant title for the medical note, like '[Template Name] - [Patient Name]' or 'Follow-up - [Patient Name]'."),
    patientName: z.string().describe("The full name of the patient mentioned in the transcript. If no name is found, return 'Unknown Patient'."),
    tag: z.string().describe("A single, relevant medical specialty or tag for the note, such as 'Cardiology', 'Pediatrics', or 'General'. If no specialty is clear, return 'General'.")
});
export type GenerateComprehensiveNoteOutput = z.infer<
  typeof GenerateComprehensiveNoteOutputSchema
>;

export async function generateComprehensiveNote(
  input: GenerateComprehensiveNoteInput
): Promise<GenerateComprehensiveNoteOutput> {
  return generateComprehensiveNoteFlow(input);
}

const comprehensiveNotePrompt = ai.definePrompt({
  name: 'comprehensiveNotePrompt',
  input: {schema: GenerateComprehensiveNoteInputSchema},
  output: {schema: GenerateComprehensiveNoteOutputSchema},
  prompt: `You are an expert AI medical assistant. Your task is to perform two actions based on the provided transcript:
1.  Convert the raw conversation transcript into a structured, human-readable medical note formatted with Markdown.
2.  Extract key metadata from the transcript: a suitable title, the patient's name, and a relevant medical tag/specialty.

You must return a single JSON object containing the generated note and the extracted metadata.

**Note Generation Instructions:**
- **Document type:** {{#if templateName}}Use the "{{templateName}}" template.{{else}}Use a standard SOAP note format.{{/if}}
- **Headings:** Use Markdown for headings (e.g., "### Subjective").
{{#if templateContent}}
- **Structure:** You MUST follow the structure provided in this template content. Fill it out using the transcript.
---
{{{templateContent}}}
---
{{else}}
- **Structure:** The main headings are Subjective, Objective, Assessment, and Plan.
{{/if}}
- **Detail Level:** {{#if detailLevel}}{{{detailLevel}}}{{else}}Default{{/if}}. Adjust the verbosity accordingly. For 'Concise', be brief. For 'Detailed', be very thorough.
- **Format:** {{#if noteFormat}}{{{noteFormat}}}{{else}}Default{{/if}}. Use bullet points for 'Bullet Point' format and paragraph prose for 'Narrative' format.
- **Content:**
  - Fill in the template based on the information in the transcript.
  - In the subjective section, list each issue's history separately.
  - In the assessment and plan section, list each issue's assessment and plan separately.
  - Do not hallucinate or invent information not present in the transcript.
  - If information for a section is missing, state 'Not Provided'.
  - Do not include the date or patient name within the note body itself.
  - Write in a professional, human-sounding voice.

**Metadata Extraction Instructions:**
- **title:** A concise title. {{#if templateName}}It should be based on the template name, e.g., '{{templateName}} - [Patient Name]'.{{else}}Use a generic title like 'Medical Note - [Patient Name]'.{{/if}}
- **patientName:** The full name of the patient. Default to 'Unknown Patient' if not found.
- **tag:** A single medical specialty, e.g., 'Cardiology'. Default to 'General' if unclear.

---

Here is the transcript to process:
{{{transcript}}}

{{#if medicalContext}}
Here is additional context provided by the user:
{{{medicalContext}}}
{{/if}}
`,
});

const generateComprehensiveNoteFlow = ai.defineFlow(
  {
    name: 'generateComprehensiveNoteFlow',
    inputSchema: GenerateComprehensiveNoteInputSchema,
    outputSchema: GenerateComprehensiveNoteOutputSchema,
  },
  async (input) => {
    // Map user-friendly model names to Genkit model identifiers.
    const primaryModel = input.model === 'gemini-1.5-pro' ? 'googleai/gemini-1.5-pro' : 'googleai/gemini-1.5-flash';
    const fallbackModel = 'googleai/gemini-1.5-flash';

    try {
        const {output} = await comprehensiveNotePrompt({...input}, { model: primaryModel });
        return output!;
    } catch (error: any) {
        // If the primary model is overloaded or fails, and it's not already the fallback, try the fallback.
        if (error.message.includes('503') && primaryModel !== fallbackModel) {
            console.warn(`Primary model ${primaryModel} failed. Retrying with ${fallbackModel}.`);
            const {output} = await comprehensiveNotePrompt({...input}, { model: fallbackModel });
            return output!;
        }
        // If it's another error or the fallback also fails, re-throw the original error.
        throw error;
    }
  }
);
