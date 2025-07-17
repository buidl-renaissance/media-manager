import { NextApiRequest, NextApiResponse } from 'next';
import { db, media } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all media items
    const allMedia = await db
      .select({ tags: media.tags })
      .from(media);

    // Extract and flatten all tags
    const allTags = new Set<string>();
    
    allMedia.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            // Skip processing tags
            if (tag !== 'processing') {
              allTags.add(tag.trim());
            }
          }
        });
      }
    });

    // Convert to sorted array
    const sortedTags = Array.from(allTags).sort();

    res.status(200).json({
      success: true,
      tags: sortedTags,
      total: sortedTags.length,
    });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch tags',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 