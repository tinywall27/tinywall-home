# TinyWall 架构规范

> 状态：当前 V1 架构记录。AI 采集、调度和自动开 PR 不属于当前已实现架构。

## 当前架构

TinyWall 当前是 Astro 7 静态站点：

- TypeScript strict mode；
- Astro Content Collections + Markdown/MDX；
- `@astrojs/rss`、`@astrojs/sitemap` 和 Pagefind；
- 纯 Astro 组件和少量原生 JavaScript，无 UI 框架；
- 无后端、数据库和认证；
- Articles、Notes、Reading 三个内容集合；
- 集中的导航、Projects、Links、Topics 和站点元数据；
- 五类命令搜索、Today 构建期聚合和跨内容类型 Topics/Archive；
- GitHub Actions PR 质量检查；
- `npm run build` 生成 `dist`，由 Cloudflare Pages 发布。

当前没有 AI 采集器、定时调度、自动摘要或自动开 PR 实现。

## 架构原则

1. **静态优先**：所有公共页面应在构建期生成，核心体验不依赖服务端运行时。
2. **数据优先**：可重复内容来自集中且有类型的数据源，页面负责组合，不保存第二份业务数据。
3. **渐进增强**：命令面板、筛选和主题切换可以使用客户端 JavaScript，但核心内容与链接在脚本失败时仍可访问。
4. **稳定 URL**：公开 URL 是兼容接口；迁移不能静默破坏已有链接、RSS 或搜索索引。
5. **最少依赖**：优先使用 Astro 和浏览器标准能力，只有明确收益超过维护成本时才新增依赖。
6. **当前与目标分离**：规范中的目标模型不能被描述成当前已经存在。

## 当前数据源

V1 使用五类内容，Today 是构建期聚合视图，不建立第六份重复集合。

### Articles

自写长文和综合编辑稿，继续使用 Astro content collection。最低字段为：

- `title`、`description`、`publishedAt`；
- 可选 `updatedAt`；
- `topics`、`lang`、`draft`、`featured`；
- 受控的可选 `series`；
- 事实性或 AI 辅助内容使用 `sources`；
- Markdown/MDX 正文。

文件名/Astro entry id 是 canonical slug。冗余 frontmatter `slug` 已从 schema、模板和现有内容中移除，源校验会阻止它重新出现。现有 `/articles/[entry-id]/` URL 保持不变；未来确需改名的已发布内容必须提供重定向。

### Notes

自己的短笔记和持续记录，使用独立 content collection。最低字段为：

- `title`、`publishedAt`、可选 `updatedAt`；
- `topics`、`lang`、`draft`；
- 可选 `description` 和 `sources`；
- Markdown/MDX 正文。

Notes 使用文件名作为 slug，并生成 `/notes/[slug]/` 详情页。

### Reading

外部文章、研究和报告的精选索引，使用独立 content collection。最低字段为：

- `title`、canonical `url`、`source`；
- 可选的来源发布时间 `publishedAt`；
- TinyWall 收录日期 `curatedAt`；
- 原创 `summary` 和 `reason`；
- `topics`、可选 `readingMinutes`；
- `featured`、`draft`。

Reading V1 只生成列表和搜索元数据，不生成本地详情页。点击条目打开 canonical external URL。

### Projects

个人项目使用单一、类型化的中央数据文件。最低字段为：

- 稳定 `id`、`title`、`description`；
- `status`、`tags`、`order`；
- 可选的公开 `url` 和 `repository`；尚未上线的项目保留站内锚点，不得发布失效外链。

首页、Projects 页面、导航和命令面板必须读取同一数据源。

### Links

常用网址使用单一、类型化的中央数据文件。最低字段为：

- 稳定 `id`、`title`、`url`、`category`；
- 可选 `description`；
- `order`。

分类和条目顺序必须由数据定义，不在组件中重复维护。

### Shared configuration

