import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { processMediaFunction, analyzeMediaFunction } from '@/lib/inngest/functions';

export default serve({
  client: inngest,
  functions: [
    processMediaFunction,
    analyzeMediaFunction,
  ],
}); 