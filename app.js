/* Awesome Airway — front-end engine.
   Renders the curated survey from data.js and runs live GitHub repo search.
   No build step, no backend: open index.html directly or serve statically. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const D = window.AWESOME_AIRWAY || {};
  const PAPERS = D.PAPERS || [];
  const CATS = D.CATEGORIES || {};
  const TIMELINE = D.TIMELINE || [];
  const OFFICIAL = D.OFFICIAL_REFS || [];
  const DATASETS = D.DATASETS || [];
  const TOOLS = D.TOOLS || [];
  const CHALLENGES = D.CHALLENGES || [];
  const GH_QUERIES = D.GH_QUERIES || [];

  // ---- i18n ---------------------------------------------------------------
  let LANG = "zh";
  try { LANG = localStorage.getItem("aa_lang") === "en" ? "en" : "zh"; } catch (e) {}
  // pick(v): v may be a plain string (shown in both langs) or {zh, en}.
  const pick = (v) => {
    if (v && typeof v === "object" && ("zh" in v || "en" in v)) return v[LANG] || v.zh || v.en || "";
    return v == null ? "" : v;
  };
  // Static UI strings (labels not coming from data.js).
  const UI = {
    langBtn:      { zh: "EN", en: "中文" },
    searchPh:     { zh: "搜索标题 / 作者 / 关键词 …", en: "Search title / author / keyword …" },
    countUnit:    { zh: (n, t) => `${n} / ${t} 篇`, en: (n, t) => `${n} / ${t} papers` },
    catUnit:      { zh: (n) => `${n} 篇`, en: (n) => `${n} papers` },
    browseCat:    { zh: "浏览该方向 →", en: "Browse this area →" },
    allFilter:    { zh: (n) => `全部 ${n}`, en: (n) => `All ${n}` },
    noMatch:      { zh: "没有匹配的结果。", en: "No matching results." },
    other:        { zh: "其他", en: "Other" },
    ghSearching:  { zh: (q) => `检索中… ${q}`, en: (q) => `Searching… ${q}` },
    ghEmpty:      { zh: "未找到仓库。换个查询试试。", en: "No repositories found. Try another query." },
    ghStart:      { zh: "点击「搜索」拉取最新仓库，或选择上方的预设查询。", en: "Click Search to fetch the latest repos, or pick a preset query." },
    ghResultInfo: { zh: (tot, n) => `共 ${tot} 个结果，显示前 ${n} 个。`, en: (tot, n) => `${tot} results total, showing top ${n}.` },
    ghRemain:     { zh: (r) => ` · 本小时剩余 API 额度：${r}`, en: (r) => ` · API quota left this hour: ${r}` },
    ghQueryStr:   { zh: "查询串", en: "query" },
    ghUpdated:    { zh: "更新", en: "updated" },
    ghNetErr:     { zh: (m) => `网络请求失败：${m}。若以 file:// 直接打开可能受限，建议用本地服务器访问。`,
                    en: (m) => `Network request failed: ${m}. Opening via file:// may be blocked; serve over a local server instead.` },
    genLabel:     { zh: "数据整理 / generated: ", en: "Generated: " },
  };
  const tf = (key, ...args) => {
    const v = UI[key] && UI[key][LANG] !== undefined ? UI[key][LANG] : (UI[key] ? UI[key].zh : "");
    return typeof v === "function" ? v(...args) : v;
  };

  // ---- tab routing --------------------------------------------------------
  function showTab(name) {
    $$(".tabview").forEach((v) => v.classList.add("hidden"));
    const el = $("#tab-" + name);
    if (el) el.classList.remove("hidden");
    $$("nav.tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    if (history.replaceState) history.replaceState(null, "", "#" + name);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  $$("nav.tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = a.getAttribute("href").slice(1);
    if ($("#tab-" + t)) { e.preventDefault(); showTab(t); }
  }));

  // ---- paper card ---------------------------------------------------------
  function linkChips(p) {
    const out = [];
    if (p.arxiv) out.push(`<a href="https://arxiv.org/abs/${esc(p.arxiv)}" target="_blank" rel="noopener">📄 arXiv:${esc(p.arxiv)}</a>`);
    if (p.doi) out.push(`<a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">🔗 DOI</a>`);
    if (p.url && !p.arxiv && !p.doi) out.push(`<a href="${esc(p.url)}" target="_blank" rel="noopener">🔗 ${LANG === "en" ? "Link" : "链接"}</a>`);
    if (p.code) out.push(`<a class="gh" href="${esc(p.code)}" target="_blank" rel="noopener">⌨ Code</a>`);
    return out.join("");
  }
  function tagChips(p) {
    const c = CATS[p.category];
    const cls = { topology: "topo", labeling: "label", transformer: "tf" }[p.category] || "";
    const tags = [`<span class="t ${cls}">${esc(c ? pick(c.short) : p.category)}</span>`];
    (p.tags || []).forEach((t) => tags.push(`<span class="t">${esc(t)}</span>`));
    return tags.join("");
  }
  function paperCard(p) {
    return `<div class="card${p.star ? " star" : ""}">
      <div class="top"><h3>${esc(pick(p.title))}</h3><span class="yr">${esc(p.year)}</span></div>
      <div class="authors">${esc(p.authors || "")}</div>
      ${p.venue ? `<div class="venue">${esc(p.venue)}</div>` : ""}
      <div class="idea">${esc(pick(p.idea) || "")}</div>
      <div class="tags">${tagChips(p)}</div>
      <div class="links">${linkChips(p)}</div>
    </div>`;
  }

  // ---- methods tab (grouped by category, filterable) ----------------------
  let activeCat = "all", searchTerm = "";
  function renderMethods() {
    const host = $("#methodSections");
    const term = searchTerm.trim().toLowerCase();
    const match = (p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (!term) return true;
      return [pick(p.title), p.title && p.title.en, p.title && p.title.zh, p.authors,
        pick(p.idea), p.venue, (p.tags || []).join(" ")]
        .join(" ").toLowerCase().includes(term);
    };
    const shown = PAPERS.filter(match);
    $("#methodCount").textContent = tf("countUnit", shown.length, PAPERS.length);

    const order = Object.keys(CATS);
    let html = "";
    order.forEach((catKey) => {
      const inCat = shown.filter((p) => p.category === catKey)
        .sort((a, b) => (b.year - a.year) || (b.star - a.star));
      if (!inCat.length) return;
      const c = CATS[catKey];
      html += `<section><div class="section-head"><h2>${esc(pick(c.name))}</h2><span class="tag">${tf("catUnit", inCat.length)}</span></div>
        ${c.desc ? `<p class="section-desc">${esc(pick(c.desc))}</p>` : ""}
        <div class="grid">${inCat.map(paperCard).join("")}</div></section>`;
    });
    // uncategorised fallback
    const rest = shown.filter((p) => !CATS[p.category]);
    if (rest.length) html += `<section><div class="section-head"><h2>${tf("other")}</h2></div>
      <div class="grid">${rest.map(paperCard).join("")}</div></section>`;
    host.innerHTML = html || `<div class="empty">${tf("noMatch")}</div>`;
  }
  function buildFilters() {
    const host = $("#methodFilters");
    const counts = {};
    PAPERS.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    let html = `<span class="chip${activeCat === "all" ? " active" : ""}" data-cat="all">${tf("allFilter", PAPERS.length)}</span>`;
    Object.keys(CATS).forEach((k) => {
      if (!counts[k]) return;
      html += `<span class="chip${activeCat === k ? " active" : ""}" data-cat="${k}">${esc(pick(CATS[k].short))} ${counts[k]}</span>`;
    });
    host.innerHTML = html;
    $$(".chip", host).forEach((chip) => chip.addEventListener("click", () => {
      activeCat = chip.dataset.cat;
      $$(".chip", host).forEach((c) => c.classList.toggle("active", c === chip));
      renderMethods();
    }));
  }
  $("#methodSearch").addEventListener("input", (e) => { searchTerm = e.target.value; renderMethods(); });

  // ---- overview tab -------------------------------------------------------
  function renderOverview() {
    const host = $("#catOverview");
    if (!host) return;
    const counts = {};
    PAPERS.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    host.innerHTML = Object.keys(CATS).map((k) => {
      const c = CATS[k];
      return `<div class="card" data-gotocat="${k}" style="cursor:pointer">
        <div class="top"><h3>${esc(pick(c.name))}</h3><span class="yr">${tf("catUnit", counts[k] || 0)}</span></div>
        <div class="idea">${esc(pick(c.desc) || "")}</div>
        <div class="links"><a data-gotocat="${k}" href="#methods">${tf("browseCat")}</a></div>
      </div>`;
    }).join("");
    $$("[data-gotocat]", host).forEach((el) => el.addEventListener("click", (e) => {
      e.preventDefault();
      const k = el.getAttribute("data-gotocat");
      showTab("methods");
      activeCat = k;
      $$("#methodFilters .chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === k));
      renderMethods();
    }));
  }

  // ---- challenges tab -----------------------------------------------------
  function renderChallenges() {
    const cg = $("#challengeGrid");
    if (cg) cg.innerHTML = CHALLENGES.map(resourceCard).join("") || `<div class="empty">—</div>`;
    $("#timeline").innerHTML = TIMELINE.map((t) =>
      `<li class="${t.done ? "done" : ""}"><div class="d">${esc(t.date)}</div>
       <div class="e">${esc(pick(t.event))}</div>${t.note ? `<div class="n">${esc(pick(t.note))}</div>` : ""}</li>`).join("");
    $("#official-refs").innerHTML = OFFICIAL.map(paperCard).join("");
  }

  // ---- datasets tab -------------------------------------------------------
  function resourceCard(r) {
    const home = LANG === "en" ? "Home" : "主页";
    const paper = LANG === "en" ? "Paper" : "论文";
    return `<div class="card">
      <div class="top"><h3>${esc(pick(r.name))}</h3>${r.year ? `<span class="yr">${esc(r.year)}</span>` : ""}</div>
      <div class="idea">${esc(pick(r.desc) || "")}</div>
      <div class="tags">${(r.tags || []).map((t) => `<span class="t">${esc(t)}</span>`).join("")}</div>
      <div class="links">
        ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">🔗 ${home}</a>` : ""}
        ${r.code ? `<a class="gh" href="${esc(r.code)}" target="_blank" rel="noopener">⌨ Code</a>` : ""}
        ${r.paper ? `<a href="${esc(r.paper)}" target="_blank" rel="noopener">📄 ${paper}</a>` : ""}
      </div></div>`;
  }
  function renderDatasets() {
    $("#datasetGrid").innerHTML = DATASETS.map(resourceCard).join("") || `<div class="empty">—</div>`;
    $("#toolGrid").innerHTML = TOOLS.map(resourceCard).join("") || `<div class="empty">—</div>`;
  }

  // ---- live GitHub search -------------------------------------------------
  const LANG_COLORS = { Python: "#3572A5", "Jupyter Notebook": "#DA5B0B", C: "#555555",
    "C++": "#f34b7d", MATLAB: "#e16737", Cuda: "#3A4E3A", Shell: "#89e051", HTML: "#e34c26" };
  function fmtDate(s) { return s ? s.slice(0, 10) : ""; }
  function repoCard(r) {
    const lang = r.language ? `<span class="lang"><span class="cdot" style="background:${LANG_COLORS[r.language] || "#888"}"></span>${esc(r.language)}</span>` : "";
    return `<div class="repo">
      <div class="rtop"><a class="rname" href="${esc(r.html_url)}" target="_blank" rel="noopener">${esc(r.full_name)}</a>
        <span class="stars">★ ${r.stargazers_count.toLocaleString()}</span></div>
      ${r.description ? `<div class="desc">${esc(r.description)}</div>` : ""}
      <div class="rmeta">${lang}<span>🕒 ${tf("ghUpdated")} ${fmtDate(r.pushed_at)}</span>
        ${r.open_issues_count != null ? `<span>◎ ${r.open_issues_count} issues</span>` : ""}
        ${r.forks_count != null ? `<span>⑂ ${r.forks_count}</span>` : ""}</div>
    </div>`;
  }
  function buildGhQuerySelect() {
    const sel = $("#ghQuery");
    sel.innerHTML = GH_QUERIES.map((q, i) =>
      `<option value="${esc(q.q)}"${i === 0 ? " selected" : ""}>${esc(pick(q.label))}</option>`).join("");
    try {
      const saved = localStorage.getItem("aa_gh_token");
      if (saved) $("#ghToken").value = saved;
    } catch (e) {}
  }
  async function ghSearch() {
    const q = $("#ghQuery").value;
    const sort = $("#ghSort").value;
    const token = $("#ghToken").value.trim();
    try { token ? localStorage.setItem("aa_gh_token", token) : localStorage.removeItem("aa_gh_token"); } catch (e) {}
    const box = $("#ghResults");
    box.innerHTML = `<div class="loading">${tf("ghSearching", `<code>${esc(q)}</code>`)}</div>`;
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=30`;
    if (sort) url += `&sort=${sort}&order=desc`;
    const headers = { Accept: "application/vnd.github+json" };
    if (token) headers.Authorization = "Bearer " + token;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const remain = res.headers.get("x-ratelimit-remaining");
        let msg = (LANG === "en" ? "GitHub API returned " : "GitHub API 返回 ") + res.status;
        if (res.status === 403 && remain === "0") msg += LANG === "en"
          ? ": anonymous rate limit (60/hr) exhausted. Add a Token to raise it to 5000/hr."
          : "：匿名速率上限（60/小时）已用尽。填入 Token 可提升到 5000/小时。";
        else if (res.status === 422) msg += LANG === "en" ? ": invalid query syntax." : "：查询语法有误。";
        box.innerHTML = `<div class="err">${esc(msg)}</div>`;
        return;
      }
      const data = await res.json();
      const items = (data.items || []).filter((r) => !r.fork);
      if (!items.length) { box.innerHTML = `<div class="empty">${tf("ghEmpty")}</div>`; return; }
      box.innerHTML = `<div class="grid">${items.map(repoCard).join("")}</div>`;
      const remain = res.headers.get("x-ratelimit-remaining");
      $("#ghHint").innerHTML = tf("ghResultInfo", data.total_count.toLocaleString(), items.length)
        + (remain ? tf("ghRemain", remain) : "")
        + ` · ${tf("ghQueryStr")}：<code>${esc(q)}</code>`;
    } catch (e) {
      box.innerHTML = `<div class="err">${esc(tf("ghNetErr", e.message))}</div>`;
    }
  }
  $("#ghGo").addEventListener("click", ghSearch);
  $("#ghQuery").addEventListener("change", () => { if ($("#ghResults").querySelector(".grid")) ghSearch(); });

  // ---- re-render everything for the active language -----------------------
  function renderAll() {
    buildFilters(); renderMethods(); renderOverview(); renderChallenges(); renderDatasets(); buildGhQuerySelect();
    $("#methodSearch").placeholder = tf("searchPh");
    if (D.GENERATED_AT) $("#genStamp").textContent = tf("genLabel") + D.GENERATED_AT;
    const btn = $("#langBtn"); if (btn) btn.textContent = tf("langBtn");
    if ($("#ghResults") && !$("#ghResults").querySelector(".grid, .err"))
      $("#ghResults").innerHTML = `<div class="empty">${tf("ghStart")}</div>`;
  }
  function applyLang() {
    document.body.classList.toggle("lang-en", LANG === "en");
    document.documentElement.lang = LANG === "en" ? "en" : "zh";
    try { localStorage.setItem("aa_lang", LANG); } catch (e) {}
    renderAll();
  }

  // ---- badges & boot ------------------------------------------------------
  function boot() {
    $("#badge-papers").textContent = PAPERS.length;
    $("#badge-cats").textContent = Object.keys(CATS).length;
    const withCode = PAPERS.filter((p) => p.code).length + TOOLS.length + DATASETS.filter((d) => d.code).length;
    $("#badge-repos").textContent = withCode;

    const btn = $("#langBtn");
    if (btn) btn.addEventListener("click", () => { LANG = LANG === "en" ? "zh" : "en"; applyLang(); });

    applyLang();  // sets body class + renders everything in the stored language

    const hash = (location.hash || "").slice(1);
    showTab($("#tab-" + hash) ? hash : "overview");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
