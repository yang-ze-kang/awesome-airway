#!/usr/bin/env python3
"""Awesome Airway — GitHub 实时更新脚本。

用途:
  1. 通过 GitHub Search API 拉取气道分割/建模相关的最新仓库,
     去重、按 star/更新时间排序, 写入 data.generated.json。
  2. 读取 data.js 中 PAPERS/TOOLS 里带 code 链接的仓库, 刷新其 star 数与
     最近提交时间, 供人工核对是否需要更新综述。

无需第三方依赖 (只用标准库)。设置环境变量 GITHUB_TOKEN 可将匿名 60 次/小时
的速率上限提升到 5000 次/小时。

用法:
  export GITHUB_TOKEN=ghp_xxx        # 可选但强烈建议
  python update_repos.py             # 生成 data.generated.json
  python update_repos.py --print     # 仅打印, 不写文件
"""
import os
import re
import sys
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
API = "https://api.github.com"

# 与前端 data.js 的 GH_QUERIES 保持一致的检索式 (union 后去重)。
QUERIES = [
    "airway segmentation in:name,description,readme",
    "airway tree modeling in:name,description,readme",
    "bronchus segmentation in:name,description,readme",
    "airway labeling in:name,description,readme",
    "bronchoscopy navigation in:name,description,readme",
    "airway centerline in:name,description,readme",
    "pulmonary airway in:name,description,readme language:Python",
    "airway topic:medical-image-segmentation",
]


def _headers():
    h = {"Accept": "application/vnd.github+json",
         "User-Agent": "awesome-airway-updater"}
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        h["Authorization"] = "Bearer " + tok
    return h


def _get(url):
    """带最简单的速率处理的 GET。返回 (json, headers)。"""
    req = urllib.request.Request(url, headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8")), dict(r.headers)
    except urllib.error.HTTPError as e:
        if e.code == 403 and e.headers.get("x-ratelimit-remaining") == "0":
            reset = int(e.headers.get("x-ratelimit-reset", "0"))
            wait = max(1, reset - int(time.time())) + 2
            print(f"  · 速率上限用尽, 等待 {wait}s …", file=sys.stderr)
            time.sleep(min(wait, 90))
            return _get(url)
        print(f"  ! HTTP {e.code} for {url}", file=sys.stderr)
        return {}, dict(e.headers)
    except Exception as e:  # noqa: BLE001
        print(f"  ! 请求失败 {url}: {e}", file=sys.stderr)
        return {}, {}


def search_repos(query, per_page=30):
    q = urllib.parse.quote(query)
    url = f"{API}/search/repositories?q={q}&sort=updated&order=desc&per_page={per_page}"
    data, _ = _get(url)
    return data.get("items", []) or []


def slim(repo):
    return {
        "full_name": repo.get("full_name"),
        "html_url": repo.get("html_url"),
        "description": (repo.get("description") or "").strip(),
        "stargazers_count": repo.get("stargazers_count", 0),
        "language": repo.get("language"),
        "pushed_at": repo.get("pushed_at"),
        "forks_count": repo.get("forks_count", 0),
        "topics": repo.get("topics", []),
    }


def discover():
    """跑所有查询, 按 full_name 去重, 按 star 降序。"""
    seen, out = {}, []
    for q in QUERIES:
        print(f"· 检索: {q}", file=sys.stderr)
        for repo in search_repos(q):
            fn = repo.get("full_name")
            if not fn or fn in seen or repo.get("fork"):
                continue
            seen[fn] = True
            out.append(slim(repo))
        time.sleep(2)  # 温和一点, 避免二级速率限制
    out.sort(key=lambda r: r["stargazers_count"], reverse=True)
    return out


def refresh_known():
    """从 data.js 抓取所有 github.com 链接, 刷新 star / 最近提交。"""
    path = os.path.join(HERE, "data.js")
    if not os.path.exists(path):
        return []
    txt = open(path, encoding="utf-8").read()
    repos = sorted(set(re.findall(r"github\.com/([\w.-]+/[\w.-]+)", txt)))
    out = []
    for full in repos:
        full = full.rstrip("/").removesuffix(".git")
        if full.count("/") != 1:
            continue
        data, _ = _get(f"{API}/repos/{full}")
        if data.get("full_name"):
            out.append(slim(data))
        time.sleep(0.5)
    out.sort(key=lambda r: r["stargazers_count"], reverse=True)
    return out


def main():
    print_only = "--print" in sys.argv
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    print(f"Awesome Airway updater — {now}", file=sys.stderr)

    result = {
        "generated_at": now,
        "discovered": discover(),
        "known": refresh_known(),
    }
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if print_only:
        print(payload)
        return
    out_path = os.path.join(HERE, "data.generated.json")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✓ 写入 {out_path}: "
          f"{len(result['discovered'])} 个发现仓库, "
          f"{len(result['known'])} 个已知仓库刷新。", file=sys.stderr)


if __name__ == "__main__":
    main()
