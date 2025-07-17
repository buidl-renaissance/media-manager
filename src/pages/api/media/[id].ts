import { NextApiRequest, NextApiResponse } from 'next';
import { db, media } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { deleteFile } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid media ID' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(id, res);
    case 'PUT':
      return handleUpdate(id, req, res);
    case 'DELETE':
      return handleDelete(id, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(id: string, res: NextApiResponse) {
  try {
    const result = await db.select().from(media).where(eq(media.id, id)).limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.status(200).json({
      success: true,
      media: result[0],
    });
  } catch (error) {
    console.error('Media fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch media',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleUpdate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tags, description, altText } = req.body;

    // Validate input
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    // Build update object with only provided fields
    const updateData: Partial<{
      tags: string[];
      description: string;
      altText: string;
    }> = {};
    if (tags !== undefined) updateData.tags = tags;
    if (description !== undefined) updateData.description = description;
    if (altText !== undefined) updateData.altText = altText;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Check if media exists first
    const existing = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Update the media
    await db.update(media).set(updateData).where(eq(media.id, id));

    // Fetch updated record
    const updated = await db.select().from(media).where(eq(media.id, id)).limit(1);

    res.status(200).json({
      success: true,
      media: updated[0],
    });
  } catch (error) {
    console.error('Media update error:', error);
    res.status(500).json({
      error: 'Failed to update media',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleDelete(id: string, res: NextApiResponse) {
  try {
    // Get media record first to access file URLs
    const existing = await db.select().from(media).where(eq(media.id, id)).limit(1);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const mediaRecord = existing[0];

    // Delete files from storage
    try {
      const deletePromises = [];
      
      if (mediaRecord.originalUrl) {
        const originalKey = mediaRecord.originalUrl.split('/').pop();
        if (originalKey) {
          deletePromises.push(deleteFile(`original/${originalKey}`));
        }
      }
      
      if (mediaRecord.mediumUrl) {
        const mediumKey = mediaRecord.mediumUrl.split('/').pop();
        if (mediumKey) {
          deletePromises.push(deleteFile(`medium/${mediumKey}`));
        }
      }
      
      if (mediaRecord.thumbnailUrl) {
        const thumbKey = mediaRecord.thumbnailUrl.split('/').pop();
        if (thumbKey) {
          deletePromises.push(deleteFile(`thumb/${thumbKey}`));
        }
      }

      await Promise.all(deletePromises);
    } catch (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, id));

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Media deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete media',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 