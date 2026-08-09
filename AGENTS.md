# TinyWall Agent 约束

本文件适用于整个仓库。`CLAUDE.md` 必须继续保持为指向本文件的符号链接。

## 产品北极星

TinyWall 是个人日常使用优先、公开访问友好的 Personal Information Hub / Personal OS，不是求职作品集、营销落地页或新闻门户。

- `/` 是 Today：用户打开后应在两秒内看到当天值得关注的内容和高频入口。
- 顶部主导航固定为 `Today · Reading · Projects · Links · Notes`，主导航项目不得超过五个。
- V1 采用静态优先架构，不实现账号、后端、数据库、跨设备同步、阅读状态、收藏状态或浏览器持久化。
- 当前实现与目标规范必须明确区分。不得把 `docs/` 中标记为“目标”或“计划中”的能力描述成已经上线。
- 产品范围、路由和阶段划分以 [`docs/PRODUCT.md`](docs/PRODUCT.md) 为准。

## 技术与包管理

- Node.js 版本必须满足 `package.json` 中的要求，当前为 Node.js 22.12 或更高版本。
- JavaScript/TypeScript 依赖只使用 npm，并维护现有 `package-lock.json`；不要引入 pnpm、Yarn 或 Bun 锁文件。
- UV 仅用于未来的 Python 辅助脚本、采集或自动化任务；不要用 UV 替代 npm 管理 Astro 依赖。
- 保持 Astro 静态输出和 Cloudflare Pages 兼容。未经用户明确批准，不得引入服务端渲染、后端服务、数据库、认证系统或前端框架。
- 优先使用 Astro 组件和少量原生 JavaScript；只有复杂交互确有必要时才考虑框架岛屿。

## 开发服务与检查

开发服务器必须在后台运行：

```bash
npm run dev # 执行 astro dev --background
```

使用以下命令管理后台服务：

```bash
astro dev status
astro dev logs
astro dev stop
```

提交前至少运行完整质量门：

```bash
npm run quality
```

质量门包含内容契约检查、原生浏览器脚本语法检查、Astro 类型检查、静态页面生成、Pagefind 索引和构建后站内链接检查。受限环境如因 Astro 遥测目录权限失败，应为相关 Astro 命令关闭遥测，例如：

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run quality
```

修改相关功能前查阅对应的 Astro 官方文档：

- [路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [框架组件](https://docs.astro.build/en/guides/framework-components/)
- [内容集合](https://docs.astro.build/en/guides/content-collections/)
- [样式](https://docs.astro.build/en/guides/styling/)
- [国际化](https://docs.astro.build/en/guides/internationalization/)

## 架构约束

- 重复出现的导航、项目、链接、主题和内容元数据必须来自集中且有类型的数据源，不得在多个页面重复硬编码。
- Articles、Notes、Reading、Projects 和 Links 是当前正式内容类型；Today 只聚合这些数据，不复制内容。详见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。
- 文件名/Astro entry id 是 canonical slug。frontmatter 不得添加冗余 `slug` 字段。
- 已发布的 `/articles/`、`/topics/`、`/archive/` URL 必须保持稳定。确需变更时，必须同时提供重定向并更新相关文档。
- `lang` 当前只是内容元数据，不代表网站已经支持完整 i18n；不得据此引入未规划的多语言路由。
- 新交互必须渐进增强：核心内容和导航在 JavaScript 失败时仍应可访问。
- 全局搜索覆盖五类内容，并必须继续支持 `⌘K`、`Ctrl+K`、Esc、焦点返回和无 Pagefind 时的基本导航退化。

## 设计与可访问性

- 视觉方向固定为 `Editorial × Software`：暖白背景、墨色正文、单一陶土强调色、高信息密度、弱边框和克制动效。
- 不使用大型营销 Hero、赛博朋克渐变、重玻璃拟态、过量阴影或大面积装饰图片。
- V1 必须支持系统深色模式、320px 起的响应式布局、键盘操作、可见焦点、`prefers-reduced-motion` 和 WCAG 2.2 AA 对比度。
- 页面修改必须同时检查桌面端与移动端，不得以隐藏核心内容解决窄屏布局问题。
- 设计 token、组件状态和交互规则以 [`docs/DESIGN.md`](docs/DESIGN.md) 为准。

## 内容与自动化

- AI 或每日资讯内容必须保留可核验的直接来源，清楚区分事实、来源观点和 TinyWall/AI 的归纳推断。
- 不复制受版权保护的全文或大段原文；使用简短转述并链接原始来源。
- 草稿、示例和真实发布内容必须醒目标识。`draft` 内容不得进入公开页面、搜索、RSS 或 sitemap。
- 自动化不得直接提交 `main`。目标流程为生成分支和 PR，通过 schema、构建和人工来源审核后再合并。
- 详细内容契约和失败处理以 [`docs/CONTENT_AND_AUTOMATION.md`](docs/CONTENT_AND_AUTOMATION.md) 为准。

## Git 与文档同步

- Git 推送优先使用 SSH：`git@github.com:tinywall27/tinywall-home.git`。
- 使用功能分支或自动化分支提交 PR；`main` 是生产分支。
- 保留用户已有改动，不做与当前任务无关的格式化、重构或依赖升级。
- 功能、路由、schema、开发命令或发布流程发生变化时，必须在同一变更中更新 README、贡献说明和对应 `docs/` 规范。
- 完成工作前检查 `git diff --check`、内部文档链接以及工作树范围，确认没有意外修改运行代码或生成文件。
