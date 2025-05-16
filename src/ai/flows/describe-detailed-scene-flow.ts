
'use server';
/**
 * @fileOverview An AI agent that provides detailed descriptions of visual scenes.
 *
 * - describeDetailedScene - A function that takes an image and returns a detailed textual description.
 * - DescribeDetailedSceneInput - The input type for the describeDetailedScene function.
 * - DescribeDetailedSceneOutput - The return type for the describeDetailedScene function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeDetailedSceneInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  previousDetailedDescription: z.string().optional().describe("The previous detailed description of the scene, if available. This can help in identifying changes or providing a more continuous narrative."),
});
export type DescribeDetailedSceneInput = z.infer<typeof DescribeDetailedSceneInputSchema>;

const DescribeDetailedSceneOutputSchema = z.object({
  detailedDescription: z.string().describe('A comprehensive and detailed textual description of the scene.'),
});
export type DescribeDetailedSceneOutput = z.infer<typeof DescribeDetailedSceneOutputSchema>;

export async function describeDetailedScene(input: DescribeDetailedSceneInput): Promise<DescribeDetailedSceneOutput> {
  return describeDetailedSceneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeDetailedScenePrompt',
  input: {schema: DescribeDetailedSceneInputSchema},
  output: {schema: DescribeDetailedSceneOutputSchema},
  prompt: `You are an expert at describing visual scenes for visually impaired users. Analyze the provided image and describe everything you see in detail.
Mention individual objects, their characteristics (like color, texture, type if discernible), their approximate location in the frame (e.g., "in the foreground", "on the left", "top-right corner"), and any activities or interactions.
Be as comprehensive as possible, paying attention to both large and small elements. If a person is visible, describe their apparent actions or posture if discernible, but avoid guessing emotions or identities.
Prioritize describing elements that would be most relevant or interesting for someone who cannot see the scene.
Make the description sound natural and engaging.

{{#if previousDetailedDescription}}
The previous detailed description for a very similar scene was: "{{previousDetailedDescription}}".
If the current scene is substantially the same, you can acknowledge this briefly and then focus on any new or changed elements, or re-iterate key elements if nothing changed.
If the scene is different, describe it fully.
{{/if}}

Image to describe:
{{media url=photoDataUri}}`,
});

const describeDetailedSceneFlow = ai.defineFlow(
  {
    name: 'describeDetailedSceneFlow',
    inputSchema: DescribeDetailedSceneInputSchema,
    outputSchema: DescribeDetailedSceneOutputSchema,
    // You might want to configure safetySettings if default ones are too restrictive for scene descriptions
    // config: {
    //   safetySettings: [
    //     { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    //   ],
    // },
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a detailed description.");
    }
    return output;
  }
);