import { NextApiRequest, NextApiResponse } from 'next';
import { db, media } from '@/lib/db';
import { like, or, desc, eq, SQL } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      q: query,
      tags: tagsParam,
      source,
      limit = '20',
      offset = '0'
    } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Parse tags if provided
    const filterTags = tagsParam && typeof tagsParam === 'string' 
      ? tagsParam.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    // Build search conditions
    const searchConditions: SQL[] = [];

    // Text search in title, description, and alt text
    if (query && typeof query === 'string' && query.trim()) {
      searchConditions.push(
        or(
          like(media.title, `%${query}%`),
          like(media.description, `%${query}%`),
          like(media.altText, `%${query}%`)
        )!
      );
    }

    // Add source filter if provided
    if (source && typeof source === 'string' && source !== 'all') {
      searchConditions.push(eq(media.source, source));
    }

    // Get all matching records first
    let results = await db
      .select()
      .from(media)
      .where(
        searchConditions.length > 0
          ? (searchConditions.length === 1 
              ? searchConditions[0]
              : or(...searchConditions)!)
          : undefined
      )
      .orderBy(desc(media.createdAt));

    // Apply tag filtering if tags are specified
    if (filterTags.length > 0) {
      results = results.filter(item => {
        if (!item.tags || item.tags.length === 0) return false;
        // Check if all specified tags are present in the media item
        return filterTags.every(filterTag => 
          item.tags!.some(tag => 
            tag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
      });
    }

    // Apply tag search in addition to text search if query is provided
    if (query && typeof query === 'string' && query.trim()) {
      const tagSearchResults = results.filter(item => {
        if (!item.tags || item.tags.length === 0) return false;
        return item.tags!.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        );
      });
      
      // Combine and deduplicate results
      const allResults = [...results, ...tagSearchResults];
      results = allResults.filter((item, index, arr) => 
        arr.findIndex(i => i.id === item.id) === index
      );
    }

    // Apply pagination
    const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

    res.status(200).json({
      success: true,
      query: query || '',
      tags: filterTags,
      source: source || 'all',
      results: paginatedResults,
      total: results.length,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < results.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 