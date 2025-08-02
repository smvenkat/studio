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

const SuggestTestPlanOutputSchema = z.object({
  suggestedTestPlan: z.string().describe(
    'A suggestion for a performance test plan, including test types and SLI/SLO metrics.'
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

  Based on the provided Swagger/OpenAPI file content, suggest a suitable performance test plan.  Include specific testing types (e.g., stress, load, soak, spike) and relevant SLI/SLO metrics for each test type.

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
