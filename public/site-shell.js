const dialog = document.querySelector('[data-command-dialog]');
const commandOpeners = [...document.querySelectorAll('[data-command-open]')];
const commandInput = dialog?.querySelector('#command-query');
const commandStatus = dialog?.querySelector('[data-command-status]');
const commandEmpty = dialog?.querySelector('[data-command-empty]');
const pagefindResults = dialog?.querySelector('[data-command-pagefind]');
const staticItems = [...(dialog?.querySelectorAll('[data-command-static]') ?? [])];
const siteMenu = document.querySelector('[data-site-menu]');
const todayDate = document.querySelector('[data-today-date]');
const themeToggles = [...document.querySelectorAll('[data-theme-toggle]')];
const themeColor = document.querySelector('[data-theme-color]');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let returnFocus = null;
let pagefindPromise = null;
let debounceTimer = 0;
let searchVersion = 0;

const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('zh-CN').trim();

const themeLabels = {
	system: '系统',
	light: '浅色',
	dark: '深色',
};

const getThemeMode = () => document.documentElement.dataset.theme || 'system';
const getResolvedTheme = (mode) => mode === 'system' ? (colorScheme.matches ? 'dark' : 'light') : mode;

const applyTheme = (mode, persist = true) => {
	if (mode === 'system') delete document.documentElement.dataset.theme;
	else document.documentElement.dataset.theme = mode;

	if (persist) {
		try {
			if (mode === 'system') localStorage.removeItem('tinywall-theme');
			else localStorage.setItem('tinywall-theme', mode);
		} catch {}
	}

	const label = themeLabels[mode];
	const resolvedTheme = getResolvedTheme(mode);
	themeColor?.setAttribute('content', resolvedTheme === 'dark' ? '#0c0d0c' : '#fafaf8');
	themeToggles.forEach((toggle) => {
		toggle.dataset.themeMode = mode;
		toggle.setAttribute('aria-label', `外观模式：${label}。点击切换`);
		toggle.title = `当前为${label}模式，点击切换`;
		toggle.querySelectorAll('[data-theme-label]').forEach((node) => {
			node.textContent = label;
		});
	});
};

const getNextTheme = () => {
	const currentMode = getThemeMode();
	if (currentMode === 'system') return getResolvedTheme(currentMode) === 'dark' ? 'light' : 'dark';
	if (currentMode === 'dark') return 'light';
	return 'system';
};

applyTheme(getThemeMode(), false);
themeToggles.forEach((toggle) => toggle.addEventListener('click', () => applyTheme(getNextTheme())));
colorScheme.addEventListener('change', () => {
	if (getThemeMode() === 'system') applyTheme('system', false);
});

