export const linkCategories = [
	{ id: 'daily', label: '日常工具', description: '日常写作、协作和开发入口。', order: 10 },
	{ id: 'finance', label: '金融与市场', description: '宏观、金融体系和市场数据来源。', order: 20 },
	{ id: 'research', label: '研究与阅读', description: '论文、研究报告和原始资料。', order: 30 },
	{ id: 'development', label: '开发文档', description: '维护 TinyWall 和相关项目的工程资料。', order: 40 },
] as const;

export type LinkCategoryId = (typeof linkCategories)[number]['id'];

export interface LinkItem {
	id: string;
	title: string;
	url: string;
	category: LinkCategoryId;
	description?: string;
	order: number;
	featured: boolean;
}

export const links = [
	{
		id: 'chatgpt',
		title: 'ChatGPT',
		url: 'https://chatgpt.com/',
		category: 'daily',
		description: 'AI 研究、写作与日常协作入口。',
		order: 10,
		featured: true,
	},
	{
		id: 'gmail',
		title: 'Google 邮箱',
		url: 'https://mail.google.com/',
		category: 'daily',
		description: '打开 Gmail 收件箱与邮件工作流。',
		order: 20,
		featured: true,
	},
	{
		id: 'github',
		title: 'GitHub',
		url: 'https://github.com/',
		category: 'daily',
		description: '代码仓库、Issue 与 Pull Request 协作。',
		order: 30,
		featured: true,
	},
	{
		id: 'x',
		title: 'X',
		url: 'https://x.com/',
		category: 'daily',
		description: '关注实时信息、作者与行业动态。',
		order: 40,
		featured: true,
	},
	{
		id: 'youtube',
		title: 'YouTube',
		url: 'https://www.youtube.com/',
		category: 'daily',
		description: '视频课程、访谈与频道订阅入口。',
		order: 50,
		featured: true,
	},
	{
		id: 'bilibili',
		title: 'bilibili',
		url: 'https://www.bilibili.com/',
		category: 'daily',
		description: '中文视频、课程与创作者内容入口。',
		order: 60,
		featured: true,
	},
	{
		id: 'bis',
		title: 'Bank for International Settlements',
		url: 'https://www.bis.org/',
		category: 'finance',
		description: '国际清算银行的研究、统计与政策资料。',
		order: 10,
		featured: true,
	},
	{
		id: 'fred',
		title: 'FRED',
		url: 'https://fred.stlouisfed.org/',
		category: 'finance',
		description: '圣路易斯联储维护的宏观经济数据库。',
		order: 20,
		featured: true,
	},
	{
		id: 'youzhiyouxing-data',
		title: '有知有行数据',
		url: 'https://youzhiyouxing.cn/data',
		category: 'finance',
		description: '市场估值、指数与长期投资数据入口。',
		order: 30,
		featured: true,
	},
	{
		id: 'arxiv',
		title: 'arXiv',
		url: 'https://arxiv.org/',
		category: 'research',
		description: '查找 AI、计算机科学与其他学科的预印本。',
		order: 10,
		featured: false,
	},
	{
		id: 'stanford-ai-index',
		title: 'Stanford AI Index',
		url: 'https://hai.stanford.edu/ai-index',
		category: 'research',
		description: '跟踪 AI 技术、经济和社会趋势的年度报告。',
		order: 20,
		featured: false,
	},
	{
		id: 'astro-docs',
		title: 'Astro Documentation',
		url: 'https://docs.astro.build/',
		category: 'development',
		description: 'Astro 的官方开发与部署文档。',
		order: 10,
		featured: false,
	},
] as const satisfies readonly LinkItem[];

assertLinkData(links);

export const linkGroups = linkCategories.map((category) => ({
	...category,
	links: links
		.filter((link) => link.category === category.id)
		.toSorted((a, b) => a.order - b.order),
}));

function assertLinkData(items: readonly LinkItem[]) {
	const ids = new Set<string>();
	const urls = new Set<string>();

	for (const link of items) {
		if (ids.has(link.id)) throw new Error(`链接 ID 重复：${link.id}`);
		if (urls.has(link.url)) throw new Error(`链接 URL 重复：${link.url}`);
		new URL(link.url);
		ids.add(link.id);
		urls.add(link.url);
	}
}
