import { NextApiRequest, NextApiResponse } from 'next';
import { db, media } from '@/lib/db';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid media ID' });
    }

    const mediaRecord = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (mediaRecord.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const record = mediaRecord[0];
    
    // Check if processing is complete
    const isProcessing = !record.originalUrl || 
                        record.tags?.includes('processing') || 
                        record.description === 'Processing...';

    res.status(200).json({
      success: true,
      media: record,
      processing: isProcessing,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 