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

export function compareDatesDescending(a: Date, b: Date) {
	return b.getTime() - a.getTime();
}
