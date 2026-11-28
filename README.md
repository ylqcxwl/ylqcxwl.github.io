# ylqcxwl.github.io

个人静态主页。

## 添加工具

- **本地 HTML 工具**：把 `.html` 文件放进 `tools/` 目录，推送到 `main` 后 GitHub Actions 会自动扫描并更新工具页。
- **外部网站**：在 `tools/sites.json` 的 `sites` 数组里添加一项：
  ```json
  { "name": "网站名称", "url": "https://example.com", "desc": "一句话说明（可选）" }
  ```
  推送后自动更新，图标自动取自该站点的 `favicon.ico`（取不到时显示名称首字）。
- 自动生成结果写在 `JS/tools-data.js`，本地手动生成可运行：
  ```bash
  python3 scripts/generate_tools.py
  ```

以 `_` 开头的 HTML 文件、以及自动跳转页不会被收录。
