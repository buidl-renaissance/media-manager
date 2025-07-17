import { NextApiRequest, NextApiResponse } from 'next';
import { db, media } from '@/lib/db';
import { like, or, desc, eq, SQL } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        search, 
        source, 
        page = '1', 
        limit = '20',
        orderBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const whereConditions: SQL[] = [];

      if (search && typeof search === 'string') {
        whereConditions.push(
          or(
            like(media.description, `%${search}%`),
            like(media.altText, `%${search}%`)
          )!
        );
      }

      if (source && typeof source === 'string') {
        whereConditions.push(
          eq(media.source, source)
        );
      }

      // Execute query with all conditions
      const baseQuery = db.select().from(media);
      
      const results = await (async () => {
        if (whereConditions.length > 0) {
          const whereClause = whereConditions.length === 1 
            ? whereConditions[0] 
            : or(...whereConditions)!;
          
          if (order === 'asc') {
            return baseQuery
              .where(whereClause)
              .orderBy(media.createdAt)
              .limit(limitNum)
              .offset(offset);
          } else {
            return baseQuery
              .where(whereClause)
              .orderBy(desc(media.createdAt))
              .limit(limitNum)
              .offset(offset);
          }
        } else {
          if (order === 'asc') {
            return baseQuery
              .orderBy(media.createdAt)
              .limit(limitNum)
              .offset(offset);
          } else {
            return baseQuery
              .orderBy(desc(media.createdAt))
              .limit(limitNum)
              .offset(offset);
          }
        }
      })();

      res.status(200).json({
        success: true,
        media: results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: results.length, // This is approximate - for exact count, need separate query
        },
      });
    } catch (error) {
      console.error('Media fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch media',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 