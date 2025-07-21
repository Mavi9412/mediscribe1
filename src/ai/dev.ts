import { config } from 'dotenv';
config();

import '@/ai/flows/patient-intake-summary.ts';
import '@/ai/flows/generate-note-from-transcript.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/extract-note-metadata.ts';
import '@/ai/flows/generate-comprehensive-note.ts';
import '@/ai/flows/generate-template-from-image.ts';
import '@/ai/flows/generate-note-from-template.ts';
import '@/ai/flows/generate-mock-conversation.ts';
import '@/ai/flows/generate-template-content.ts';
import '@/ai/flows/summarize-note.ts';
