import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { topicIds } from './data/topics';

const languageSchema = z.enum(['zh-CN', 'en']).default('zh-CN');
const topicsSchema = z.array(z.enum(topicIds)).min(1);
const sourcesSchema = z
	.array(
		z.object({
			title: z.string().min(2).max(120),
			url: z.url(),
		}),
	)
	.min(1)
	.optional();

const articles = defineCollection({
	loader: glob({
		base: './src/content/articles',
		pattern: '**/*.{md,mdx}',
	}),
	schema: z.object({
		title: z.string().min(2).max(120),
		description: z.string().min(10).max(240),
		publishedAt: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		topics: topicsSchema,
		series: z.string().min(2).max(80).optional(),
		lang: languageSchema,
		draft: z.boolean().default(false),
		featured: z.boolean().default(false),
		sources: sourcesSchema,
	}),
});

const notes = defineCollection({
	loader: glob({
		base: './src/content/notes',
		pattern: '**/*.{md,mdx}',
	}),
	schema: z.object({
		title: z.string().min(2).max(120),
		description: z.string().min(10).max(240).optional(),
		publishedAt: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		topics: topicsSchema,
		lang: languageSchema,
		draft: z.boolean().default(false),
		sources: sourcesSchema,
	}),
});

const reading = defineCollection({
	loader: glob({
		base: './src/content/reading',
		pattern: '**/*.{md,mdx}',
	}),
	schema: z.object({
		title: z.string().min(2).max(180),
		url: z.url(),
		source: z.string().min(2).max(120),
		publishedAt: z.coerce.date().optional(),
		curatedAt: z.coerce.date(),
		summary: z.string().min(10).max(360),
		reason: z.string().min(10).max(280),
		topics: topicsSchema,
		readingMinutes: z.number().int().positive().max(600).optional(),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
	}),
});

export const collections = { articles, notes, reading };
