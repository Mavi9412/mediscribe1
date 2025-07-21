'use server';
/**
 * @fileOverview Generates markdown content for a medical template using AI.
 *
 * - generateTemplateContent - A function that generates template content.
 * - GenerateTemplateContentInput - The input type for the function.
 * - GenerateTemplateContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTemplateContentInputSchema = z.object({
  name: z.string().describe("The name of the template."),
  description: z.string().describe("The description of the template's purpose."),
  headings: z.array(z.string()).optional().describe("A list of markdown headings to include, like '### Chief Complaint'."),
  categories: z.array(z.string()).optional().describe("A list of medical specialties or categories for context."),
  additionalInstructions: z.string().optional().describe("Any additional instructions for the AI on how to structure or what to include in the template."),
});
export type GenerateTemplateContentInput = z.infer<typeof GenerateTemplateContentInputSchema>;

const GenerateTemplateContentOutputSchema = z.object({
  content: z.string().describe('The generated template content in Markdown format. It should replicate the structure of a medical form with appropriate Markdown headings, lists, and placeholders like `- ` for user input.'),
});
export type GenerateTemplateContentOutput = z.infer<typeof GenerateTemplateContentOutputSchema>;

export async function generateTemplateContent(
  input: GenerateTemplateContentInput
): Promise<GenerateTemplateContentOutput> {
  return generateTemplateContentFlow(input);
}

const templateContentPrompt = ai.definePrompt({
  name: 'generateTemplateContentPrompt',
  input: {schema: GenerateTemplateContentInputSchema},
  output: {schema: GenerateTemplateContentOutputSchema},
  prompt: `You are an expert at creating structured Markdown templates for medical forms.
Your task is to generate the Markdown 'content' for a new template based on the provided details.

**Template Details:**
- Name: {{{name}}}
- Description: {{{description}}}
{{#if categories}}
- Categories: {{#each categories}}{{{this}}}{{/each}}
{{/if}}
{{#if headings}}
- Required Headings:
{{#each headings}}
  - {{{this}}}
{{/each}}
{{/if}}
{{#if additionalInstructions}}
- Additional Instructions: {{{additionalInstructions}}}
{{/if}}

**Instructions for Content Generation:**
1.  Create well-formatted Markdown content that reflects the template's purpose.
2.  If headings are provided, you MUST include them in the output. You can add other relevant sections or subheadings as needed based on the description and categories.
3.  Use Markdown headings (e.g., \`### Section Title\`).
4.  For fields where a user would enter information, use placeholders like a bullet point followed by a blank line (\`- \`).
5.  Do not fill in any example data. The goal is to create a blank, reusable template.
6.  The final output must be a JSON object with a single key: "content".
`,
});

const generateTemplateContentFlow = ai.defineFlow(
  {
    name: 'generateTemplateContentFlow',
    inputSchema: GenerateTemplateContentInputSchema,
    outputSchema: GenerateTemplateContentOutputSchema,
  },
  async input => {
    const {output} = await templateContentPrompt(input);
    return output!;
  }
);
