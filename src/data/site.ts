export interface SiteMetadata {
	name: string;
	description: string;
	url: string;
	lang: 'zh-CN';
	locale: 'zh_CN';
	repository: string;
}

export const siteMetadata = {
	name: 'TinyWall',
	description: '把当天资讯、每日阅读、个人项目、常用链接和长期笔记放在同一个安静入口中。',
	url: 'https://tinywall.cc',
	lang: 'zh-CN',
	locale: 'zh_CN',
	repository: 'https://github.com/tinywall27/tinywall-home',
} as const satisfies SiteMetadata;
