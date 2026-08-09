import { getCollection, type CollectionEntry } from 'astro:content';
import { validateContentEntries } from './content-validation';

export type Note = CollectionEntry<'notes'>;

export async function getPublishedNotes() {
	const notes = await getCollection('notes', ({ data }) => !data.draft);
	validateContentEntries(notes, '笔记');

	return notes.sort((a, b) => {
		const aDate = a.data.updatedAt ?? a.data.publishedAt;
		const bDate = b.data.updatedAt ?? b.data.publishedAt;
		return bDate.getTime() - aDate.getTime() || a.id.localeCompare(b.id);
	});
}

export function getNoteDisplayDate(note: Note) {
	return note.data.updatedAt ?? note.data.publishedAt;
}
