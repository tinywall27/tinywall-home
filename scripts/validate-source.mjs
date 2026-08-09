import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const collections = {
	articles: {
		required: ['title', 'description', 'publishedAt', 'topics', 'lang', 'draft', 'featured'],
		booleans: ['draft', 'featured'],
		dates: ['publishedAt', 'updatedAt'],
	},
	notes: {
		required: ['title', 'publishedAt', 'topics', 'lang', 'draft'],
		booleans: ['draft'],
		dates: ['publishedAt', 'updatedAt'],
	},
	reading: {
		required: [
			'title',
			'url',
			'source',
			'curatedAt',
			'summary',
			'reason',
			'topics',
			'featured',
			'draft',
		],
		booleans: ['featured', 'draft'],
		dates: ['publishedAt', 'curatedAt'],
	},
};

async function exists(target) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}

async function walk(directory, predicate = () => true) {
	if (!(await exists(directory))) return [];
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const target = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(target, predicate)));
		else if (entry.isFile() && predicate(target)) files.push(target);
	}
	return files.sort();
}

function displayPath(target) {
	return path.relative(root, target).split(path.sep).join('/');
}

function unquote(value) {
	const trimmed = value.trim().replace(/\s+#.*$/, '').trim();
	if (
		(trimmed.startsWith("'") && trimmed.endsWith("'")) ||
		(trimmed.startsWith('"') && trimmed.endsWith('"'))
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

function parseFrontmatter(source, file) {
	const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
	if (lines[0]?.trim() !== '---') {
		errors.push(`${displayPath(file)}: 缺少开头 frontmatter`);
		return new Map();
	}
	const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	if (end < 0) {
		errors.push(`${displayPath(file)}: frontmatter 未闭合`);
		return new Map();
	}

	const fields = new Map();
	for (let index = 1; index < end; index += 1) {
		const match = lines[index].match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/);
		if (!match) continue;
		const [, key, inline = ''] = match;
		if (fields.has(key)) errors.push(`${displayPath(file)}:${index + 1}: frontmatter 字段 ${key} 重复`);
		const block = [];
		let cursor = index + 1;
		while (cursor < end && !/^[A-Za-z][\w-]*:/.test(lines[cursor])) {
			block.push(lines[cursor]);
			cursor += 1;
		}
		fields.set(key, { value: unquote(inline), block, line: index + 1 });
		index = cursor - 1;
	}
	return fields;
}

function listValues(field) {
	if (!field) return [];
	if (field.value.startsWith('[') && field.value.endsWith(']')) {
		return field.value
			.slice(1, -1)
			.split(',')
			.map(unquote)
			.filter(Boolean);
	}
	return field.block
		.map((line) => line.match(/^\s*-\s+([^:#][^#]*?)(?:\s+#.*)?$/)?.[1])
		.filter(Boolean)
		.map(unquote);
}

function validHttpUrl(value) {
	try {
		return ['http:', 'https:'].includes(new URL(value).protocol);
	} catch {
		return false;
	}
}

function canonicalUrl(value) {
	const url = new URL(value);
	url.hash = '';
	url.hostname = url.hostname.toLowerCase();
	for (const key of [...url.searchParams.keys()]) {
		if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key.toLowerCase())) {
			url.searchParams.delete(key);
		}
	}
	url.searchParams.sort();
	if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
	return url.toString();
}

function validateFields(kind, file, fields) {
	const spec = collections[kind];
	for (const key of spec.required) {
		const field = fields.get(key);
		if (!field || (!field.value && field.block.every((line) => !line.trim()))) {
			errors.push(`${displayPath(file)}: 缺少必填字段 ${key}`);
		}
	}
	if (fields.has('slug')) {
		errors.push(`${displayPath(file)}:${fields.get('slug').line}: 删除冗余 slug；Astro entry id 是 canonical slug`);
	}
	if (listValues(fields.get('topics')).length === 0) {
		errors.push(`${displayPath(file)}: topics 必须至少包含一个主题`);
	}
	for (const key of spec.booleans) {
		const field = fields.get(key);
		if (field && !['true', 'false'].includes(field.value)) {
			errors.push(`${displayPath(file)}:${field.line}: ${key} 必须是 true 或 false`);
		}
	}
	for (const key of spec.dates) {
		const field = fields.get(key);
		if (field && (!field.value || Number.isNaN(Date.parse(field.value)))) {
			errors.push(`${displayPath(file)}:${field.line}: ${key} 不是有效日期`);
		}
	}
	if (fields.has('updatedAt') && fields.has('publishedAt')) {
		if (Date.parse(fields.get('updatedAt').value) < Date.parse(fields.get('publishedAt').value)) {
			errors.push(`${displayPath(file)}: updatedAt 不能早于 publishedAt`);
		}
	}
	if (kind === 'reading') {
		const url = fields.get('url');
		if (url && !validHttpUrl(url.value)) errors.push(`${displayPath(file)}:${url.line}: url 必须是 HTTP(S) URL`);
		const minutes = fields.get('readingMinutes');
		if (minutes && (!/^\d+$/.test(minutes.value) || Number(minutes.value) < 1)) {
			errors.push(`${displayPath(file)}:${minutes.line}: readingMinutes 必须是正整数`);
		}
	}
	for (const sourceUrl of fields.get('sources')?.block ?? []) {
		const match = sourceUrl.match(/^\s+url:\s*(.+?)\s*$/);
		if (match && !validHttpUrl(unquote(match[1]))) {
			errors.push(`${displayPath(file)}: sources 中存在无效 HTTP(S) URL`);
		}
	}
}

async function validateCollections() {
	for (const kind of Object.keys(collections)) {
		const directory = path.join(root, 'src/content', kind);
		const files = await walk(directory, (file) => /\.(md|mdx)$/i.test(file));
		const ids = new Map();
		const urls = new Map();
		for (const file of files) {
			const id = path
				.relative(directory, file)
				.replace(/\.(md|mdx)$/i, '')
				.split(path.sep)
				.join('/');
			if (!id.split('/').every((part) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) {
				errors.push(`${displayPath(file)}: entry id 只能使用小写字母、数字和单连字符`);
			}
			const identity = id.toLowerCase();
			if (ids.has(identity)) errors.push(`${displayPath(file)}: entry id 与 ${displayPath(ids.get(identity))} 重复`);
			else ids.set(identity, file);

			const source = await readFile(file, 'utf8');
			const fields = parseFrontmatter(source, file);
			validateFields(kind, file, fields);
			if (kind === 'reading' && validHttpUrl(fields.get('url')?.value ?? '')) {
				const url = canonicalUrl(fields.get('url').value);
				if (urls.has(url)) errors.push(`${displayPath(file)}: canonical URL 与 ${displayPath(urls.get(url))} 重复`);
				else urls.set(url, file);
			}
		}
	}
}

async function validateDataFile(kind, relativeFile) {
	const file = path.join(root, relativeFile);
	if (!(await exists(file))) {
		errors.push(`${relativeFile}: 缺少 ${kind} 的中央数据文件`);
		return;
	}
	const source = await readFile(file, 'utf8');
	const exportName = kind === 'Projects' ? 'projects' : 'links';
	const arraySource = extractArrayLiteral(source, exportName);
	if (!arraySource) {
		errors.push(`${relativeFile}: 无法静态读取 export const ${exportName} 数组`);
		return;
	}
	const values = { id: [], url: [] };
	const property = /\b(id|url)\s*:\s*(['"`])([^'"`\r\n]+)\2/g;
	for (const match of arraySource.matchAll(property)) values[match[1]].push({ value: match[3], offset: match.index });
	for (const key of ['id', 'url']) {
		const seen = new Map();
		for (const item of values[key]) {
			const identity = key === 'url' && validHttpUrl(item.value) ? canonicalUrl(item.value) : item.value.toLowerCase();
			if (seen.has(identity)) errors.push(`${relativeFile}: ${kind} ${key} “${item.value}” 重复`);
			else seen.set(identity, item.offset);
		}
	}
	for (const item of values.url) {
		if (!validHttpUrl(item.value)) errors.push(`${relativeFile}: ${kind} URL “${item.value}” 必须是 HTTP(S) URL`);
	}
}

function extractArrayLiteral(source, exportName) {
	const declaration = new RegExp(
		`\\bexport\\s+const\\s+${exportName}(?:\\s*:[^=]+)?\\s*=\\s*\\[`,
	).exec(source);
	if (!declaration) return null;
	const open = declaration.index + declaration[0].lastIndexOf('[');
	let depth = 0;
	let quote = '';
	let escaped = false;
	for (let index = open; index < source.length; index += 1) {
		const character = source[index];
		if (quote) {
			if (escaped) escaped = false;
			else if (character === '\\') escaped = true;
			else if (character === quote) quote = '';
			continue;
		}
		if (character === "'" || character === '"' || character === '`') {
			quote = character;
			continue;
		}
		if (character === '[') depth += 1;
		if (character === ']') {
			depth -= 1;
			if (depth === 0) return source.slice(open + 1, index);
		}
	}
	return null;
}

function withoutCode(markdown) {
	let fenced = false;
	let marker = '';
	return markdown
		.split(/\r?\n/)
		.map((line) => {
			const fence = line.match(/^\s*(```|~~~)/)?.[1];
			if (fence && !fenced) {
				fenced = true;
				marker = fence;
				return '';
			}
			if (fence === marker && fenced) {
				fenced = false;
				return '';
			}
			return fenced ? '' : line.replace(/`[^`\n]*`/g, '');
		})
		.join('\n');
}

function markdownTargets(markdown) {
	const clean = withoutCode(markdown);
	const targets = [];
	for (const match of clean.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
		const raw = match[1].trim();
		targets.push(raw.startsWith('<') ? raw.slice(1, raw.indexOf('>')) : raw.split(/\s+/)[0]);
	}
	for (const match of clean.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)) targets.push(match[1]);
	return targets;
}

async function validateMarkdownLinks() {
	const ignored = new Set(['.git', '.astro', 'dist', 'node_modules', 'coverage']);
	async function collect(directory) {
		const entries = await readdir(directory, { withFileTypes: true });
		const files = [];
		for (const entry of entries) {
			if (ignored.has(entry.name)) continue;
			const target = path.join(directory, entry.name);
			if (entry.isDirectory()) files.push(...(await collect(target)));
			else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) files.push(target);
		}
		return files;
	}
	for (const file of await collect(root)) {
		const source = await readFile(file, 'utf8');
		for (const target of markdownTargets(source)) {
			if (!target || target.startsWith('#') || target.startsWith('/') || target.startsWith('//')) continue;
			if (/^[a-z][a-z\d+.-]*:/i.test(target)) continue;
			const pathname = decodeURIComponent(target.split('#')[0].split('?')[0]);
			if (!pathname) continue;
			let resolved = path.resolve(path.dirname(file), pathname);
			if (pathname.endsWith('/')) resolved = path.join(resolved, 'README.md');
			if (!(await exists(resolved))) {
				errors.push(`${displayPath(file)}: Markdown 内部链接不存在：${target}`);
			}
		}
	}
}

await validateCollections();
await validateDataFile('Projects', 'src/data/projects.ts');
await validateDataFile('Links', 'src/data/links.ts');
await validateMarkdownLinks();

if (errors.length > 0) {
	console.error(`Source validation failed (${errors.length}):`);
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
} else {
	console.log('Source validation passed: content contracts, duplicate IDs/URLs, and Markdown links.');
}
