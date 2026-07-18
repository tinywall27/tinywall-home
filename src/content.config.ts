import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { topicIds } from './data/topics';

const articles = defineCollection({
	loader: glob({
		base: './src/content/articles',
		pattern: '**/*.{md,mdx}',
	}),
	schema: z.object({
		title: z.string().min(2).max(120),
		slug: z
			.string()
			.min(2)
			.max(100)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能包含小写字母、数字和连字符'),
		description: z.string().min(10).max(240),
		publishedAt: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		topics: z.array(z.enum(topicIds)).min(1),
		series: z.string().min(2).max(80).optional(),
		lang: z.enum(['zh-CN', 'en']).default('zh-CN'),
		draft: z.boolean().default(false),
		featured: z.boolean().default(false),
		sources: z
			.array(
				z.object({
					title: z.string().min(2).max(120),
					url: z.url(),
				}),
			)
			.optional(),
	}),
});

export const collections = { articles };
