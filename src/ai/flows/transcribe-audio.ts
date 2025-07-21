'use server';
/**
 * @fileOverview Transcribes audio to text using Google's Gemini model via Genkit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for input
const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file as a Data URI with MIME type and Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

// Schema for output
const TranscribeAudioOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

// Public function
export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

// Internal Genkit flow
const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const modelToTry = 'googleai/gemini-1.5-pro';
    const fallbackModel = 'googleai/gemini-1.5-flash';
    const prompt = [
        {
          text:
            'Transcribe the following audio recording of a medical consultation. ' +
            'Provide a clean transcript without adding any speaker labels unless they are clearly distinguishable.',
        },
        {
          media: { url: input.audioDataUri },
        },
      ];

    try {
        const { text } = await ai.generate({ model: modelToTry, prompt });
        return { transcript: text };
    } catch (error: any) {
        // CORRECTED LOGIC: The redundant check has been removed.
        // We only check for the '503' error to trigger the retry.
        if (error.message.includes('503')) {
            console.warn(`Model ${modelToTry} failed. Retrying with ${fallbackModel}.`);
            const { text } = await ai.generate({ model: fallbackModel, prompt });
            return { transcript: text };
        }
        // For any other kind of error, we re-throw it so it's not ignored.
        throw error;
    }
  }
);