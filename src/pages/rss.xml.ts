import rss from '@astrojs/rss';
import { siteMetadata } from '../data/site';
import { getPublishedArticles, getPublishedNotes } from '../lib/content';

export async function GET(context: { site?: URL }) {
	const [articles, notes] = await Promise.all([getPublishedArticles(), getPublishedNotes()]);
	const items = [
		...articles.map((article) => ({
			title: article.data.title,
			description: article.data.description,
			pubDate: article.data.publishedAt,
			link: `/articles/${article.id}/`,
			categories: article.data.topics,
		})),
		...notes.map((note) => ({
			title: note.data.title,
			description: note.data.description ?? `TinyWall 笔记：${note.data.title}`,
			pubDate: note.data.publishedAt,
			link: `/notes/${note.id}/`,
			categories: note.data.topics,
		})),
	].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

	return rss({
		title: siteMetadata.name,
		description: 'TinyWall 发布的文章、编辑简报与公开笔记。',
		site: context.site ?? new URL(siteMetadata.url),
		items,
		customData: '<language>zh-CN</language>',
	});
}
