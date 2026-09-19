export const topics = [
	{
		id: 'ai',
		name: '人工智能',
		description: '模型、产品、研究与 AI 工作方式。',
	},
	{
		id: 'finance',
		name: '金融',
		description: '金融体系、政策、投资研究与跨境资产。',
	},
	{
		id: 'markets',
		name: '市场',
		description: '宏观环境、市场结构与价格信号。',
	},
	{
		id: 'geography',
		name: '地理',
		description: '空间信息、区域知识与地理技术。',
	},
	{
		id: 'gaming',
		name: '游戏',
		description: '有版本依据的游戏攻略、策略选择与游玩记录。',
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
