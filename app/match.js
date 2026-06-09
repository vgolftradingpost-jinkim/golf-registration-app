/* ================================================================
   match.js — 자판 직접 입력용 자동완성 엔진 (검색형 드롭다운)
   ----------------------------------------------------------------
   · 계층 자동완성 (TYPE > BRAND > MODEL)        — match_tree.json
   · SHAFT 3단계 폴백 (BRAND+MODEL > BRAND > TYPE) — shaft_index.json
   · 퍼지 매칭 (오타 보정, 후보 0건일 때 폴백 필터)
   · 방법 A: STATE.entries(직접 등록 항목) 런타임 병합 — 자동 학습
   계획서: docs/improve-plan_manual-input_20260604.md
   v14 (2026-06-04) — 음성(Web Speech) 제거, 칩→드롭다운 전환
   ================================================================ */

const MATCH = {
  tree: null,          // { TYPE: { BRAND: { MODEL: count } } }
  shaft: null,         // { byModel, byBrand, byType }
  loaded: false,
  SHAFT_TYPE_LIMIT: 8,   // 폴백 3차(TYPE 전체) 노출 후보 개수 (확정 사항 #3)
  SHAFT_CHIP_LIMIT: 8,   // 1·2차 칩 표시 상한 (전체는 자판/음성으로 입력 가능)
};

/* ---- 데이터 로드 (앱 시작 시 1회) ---- */
async function loadMatchData() {
  if (MATCH.loaded) return;
  try {
    const [t, s] = await Promise.all([
      fetch('data/match_tree.json').then(r => r.json()),
      fetch('data/shaft_index.json').then(r => r.json()),
    ]);
    MATCH.tree = t;
    MATCH.shaft = s;
    MATCH.loaded = true;
  } catch (e) {
    console.warn('match 데이터 로드 실패 — 자동완성은 등록 항목만 사용', e);
    MATCH.tree = {};
    MATCH.shaft = { byModel: {}, byBrand: {}, byType: {} };
    MATCH.loaded = true;
  }
}

/* ================================================================
   방법 A — STATE.entries 병합 (자동 학습)
   직접 등록한 항목을 기준 데이터와 같은 구조로 집계하여 후보에 합침.
   entry 필드: { type, brand, model, shaftBrand, shaftModel } 가정.
   ================================================================ */
function entriesAsCounter(extractor) {
  // extractor(entry) → [key, ...] (없으면 빈 배열)
  const c = Object.create(null);
  const list = (typeof STATE !== 'undefined' && Array.isArray(STATE.entries)) ? STATE.entries : [];
  for (const e of list) {
    for (const k of extractor(e)) {
      if (k) c[k] = (c[k] || 0) + 1;
    }
  }
  return c;
}

/* 두 count 맵을 합산하여 빈도 내림차순 key 배열 반환 */
function mergeRank(base, extra) {
  const m = Object.create(null);
  if (base)  for (const k in base)  m[k] = (m[k] || 0) + base[k];
  if (extra) for (const k in extra) m[k] = (m[k] || 0) + extra[k];
  return Object.keys(m).sort((a, b) => m[b] - m[a]);
}

/* ================================================================
   계층 자동완성
   ================================================================ */
/* TYPE 의 BRAND 후보 (빈도순) — 기준 + 등록 병합 */
function getBrandCandidates(type) {
  const base = {};
  const t = (MATCH.tree && MATCH.tree[type]) || {};
  for (const b in t) base[b] = Object.values(t[b]).reduce((a, c) => a + c, 0);
  const learned = entriesAsCounter(e =>
    (e.type === type && e.brand) ? [e.brand] : []);
  return mergeRank(base, learned);
}

/* BRAND 의 MODEL 후보 (빈도순) — TYPE 안에서 */
function getModelCandidates(type, brand) {
  const base = (MATCH.tree && MATCH.tree[type] && MATCH.tree[type][brand]) || {};
  const learned = entriesAsCounter(e =>
    (e.type === type && e.brand === brand && e.model) ? [e.model] : []);
  return mergeRank(base, learned);
}

/* ================================================================
   SHAFT 3단계 폴백
   반환: { stage: 'model'|'brand'|'type', label, list:[shaft...] }
   ================================================================ */
