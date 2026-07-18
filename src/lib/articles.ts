import { getCollection, type CollectionEntry } from 'astro:content';
import { getTopic } from '../data/topics';

export type Article = CollectionEntry<'articles'>;

export async function getPublishedArticles() {
	const articles = await getCollection('articles', ({ data }) => !data.draft);
	const seen = new Set<string>();

	for (const article of articles) {
		if (seen.has(article.id)) {
			throw new Error(`发现重复文章 slug：${article.id}`);
		}
		seen.add(article.id);
		for (const topic of article.data.topics) {
			if (!getTopic(topic)) {
				throw new Error(`文章 ${article.id} 使用了未知主题：${topic}`);
			}
		}
	}

	return articles.sort(
		(a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
	);
}

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
}

export function formatShortDate(date: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

export function getArticleYear(article: Article) {
	return String(article.data.publishedAt.getFullYear());
}

export function estimateReadingMinutes(body = '') {
	const normalized = body.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ');
	const chineseCharacters = normalized.match(/[\u3400-\u9fff]/g)?.length ?? 0;
	const latinWords = normalized
		.replace(/[\u3400-\u9fff]/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
	return Math.max(1, Math.ceil(chineseCharacters / 300 + latinWords / 220));
}