主题、主导航、次级导航和站点元数据各自只能有一个集中配置源。Articles、Notes 和 Reading 共用受控 topic ID，未知 topic 必须在构建期失败。

## 路由契约

| 路由 | 状态 | 数据来源 |
| --- | --- | --- |
| `/` | 保留并重构 | 五类数据的 Today 聚合 |
| `/reading/` | 已实现 | Reading + Articles 入口 |
| `/projects/` | 已实现 | Projects 数据 |
| `/links/` | 已实现 | Links 数据 |
| `/notes/`、`/notes/[slug]/` | 已实现 | Notes collection |
| `/articles/`、`/articles/[slug]/` | 保留 | Articles collection |
| `/topics/`、`/topics/[topic]/` | 保留并扩展 | 共享 topics 与日期型内容 |
| `/archive/`、`/archive/[year]/` | 保留并扩展 | Articles、Notes、Reading |
| `/rss.xml` | 保留 | V1 继续发布 TinyWall 自写内容 |

`/rss.xml` 在 V1 继续以 Articles 为主，并可加入公开 Notes；外部 Reading 不进入该 Feed，避免把第三方内容误认为 TinyWall 发布内容。若未来增加 Reading Feed，应使用独立 URL 和明确标题。

`/now/` 与 `/about/` 属于第二阶段，不在 V1 创建。

## Today 数据流

Today 在构建期读取并排序五类数据：

```text
Articles / Notes / Reading / Projects / Links
                         ↓
                  build-time selectors
                         ↓
    Intelligence / Daily Read / Quick Links / Projects / Recent Notes
```

- Today 不复制条目内容，只保存展示规则。
- 当天 Reading 不足时，可显示最近一次有效精选，但必须显示真实日期。
- `featured` 或排序字段只能影响展示，不能改变 canonical 数据。
- 项目、链接和内容选择逻辑应放在可测试的辅助函数中，不散落在页面模板里。

## 搜索与命令面板

V1 搜索覆盖 Articles、Notes、Reading、Projects 和 Links：

- 本地页面正文继续由 Pagefind 索引；
- 外部 Reading、Projects 和 Links 通过构建期生成的轻量静态索引加入命令面板；
- 每个结果包含类型、标题、简短说明、目标 URL 和可搜索关键词；
- 本地结果在站内打开，外部结果使用安全的新窗口策略或明确的外链提示；
- 支持 `⌘K`、`Ctrl+K`、Esc、上下键、Enter、焦点捕获和关闭后焦点返回；
- JavaScript 或 Pagefind 不可用时，用户仍能通过五个页面和原生页面链接找到内容。

## 样式与客户端代码

- 语义化 design tokens、全站外壳/命令面板、内容页面样式已按职责拆分；新增样式继续进入对应文件，不得重新堆回单一全局文件。
- 客户端代码保持原生、模块化并按需加载；不为简单筛选或对话框引入完整 UI 框架。
- 系统深色模式使用 CSS `prefers-color-scheme`。V1 不使用 localStorage 持久化主题或其他个人状态。
- 所有交互都必须提供语义 HTML、键盘路径、焦点管理和减少动效行为。

## 构建、部署与失败行为

- npm 是 Node 项目的唯一包管理器；`package-lock.json` 必须随依赖变化更新。
- UV 仅管理未来 Python 自动化环境，相关文件应与 Node 依赖边界清晰分离。
- `npm run quality` 是提交前完整质量门，包含内容契约、原生浏览器脚本语法、Astro check、静态构建、Pagefind 和构建后站内链接检查。
- `main` 是生产分支；功能和自动化变更先进入 PR。
- `.github/workflows/quality.yml` 在 PR 和 `main` 上使用锁定依赖运行质量门；它不生成内容。
- Cloudflare Pages 配置位于仓库外，代码不得假设平台中未被验证的环境变量或服务绑定。
- schema 无效、来源缺失、重复 ID、未知 topic、内部链接错误或构建失败时，不得发布相关内容。
