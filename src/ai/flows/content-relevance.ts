// src/ai/flows/content-relevance.ts
'use server';

/**
 * @fileOverview A tool to determine the relevance of web content for presentation to the user.
 *
 * - isContentRelevant - A function that checks if web content is relevant.
 * - ContentRelevanceInput - The input type for the isContentRelevant function.
 * - ContentRelevanceOutput - The return type for the isContentRelevant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContentRelevanceInputSchema = z.object({
  query: z.string().describe('The user query or topic of interest.'),
  content: z.string().describe('The web content to evaluate for relevance.'),
});
export type ContentRelevanceInput = z.infer<typeof ContentRelevanceInputSchema>;

const ContentRelevanceOutputSchema = z.object({
  isRelevant: z.boolean().describe('Whether the content is relevant to the query.'),
  reason: z.string().describe('The reason for the relevance determination.'),
});
export type ContentRelevanceOutput = z.infer<typeof ContentRelevanceOutputSchema>;

export async function isContentRelevant(input: ContentRelevanceInput): Promise<ContentRelevanceOutput> {
  return contentRelevanceFlow(input);
}

const contentRelevancePrompt = ai.definePrompt({
  name: 'contentRelevancePrompt',
  input: {schema: ContentRelevanceInputSchema},
  output: {schema: ContentRelevanceOutputSchema},
  prompt: `You are an AI assistant that determines whether a given piece of web content is relevant to a user's query or topic of interest.

  Query: {{{query}}}
  Content: {{{content}}}

  Determine if the content is relevant to the query. Explain your reasoning.
  Return a JSON object with 'isRelevant' (boolean) and 'reason' (string) fields.
  `,
});

const contentRelevanceFlow = ai.defineFlow(
  {
    name: 'contentRelevanceFlow',
    inputSchema: ContentRelevanceInputSchema,
    outputSchema: ContentRelevanceOutputSchema,
  },
  async input => {
    const {output} = await contentRelevancePrompt(input);
    return output!;
  }
);