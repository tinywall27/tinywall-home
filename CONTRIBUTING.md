# 内容与代码贡献说明

TinyWall 当前由个人维护。人工与 Agent 修改直接在 `main` 完成；自动化生成内容使用独立分支和 Pull Request，以便在发布前检查来源、构建结果和 Cloudflare Pages 预览。

## 开发流程

1. 在最新 `main` 上进行范围明确的修改，不为日常人工或 Agent 工作创建功能分支。
2. 使用 npm 管理 Node.js 依赖；不要新增其他 JavaScript 包管理器的锁文件。
3. 开发服务使用 `npm run dev`（执行 `astro dev --background`），并通过 `astro dev status|logs|stop` 管理。
4. 只修改当前任务需要的文件；功能、路由或 schema 变化应同步更新相关文档。
5. 运行完整质量门后提交并推送 `main`；只有自动化内容需要创建 PR 并由人审核合并。

Git 推送优先使用 SSH：

```text
ssh://git@ssh.github.com:443/tinywall27/tinywall-home.git
```

## 内容规则

- 一篇文章对应一个 Markdown 或 MDX 文件。
- 文件名/Astro entry id 是 canonical slug；frontmatter 不得添加冗余 `slug` 字段。
- 不修改已发布内容的文件名或 URL；如确需修改，必须同步增加重定向并修复内部链接。
- `description` 应能独立说明内容主题，不使用“点击查看”等空泛文字。
- 主题必须来自 `src/data/topics.ts`；新增主题时同时补充名称和简介。
- `draft: true` 的内容不得出现在公开页面、搜索或 sitemap 中。
- `lang` 当前只是内容元数据，不表示网站已具备完整多语言路由。
- 示例、草稿和真实发布内容必须明确标注，避免示例信息被误认为事实。

## AI 与外部来源

- AI 生成或辅助生成的事实性内容必须提供可核验的直接来源；优先使用官方公告、原始研究、监管文件和一手报道。
- 清楚区分已核实事实、来源中的观点和 TinyWall/AI 的分析推断。
- 不伪造作者、日期、数字、引文或链接。无法核实的内容应删除或保留为草稿。
- 不复制付费文章或其他受版权保护内容的全文和大段原文；使用必要的短引文、原创转述和原始链接。
- 自动化应先去重和校验，再创建 PR；不得直接提交 `main`。
- PR 描述应列出主要来源、生成日期、已知限制和人工需要重点核对的内容。

详细规则见[内容与自动化规范](docs/CONTENT_AND_AUTOMATION.md)。

## 代码与视觉要求

- 保持 Astro 静态优先和渐进增强；未经明确决策不增加后端、数据库、认证或前端框架。
- 重复内容和导航必须来自集中数据源，不在多个组件重复硬编码。
- 保留现有内容 URL，确保内部链接和搜索仍可工作。
- 新页面在 320px、常见平板宽度和桌面宽度下都应可用。
- 检查键盘导航、可见焦点、语义 HTML、WCAG AA 对比度和 `prefers-reduced-motion`。
- 视觉更改遵循[设计规范](docs/DESIGN.md)，不重新引入大型 Hero 或装饰性信息噪声。

## 提交前检查

运行完整质量门：

```bash
npm run quality
git diff --check
```

受限环境如因 Astro 遥测目录权限失败，应为相关 Astro 命令关闭遥测，例如：

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run quality
```

同时确认：

- 构建、内容校验和 Pagefind 索引成功；
- 新增或修改的文档内部链接可达；
- 提交不包含无关格式化、生成文件或依赖升级；
- 目标能力没有被描述成当前已经上线。
