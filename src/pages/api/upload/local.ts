import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Part } from 'formidable';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db, media } from '@/lib/db';
import { inngest } from '@/lib/inngest';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: (part: Part) => {
        return part.mimetype?.startsWith('image/') || false;
      },
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the uploaded file
    const originalBuffer = await fs.readFile(uploadedFile.filepath);
    const mediaId = uuidv4();
    const fileExtension = uploadedFile.originalFilename?.split('.').pop() || 'jpg';

    // Upload original file to storage first to avoid payload size limits
    const { uploadFile, getFileKey } = await import('@/lib/storage');
    const originalUpload = await uploadFile(
      originalBuffer,
      getFileKey(mediaId, 'original', fileExtension),
      uploadedFile.mimetype || 'image/jpeg'
    );

    // Save initial record to database with original URL
    const mediaRecord = {
      id: mediaId,
      originalUrl: originalUpload.url,
      mediumUrl: '', // Will be updated by background job  
      thumbnailUrl: '', // Will be updated by background job
      source: 'local' as const,
      tags: ['processing'], // Temporary tag while processing
      title: 'Processing...', // Temporary title
      description: 'Processing...', // Temporary description
      altText: 'Image being processed', // Temporary alt text
    };

    await db.insert(media).values(mediaRecord);

    // Trigger background processing job with storage URL instead of base64
    await inngest.send({
      name: 'media/process',
      data: {
        mediaId,
        originalUrl: originalUpload.url,
        filename: uploadedFile.originalFilename || 'image.jpg',
        mimetype: uploadedFile.mimetype || 'image/jpeg',
      },
    });

    // Clean up temporary file
    await fs.unlink(uploadedFile.filepath).catch(() => {});

    // Return immediately with processing status
    res.status(200).json({
      success: true,
      media: {
        ...mediaRecord,
        processing: true,
      },
      message: 'Upload received. Processing in background...',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 