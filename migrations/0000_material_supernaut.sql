CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`original_url` text NOT NULL,
	`medium_url` text,
	`thumbnail_url` text,
	`source` text NOT NULL,
	`tags` text DEFAULT '[]',
	`description` text,
	`alt_text` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
