export const topics = [
	{
		id: 'ai',
		name: '人工智能',
		description: '模型、产品、研究与 AI 工作方式。',
	},
	{
		id: 'daily-brief',
		name: '每日简报',
		description: '面向个人阅读的高密度每日信息窗口。',
	},
	{
		id: 'site-notes',
		name: '建站札记',
		description: '关于 TinyWall 的结构、设计与持续建设。',
	},
	{
		id: 'knowledge-management',
		name: '知识管理',
		description: '信息如何被采集、组织、检索与复用。',
	},
] as const;

export type TopicId = (typeof topics)[number]['id'];
export const topicIds = topics.map((topic) => topic.id) as [TopicId, ...TopicId[]];

export const topicMap = Object.fromEntries(
	topics.map((topic) => [topic.id, topic]),
) as Record<TopicId, (typeof topics)[number]>;

export function getTopic(id: string) {
	return topics.find((topic) => topic.id === id);
}
