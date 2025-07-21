'use server';
/**
 * @fileOverview Summarizes patient intake information, highlighting key details for doctors.
 *
 * - summarizePatientIntake - A function that summarizes patient intake.
 * - SummarizePatientIntakeInput - The input type for the summarizePatientIntake function.
 * - SummarizePatientIntakeOutput - The return type for the summarizePatientIntake function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePatientIntakeInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  chiefComplaint: z.string().describe('The patient\'s primary reason for seeking medical attention.'),
  historyOfPresentIllness: z.string().describe('A detailed account of the patient\'s current medical problem.'),
  pastMedicalHistory: z.string().describe('The patient\'s significant past medical conditions.'),
  medications: z.string().describe('A list of the patient\'s current medications.'),
  allergies: z.string().describe('A list of the patient\'s known allergies.'),
  familyHistory: z.string().describe('Relevant medical history of the patient\'s family.'),
  socialHistory: z.string().describe('Information about the patient\'s lifestyle, such as smoking, alcohol use, and occupation.'),
  reviewOfSystems: z.string().describe('A head-to-toe review of the patient\'s symptoms.'),
});
export type SummarizePatientIntakeInput = z.infer<typeof SummarizePatientIntakeInputSchema>;

const SummarizePatientIntakeOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the patient\'s intake information, highlighting the most important details.'),
});
export type SummarizePatientIntakeOutput = z.infer<typeof SummarizePatientIntakeOutputSchema>;

export async function summarizePatientIntake(input: SummarizePatientIntakeInput): Promise<SummarizePatientIntakeOutput> {
  return summarizePatientIntakeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatientIntakePrompt',
  input: {schema: SummarizePatientIntakeInputSchema},
  output: {schema: SummarizePatientIntakeOutputSchema},
  prompt: `You are an AI assistant specializing in summarizing patient intake information for doctors.

  Given the following patient intake details, create a concise summary highlighting the most important information so that doctors can quickly understand the patient\'s status.

  Patient Name: {{{patientName}}}
  Chief Complaint: {{{chiefComplaint}}}
  History of Present Illness: {{{historyOfPresentIllness}}}
  Past Medical History: {{{pastMedicalHistory}}}
  Medications: {{{medications}}}
  Allergies: {{{allergies}}}
  Family History: {{{familyHistory}}}
  Social History: {{{socialHistory}}}
  Review of Systems: {{{reviewOfSystems}}}

  Summary:
  `,
});

const summarizePatientIntakeFlow = ai.defineFlow(
  {
    name: 'summarizePatientIntakeFlow',
    inputSchema: SummarizePatientIntakeInputSchema,
    outputSchema: SummarizePatientIntakeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
