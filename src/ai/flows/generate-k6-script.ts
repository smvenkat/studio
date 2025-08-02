'use server';

/**
 * @fileOverview A flow for generating K6 test scripts from a swagger definition and test plan.
 *
 * - generateK6Script - A function that generates K6 test scripts based on the API definition and test plan.
 * - GenerateK6ScriptInput - The input type for the generateK6Script function.
 * - GenerateK6ScriptOutput - The return type for the generateK6Script function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateK6ScriptInputSchema = z.object({
  apiDefinition: z
    .string()
    .describe('The Swagger/OpenAPI definition of the API as a JSON string.'),
  testPlan: z
    .string()
    .describe('The test plan, including test type and metrics, as a JSON string.'),
});
export type GenerateK6ScriptInput = z.infer<typeof GenerateK6ScriptInputSchema>;

const GenerateK6ScriptOutputSchema = z.object({
  k6Script: z
    .string()
    .describe('The generated K6 test script as a string.'),
});
export type GenerateK6ScriptOutput = z.infer<typeof GenerateK6ScriptOutputSchema>;

export async function generateK6Script(input: GenerateK6ScriptInput): Promise<GenerateK6ScriptOutput> {
  return generateK6ScriptFlow(input);
}

const generateK6ScriptPrompt = ai.definePrompt({
  name: 'generateK6ScriptPrompt',
  input: {schema: GenerateK6ScriptInputSchema},
  output: {schema: GenerateK6ScriptOutputSchema},
  prompt: `You are an expert performance engineer specializing in generating K6 test scripts based on API definitions and test plans.

  You will use the provided API definition (Swagger/OpenAPI JSON) and test plan (JSON) to generate a K6 test script.
  The K6 script should automate the performance tests as per the test plan.
  Ensure the generated script includes the necessary configurations, metrics, and checks to accurately measure the API's performance.

  API Definition:
  \`\`\`
  {{{apiDefinition}}}
  \`\`\`

  Test Plan:
  \`\`\`
  {{{testPlan}}}
  \`\`\`

  K6 Script:`, // Ensure that the generated script has all necessary setup, teardown, checks and metric gathering.
});

const generateK6ScriptFlow = ai.defineFlow(
  {
    name: 'generateK6ScriptFlow',
    inputSchema: GenerateK6ScriptInputSchema,
    outputSchema: GenerateK6ScriptOutputSchema,
  },
  async input => {
    const {output} = await generateK6ScriptPrompt(input);
    return output!;
  }
);
