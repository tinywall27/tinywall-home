import rss from '@astrojs/rss';
import { getPublishedArticles } from '../lib/articles';

export async function GET(context: { site?: URL }) {
	const articles = await getPublishedArticles();
	return rss({
		title: 'TinyWall',
		description: '连接重要项目、文章与每日阅读的个人知识门户。',
		site: context.site ?? new URL('https://tinywall.cc'),
		items: articles.map((article) => ({
			title: article.data.title,
			description: article.data.description,
			pubDate: article.data.publishedAt,
			link: `/articles/${article.id}/`,
			categories: article.data.topics,
		})),
		customData: '<language>zh-CN</language>',
	});
}
