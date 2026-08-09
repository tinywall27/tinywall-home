import { links, linkCategories } from '../data/links';
import { projects } from '../data/projects';
import { topicMap, type TopicId } from '../data/topics';
import { getPublishedArticles, type Article } from './articles';
import { getNoteDisplayDate, getPublishedNotes, type Note } from './notes';
import { getPublishedReadings, type Reading } from './reading';

export { formatDate, formatShortDate } from './dates';
export { getPublishedArticles, type Article } from './articles';
export { getPublishedNotes, getNoteDisplayDate, type Note } from './notes';
export { getPublishedReadings, type Reading } from './reading';

export type DatedContentType = 'article' | 'note' | 'reading';
export type CommandItemType = DatedContentType | 'project' | 'link';

export interface DatedContentItem {
	type: DatedContentType;
	id: string;
	title: string;
	description: string;
	date: Date;
	topics: readonly TopicId[];
	href: string;
	external: boolean;
	source?: string;
}

export interface CommandItem {
	type: CommandItemType;
	title: string;
	description?: string;
	url: string;
	external: boolean;
	keywords?: string[];
}

export interface TodayContent {
	asOf?: Date;
	intelligence: Reading[];
	dailyRead?: Reading;
	quickLinks: (typeof links)[number][];
	projects: (typeof projects)[number][];
	recentNotes: Note[];
}

export async function getDatedContentItems(): Promise<DatedContentItem[]> {
	const [articles, notes, readings] = await Promise.all([
		getPublishedArticles(),
		getPublishedNotes(),
		getPublishedReadings(),
	]);

	return [
		...articles.map(mapArticleToDatedContent),
		...notes.map(mapNoteToDatedContent),
		...readings.map(mapReadingToDatedContent),
	].sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id));
}

export async function getTodayContent(): Promise<TodayContent> {
	const [readings, notes] = await Promise.all([
		getPublishedReadings(),
		getPublishedNotes(),
	]);
	const dailyRead = readings.find((reading) => reading.data.featured) ?? readings[0];
	const categoryOrder = new Map(linkCategories.map((category) => [category.id, category.order]));

	return {
		asOf: readings[0]?.data.curatedAt,
		intelligence: readings.filter((reading) => reading.id !== dailyRead?.id).slice(0, 4),
		dailyRead,
		quickLinks: links
			.filter((link) => link.featured)
			.toSorted(
				(a, b) =>
					(categoryOrder.get(a.category) ?? 0) - (categoryOrder.get(b.category) ?? 0) ||
					a.order - b.order,
			)
			.slice(0, 6),
		projects: projects.toSorted((a, b) => a.order - b.order).slice(0, 4),
		recentNotes: notes.slice(0, 4),
	};
}

export async function getCommandItems(): Promise<CommandItem[]> {
	const [articles, notes, readings] = await Promise.all([
		getPublishedArticles(),
		getPublishedNotes(),
		getPublishedReadings(),
	]);

	return [
		...articles.map((article) => ({
			type: 'article' as const,
			title: article.data.title,
			description: article.data.description,
			url: `/articles/${article.id}/`,
			external: false,
			keywords: getTopicKeywords(article.data.topics),
		})),
		...notes.map((note) => ({
			type: 'note' as const,
			title: note.data.title,
			description: note.data.description,
			url: `/notes/${note.id}/`,
			external: false,
			keywords: getTopicKeywords(note.data.topics),
		})),
		...readings.map((reading) => ({
			type: 'reading' as const,
			title: reading.data.title,
			description: reading.data.summary,
			url: reading.data.url,
			external: true,
			keywords: [reading.data.source, ...getTopicKeywords(reading.data.topics)],
		})),
		...projects.toSorted((a, b) => a.order - b.order).map((project) => ({
			type: 'project' as const,
			title: project.title,
			description: project.description,
			url: project.url ?? `/projects/#${project.id}`,
			external: Boolean(project.url),
			keywords: [...project.tags],
		})),
		...links.toSorted((a, b) => a.order - b.order).map((link) => ({
			type: 'link' as const,
			title: link.title,
			description: link.description,
			url: link.url,
			external: true,
			keywords: [
				link.category,
				linkCategories.find((category) => category.id === link.category)?.label ?? '',
			].filter(Boolean),
		})),
	];
}

function mapArticleToDatedContent(article: Article): DatedContentItem {
	return {
		type: 'article',
		id: article.id,
		title: article.data.title,
		description: article.data.description,
		date: article.data.publishedAt,
		topics: article.data.topics,
		href: `/articles/${article.id}/`,
		external: false,
	};
}

function mapNoteToDatedContent(note: Note): DatedContentItem {
	return {
		type: 'note',
		id: note.id,
		title: note.data.title,
		description: note.data.description ?? '',
		date: getNoteDisplayDate(note),
		topics: note.data.topics,
		href: `/notes/${note.id}/`,
		external: false,
	};
}

function mapReadingToDatedContent(reading: Reading): DatedContentItem {
	return {
		type: 'reading',
		id: reading.id,
		title: reading.data.title,
		description: reading.data.summary,
		date: reading.data.curatedAt,
		topics: reading.data.topics,
		href: reading.data.url,
		external: true,
		source: reading.data.source,
	};
}

function getTopicKeywords(topicIds: readonly TopicId[]) {
	return topicIds.flatMap((topic) => [topic, topicMap[topic].name]);
}
