export type PrimaryNavigationId = 'today' | 'reading' | 'projects' | 'links' | 'notes';
export type SecondaryNavigationId = 'articles' | 'topics' | 'archive' | 'rss';

export interface NavigationItem<Id extends string = string> {
	id: Id;
	label: string;
	href: string;
}

export const primaryNavigation = [
	{ id: 'today', label: 'Today', href: '/' },
	{ id: 'reading', label: 'Reading', href: '/reading/' },
	{ id: 'projects', label: 'Projects', href: '/projects/' },
	{ id: 'links', label: 'Links', href: '/links/' },
	{ id: 'notes', label: 'Notes', href: '/notes/' },
] as const satisfies readonly NavigationItem<PrimaryNavigationId>[];

export const secondaryNavigation = [
	{ id: 'articles', label: 'Articles', href: '/articles/' },
	{ id: 'topics', label: 'Topics', href: '/topics/' },
	{ id: 'archive', label: 'Archive', href: '/archive/' },
	{ id: 'rss', label: 'RSS', href: '/rss.xml' },
] as const satisfies readonly NavigationItem<SecondaryNavigationId>[];
