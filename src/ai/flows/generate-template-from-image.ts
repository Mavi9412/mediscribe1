
'use server';
/**
 * @fileOverview Converts an image or document of a form into a Markdown template.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTemplateFromImageInputSchema = z.object({
  formDataUri: z
    .string()
    .describe(
      "A file (image, PDF, etc.) of a form, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateTemplateFromImageInput = z.infer<typeof GenerateTemplateFromImageInputSchema>;

const GenerateTemplateFromImageOutputSchema = z.object({
  name: z.string().describe("A suitable name for the template, based on the form's title or content."),
  description: z.string().describe("A brief description of the template's purpose."),
  content: z.string().describe('The generated template content in Markdown format. It should replicate the structure of the form with appropriate Markdown headings, lists, and placeholders like `[text]` or `- ` for user input.'),
});
export type GenerateTemplateFromImageOutput = z.infer<typeof GenerateTemplateFromImageOutputSchema>;

export async function generateTemplateFromImage(
  input: GenerateTemplateFromImageInput
): Promise<GenerateTemplateFromImageOutput> {
  return generateTemplateFromImageFlow(input);
}

const templatePrompt = ai.definePrompt({
  name: 'generateTemplateFromImagePrompt',
  input: {schema: GenerateTemplateFromImageInputSchema},
  output: {schema: GenerateTemplateFromImageOutputSchema},
  prompt: `You are an expert at converting images and documents of medical forms into structured Markdown templates.
Analyze the provided file of a form and perform the following tasks:
1.  **Generate a 'name'**: Create a concise and descriptive name for this template (e.g., "Patient Intake Form", "SOAP Note Template").
2.  **Generate a 'description'**: Write a short sentence describing what the template is used for.
3.  **Generate 'content'**: Convert the form's structure into a well-formatted Markdown template.
    - Use Markdown headings (e.g., \`### Section Title\`) for sections.
    - Use bullet points (\`-\`) or numbered lists for questions or fields.
    - Where a user would fill in information, use placeholders like blank lines with bullet points or empty fields.
    - Preserve the logical structure of the original form.

Do not fill in any example data. The goal is to create a blank, reusable template.

Form File:
{{media url=formDataUri}}
`,
});

const generateTemplateFromImageFlow = ai.defineFlow(
  {
    name: 'generateTemplateFromImageFlow',
    inputSchema: GenerateTemplateFromImageInputSchema,
    outputSchema: GenerateTemplateFromImageOutputSchema,
  },
  async input => {
    const {output} = await templatePrompt(input);
    return output!;
  }
);
