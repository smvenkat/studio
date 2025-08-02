import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-test-plan.ts';
import '@/ai/flows/generate-k6-script.ts';
import '@/ai/flows/zip-artifacts.ts';
