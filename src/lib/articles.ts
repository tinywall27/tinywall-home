import { getCollection, type CollectionEntry } from 'astro:content';
import { validateContentEntries } from './content-validation';

export { formatDate, formatShortDate } from './dates';

export type Article = CollectionEntry<'articles'>;

export async function getPublishedArticles() {
	const articles = await getCollection('articles', ({ data }) => !data.draft);
	validateContentEntries(articles, '文章');

	return articles.sort(
		(a, b) =>
			b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
			a.id.localeCompare(b.id),
	);
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
