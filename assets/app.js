/* AI 학습도구 큐레이션 — 프로토타입 로직 (무빌드, 순수 JS) */
(() => {
  "use strict";

  const state = {
    q: "",
    category: new Set(),
    grades: new Set(),
    pricing: new Set(),
    user: new Set(),
    age: new Set(),
    subjects: new Set(),
    lessonStages: new Set(),
    readiness: new Set(),
    koreanOnly: false,
    domesticOnly: false,
    s2bOnly: false,
    studentAccountOnly: false,
    translationOnly: false,
    voiceOnly: false,
    compare: new Set(),
    compareMode: false,
    catalogStarted: false,
    tool: "",
    sort: "name",
  };
  let TOOLS = [];
  let TAX = {};
  let SOURCES = new Map();
  let detailReturnFocus = null;
  let compareReturnFocus = null;
  let helpReturnFocus = null;
  let lastOpenedToolId = "";
  let toastTimer = null;
  const COMPARE_MAX = 4;

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const CATEGORY_ICONS = {
    "글쓰기·작문": "notebook-pen", "이미지·그림": "image", "영상": "clapperboard", "음악·오디오": "headphones",
    "프레젠테이션·디자인": "presentation", "코스웨어·LMS": "graduation-cap", "평가·퀴즈·피드백": "list-checks",
    "코딩·SW교육": "code-2", "번역·외국어": "languages", "AI 튜터·챗봇": "bot", "리서치·자료정리": "search-check",
    "교사 업무자동화": "clipboard-check",
  };
  const icon = (name, cls = "") => {
    const node = el("i", cls);
    node.dataset.lucide = name;
    node.setAttribute("aria-hidden", "true");
    return node;
  };
  const setActionLabel = (button, iconName, text) => {
    button.replaceChildren(icon(iconName), document.createTextNode(text));
  };
  const refreshIcons = () => window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
  function toolLogoUrl(t) {
    if (t.logo_url) return t.logo_url;
    try {
      return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(t.url)}&sz=128`;
    } catch {
      return "";
    }
  }
  function toolVisual(t, cls = "") {
    const visual = el("div", `tool-visual ${cls}`.trim());
    visual.dataset.tone = String(Math.max(0, TAX.categories?.indexOf(t.category) || 0) % 6);
    const mark = el("span", "tool-mark");
    mark.appendChild(icon(CATEGORY_ICONS[t.category] || "shapes"));
    const logoUrl = toolLogoUrl(t);
    if (logoUrl) {
      const logo = el("img", "tool-logo");
      logo.src = logoUrl;
      logo.alt = "";
      logo.loading = "lazy";
      logo.decoding = "async";
      logo.referrerPolicy = "no-referrer";
      logo.addEventListener("load", () => logo.classList.add("is-ready"));
      logo.addEventListener("error", () => logo.remove());
      mark.appendChild(logo);
    }
    visual.appendChild(mark);
    visual.appendChild(el("span", "tool-visual-label", t.category));
    return visual;
  }

  // 연령제한 → 안전 표기(색상·라벨)
  const AGE_LABEL = { "없음": "제한 없음", "13+": "만 13세+", "14+": "만 14세+", "18+": "만 18세+", "교사전용": "교사 전용" };
  function ageClass(a) {
    if (a == null) return "unknown";
    if (a === "없음") return "ok";
    if (a === "13+" || a === "14+") return "warn";
    if (a === "18+") return "danger";
    if (a === "교사전용") return "teacher";
    return "unknown";
  }
  function ageText(a) { return a == null ? "연령 확인 필요" : (AGE_LABEL[a] || a); }
  const FREE = new Set(["완전무료", "교육용 무료"]);

  // --- URL 상태 동기화 ---
  const URL_KEYS = { category: "cat", grades: "grade", pricing: "price", user: "user", age: "age", subjects: "subj", lessonStages: "stage", readiness: "ready" };
  // 분야는 URL에 영문 슬러그로 노출한다(읽기 쉬운 공유 주소). 매핑은 taxonomy.category_slugs.
  function catToSlug(name) { return (TAX.category_slugs || {})[name] || name; }
  function slugToCat(slug) {
    const map = TAX.category_slugs || {};
    const hit = Object.keys(map).find((name) => map[name] === slug);
    return hit || slug; // 슬러그가 없으면 한글 분야명 그대로 허용(이전 링크 호환)
  }
  function stateToParams() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    Object.entries(URL_KEYS).forEach(([k, param]) => {
      if (!state[k].size) return;
      const values = [...state[k]].map((v) => (k === "category" ? catToSlug(v) : v));
      p.set(param, values.join(","));
    });
    if (state.koreanOnly) p.set("kr", "1");
    if (state.domesticOnly) p.set("dom", "1");
    if (state.s2bOnly) p.set("s2b", "1");
    if (state.studentAccountOnly) p.set("account", "1");
    if (state.translationOnly) p.set("translation", "1");
    if (state.voiceOnly) p.set("voice", "1");
    if (state.tool) p.set("tool", state.tool);
    if (state.sort !== "name") p.set("sort", state.sort);
    return p;
  }
  function slugToCatStrict(slug) {
    const map = TAX.category_slugs || {};
    return Object.keys(map).find((name) => map[name] === slug) || null;
  }
  function paramsToState() {
    const p = new URLSearchParams(location.search);
    // 경로(/tutor)로 들어온 분야 복원
    const seg = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "");
    if (seg) {
      const fromPath = slugToCatStrict(seg) || (TAX.categories || []).find((c) => c === seg);
      if (fromPath) state.category.add(fromPath);
    }
    if (p.get("q")) state.q = p.get("q");
    Object.entries(URL_KEYS).forEach(([k, param]) => {
      const v = p.get(param);
      if (v) v.split(",").forEach((x) => state[k].add(k === "category" ? slugToCat(x) : x));
    });
    state.koreanOnly = p.get("kr") === "1";
    state.domesticOnly = p.get("dom") === "1";
    state.s2bOnly = p.get("s2b") === "1";
    state.studentAccountOnly = p.get("account") === "1";
    state.translationOnly = p.get("translation") === "1";
    state.voiceOnly = p.get("voice") === "1";
    state.tool = p.get("tool") || "";
    state.sort = p.get("sort") || "name";
  }
  // 분야 1개만 고른 상태는 /tutor 처럼 경로로 표현한다(짧고 읽기 쉬운 주소).
  function buildURL() {
    const p = stateToParams();
    let path = "/";
    if (state.category.size === 1) {
      p.delete("cat");
      path = "/" + catToSlug([...state.category][0]);
    }
    const qs = p.toString();
    return qs ? `${path}?${qs}` : path;
  }
  function pushURL() {
    const url = buildURL();
    if (url !== location.pathname + location.search) history.pushState(null, "", url);
  }
  function updateURL() {
    history.replaceState(null, "", buildURL());
  }
  function syncUIFromState() {
    $("#search").value = state.q;
    $("#landing-search").value = state.q;
    $("#t-korean").checked = state.koreanOnly;
    $("#t-domestic").checked = state.domesticOnly;
    $("#t-s2b").checked = state.s2bOnly;
    $("#t-account").checked = state.studentAccountOnly;
    $("#t-translation").checked = state.translationOnly;
    $("#t-voice").checked = state.voiceOnly;
    $("#sort").value = state.sort;
    document.querySelectorAll("#f-category .chip").forEach((b) => b.setAttribute("aria-pressed", state.category.has(b.dataset.value)));
    document.querySelectorAll(".filters input[type=checkbox]").forEach((inp) => {
      const group = inp.closest("[id^=f-]")?.id;
      const key = Object.keys(URL_KEYS).find((k) => "f-" + k === group);
      if (key && state[key].has(inp.value)) inp.checked = true;
    });
  }

  async function load() {
    try {
      const [tools, tax, enrichment, sources] = await Promise.all([
        fetch("/data/tools.json").then((r) => r.json()),
        fetch("/data/taxonomy.json").then((r) => r.json()),
        fetch("/data/tool-enrichment.json").then((r) => r.json()),
        fetch("/data/sources.json").then((r) => r.json()),
      ]);
      const byId = new Map(enrichment.map((item) => [item.id, item]));
      SOURCES = new Map(sources.map((source) => [source.id, source]));
      TOOLS = tools.map((tool) => ({ ...tool, ...(byId.get(tool.id) || {}) }));
      TAX = tax;
      $("#landing-count").textContent = String(TOOLS.length);
      const latestVerified = TOOLS.map((tool) => tool.verified_at).filter(Boolean).sort().at(-1);
      $("#last-updated").textContent = latestVerified ? latestVerified.replaceAll("-", ".") : "확인 필요";
      buildFilters();
      buildLandingCategories();
      buildCategoryMenu();
      paramsToState();
      state.catalogStarted = hasActiveCriteria();
      syncUIFromState();
      bindEvents();
      render();
      refreshIcons();
    } catch (e) {
      $("#cards").innerHTML = '<p style="color:var(--text-muted)">데이터를 불러오지 못했습니다. 로컬 서버로 열어주세요 (file:// 는 fetch가 막힙니다).</p>';
      console.error(e);
    }
  }

  function buildFilters() {
    // 카테고리 칩 (실제 데이터에 존재하는 것만, 개수순)
    const catCount = {};
    TOOLS.forEach((t) => (catCount[t.category] = (catCount[t.category] || 0) + 1));
    const cats = TAX.categories.filter((c) => catCount[c]).sort((a, b) => catCount[b] - catCount[a]);
    const cbox = $("#f-category");
    cats.forEach((c) => {
      const b = el("button", "chip", `${c} ${catCount[c]}`);
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.dataset.value = c;
      b.addEventListener("click", () => {
        toggle(state.category, c);
        b.setAttribute("aria-pressed", state.category.has(c));
        render();
      });
      cbox.appendChild(b);
    });

    checkGroup("#f-grades", TAX.grades, state.grades);
    checkGroup("#f-pricing", TAX.pricing, state.pricing);
    checkGroup("#f-user", TAX.user, state.user);
    checkGroup("#f-subjects", TAX.subjects, state.subjects);
    checkGroup("#f-lessonStages", TAX.lesson_stages.filter((stage) => TOOLS.some((tool) => tool.lesson_stages?.includes(stage))), state.lessonStages);
    checkGroup("#f-readiness", ["추천", "조건부 활용", "참고"], state.readiness);
    // 연령제한: taxonomy 값 + '확인 필요'(null)
    checkGroup("#f-age", [...TAX.age_limit, "__null__"], state.age, (v) => (v === "__null__" ? "확인 필요" : ageText(v)));
  }

  function buildLandingCategories() {
    const counts = {};
    TOOLS.forEach((tool) => (counts[tool.category] = (counts[tool.category] || 0) + 1));
    const box = $("#landing-categories");
    TAX.categories.filter((category) => counts[category]).forEach((category) => {
      const button = el("button", "landing-category");
      button.type = "button";
      button.appendChild(icon(CATEGORY_ICONS[category] || "shapes", "category-icon"));
      button.appendChild(el("strong", null, category));
      button.appendChild(el("span", null, `${counts[category]}개 도구`));
      button.addEventListener("click", () => {
        state.category.clear();
        state.category.add(category);
        state.catalogStarted = true;
        pushURL();
        render();
        requestAnimationFrame(() => $("#catalog").scrollIntoView({ block: "start" }));
      });
      box.appendChild(button);
    });
  }

  function checkGroup(sel, values, set, labelFn) {
    const box = $(sel);
    values.forEach((v) => {
      const label = el("label");
      const inp = el("input");
      inp.type = "checkbox";
      inp.value = v;
      inp.addEventListener("change", () => {
        if (inp.checked) set.add(v); else set.delete(v);
        render();
      });
      label.appendChild(inp);
      label.appendChild(document.createTextNode(" " + (labelFn ? labelFn(v) : v)));
      box.appendChild(label);
    });
  }

  function toggle(set, v) { set.has(v) ? set.delete(v) : set.add(v); }

  function bindEvents() {
    $("#search").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
    $("#landing-search").addEventListener("input", (e) => {
      state.q = e.target.value.trim().toLowerCase();
      if (state.q) state.catalogStarted = true;
      render();
    });
    $("#t-korean").addEventListener("change", (e) => { state.koreanOnly = e.target.checked; render(); });
    $("#t-domestic").addEventListener("change", (e) => { state.domesticOnly = e.target.checked; render(); });
    $("#t-s2b").addEventListener("change", (e) => { state.s2bOnly = e.target.checked; render(); });
    $("#t-account").addEventListener("change", (e) => { state.studentAccountOnly = e.target.checked; render(); });
    $("#t-translation").addEventListener("change", (e) => { state.translationOnly = e.target.checked; render(); });
    $("#t-voice").addEventListener("change", (e) => { state.voiceOnly = e.target.checked; render(); });
    $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
    $("#reset").addEventListener("click", () => reset(false));
    $("#home").addEventListener("click", (e) => {
      e.stopPropagation();
      if ($("#category-menu-wrap").classList.contains("is-open")) closeCategoryMenu(); else openCategoryMenu();
    });
    $("#home-logo").addEventListener("click", (e) => { e.preventDefault(); returnToLanding(); });
    $("#help-open").addEventListener("click", () => {
      helpReturnFocus = document.activeElement;
      $("#help").showModal();
      refreshIcons();
    });
    $("#help-close").addEventListener("click", () => $("#help").close());
    $("#help").addEventListener("click", (e) => { if (e.target.id === "help") $("#help").close(); });
    $("#help").addEventListener("close", () => helpReturnFocus?.focus());
    $("#share").addEventListener("click", async () => {
      updateURL();
      try {
        await navigator.clipboard.writeText(location.href);
        const btn = $("#share");
        setActionLabel(btn, "check", "링크 복사됨!");
        refreshIcons();
        setTimeout(() => {
          setActionLabel(btn, "link-2", "필터 링크 복사");
          refreshIcons();
        }, 1500);
      } catch { alert(location.href); }
    });
    $("#detail-close").addEventListener("click", () => $("#detail").close());
    $("#detail").addEventListener("click", (e) => { if (e.target.id === "detail") $("#detail").close(); });
    $("#detail").addEventListener("close", () => {
      state.tool = "";
      lastOpenedToolId = "";
      updateURL();
      detailReturnFocus?.focus();
    });
    $("#compare-open").addEventListener("click", openCompare);
    $("#compare-mode").addEventListener("click", () => {
      state.compareMode = !state.compareMode;
      $("#compare-mode").setAttribute("aria-pressed", String(state.compareMode));
      setActionLabel($("#compare-mode"), state.compareMode ? "circle-check" : "list-checks", state.compareMode ? "비교 선택 중" : "비교 선택");
      render();
    });
    $("#compare-close").addEventListener("click", () => $("#compare").close());
    $("#compare").addEventListener("click", (e) => { if (e.target.id === "compare") $("#compare").close(); });
    $("#compare").addEventListener("close", () => compareReturnFocus?.focus());
    $("#compare-clear").addEventListener("click", () => { state.compare.clear(); $("#compare").close(); render(); });

    // 브라우저 뒤로/앞으로: 주소를 다시 읽어 화면 상태를 복원한다
    window.addEventListener("popstate", () => {
      ["category", "grades", "pricing", "user", "age", "subjects", "lessonStages", "readiness"].forEach((k) => state[k].clear());
      state.q = ""; state.koreanOnly = false; state.domesticOnly = false; state.s2bOnly = false;
      state.studentAccountOnly = false; state.translationOnly = false; state.voiceOnly = false;
      state.tool = ""; state.sort = "name";
      lastOpenedToolId = "";
      if ($("#detail").open) $("#detail").close();
      document.querySelectorAll(".chip[aria-pressed]").forEach((c) => c.setAttribute("aria-pressed", "false"));
      document.querySelectorAll(".filters input[type=checkbox]").forEach((c) => (c.checked = false));
      paramsToState();
      state.catalogStarted = hasActiveCriteria();
      syncUIFromState();
      render();
    });
  }

  function reset(returnToLanding = false, push = false) {
    ["category", "grades", "pricing", "user", "age", "subjects", "lessonStages", "readiness", "compare"].forEach((k) => state[k].clear());
    state.q = ""; state.koreanOnly = false; state.domesticOnly = false; state.s2bOnly = false; state.studentAccountOnly = false; state.translationOnly = false; state.voiceOnly = false; state.compareMode = false; state.catalogStarted = !returnToLanding; state.tool = ""; state.sort = "name";
    lastOpenedToolId = "";
    $("#search").value = ""; $("#sort").value = "name";
    $("#landing-search").value = "";
    $("#t-korean").checked = false; $("#t-domestic").checked = false; $("#t-s2b").checked = false; $("#t-account").checked = false; $("#t-translation").checked = false; $("#t-voice").checked = false;
    $("#compare-mode").setAttribute("aria-pressed", "false");
    setActionLabel($("#compare-mode"), "list-checks", "비교 선택");
    document.querySelectorAll(".chip[aria-pressed]").forEach((c) => c.setAttribute("aria-pressed", "false"));
    document.querySelectorAll(".filters input[type=checkbox]").forEach((c) => (c.checked = false));
    if (push) pushURL();
    render();
  }

  function returnToLanding() {
    reset(true, true);
    requestAnimationFrame(() => $("#landing").scrollIntoView({ block: "start" }));
  }

  // 분야 바로 바꾸기 드롭다운 — 랜딩으로 돌아가지 않고 다른 분야로 이동
  function buildCategoryMenu() {
    const menu = $("#category-menu");
    const counts = {};
    TOOLS.forEach((tool) => (counts[tool.category] = (counts[tool.category] || 0) + 1));
    menu.innerHTML = "";
    TAX.categories.filter((c) => counts[c]).forEach((category) => {
      const item = el("button", "category-menu-item");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.appendChild(icon(CATEGORY_ICONS[category] || "shapes"));
      item.appendChild(el("strong", null, category));
      item.appendChild(el("span", null, String(counts[category])));
      item.addEventListener("click", () => {
        state.category.clear();
        state.category.add(category);
        state.catalogStarted = true;
        state.tool = "";
        closeCategoryMenu();
        pushURL();
        syncUIFromState();
        render();
        $("#cards").scrollIntoView({ block: "start", behavior: "smooth" });
      });
      menu.appendChild(item);
    });
    const all = el("button", "category-menu-item is-all");
    all.type = "button";
    all.setAttribute("role", "menuitem");
    all.appendChild(icon("layout-grid"));
    all.appendChild(el("strong", null, "전체 분야 보기"));
    all.addEventListener("click", () => { closeCategoryMenu(); returnToLanding(); });
    menu.appendChild(all);
    refreshIcons();
  }
  function openCategoryMenu() {
    $("#category-menu-wrap").classList.add("is-open");
    $("#home").setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocClickCategoryMenu, true);
    document.addEventListener("keydown", onEscCategoryMenu);
  }
  function closeCategoryMenu() {
    $("#category-menu-wrap").classList.remove("is-open");
    $("#home").setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClickCategoryMenu, true);
    document.removeEventListener("keydown", onEscCategoryMenu);
  }
  function onDocClickCategoryMenu(e) { if (!$("#category-menu-wrap").contains(e.target)) closeCategoryMenu(); }
  function onEscCategoryMenu(e) { if (e.key === "Escape") { closeCategoryMenu(); $("#home").focus(); } }

  function intersects(arr, set) { return arr && arr.some((x) => set.has(x)); }
  function hasLanguageDetail(value) { return Boolean(value) && !/(미확인|확인 필요|범위 미확인)/.test(value); }

  function match(t) {
    if (state.category.size && !state.category.has(t.category)) return false;
    if (state.pricing.size && !state.pricing.has(t.pricing)) return false;
    if (state.user.size && !state.user.has(t.user)) return false;
    if (state.grades.size && !intersects(t.grades, state.grades)) return false;
    if (state.subjects.size && !intersects(t.subjects, state.subjects)) return false;
    if (state.lessonStages.size && !intersects(t.lesson_stages, state.lessonStages)) return false;
    if (state.age.size) {
      const key = t.age_limit == null ? "__null__" : t.age_limit;
      if (!state.age.has(key)) return false;
    }
    if (state.readiness.size && !state.readiness.has(t.review?.readiness)) return false;
    if (state.koreanOnly && !t.korean_support) return false;
    if (state.domesticOnly && !t.domestic) return false;
    if (state.s2bOnly && t.procurement?.s2b_public_listing !== "공개목록 확인") return false;
    if (state.studentAccountOnly && !t.adoption?.student_account) return false;
    if (state.translationOnly && !hasLanguageDetail(t.languages?.translation)) return false;
    if (state.voiceOnly && !hasLanguageDetail(t.languages?.voice)) return false;
    if (state.q) {
      const hay = [t.name, t.name_ko, t.provider, t.one_liner, t.classroom_use, (t.tags || []).join(" "), (t.aliases || []).join(" "), (t.secondary_categories || []).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function hasActiveCriteria() {
    return Boolean(
      state.q || state.category.size || state.grades.size || state.pricing.size || state.user.size || state.age.size ||
      state.subjects.size || state.lessonStages.size || state.readiness.size || state.koreanOnly || state.domesticOnly ||
      state.s2bOnly || state.studentAccountOnly || state.translationOnly || state.voiceOnly || state.tool
    );
  }

  function sortList(list) {
    const arr = [...list];
    if (state.sort === "category") arr.sort((a, b) => a.category.localeCompare(b.category, "ko") || a.name.localeCompare(b.name, "ko"));
    else if (state.sort === "free") {
      arr.sort((a, b) => (FREE.has(b.pricing) - FREE.has(a.pricing)) || a.name.localeCompare(b.name, "ko"));
    } else arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return arr;
  }

  function toolShareUrl(t) {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("tool", t.id);
    return url.toString();
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => (toast.hidden = true), 180);
    }, 1800);
  }

  async function shareTool(t) {
    const url = toolShareUrl(t);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${t.name} · AI 수업도구`, text: t.one_liner, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(`${t.name} 공유 링크를 복사했습니다.`);
    } catch { alert(url); }
  }

  function lessonText(t) {
    return (t.classroom_use || t.one_liner || "수업에 필요한 활동을 구성").replace(/\s+/g, " ").trim();
  }

  function openDetail(t, trigger, syncUrl = true) {
    detailReturnFocus = trigger || document.activeElement;
    if (syncUrl) {
      state.tool = t.id;
      lastOpenedToolId = t.id;
      state.catalogStarted = true;
      updateURL();
    }
    const body = $("#detail-body");
    body.innerHTML = "";
    const summary = el("div", "detail-summary");
    const scroll = el("div", "detail-scroll");
    body.appendChild(summary);
    body.appendChild(scroll);

    summary.appendChild(toolVisual(t, "detail-visual"));
    const h = el("h3");
    h.id = "detail-title";
    h.appendChild(document.createTextNode(t.name));
    if (t.name_ko && t.name_ko !== t.name) h.appendChild(el("span", "alt", " · " + t.name_ko));
    summary.appendChild(h);
    summary.appendChild(el("span", "cat-badge", t.category + (t.subcategory ? " · " + t.subcategory : "")));
    summary.appendChild(el("p", "one-liner", t.one_liner));
    const lesson = el("div", "detail-lesson");
    lesson.appendChild(el("span", null, "이 앱을 이용하면, 이런 수업을 만들 수 있어요"));
    lesson.appendChild(el("strong", null, lessonText(t)));
    summary.appendChild(lesson);

    const dl = el("dl");
    const row = (dt, dd) => { if (!dd) return; dl.appendChild(el("dt", null, dt)); dl.appendChild(el("dd", null, dd)); };
    row("대상 학령", (t.grades || []).join(", "));
    row("교과", (t.subjects || []).join(", "));
    row("활용 주체", t.user);
    row("요금", t.pricing);
    row("연령제한", ageText(t.age_limit));
    row("도입 형태", t.form);
    row("로그인", t.login_required ? "필요" : "불필요");
    row("한국어 지원", t.korean_support === false ? "미지원" : "지원");
    row("국내 도입", t.domestic ? "예" : "아니오");
    row("출처", (t.source || []).join(", "));
    row("확인일", t.verified_at);
    scroll.appendChild(dl);

    const section = (title) => {
      const s = el("section", "detail-section");
      s.appendChild(el("h4", null, title));
      scroll.appendChild(s);
      return s;
    };
    const textLine = (parent, label, value) => {
      if (!value || (Array.isArray(value) && !value.length)) return;
      const p = el("p", "detail-line");
      p.appendChild(el("strong", null, label + " "));
      p.appendChild(document.createTextNode(Array.isArray(value) ? value.join(" · ") : value));
      parent.appendChild(p);
    };

    if (t.provider || t.edition || (t.secondary_categories || []).length || (t.lesson_stages || []).length) {
      const s = section("도구·수업 맥락");
      textLine(s, "운영사", t.provider);
      textLine(s, "교육용·일반용 구분", t.edition);
      textLine(s, "보조 분야", t.secondary_categories);
      textLine(s, "수업 단계", t.lesson_stages);
      textLine(s, "AI 활용", t.ai_modes);
    }
    if (t.languages) {
      const s = section("언어 지원");
      textLine(s, "화면", t.languages.interface);
      textLine(s, "생성·응답", t.languages.generation_response);
      textLine(s, "번역", t.languages.translation);
      textLine(s, "음성", t.languages.voice);
      textLine(s, "한국어 수업 품질", t.languages.korean_quality);
    }
    if (t.adoption || t.safety || t.review) {
      const s = section("학교 적용 판단");
      if (t.review) {
        const label = el("span", "readiness " + readinessClass(t.review.readiness), t.review.readiness);
        s.appendChild(label);
        textLine(s, "판정 사유", t.review.reason);
        textLine(s, "근거 수준", t.review.evidence_level);
      }
      textLine(s, "학생 계정", t.adoption?.student_account);
      textLine(s, "요금·플랜", t.adoption?.pricing_detail);
      textLine(s, "지원 환경", t.adoption?.platforms);
      textLine(s, "연동", t.adoption?.integrations);
      textLine(s, "안전", t.safety?.summary);
      textLine(s, "교사 확인", t.safety?.cautions);
    }
    if (t.procurement) {
      const s = section("국내 도입·구매 근거");
      textLine(s, "S2B 상태", t.procurement.s2b_public_listing);
      (t.procurement.products || []).forEach((product) => {
        const a = el("a", "source-link", `${product.name} (${product.estimate_code})`);
        a.href = product.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        s.appendChild(a);
      });
    }
    const sourceList = (t.source_ids || []).map((id) => SOURCES.get(id)).filter(Boolean);
    if (sourceList.length) {
      const s = section("공식 확인 출처");
      const ul = el("ul", "source-list");
      sourceList.forEach((source) => {
        const li = el("li");
        const a = el("a", "source-link", `[${source.id}] ${source.publisher} · ${source.title}`);
        a.href = source.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        li.appendChild(a);
        ul.appendChild(li);
      });
      s.appendChild(ul);
    }

    if (t.notes) scroll.appendChild(el("p", "notes", "⚠️ " + t.notes));

    // 하단 동작 줄은 스크롤 밖에 고정한다(왼쪽: 공식 페이지 방문, 오른쪽: 공유하기)
    const actions = el("div", "detail-actions");
    const a = el("a", "visit btn-visit");
    a.href = t.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.appendChild(icon("external-link"));
    a.appendChild(document.createTextNode(" 공식 페이지 방문"));
    actions.appendChild(a);
    const share = el("button", "detail-share");
    share.type = "button";
    share.appendChild(icon("share-2"));
    share.appendChild(document.createTextNode(" 공유하기"));
    share.addEventListener("click", () => shareTool(t));
    actions.appendChild(share);
    body.appendChild(actions);

    $("#detail").showModal();
    refreshIcons();
  }

  function isStale(t) {
    const checked = new Date(`${t.verified_at}T00:00:00`);
    return !Number.isNaN(checked.getTime()) && (Date.now() - checked.getTime()) / 86400000 > 180;
  }

  function updateCompareControl(message = "") {
    const button = $("#compare-open");
    const count = state.compare.size;
    button.disabled = count === 0;
    setActionLabel(button, "columns-3", `비교하기 (${count}/${COMPARE_MAX})`);
    if (message) $("#compare-status").textContent = message;
  }

  function compareValue(t, key) {
    const values = {
      "한국어 지원": t.languages?.interface || (t.korean_support ? "한국어 지원" : "한국어 미지원"),
      "학생 계정": t.adoption?.student_account || "심층 확인 필요",
      "요금·시작 조건": t.adoption?.pricing_detail || t.pricing,
      "최소 연령": ageText(t.age_limit),
      "안전·교사 확인": t.safety?.summary || t.notes || "심층 확인 필요",
      "학교 적용 판단": t.review?.readiness || "심층 확인 필요",
      "S2B 공개목록": t.procurement?.s2b_public_listing || "심층 확인 필요",
    };
    return values[key];
  }

  function openCompare() {
    const selected = TOOLS.filter((t) => state.compare.has(t.id));
    if (!selected.length) return;
    compareReturnFocus = document.activeElement;
    const body = $("#compare-body");
    body.innerHTML = "";
    const table = el("table", "compare-table");
    const caption = el("caption", "sr-only", "선택한 도구의 학교 적용 조건 비교");
    table.appendChild(caption);
    const head = el("thead");
    const headRow = el("tr");
    headRow.appendChild(el("th", null, "항목"));
    selected.forEach((t) => headRow.appendChild(el("th", null, t.name)));
    head.appendChild(headRow);
    table.appendChild(head);
    const tbody = el("tbody");
    ["한국어 지원", "학생 계정", "요금·시작 조건", "최소 연령", "안전·교사 확인", "학교 적용 판단", "S2B 공개목록"].forEach((key) => {
      const row = el("tr");
      row.appendChild(el("th", null, key));
      selected.forEach((t) => row.appendChild(el("td", null, compareValue(t, key))));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    body.appendChild(table);
    $("#compare").showModal();
  }

  function card(t) {
    const c = el("article", "card");
    c.appendChild(toolVisual(t, "card-visual"));

    const top = el("div", "card-top");
    const h = el("h3");
    h.appendChild(document.createTextNode(t.name));
    if (t.name_ko && t.name_ko !== t.name) h.appendChild(el("span", "alt", " · " + t.name_ko));
    top.appendChild(h);
    top.appendChild(el("span", "cat-badge", t.category));
    c.appendChild(top);

    const lesson = el("div", "card-lesson");
    lesson.appendChild(el("span", null, "이 앱을 이용하면"));
    lesson.appendChild(el("strong", null, lessonText(t)));
    c.appendChild(lesson);

    const facts = el("div", "card-facts");
    const fact = (iconName, label, value, cls = "") => {
      const item = el("div", `card-fact ${cls}`.trim());
      item.appendChild(icon(iconName));
      const copy = el("span");
      copy.appendChild(el("small", null, label));
      copy.appendChild(el("strong", null, value));
      item.appendChild(copy);
      facts.appendChild(item);
    };
    fact("wallet", "요금", t.pricing, FREE.has(t.pricing) ? "fact-safe" : "");
    fact("shield-check", "연령", ageText(t.age_limit), ageClass(t.age_limit));
    fact("users-round", "대상", (t.grades || []).slice(0, 2).join(" · ") || t.user);
    c.appendChild(facts);

    const foot = el("div", "card-foot");
    const actions = el("div", "card-actions");
    const openHint = el("span", "card-open-hint", "카드 열기");
    openHint.appendChild(icon("arrow-up-right"));
    actions.appendChild(openHint);
    const share = el("button", "card-share");
    share.type = "button";
    share.title = `${t.name} 공유`;
    share.setAttribute("aria-label", `${t.name} 공유`);
    share.appendChild(icon("share-2"));
    share.addEventListener("click", () => shareTool(t));
    actions.appendChild(share);
    foot.appendChild(actions);
    c.appendChild(foot);

    const compare = el("label", "compare-choice");
    const input = el("input");
    input.type = "checkbox";
    input.checked = state.compare.has(t.id);
    input.setAttribute("aria-label", `${t.name} 비교에 추가`);
    input.addEventListener("change", () => {
      if (input.checked && state.compare.size >= COMPARE_MAX) {
        input.checked = false;
        updateCompareControl(`비교는 최대 ${COMPARE_MAX}개 도구까지 선택할 수 있습니다.`);
        return;
      }
      if (input.checked) state.compare.add(t.id); else state.compare.delete(t.id);
      updateCompareControl(`${t.name} ${input.checked ? "비교에 추가" : "비교에서 제외"}`);
    });
    compare.appendChild(input);
    compare.appendChild(document.createTextNode(" 비교에 추가"));
    if (!state.compareMode) compare.hidden = true;
    c.appendChild(compare);
    const open = el("button", "card-open");
    open.type = "button";
    open.setAttribute("aria-label", `${t.name} 카드 열기`);
    open.addEventListener("click", () => openDetail(t, open));
    c.appendChild(open);
    return c;
  }

  function readinessClass(readiness) {
    return ({ "추천": "recommended", "조건부 활용": "conditional", "참고": "reference" })[readiness] || "reference";
  }

  function render() {
    const catalogVisible = state.catalogStarted || hasActiveCriteria();
    $("#landing").hidden = catalogVisible;
    $("#catalog").hidden = !catalogVisible;
    const list = sortList(TOOLS.filter(match));
    const box = $("#cards");
    box.innerHTML = "";
    list.forEach((t) => box.appendChild(card(t)));
    $("#empty").hidden = list.length !== 0;
    $("#result-count").innerHTML = `<strong>${list.length}</strong> / ${TOOLS.length}개`;
    updateCompareControl();
    updateURL();
    refreshIcons();
    if (state.tool && state.tool !== lastOpenedToolId) {
      const sharedTool = TOOLS.find((tool) => tool.id === state.tool);
      if (sharedTool) {
        lastOpenedToolId = state.tool;
        requestAnimationFrame(() => openDetail(sharedTool, null, false));
      } else {
        state.tool = "";
        updateURL();
      }
    }
  }

  load();
})();
