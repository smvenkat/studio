'use server';

/**
 * @fileOverview A flow for creating a zip archive from text-based file content.
 *
 * - zipArtifacts - A function that creates a zip file.
 * - ZipArtifactsInput - The input type for the zipArtifacts function.
 * - ZipArtifactsOutput - The return type for the zipArtifacts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import JSZip from 'jszip';

const FileObjectSchema = z.object({
  name: z.string().describe('The name of the file.'),
  content: z.string().describe('The content of the file.'),
});

const ZipArtifactsInputSchema = z.object({
  files: z.array(FileObjectSchema).describe('An array of file objects to include in the zip archive.'),
});
export type ZipArtifactsInput = z.infer<typeof ZipArtifactsInputSchema>;

const ZipArtifactsOutputSchema = z.object({
  zipAsBase64: z.string().describe('The generated zip file as a Base64 encoded string.'),
});
export type ZipArtifactsOutput = z.infer<typeof ZipArtifactsOutputSchema>;

export async function zipArtifacts(input: ZipArtifactsInput): Promise<ZipArtifactsOutput> {
  return zipArtifactsFlow(input);
}

const zipArtifactsFlow = ai.defineFlow(
  {
    name: 'zipArtifactsFlow',
    inputSchema: ZipArtifactsInputSchema,
    outputSchema: ZipArtifactsOutputSchema,
  },
  async (input) => {
    const zip = new JSZip();
    for (const file of input.files) {
      zip.file(file.name, file.content);
    }
    const zipAsBase64 = await zip.generateAsync({ type: 'base64' });
    return { zipAsBase64 };
  }
);
