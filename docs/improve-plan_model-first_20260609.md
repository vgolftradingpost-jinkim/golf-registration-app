# 구현계획서 — 직접입력 순서 변경 (Brand-first → Model-first)

작성일: 2026-06-09
대상: `app/match.js`, `app/index.html`, `app/sw.js`, `CLAUDE.md`, `docs/data_analysis.md`
상태: **계획 수립 완료 — 승인 대기 (코드 미수정)**

---

## 1. 요청 요약

직접입력(Quick Entry) 화면의 입력 순서를 바꾼다.

| 단계 | 현재 (v15) | 변경 후 |
|---|---|---|
| 1 | **Brand** 검색/선택 | **Model** 검색/선택 |
| 2 | Brand 안에서 **Model** | Model 보유 **Brand** 자동확정(+수정가능) |
| 3 | **Shaft** 전체검색 | **Shaft** 전체검색 (변경 없음) |

확정 사항(사용자 답변):
- Model 선택 시 Brand는 **자동 채움 + 수정가능** (1개면 자동확정, 여러 개면 드롭다운 노출)
- 이번 작업은 **계획서만** 작성. 실제 코드 수정은 별도 승인 후 진행.

---

## 2. 현재 구조 분석 (파악 완료)

### 데이터
- `app/data/match_tree.json` : `{ TYPE: { BRAND: { MODEL: count } } }` (49KB)
- `app/data/shaft_index.json` : `{ byModel, byBrand, byType }` (209KB)
- 데이터 방향은 **Brand→Model**. Model→Brand 역조회 함수는 **현재 없음**.

### 핵심 검증 결과 (2026-06-09 실측)
`match_tree.json` Driver 기준: 고유 모델 489개 중 **두 개 이상 브랜드에 걸친 모델은 단 1개**(`ASIRI`).
→ 거의 모든 모델은 선택 즉시 브랜드 1개로 확정됨. "자동 채움+수정가능" 방식이 데이터와 잘 맞음.
→ **데이터(JSON) 재생성 불필요.** 기존 트리를 런타임 역순회하면 됨.

### 관련 코드 위치
- `match.js`
  - `getBrandCandidates(type)` (L68) — TYPE 전체 브랜드 빈도순
  - `getModelCandidates(type, brand)` (L78) — 브랜드 종속 모델
  - `getAllShaftCandidates()` (L122) — 샤프트 전체풀 (그대로 사용)
- `index.html`
  - HTML 필드 순서 (L241–270): Brand → Model → Shaft
  - `MI` 상태객체 (L890)
  - `ddCandidates(field, filter)` (L922)
  - `pick(field, val)` (L1008) — 단계 초기화 로직
  - `syncStages()` (L1028) — brand→model→shaft 활성화 체인
  - `onManualBrandInput/onManualModelInput` (L989–999)
  - `manualContinue()` (L1046)

---

## 3. 변경 설계

### 3-A. match.js — 함수 2개 신규 추가 (기존 함수는 유지)

```js
/* TYPE 의 전체 MODEL 후보 (빈도순) — Model-first 진입용.
   브랜드를 가로질러 같은 모델명은 count 합산. 기준 + 등록(STATE.entries) 병합. */
function getAllModelCandidates(type) {
  const base = {};
  const t = (MATCH.tree && MATCH.tree[type]) || {};
  for (const b in t)
    for (const m in t[b]) base[m] = (base[m] || 0) + t[b][m];
  const learned = entriesAsCounter(e =>
    (e.type === type && e.model) ? [e.model] : []);
  return mergeRank(base, learned);
}

/* MODEL 을 보유한 BRAND 후보 (빈도순) — 자동확정/수정 후보용.
   해당 model 을 가진 브랜드만 추려서 count(=그 model 등장수) 순. */
function getBrandCandidatesByModel(type, model) {
  const base = {};
  const t = (MATCH.tree && MATCH.tree[type]) || {};
  for (const b in t)
    if (t[b][model]) base[b] = (base[b] || 0) + t[b][model];
  const learned = entriesAsCounter(e =>
    (e.type === type && e.model === model && e.brand) ? [e.brand] : []);
  return mergeRank(base, learned);
}
```

> 기존 `getBrandCandidates`/`getModelCandidates`/`getShaftCandidates`는 **삭제하지 않고 남겨둠** (회귀 방지·롤백 용이).

### 3-B. index.html — HTML 필드 순서 교체 (L241–270)

Brand 블록과 Model 블록의 **위치를 맞바꿈**. 결과 순서:

1. **Model** (`mi-model`) — 첫 활성, `onfocus="openDD('model')"`
2. **Brand** (`mi-brand`) — 초기 `disabled`, Model 확정 후 활성
3. **Shaft** (`mi-shaft`) — 초기 `disabled`, Brand 확정 후 활성 (현행과 동일)

input 이벤트 핸들러 이름은 그대로 두되 의미만 재배치(아래 3-C).

### 3-C. index.html — 컨트롤러 로직 수정

