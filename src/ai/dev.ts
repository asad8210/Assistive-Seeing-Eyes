// dotenv config is called in genkit.ts

// Import your flows here to register them with Genkit
import '@/ai/flows/content-relevance.ts';
import '@/ai/flows/personal-assistant.ts';
import '@/ai/flows/describe-detailed-scene-flow.ts';

// The Genkit development server will pick up flows defined
// using ai.defineFlow(...) in the imported files.
