'use server';

/**
 * @fileOverview A flow that analyzes a Swagger file and suggests relevant performance testing types with SLI/SLO metrics.
 *
 * - suggestTestPlan - A function that handles the test plan suggestion process.
 * - SuggestTestPlanInput - The input type for the suggestTestPlan function.
 * - SuggestTestPlanOutput - The return type for the suggestTestPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTestPlanInputSchema = z.object({
  swaggerFileContent: z
    .string()
    .describe('The content of the Swagger/OpenAPI file (JSON or YAML).'),
});
export type SuggestTestPlanInput = z.infer<typeof SuggestTestPlanInputSchema>;

const TestMetricSchema = z.object({
  name: z.string().describe('The name of the SLI/SLO metric (e.g., "p95 latency", "error rate").'),
  threshold: z.string().describe('The target threshold for the metric (e.g., "< 200ms", "< 1%").'),
  description: z.string().describe('A brief description or rationale for this metric.'),
});

const TestTypeSchema = z.object({
  name: z.string().describe('The type of performance test (e.g., "Load Test", "Stress Test").'),
  description: z.string().describe('A brief description of this test type and its purpose for this API.'),
  metrics: z.array(TestMetricSchema).describe('A list of SLI/SLO metrics for this test type.'),
});


const SuggestTestPlanOutputSchema = z.object({
  suggestedTests: z.array(TestTypeSchema).describe(
    'An array of suggested performance tests with SLI/SLO metrics.'
  ),
});
export type SuggestTestPlanOutput = z.infer<typeof SuggestTestPlanOutputSchema>;

export async function suggestTestPlan(input: SuggestTestPlanInput): Promise<SuggestTestPlanOutput> {
  return suggestTestPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTestPlanPrompt',
  input: {schema: SuggestTestPlanInputSchema},
  output: {schema: SuggestTestPlanOutputSchema},
  prompt: `You are an expert performance testing consultant.

  Based on the provided Swagger/OpenAPI file content, suggest a suitable performance test plan.  Include specific testing types (e.g., stress, load, soak, spike) and relevant SLI/SLO metrics for each test type. The output should be a structured JSON object.

  Swagger File Content:
  {{swaggerFileContent}}`,
});

const suggestTestPlanFlow = ai.defineFlow(
  {
    name: 'suggestTestPlanFlow',
    inputSchema: SuggestTestPlanInputSchema,
    outputSchema: SuggestTestPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
