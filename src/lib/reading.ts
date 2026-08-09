import { getCollection, type CollectionEntry } from 'astro:content';
import { validateContentEntries } from './content-validation';

export type Reading = CollectionEntry<'reading'>;

export async function getPublishedReadings() {
	const readings = await getCollection('reading', ({ data }) => !data.draft);
	validateContentEntries(readings, '阅读条目');

	const urls = new Set<string>();
	for (const reading of readings) {
		const url = normalizeExternalUrl(reading.data.url);
		if (urls.has(url)) {
			throw new Error(`阅读条目的 canonical URL 重复：${reading.data.url}`);
		}
		urls.add(url);
	}

	return readings.sort(
		(a, b) =>
			b.data.curatedAt.getTime() - a.data.curatedAt.getTime() ||
			(b.data.publishedAt?.getTime() ?? 0) - (a.data.publishedAt?.getTime() ?? 0) ||
			a.id.localeCompare(b.id),
	);
}

export function normalizeExternalUrl(value: string | URL) {
	const url = new URL(value);
	url.hash = '';

	for (const key of [...url.searchParams.keys()]) {
		if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key.toLowerCase())) {
			url.searchParams.delete(key);
		}
	}

	url.searchParams.sort();
	return url.toString();
}
