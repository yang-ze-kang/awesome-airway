# Awesome Airway 🫁

> 胸部 CT **肺气道分析**方法精选综述 & awesome-list
> A curated survey / awesome-list of **pulmonary airway analysis** from chest CT.

一个**零依赖的静态网站**：广泛整理气道分割、拓扑连通性、解剖分支标注、支气管镜导航等方向的关键论文与开源仓库，并内置**实时 GitHub 检索**，可随时拉取该领域最新发布的仓库。ATM 系列（ATM'22 → ATM26）等挑战赛作为其中一个板块收录，而非全站焦点。

## 特性

- 📚 **方法综述**：按「分割 / 拓扑连通 / 解剖标注 / Transformer·SSM / 导航 / 数据集」分类的可搜索卡片，含 arXiv / DOI / 代码链接。
- 🧭 **概览**：任务、技术脉络、方向速览与评价指标一览。
- 🔍 **实时 GitHub 检索**：浏览器直连 GitHub Search API，预设多组查询，可填 Token 提额度。
- 🛠 **数据与工具**：ATM26 / ATM'22 / AeroPath / EXACT'09 / LIDC-IDRI 等数据集与常用框架。
- 🏆 **挑战赛**：ATM26 / ATM'22 / AIIB23 / EXACT'09 等气道相关挑战赛。
- 🔄 **自动更新脚本**：`update_repos.py` 通过 GitHub API 发现新仓库并刷新已收录仓库的 star / 提交时间。

## 快速开始

```bash
# 方式一：任意静态服务器（推荐，实时检索不受 CORS 限制）
cd awesome-airway
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000

# 方式二：直接双击 index.html
# （方法综述正常；实时 GitHub 检索在 file:// 下可能受浏览器限制）
```

## 实时更新最新论文/仓库

```bash
export GITHUB_TOKEN=ghp_xxx        # 可选，把速率从 60→5000 次/小时
python3 update_repos.py            # 生成 data.generated.json
python3 update_repos.py --print    # 只打印不写文件
```

`data.generated.json` 结构：
```json
{
  "generated_at": "2026-07-07 ...",
  "discovered": [ { "full_name": "...", "stargazers_count": 0, "pushed_at": "...", ... } ],
  "known":      [ /* data.js 中已收录仓库的最新 star/提交 */ ]
}
```

也可以直接在**网页的「实时检索」标签页**里选预设查询、按 star / 更新时间排序，无需运行脚本。

## 目录结构

```
awesome-airway/
├── index.html          # 页面结构（挑战赛 / 方法 / 实时检索 / 数据 / 贡献）
├── style.css           # 深色 GitHub 风格样式
├── app.js              # 前端引擎：渲染 + 实时 GitHub 检索
├── data.js             # ★ 精选数据集（论文/工具/时间线/查询式）— 在此增删条目
├── update_repos.py     # GitHub API 更新脚本
├── data.generated.json # 脚本产物（自动发现的最新仓库）
└── README.md
```

## 贡献 / 添加一篇论文

编辑 `data.js` 里的 `PAPERS` 数组，追加：

```js
{
  title: "论文标题",
  authors: "First et al.",
  year: 2025,
  venue: "MICCAI",
  category: "topology",     // segmentation | topology | labeling | transformer | navigation | dataset
  idea: "一句话核心思想",
  arxiv: "2412.11039",       // 或 null
  doi:   "10.xxxx/xxxx",     // 或 null
  code:  "https://github.com/...", // 或 null
  star:  false               // 标为该方向代表作则设 true
}
```

## 数据准确性说明

综述数据由自动检索 + 人工整理而成。`data.js` 中带 `// [unverified]` 注释的字段（个别 DOI、作者、仓库-论文对应关系）建议发布前对照原始 arXiv / DOI 页面核对。引用请以论文原文为准。

## 相关精选列表

- [EndoluminalSurgicalVision-IMR/ATM-22-Related-Work](https://github.com/EndoluminalSurgicalVision-IMR/ATM-22-Related-Work) — 气道建模文献/代码主索引（本站主要种子来源）

---
本项目为 ATM26 研究配套资料，仅供学术参考。
