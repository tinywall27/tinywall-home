# TinyWall Home

[tinywall.cc](https://tinywall.cc) 的源码仓库。它是一个连接重要项目、文章与每日阅读的个人知识门户，使用 Astro 构建并由 Cloudflare Pages 发布。

## 本地运行

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

发布前检查：

```bash
npm run build
```

构建会依次完成类型检查、静态页面生成和 Pagefind 中文全文索引。输出目录为 `dist`。

## 新增文章

1. 复制 `templates/article.md` 到 `src/content/articles/`。
2. 修改文件名和 frontmatter；`slug` 必须唯一，只使用小写字母、数字和连字符。
3. 从 `src/data/topics.ts` 中选择主题 ID。
4. 写作期间保持 `draft: true`，准备发布时改为 `false`。
5. 运行 `npm run build`。无效日期、未知主题、重复 slug 或错误来源链接会阻止发布。

AI Daily Brief 使用固定的 `series: ai-daily-brief`。未来自动化只需生成同样格式的 Markdown 文件并提交到 `main`，Cloudflare Pages 会完成后续发布。

## Cloudflare Pages

- Project name：`tinywall-home`
- Production branch：`main`
- Build command：`npm run build`
- Output directory：`dist`
- Custom domain：`tinywall.cc`

功能分支和 Pull Request 用于预览，正式内容合并到 `main` 后自动上线。

## 内容授权

本仓库暂未添加开源许可证。除非另有明确说明，仓库中的文章与其他内容不授予复制、再发布或商业使用许可。
