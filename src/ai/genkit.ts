//import {genkit} from 'genkit';
//import {googleAI} from '@genkit-ai/googleai';

//export const ai = genkit({
  //plugins: [googleAI()],
  //model: 'googleai/gemini-2.0-flash',
//});
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config(); // Load environment variables from .env file, useful for local dev with Docker

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      // You can specify the API version if needed, e.g., 'v1beta'
      // apiVersion: 'v1beta',
    }),
  ],
  // You can set a default model here if desired, but it's often better
  // to specify models within individual prompts or flows.
  // model: 'googleai/gemini-1.5-flash-latest',

  // Log level can be 'debug', 'info', 'warn', 'error'
  // It's useful to set to 'debug' during development.
  // logLevel: 'debug',

  // Enable OpenTelemetry trace collection.
  // Set to false to disable, e.g., for some production environments
  // or if you don't need detailed tracing.
  enableTracing: true,
});
