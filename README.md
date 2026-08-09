# TinyWall Home

[tinywall.cc](https://tinywall.cc) 的源码仓库。TinyWall 是个人日常使用优先、公开访问友好的 Personal Information Hub / Personal OS：把当天资讯、每日阅读、个人项目、常用链接和长期笔记放在一个安静、可搜索的入口中。

## 当前能力

| 领域 | 已实现 |
| --- | --- |
| Today | 日期、Today Intelligence、Daily Read、Quick Links、Projects、Recent Notes |
| 内容 | Articles、Notes、外部 Reading、Topics 和跨内容类型 Archive |
| 项目与链接 | 集中、类型化的 Projects 与分类 Links 数据 |
| 搜索 | 覆盖五类内容的 `⌘K` / `Ctrl+K` 命令面板，以及 Pagefind 正文搜索 |
| 外观 | 暖白克制的 `Editorial × Software`、顶部五项导航、系统深色模式和 320px 响应式 |
| 数据与状态 | Astro 静态内容；无账号、数据库或个人状态持久化 |
| 质量门 | 内容契约、类型检查、静态构建、Pagefind、站内链接和 PR workflow |

AI 采集、摘要和自动开 PR 尚未实现；当前仓库只提供经过核验的示例内容、内容 schema 和发布质量门。完整边界见[内容与自动化规范](docs/CONTENT_AND_AUTOMATION.md)。

## 技术栈

- Astro 7 静态站点
- TypeScript strict mode
- Astro Content Collections 与 MDX
- 原生 JavaScript 命令面板和渐进增强
- Pagefind 中文全文索引
- RSS 与 sitemap
- GitHub Actions PR 质量检查
- Cloudflare Pages 发布

## 本地开发

需要 Node.js 22.12 或更高版本。JavaScript/TypeScript 依赖固定使用 npm；UV 仅用于未来可能加入的 Python 辅助工具。

```bash
npm install
```

开发服务器必须使用后台模式：

```bash
npm run dev
astro dev status
astro dev logs
astro dev stop
```

常用检查：

```bash
npm run validate       # 内容契约和文档内部链接
npm run validate:scripts # 原生浏览器脚本语法
npm run check          # Astro 类型检查
npm run build          # 校验 + Astro build + Pagefind
npm run quality        # build + 构建后站内链接检查
```

提交前运行 `npm run quality`。受限环境若遇到 Astro 遥测目录权限问题，应关闭遥测：

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run quality
```

静态输出目录为 `dist`。

## 项目结构

```text
.github/workflows/     Pull Request 与 main 质量检查
scripts/               内容与构建后站点验证
src/components/        Astro UI 组件
src/content/           Articles、Notes、Reading 内容
src/data/              导航、主题、项目、链接与站点元数据
src/layouts/           页面布局
src/lib/               内容读取、聚合、校验与格式化逻辑
src/pages/             Astro 文件路由
src/styles/            tokens、全站外壳和内容页面样式
public/                品牌资源与原生浏览器脚本
templates/             内容模板
docs/                  产品、架构、设计和自动化规范
```

## 内容维护

### Articles

1. 复制 `templates/article.md` 到 `src/content/articles/`。
2. 使用小写字母、数字和连字符命名文件，例如 `my-article.md`；文件名/Astro entry id 即 canonical slug。
3. 不添加 frontmatter `slug` 字段。
4. 从 `src/data/topics.ts` 中选择主题 ID。
5. 写作期间保持 `draft: true`，准备发布时改为 `false`。
6. 事实性或 AI 辅助内容填写可核验的 `sources`。
7. 运行 `npm run quality`。

已发布文件名和 URL 不得随意修改；确需修改时必须同时提供重定向并修复内部链接。

### Notes 与 Reading

- Notes 保存自己的短笔记，并生成 `/notes/[entry-id]/` 详情页。
- Reading 保存外部内容的 canonical URL、来源、摘要和推荐理由，站内不复制第三方全文。
- Reading 条目直接打开原始来源，不生成本地详情页。
- 两类内容的字段契约见[架构规范](docs/ARCHITECTURE.md)和[内容规范](docs/CONTENT_AND_AUTOMATION.md)。

Projects、Links、导航和站点元数据分别维护在 `src/data/` 的集中数据文件中，不得在页面重复硬编码。

## 内容与发布流程

- 手工内容、Agent 生成内容和未来自动化内容都通过功能分支或自动化分支提交 PR。
- `.github/workflows/quality.yml` 会在 PR 和 `main` 上使用锁定依赖运行完整质量门。
- AI Daily Reading 自动化不得直接推送 `main`；未来实现必须创建 PR，并由人核对来源、摘要与版权风险。
- PR 合并到 `main` 后，由 Cloudflare Pages 生成生产站点。
- 当前尚无采集器、定时任务、AI 凭据或自动开 PR 脚本，不应把质量 workflow 描述为内容生成自动化。

## Cloudflare Pages

- Project name：`tinywall-home`
- Production branch：`main`
- Build command：`npm run build`
- Output directory：`dist`
- Custom domain：`tinywall.cc`

Cloudflare Pages 的平台配置位于仓库外。功能分支和 PR 可用于预览；生产发布以平台实际配置为准。

## 文档索引

- [Agent 开发约束](AGENTS.md)
- [产品规范](docs/PRODUCT.md)
- [架构规范](docs/ARCHITECTURE.md)
- [设计规范](docs/DESIGN.md)
- [内容与自动化规范](docs/CONTENT_AND_AUTOMATION.md)
- [贡献说明](CONTRIBUTING.md)

## 内容授权

本仓库暂未添加开源许可证。除非另有明确说明，仓库中的文章与其他内容不授予复制、再发布或商业使用许可。
