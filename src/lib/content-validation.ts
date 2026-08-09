import { getTopic } from '../data/topics';

interface TopicEntry {
	id: string;
	data: {
		topics: readonly string[];
	};
}

export function validateContentEntries(
	entries: readonly TopicEntry[],
	collectionLabel: string,
) {
	const seen = new Set<string>();

	for (const entry of entries) {
		if (seen.has(entry.id)) {
			throw new Error(`${collectionLabel} 存在重复 entry id：${entry.id}`);
		}
		seen.add(entry.id);

		for (const topic of entry.data.topics) {
			if (!getTopic(topic)) {
				throw new Error(`${collectionLabel} ${entry.id} 使用了未知主题：${topic}`);
			}
		}
	}
}
