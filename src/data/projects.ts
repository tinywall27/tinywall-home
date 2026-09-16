import { parentingGuide } from './parenting';
export const projectStatuses = {
	active: '持续维护',
	building: '建设中',
	maintained: '稳定运行',
	paused: '暂停',
	archived: '已归档',
} as const;

export type ProjectStatus = keyof typeof projectStatuses;

export interface Project {
	id: string;
	title: string;
	description: string;
	url?: string;
	status: ProjectStatus;
	tags: readonly string[];
	order: number;
	repository?: string;
}

export const projects: readonly Project[] = [
	{ ...parentingGuide, status: 'active', tags: ['育儿', '成长指南', '月龄'], order: 30 },
	{
		id: 'fund-knowledge-base',
		title: '跨境基金知识库',
		description: '围绕跨境基金、市场结构与投资研究建立的知识索引。',
		url: 'https://fund.tinywall.cc',
		status: 'active',
		tags: ['Finance', 'Knowledge Base'],
		order: 10,
		repository: 'https://github.com/tinywall27/fundadmin-kb',
	},
	{
		id: 'geo-ai',
		title: '地理 AI 项目',
		description: '探索空间信息、地理知识与人工智能之间的连接。',
		status: 'building',
		tags: ['Geography', 'AI'],
		order: 20,
	},
] as const satisfies readonly Project[];

assertProjectData(projects);

function assertProjectData(items: readonly Project[]) {
	const ids = new Set<string>();
	const urls = new Set<string>();

	for (const project of items) {
		if (ids.has(project.id)) throw new Error(`项目 ID 重复：${project.id}`);
		if (project.url && urls.has(project.url)) throw new Error(`项目 URL 重复：${project.url}`);
		if (project.url) new URL(project.url);
		if (project.repository) new URL(project.repository);
		ids.add(project.id);
		if (project.url) urls.add(project.url);
	}
}