function getShaftCandidates(type, brand, model) {
  const sh = MATCH.shaft || { byModel: {}, byBrand: {}, byType: {} };

  // 1차: BRAND + MODEL
  const mKey = `${brand}||${model}`;
  const baseModel = sh.byModel[mKey] || {};
  const learnedModel = entriesAsCounter(e =>
    (e.brand === brand && e.model === model && e.shaftModel) ? [e.shaftModel] : []);
  let list = mergeRank(baseModel, learnedModel);
  if (list.length > 0) {
    return { stage: 'model', label: '이 모델 기준', list: list.slice(0, MATCH.SHAFT_CHIP_LIMIT) };
  }

  // 2차: BRAND 전체
  const baseBrand = sh.byBrand[brand] || {};
  const learnedBrand = entriesAsCounter(e =>
    (e.brand === brand && e.shaftModel) ? [e.shaftModel] : []);
  list = mergeRank(baseBrand, learnedBrand);
  if (list.length > 0) {
    return { stage: 'brand', label: '이 브랜드 기준', list: list.slice(0, MATCH.SHAFT_CHIP_LIMIT) };
  }

  // 3차: TYPE 전체 (상위 8개)
  const baseType = sh.byType[type] || {};
  const learnedType = entriesAsCounter(e =>
    (e.type === type && e.shaftModel) ? [e.shaftModel] : []);
  list = mergeRank(baseType, learnedType).slice(0, MATCH.SHAFT_TYPE_LIMIT);
  return { stage: 'type', label: '타입 전체', list };
}

/* (v16) Model-first 진입용 — TYPE 의 전체 MODEL 후보 (빈도순).
   브랜드를 가로질러 같은 모델명 count 합산. 기준 + 등록(STATE.entries) 병합. */
function getAllModelCandidates(type) {
  const base = {};
  const t = (MATCH.tree && MATCH.tree[type]) || {};
  for (const b in t)
    for (const m in t[b]) base[m] = (base[m] || 0) + t[b][m];
  const learned = entriesAsCounter(e =>
    (e.type === type && e.model) ? [e.model] : []);
  return mergeRank(base, learned);
}

/* (v16) MODEL 을 보유한 BRAND 후보 (빈도순) — 자동확정/수정 후보용. */
function getBrandCandidatesByModel(type, model) {
  const base = {};
  const t = (MATCH.tree && MATCH.tree[type]) || {};
  for (const b in t)
    if (t[b][model]) base[b] = (base[b] || 0) + t[b][model];
  const learned = entriesAsCounter(e =>
    (e.type === type && e.model === model && e.brand) ? [e.brand] : []);
  return mergeRank(base, learned);
}

/* (v15) 전체 샤프트 풀 — BRAND 필드처럼 전체에서 부분단어 검색용.
   byModel/byBrand/byType 전부 + STATE.entries 를 합산해 고유 샤프트를 빈도순 반환.
   모델/브랜드 종속 없이 어떤 입력값이든 전체에서 매칭되도록 함. */
function getAllShaftCandidates() {
  const sh = MATCH.shaft || { byModel: {}, byBrand: {}, byType: {} };
  const m = Object.create(null);
  const addMap = (obj) => {
    for (const k in obj) {
      const inner = obj[k];
      for (const name in inner) m[name] = (m[name] || 0) + inner[name];
    }
  };
  addMap(sh.byModel);
  addMap(sh.byBrand);
  addMap(sh.byType);
  const learned = entriesAsCounter(e => (e.shaftModel ? [e.shaftModel] : []));
  for (const k in learned) m[k] = (m[k] || 0) + learned[k];
  return Object.keys(m).sort((a, b) => m[b] - m[a]);
}

/* ================================================================
   퍼지 매칭 — 오타/음성 오인식 보정
   ================================================================ */
function fzNorm(s) {
  return String(s || '').toLowerCase().replace(/[\s\-_.]/g, '');
}

/* Levenshtein 거리 (경량) */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = tmp;
    }
  }
  return prev[b.length];
}

/* 입력값을 후보 리스트와 비교해 상위 매치 반환
   반환: [{ value, score }] (score 0~1, 높을수록 일치)
   - 완전/부분 일치 우선, 그다음 편집거리 유사도 */
function fuzzyMatch(input, candidates, limit = 6) {
  const q = fzNorm(input);
  if (!q) return [];
  const scored = [];
  for (const cand of candidates) {
    const c = fzNorm(cand);
    if (!c) continue;
    let score;
    if (c === q) score = 1.0;
    else if (c.startsWith(q)) score = 0.9;
    else if (c.includes(q)) score = 0.8;
    else {
      const dist = levenshtein(q, c);
      const sim = 1 - dist / Math.max(q.length, c.length);
      score = sim * 0.7; // 편집거리 기반은 상한 0.7
    }
    if (score >= 0.34) scored.push({ value: cand, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/* 입력 텍스트로 후보 실시간 필터 (자판 입력용)
   - 한 글자만 입력해도 부분일치(startsWith → includes) 즉시 노출
   - 일치 0건일 때만 퍼지(편집거리) 폴백 */
function filterCandidates(input, candidates, limit = 30) {
  const q = fzNorm(input);
  if (!q) return candidates.slice(0, limit);
  const starts = [], includes = [];
  for (const c of candidates) {
    const n = fzNorm(c);
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q)) includes.push(c);
  }
  let out = starts.concat(includes).slice(0, limit);
  if (out.length === 0) out = fuzzyMatch(input, candidates, limit).map(x => x.value);
  return out;
}

/* (v14) Web Speech 음성 입력 제거 — 모델/샤프트 영어 음성 인식 정확도 부족.
   자판 + 검색형 드롭다운으로 일원화. */
