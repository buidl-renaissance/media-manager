import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  originalUrl: text('original_url').notNull(),
  mediumUrl: text('medium_url'),
  thumbnailUrl: text('thumbnail_url'),
  source: text('source').notNull(), // 'local' | 'gdrive'
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  title: text('title'),
  description: text('description'),
  altText: text('alt_text'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}); 