**(1) `ddCandidates(field, filter)`** — 분기 의미 변경:
- `model` 분기: `getAllModelCandidates(miType())` 사용, head `"Model 추천 (사용 빈도순)"`
- `brand` 분기: `getBrandCandidatesByModel(miType(), MI.model)` 사용, head `MI.model + " 보유 브랜드"`
- `shaft` 분기: `getAllShaftCandidates()` (변경 없음)

**(2) `pick(field, val)`** — 단계 초기화 방향 반전:
- `model` 선택 시: `MI.model=v`; 하위(Brand·Shaft) 리셋; **Brand 자동확정 시도**(아래 (4))
- `brand` 선택 시: `MI.brand=v`; Shaft 리셋
- `shaft` 선택 시: 현행과 동일

**(3) `syncStages()`** — 활성화 체인 반전:
```js
const modelOk = !!MI.model;
const brandOk = !!MI.brand;
document.getElementById('mi-field-brand').classList.toggle('disabled', !modelOk);
document.getElementById('mi-field-shaft').classList.toggle('disabled', !(modelOk && brandOk));
```

**(4) Model 선택 시 Brand 자동 채움** (신규, `pick('model',…)` 내부):
```js
const bcs = getBrandCandidatesByModel(miType(), MI.model);
if (bcs.length === 1) {                 // 단일 브랜드 → 자동확정
  MI.brand = bcs[0];
  document.getElementById('mi-brand').value = bcs[0];
} else {                                // 0개 또는 다중 → 비우고 사용자 선택 유도
  MI.brand = '';
  document.getElementById('mi-brand').value = '';
}
```
→ 자동확정돼도 Brand 칸은 편집 가능(수정 시 `onManualBrandInput`이 다시 드롭다운 노출).

**(5) `updateMiContinue()`** — 조건 동일(`MI.brand && MI.model`). 순서 무관하므로 무변경.

**(6) `resetManual()`** — 초기 disabled 대상을 `brand`/`shaft`로 변경(현재는 `model`/`shaft`).

**(7) `manualContinue()` / `populateEditForm` 전달** — 무변경 (brand/model/shaft 값만 넘기므로 순서 무관).

### 3-D. 라벨/플레이스홀더 문구 정리
- Model 칸: "모델 입력/선택 (예: SIM2 MAX)" + 헤드 "Model 추천 (사용 빈도순)"
- Brand 칸: 플레이스홀더 "모델 선택 시 자동 / 직접 선택 가능", 헤드 "{model} 보유 브랜드"
- 힌트 "추천에 없으면 입력값 그대로 등록됩니다."는 유지.

---

## 4. 영향 범위 / 회귀 위험

- **사진→AI 경로**: 무영향 (직접입력 컨트롤러만 수정).
- **Edit/Save/List/Export**: 무영향 (`MI` → `populateEditForm`로 값만 전달, 필드 구조 동일).
- **방법 A 자동학습**: `entriesAsCounter` 그대로 재사용 → 신규 함수에도 자동 반영.
- **shaft 전체검색(v15)**: 그대로 유지.
- **롤백**: 신규 함수만 추가·기존 함수 보존하므로, 문제 시 HTML 순서와 분기만 되돌리면 즉시 원복.

---

## 5. 작업 도구 주의 (CLAUDE.md 사고 이력 반영)

마운트 폴더 대형 파일(index.html ~1790줄)은 Cowork **Edit 도구가 NUL 덧붙임/뒷부분 절단**을 반복 유발.
→ **Python 문자열 치환 + `.replace(b'\x00', b'')`** 방식으로 수정하고, 각 파일 `node --check`(JS) / NUL·`</html>` 종료 확인(HTML) 검증. sw.js는 수정 전 `git show HEAD:app/sw.js`로 무결성 확인.

---

## 6. 실행 단계 (승인 후)

1. `match.js`에 `getAllModelCandidates` / `getBrandCandidatesByModel` 추가 → `node --check`
2. `index.html` HTML 필드 순서 교체 + `ddCandidates`/`pick`/`syncStages`/`resetManual` 수정 (Python 치환)
3. `index.html` NUL 없음 + 줄 수 + `</html>` 종료 검증
4. `app/sw.js` `CACHE_VERSION` `20260604c` → `20260609` 승급 (재배포 강제)
5. Node(vm)로 실데이터 시나리오 검증:
   - Model "SIM2 MAX" 입력 → Brand 자동확정 "TaylorMade"
   - 다중브랜드 모델("ASIRI") → Brand 드롭다운 2개 노출
   - 추천에 없는 모델 → 입력값 그대로 진행
6. `CLAUDE.md` v16 변경 기록 + `docs/data_analysis.md` 동기화 (재오류 방지 규칙)
7. push (sw.js 버전 반영 확인)

---

## 7. 미확정/추가 확인 사항

- 없음. (Brand 자동확정 정책 확정됨, 데이터 재생성 불필요 확인됨)
