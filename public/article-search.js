const form = document.querySelector('#article-filters');
const searchInput = document.querySelector('#article-search');
const topicSelect = document.querySelector('#topic-filter');
const yearSelect = document.querySelector('#year-filter');
const cards = [...document.querySelectorAll('[data-article-card]')];
const count = document.querySelector('[data-result-count]');
const emptyState = document.querySelector('[data-empty-state]');
let pagefind = null;
let pagefindUnavailable = false;
let debounceTimer = 0;

const normalizePath = (value) => {
	const url = new URL(value, window.location.origin);
	return url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
};

const loadPagefind = async () => {
	if (pagefind || pagefindUnavailable) return pagefind;
	try {
		pagefind = await import('/pagefind/pagefind.js');
		return pagefind;
	} catch {
		pagefindUnavailable = true;
		return null;
	}
};

const updateUrl = (query, topic, year) => {
	const url = new URL(window.location.href);
	for (const [key, value] of Object.entries({ q: query, topic, year })) {
		if (value) url.searchParams.set(key, value);
		else url.searchParams.delete(key);
	}
	window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

const applyFilters = async () => {
	if (!searchInput || !topicSelect || !yearSelect || !count || !emptyState) return;
	const query = searchInput.value.trim();
	const topic = topicSelect.value;
	const year = yearSelect.value;
	let pagefindUrls = null;

	if (query) {
		const engine = await loadPagefind();
		if (engine) {
			const response = await engine.search(query);
			const results = await Promise.all(response.results.map((result) => result.data()));
			pagefindUrls = new Set(results.map((result) => normalizePath(result.url)));
		}
	}

	let visible = 0;
	for (const card of cards) {
		const cardTopics = card.dataset.topics?.split(',') ?? [];
		const matchesTopic = !topic || cardTopics.includes(topic);
		const matchesYear = !year || card.dataset.year === year;
		const matchesStaticSearch =
			!query || card.dataset.search?.includes(query.toLocaleLowerCase('zh-CN'));
		const matchesSearch = pagefindUrls
			? pagefindUrls.has(normalizePath(card.dataset.url ?? ''))
			: matchesStaticSearch;
		const show = matchesTopic && matchesYear && matchesSearch;
		card.hidden = !show;
		if (show) visible += 1;
	}

	count.textContent = String(visible);
	emptyState.hidden = visible !== 0;
	updateUrl(query, topic, year);
};

const scheduleFilters = () => {
	window.clearTimeout(debounceTimer);
	debounceTimer = window.setTimeout(applyFilters, 180);
};

if (form && searchInput && topicSelect && yearSelect) {
	const params = new URLSearchParams(window.location.search);
	searchInput.value = params.get('q') ?? '';
	topicSelect.value = params.get('topic') ?? '';
	yearSelect.value = params.get('year') ?? '';

	form.addEventListener('submit', (event) => event.preventDefault());
	searchInput.addEventListener('input', scheduleFilters);
	topicSelect.addEventListener('change', applyFilters);
	yearSelect.addEventListener('change', applyFilters);
	form.addEventListener('reset', () => window.setTimeout(applyFilters, 0));
	applyFilters();
}
