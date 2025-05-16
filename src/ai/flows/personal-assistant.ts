
'use server';

/**
 * @fileOverview A voice-activated personal assistant AI agent for AssistiveVisions.
 *
 * - personalAssistant - A function that handles the personal assistant process.
 * - PersonalAssistantInput - The input type for the personalAssistant function.
 * - PersonalAssistantOutput - The return type for the personalAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalAssistantInputSchema = z.object({
  speech: z.string().describe('The transcribed speech from the user.'),
  location: z.string().optional().describe('The current location of the user (e.g., "Latitude: 40.71, Longitude: -74.00" or "New York City").'),
});

export type PersonalAssistantInput = z.infer<typeof PersonalAssistantInputSchema>;

const PersonalAssistantOutputSchema = z.object({
  response: z.string().describe('The helpful and empathetic response from the personal assistant.'),
});

export type PersonalAssistantOutput = z.infer<typeof PersonalAssistantOutputSchema>;

export async function personalAssistant(input: PersonalAssistantInput): Promise<PersonalAssistantOutput> {
  return personalAssistantFlow(input);
}

const personalAssistantPrompt = ai.definePrompt({
  name: 'personalAssistantPrompt',
  input: {schema: PersonalAssistantInputSchema},
  output: {schema: PersonalAssistantOutputSchema},
  prompt: `You are "Vision Buddy", a friendly and helpful voice assistant for the AssistiveVisions app, designed to help users who may have visual impairments.
Listen carefully to the user's speech. Respond clearly, concisely, and empathetically.
If their location is provided and relevant to their query, use it to give a more helpful answer.

User's speech: {{{speech}}}
{{#if location}}
User's current location: {{{location}}}
{{/if}}

Your response:`,
});

const personalAssistantFlow = ai.defineFlow(
  {
    name: 'personalAssistantFlow',
    inputSchema: PersonalAssistantInputSchema,
    outputSchema: PersonalAssistantOutputSchema,
  },
  async input => {
    const {output} = await personalAssistantPrompt(input);
    if (!output) {
      // Fallback response if the model returns nothing, though the schema should enforce it.
      return { response: "I'm sorry, I didn't quite understand that. Could you please rephrase?" };
    }
    return output;
  }
);
