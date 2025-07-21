'use server';
/**
 * @fileOverview Generates a mock medical conversation for a template preview.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMockConversationInputSchema = z.object({
  name: z.string().describe("The name of the template."),
  description: z.string().describe("The description of the template."),
  categories: z.array(z.string()).optional().describe("A list of medical specialties or categories for the template."),
  headings: z.array(z.string()).describe("A list of headings in the template, which indicates its structure."),
});
export type GenerateMockConversationInput = z.infer<typeof GenerateMockConversationInputSchema>;

const GenerateMockConversationOutputSchema = z.object({
  conversation: z.string().describe("The generated mock conversation between a doctor and a patient, formatted with 'Doctor:' and 'Patient:' prefixes."),
});
export type GenerateMockConversationOutput = z.infer<typeof GenerateMockConversationOutputSchema>;


export async function generateMockConversation(
  input: GenerateMockConversationInput
): Promise<GenerateMockConversationOutput> {
  return generateMockConversationFlow(input);
}


const mockConversationPrompt = ai.definePrompt({
  name: 'generateMockConversationPrompt',
  input: {schema: GenerateMockConversationInputSchema},
  output: {schema: GenerateMockConversationOutputSchema},
  prompt: `You are an expert scriptwriter for medical simulations. Your task is to generate a short, realistic mock conversation between a doctor and a patient.

The conversation should be relevant to the provided medical template details. Use the template name, description, categories, and headings to understand the context of the consultation.

The conversation should cover topics that would naturally be discussed in a consultation that would use this template. Make it sound authentic.

**Template Details:**
- Name: {{{name}}}
- Description: {{{description}}}
{{#if categories}}
- Categories: {{#each categories}}{{{this}}}{{/each}}{{/if}}
- Headings: {{#each headings}}
  - {{{this}}}
{{/each}}

**Output format:**
- The output should be a simple string.
- Start each line with either "Doctor: " or "Patient: ".
- The conversation should be brief, just a few lines to provide context for a preview.

**Example Output:**
Doctor: 'Tell me about the chest pain.'
Patient: 'It comes and goes, especially when I walk up stairs.'
`,
});

const generateMockConversationFlow = ai.defineFlow(
  {
    name: 'generateMockConversationFlow',
    inputSchema: GenerateMockConversationInputSchema,
    outputSchema: GenerateMockConversationOutputSchema,
  },
  async input => {
    const {output} = await mockConversationPrompt(input);
    return output!;
  }
);