const updateTodayDate = () => {
	if (!(todayDate instanceof HTMLTimeElement)) return;
	const now = new Date();
	const formatter = new Intl.DateTimeFormat('zh-CN', {
		timeZone: 'Asia/Shanghai',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
	const numericParts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Shanghai',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now);
	const values = Object.fromEntries(numericParts.map(({ type, value }) => [type, value]));
	todayDate.textContent = formatter.format(now);
	todayDate.dateTime = `${values.year}-${values.month}-${values.day}`;
};

updateTodayDate();
document.addEventListener('visibilitychange', () => {
	if (!document.hidden) updateTodayDate();
});

const getVisibleItems = () =>
	[...(dialog?.querySelectorAll('[data-command-item]') ?? [])].filter((item) => !item.hidden);

const updateEmptyState = (isSearching = false) => {
	if (!commandEmpty) return;
	const count = getVisibleItems().length;
	commandEmpty.hidden = count > 0 || isSearching;
	if (commandStatus) {
		commandStatus.textContent = isSearching
			? '正在搜索…'
			: commandInput?.value.trim()
				? `找到 ${count} 个结果`
				: '快速入口';
	}
};

const resetResults = () => {
	searchVersion += 1;
	if (commandInput) commandInput.value = '';
	if (pagefindResults) pagefindResults.replaceChildren();
	staticItems.forEach((item, index) => {
		item.hidden = index >= 12;
	});
	updateEmptyState();
};

const loadPagefind = () => {
	if (!pagefindPromise) {
		pagefindPromise = import('/pagefind/pagefind.js').catch(() => null);
	}
	return pagefindPromise;
};

const stripMarkup = (value = '') => {
	const container = document.createElement('span');
	container.innerHTML = value;
	return container.textContent?.trim() ?? '';
};

const renderPagefindResults = async (query, version) => {
	const pagefind = await loadPagefind();
	if (!pagefind || version !== searchVersion || !query) {
		updateEmptyState();
		return;
	}

	try {
		const response = await pagefind.search(query);
		const details = await Promise.all(response.results.slice(0, 8).map((result) => result.data()));
		if (version !== searchVersion || !pagefindResults) return;

		const existingUrls = new Set(
			staticItems.filter((item) => !item.hidden).map((item) => new URL(item.href, window.location.origin).href),
		);
		const fragment = document.createDocumentFragment();
		let resultIndex = 0;

		for (const result of details) {
			const absoluteUrl = new URL(result.url, window.location.origin).href;
			if (existingUrls.has(absoluteUrl)) continue;

			const item = document.createElement('a');
			item.className = 'command-item';
			item.href = result.url;
			item.setAttribute('role', 'listitem');
			item.dataset.commandItem = '';
			item.id = `command-pagefind-${resultIndex}`;

			const type = document.createElement('span');
			type.className = 'command-item__type';
			type.textContent = {
				Article: '文章',
				Note: '笔记',
				'AI Daily Brief': '简报',
			}[result.meta?.type] ?? '页面';

			const copy = document.createElement('span');
			copy.className = 'command-item__copy';
			const title = document.createElement('strong');
			title.textContent = result.meta?.title || 'TinyWall 页面';
			const description = document.createElement('small');
			description.textContent = result.meta?.description || stripMarkup(result.excerpt).slice(0, 96);
			copy.append(title, description);

			const arrow = document.createElement('span');
			arrow.className = 'command-item__arrow';
			arrow.setAttribute('aria-hidden', 'true');
			arrow.textContent = '→';
			item.append(type, copy, arrow);
			fragment.append(item);
			resultIndex += 1;
		}

		pagefindResults.replaceChildren(fragment);
		updateEmptyState();
	} catch {
		if (version === searchVersion) updateEmptyState();
	}
};

const runSearch = () => {
	const query = normalize(commandInput?.value ?? '');
	const version = ++searchVersion;
	if (pagefindResults) pagefindResults.replaceChildren();

	staticItems.forEach((item, index) => {
		item.hidden = query ? !normalize(item.dataset.commandSearch ?? '').includes(query) : index >= 12;
	});

	if (!query) {
		updateEmptyState();
		return;
	}

	updateEmptyState(query.length >= 2);
	if (query.length >= 2) renderPagefindResults(query, version);
};

const openCommands = (opener) => {
	if (!(dialog instanceof HTMLDialogElement)) return;
	returnFocus = opener instanceof HTMLElement ? opener : document.activeElement;
	if (siteMenu instanceof HTMLDetailsElement) siteMenu.open = false;
	resetResults();
	if (!dialog.open) dialog.showModal();
	document.body.classList.add('dialog-open');
	window.requestAnimationFrame(() => commandInput?.focus());
};

commandOpeners.forEach((opener) => {
	opener.addEventListener('click', () => openCommands(opener));
});

document.addEventListener('keydown', (event) => {
	if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
		event.preventDefault();
		openCommands(document.activeElement);
	}
});

commandInput?.addEventListener('input', () => {
	window.clearTimeout(debounceTimer);
	debounceTimer = window.setTimeout(runSearch, 140);
});

dialog?.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		event.preventDefault();
		dialog.close();
		return;
	}
	if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
	const items = getVisibleItems();
	if (items.length === 0) return;
	event.preventDefault();
	const currentIndex = items.indexOf(document.activeElement);
	if (event.key === 'ArrowDown') items[currentIndex < items.length - 1 ? currentIndex + 1 : 0]?.focus();
	else if (currentIndex <= 0) commandInput?.focus();
	else items[currentIndex - 1]?.focus();
});

dialog?.addEventListener('click', (event) => {
	if (event.target === dialog) dialog.close();
	if (event.target instanceof Element && event.target.closest('[data-command-item]')) dialog.close();
});

dialog?.addEventListener('close', () => {
	document.body.classList.remove('dialog-open');
	resetResults();
	if (returnFocus instanceof HTMLElement) returnFocus.focus();
	returnFocus = null;
});

if (siteMenu instanceof HTMLDetailsElement) {
	document.addEventListener('click', (event) => {
		if (siteMenu.open && event.target instanceof Node && !siteMenu.contains(event.target)) siteMenu.open = false;
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && siteMenu.open) {
			siteMenu.open = false;
			siteMenu.querySelector('summary')?.focus();
		}
	});
	siteMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
		siteMenu.open = false;
	}));
}
