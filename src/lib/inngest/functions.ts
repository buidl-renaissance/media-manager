import { inngest } from '@/lib/inngest';
import { db, media } from '@/lib/db';
import { uploadFile, getFileKey } from '@/lib/storage';
import { generateResizedVersions, getFileExtension, getImageFormat } from '@/lib/storage/resize';
import { analyzeImageFromBuffer } from '@/lib/ai';
import { eq } from 'drizzle-orm';

export const processMediaFunction = inngest.createFunction(
  { id: 'process-media' },
  { event: 'media/process' },
  async ({ event, step }) => {
    const { mediaId, originalUrl, filename, mimetype } = event.data;
    const fileExtension = getFileExtension(filename);

    // Process everything in a single step to avoid large data serialization
    const result = await step.run('process-media', async () => {
      console.log(`Processing media ${mediaId}`);
      
      // Download the original file
      console.log(`Downloading original file from ${originalUrl}`);
      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to download original file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate resized versions
      console.log(`Generating resized versions for ${mediaId}`);
      const { medium, thumb } = await generateResizedVersions(buffer);

      // Upload resized versions
      console.log(`Uploading resized versions for ${mediaId}`);
      const [mediumUpload, thumbUpload] = await Promise.all([
        uploadFile(
          medium,
          getFileKey(mediaId, 'medium', fileExtension),
          mimetype
        ),
        uploadFile(
          thumb,
          getFileKey(mediaId, 'thumb', fileExtension),
          mimetype
        ),
      ]);

      return {
        mediumUrl: mediumUpload.url,
        thumbnailUrl: thumbUpload.url,
      };
    });

    // Update database record with resized versions
    await step.run('update-database', async () => {
      console.log(`Updating database record for ${mediaId}`);
      await db
        .update(media)
        .set({
          mediumUrl: result.mediumUrl,
          thumbnailUrl: result.thumbnailUrl,
        })
        .where(eq(media.id, mediaId));
    });

    // Trigger AI analysis as a separate background job
    await step.run('trigger-ai-analysis', async () => {
      await inngest.send({
        name: 'media/analyze',
        data: {
          mediaId,
          originalUrl,
        },
      });
    });

    return {
      success: true,
      mediaId,
      urls: {
        mediumUrl: result.mediumUrl,
        thumbnailUrl: result.thumbnailUrl,
      },
    };
  }
);

export const analyzeMediaFunction = inngest.createFunction(
  { 
    id: 'analyze-media',
    retries: 3, // Retry AI analysis up to 3 times if it fails
  },
  { event: 'media/analyze' },
  async ({ event, step }) => {
    const { mediaId, originalUrl } = event.data;

    // Download and analyze the image
    const aiAnalysis = await step.run('ai-analysis', async () => {
      console.log(`Running AI analysis for media ${mediaId}`);
      
      try {
        // Download the original file
        console.log(`Downloading original file from ${originalUrl}`);
        const response = await fetch(originalUrl);
        if (!response.ok) {
          throw new Error(`Failed to download original file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Run AI analysis
        const analysis = await analyzeImageFromBuffer(buffer);
        console.log(`AI analysis completed for ${mediaId}:`, analysis);
        
        return analysis;
             } catch (error) {
         console.error('AI analysis failed:', error);
         return {
           tags: ['image'],
           title: 'Uploaded Image',
           description: 'Uploaded image',
           altText: 'Uploaded image',
         };
       }
    });

    // Update database with AI analysis results
    await step.run('update-ai-analysis', async () => {
      console.log(`Updating AI analysis for media ${mediaId}`);
             await db
         .update(media)
         .set({
           tags: aiAnalysis.tags,
           title: aiAnalysis.title,
           description: aiAnalysis.description,
           altText: aiAnalysis.altText,
         })
         .where(eq(media.id, mediaId));
    });

    return {
      success: true,
      mediaId,
      analysis: aiAnalysis,
    };
  }
); 