# Awesome Airway 🫁

> A curated survey / awesome-list of **pulmonary airway analysis** from chest CT —
> segmentation, topology & connectivity, anatomical branch labeling, bronchoscopy navigation, datasets & challenges.

<p align="center">
  <a href="https://yang-ze-kang.github.io/awesome-airway/#overview">
    <img src="https://img.shields.io/badge/🌐_Live_Website-Awesome_Airway-4a90d9?style=for-the-badge" alt="Live Website">
  </a>
</p>

<p align="center">
  <b>🌐 <a href="https://yang-ze-kang.github.io/awesome-airway/#overview">yang-ze-kang.github.io/awesome-airway</a></b>
  &nbsp;·&nbsp;
  <a href="#-中文说明">中文说明</a>
</p>

A **zero-dependency static website** that broadly curates key papers and open-source repositories on airway segmentation, topology/connectivity, anatomical branch labeling, and bronchoscopy navigation, with **built-in live GitHub search** to pull the latest repos at any time. Challenges such as the ATM series (ATM'22 → ATM26) are included as one section rather than the site's focus.

## Features

- 📚 **Methods survey** — searchable cards grouped by *Segmentation / Topology / Labeling / Transformer·SSM / Navigation / Datasets*, with arXiv / DOI / code links.
- 🧭 **Overview** — tasks, technical threads, category quick-view, and evaluation metrics at a glance.
- 🌐 **Bilingual** — one-click 中文 / English toggle across the whole site.
- 🔍 **Live GitHub search** — the browser calls the GitHub Search API directly, with preset queries; add a token to raise the rate limit.
- 🛠 **Data & tools** — ATM26 / ATM'22 / AeroPath / EXACT'09 / LIDC-IDRI datasets and common frameworks.
- 🏆 **Challenges** — ATM26 / ATM'22 / AIIB23 / EXACT'09 and related airway challenges.
- 🔄 **Auto-update script** — `update_repos.py` discovers new repos via the GitHub API and refreshes stars / push time of listed repos.

## Quick start

```bash
# Option 1: any static server (recommended — live search is not blocked by CORS)
cd awesome-airway
python3 -m http.server 8000
# open http://localhost:8000

# Option 2: just open index.html
# (the survey works; live GitHub search may be restricted under file://)
```

Or simply visit the deployed site: **https://yang-ze-kang.github.io/awesome-airway/#overview**

## Refresh the latest papers / repos

```bash
export GITHUB_TOKEN=ghp_xxx        # optional, raises the rate limit 60 → 5000 /hr
python3 update_repos.py            # writes data.generated.json
python3 update_repos.py --print    # print only, no file write
```

`data.generated.json` structure:
```json
{
  "generated_at": "2026-07-07 ...",
  "discovered": [ { "full_name": "...", "stargazers_count": 0, "pushed_at": "...", ... } ],
  "known":      [ /* latest stars/push of repos already in data.js */ ]
}
```

You can also use the **"Live GitHub" tab** on the website to run preset queries and sort by stars / recency, no script needed.

## Project structure

```
awesome-airway/
├── index.html          # page structure (Overview / Methods / Live GitHub / Data / Challenges / Contribute)
├── style.css           # dark GitHub-flavoured theme + i18n toggle rules
├── app.js              # front-end engine: rendering, i18n, live GitHub search
├── data.js             # ★ curated dataset (papers/tools/timeline/queries) — add entries here
├── update_repos.py     # GitHub API updater
├── data.generated.json # script output (auto-discovered repos)
├── .github/workflows/  # GitHub Pages deploy workflow
└── README.md
```

## Contribute / add a paper

Edit the `PAPERS` array in `data.js` and append an entry. Text fields (`title`, `idea`, `name`, `desc`, `label`) accept either a plain string or a `{ zh, en }` object for bilingual display:

```js
{
  title: "Paper title",
  authors: "First et al.",
  year: 2025,
  venue: "MICCAI",
  category: "topology",     // segmentation | topology | labeling | transformer | navigation | dataset
  idea: { zh: "一句话核心思想", en: "One-line key idea" },
  arxiv: "2412.11039",       // or null
  doi:   "10.xxxx/xxxx",     // or null
  code:  "https://github.com/...", // or null
  star:  false               // set true to mark a landmark method
}
```

## Data accuracy

The survey is compiled from automated search plus manual curation. Fields marked `// [unverified]` in `data.js` (a few DOIs, authors, repo–paper mappings) should be checked against the original arXiv / DOI page before citing. Always cite the original papers.

## Related lists

- [EndoluminalSurgicalVision-IMR/ATM-22-Related-Work](https://github.com/EndoluminalSurgicalVision-IMR/ATM-22-Related-Work) — the master index of airway-modeling papers/code (main seed of this site).

---

## 🀄 中文说明

> 胸部 CT **肺气道分析**方法精选综述 & awesome-list —— 覆盖气道分割、拓扑连通、解剖分支标注、支气管镜导航、数据集与挑战赛。

**🌐 在线站点：<https://yang-ze-kang.github.io/awesome-airway/#overview>**

一个**零依赖的静态网站**：广泛整理气道分割、拓扑连通性、解剖分支标注、支气管镜导航等方向的关键论文与开源仓库，并内置**实时 GitHub 检索**，可随时拉取该领域最新发布的仓库。ATM 系列（ATM'22 → ATM26）等挑战赛作为其中一个板块收录，而非全站焦点。

### 特性

- 📚 **方法综述**：按「分割 / 拓扑连通 / 解剖标注 / Transformer·SSM / 导航 / 数据集」分类的可搜索卡片，含 arXiv / DOI / 代码链接。
- 🧭 **概览**：任务、技术脉络、方向速览与评价指标一览。
- 🌐 **中英双语**：全站一键切换 中文 / English。
- 🔍 **实时 GitHub 检索**：浏览器直连 GitHub Search API，预设多组查询，可填 Token 提额度。
- 🛠 **数据与工具**：ATM26 / ATM'22 / AeroPath / EXACT'09 / LIDC-IDRI 等数据集与常用框架。
- 🏆 **挑战赛**：ATM26 / ATM'22 / AIIB23 / EXACT'09 等气道相关挑战赛。
- 🔄 **自动更新脚本**：`update_repos.py` 通过 GitHub API 发现新仓库并刷新已收录仓库的 star / 提交时间。

### 快速开始

```bash
# 方式一：任意静态服务器（推荐，实时检索不受 CORS 限制）
cd awesome-airway
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000

# 方式二：直接访问已部署站点
# https://yang-ze-kang.github.io/awesome-airway/#overview
```

### 实时更新最新论文/仓库

```bash
export GITHUB_TOKEN=ghp_xxx        # 可选，把速率从 60→5000 次/小时
python3 update_repos.py            # 生成 data.generated.json
python3 update_repos.py --print    # 只打印不写文件
```

也可以直接在**网页的「实时检索 / Live GitHub」标签页**里选预设查询、按 star / 更新时间排序，无需运行脚本。

### 贡献 / 添加一篇论文

编辑 `data.js` 里的 `PAPERS` 数组，追加一条。文本字段（`title` / `idea` / `name` / `desc` / `label`）可写普通字符串，也可写 `{ zh, en }` 对象实现中英双语：

```js
{
  title: "论文标题",
  authors: "First et al.",
  year: 2025,
  venue: "MICCAI",
  category: "topology",     // segmentation | topology | labeling | transformer | navigation | dataset
  idea: { zh: "一句话核心思想", en: "One-line key idea" },
  arxiv: "2412.11039",       // 或 null
  doi:   "10.xxxx/xxxx",     // 或 null
  code:  "https://github.com/...", // 或 null
  star:  false               // 标为该方向代表作则设 true
}
```

### 数据准确性说明

综述数据由自动检索 + 人工整理而成。`data.js` 中带 `// [unverified]` 注释的字段（个别 DOI、作者、仓库-论文对应关系）建议发布前对照原始 arXiv / DOI 页面核对。引用请以论文原文为准。

---
For research reference only; please cite the original papers. · 仅供学术参考，引用请以原文为准。
