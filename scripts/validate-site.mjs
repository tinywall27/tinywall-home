import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const origin = 'https://tinywall.cc';
const errors = new Set();

async function exists(target) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}

async function walk(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const target = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(target)));
		else if (entry.isFile() && entry.name.endsWith('.html')) files.push(target);
	}
	return files;
}

function publicPath(file) {
	const relative = path.relative(dist, file).split(path.sep).join('/');
	if (relative === 'index.html') return '/';
	if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
	return `/${relative}`;
}

function decodeHtml(value) {
	return value
		.replaceAll('&amp;', '&')
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'")
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>');
}

async function resolveTarget(pathname) {
	let decoded;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		return null;
	}
	const relative = path.posix.normalize(decoded).replace(/^\/+/, '');
	if (relative.startsWith('../')) return null;
	const candidates = decoded.endsWith('/')
		? [path.join(dist, relative, 'index.html'), path.join(dist, `${relative.replace(/\/+$/, '')}.html`)]
		: [path.join(dist, relative), path.join(dist, relative, 'index.html'), path.join(dist, `${relative}.html`)];
	for (const candidate of candidates) if (await exists(candidate)) return candidate;
	return null;
}

if (!(await exists(dist))) {
	console.error('Site validation failed: dist/ 不存在，请先运行 npm run build。');
	process.exit(1);
}

const htmlFiles = await walk(dist);
const htmlCache = new Map();
for (const file of htmlFiles) htmlCache.set(file, await readFile(file, 'utf8'));

for (const [file, html] of htmlCache) {
	const pageUrl = new URL(publicPath(file), origin);
	for (const match of html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
		const raw = decodeHtml(match[2].trim());
		if (!raw || raw === '#' || /^(?:data|mailto|tel|javascript):/i.test(raw)) continue;
		let url;
		try {
			url = new URL(raw, pageUrl);
		} catch {
			errors.add(`${publicPath(file)}: 无法解析链接 ${raw}`);
			continue;
		}
		if (url.origin !== origin) continue;
		const target = await resolveTarget(url.pathname);
		if (!target) {
			errors.add(`${publicPath(file)}: 站内目标不存在 ${url.pathname}`);
			continue;
		}
		if (url.hash && target.endsWith('.html')) {
			let fragment;
			try {
				fragment = decodeURIComponent(url.hash.slice(1));
			} catch {
				fragment = url.hash.slice(1);
			}
			const targetHtml = htmlCache.get(target) ?? (await readFile(target, 'utf8'));
			const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			if (!new RegExp(`\\b(?:id|name)=["']${escaped}["']`).test(targetHtml)) {
				errors.add(`${publicPath(file)}: 片段目标不存在 ${url.pathname}${url.hash}`);
			}
		}
	}
}

if (errors.size > 0) {
	console.error(`Site validation failed (${errors.size}):`);
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
} else {
	console.log(`Site validation passed: ${htmlFiles.length} HTML files checked.`);
}
