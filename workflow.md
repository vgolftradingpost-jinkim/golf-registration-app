# Golf Club Register App — Workflow & Code Review

> 최초 작성: 2026-04-06 | 최종 업데이트: 2026-04-08 (v9)
> 분석 대상: `app/index.html` (v9 기준, ~1,637줄 단일 파일 PWA)

---

## 1. 프로젝트 전체 구조

```
03 golf-club-app/
├── app/
│   ├── index.html        ← 메인 앱 (CSS + JS + HTML 전부 포함, ~1,637줄)
│   ├── manifest.json     ← PWA 설정 (standalone 모드, 아이콘 등)
│   ├── sw.js             ← Service Worker (오프라인 캐싱)
│   └── icon-*.png/svg    ← PWA 아이콘
├── docs/
│   └── data_analysis.md     ← 데이터 구조 및 매핑 기준 문서
├── api/
│   ├── laptop_api.md
│   └── phone_api.txt
├── CLAUDE.md             ← 프로젝트 컨텍스트
├── start_server.bat      ← 로컬 서버 실행 (더블클릭)
└── push.bat              ← GitHub push 실행 (더블클릭)
```

> ⚠️ v9에서 제거됨: `app/golf_db.json` (2.4MB), `app/brands.json` (21KB), `data/golf_inventory.xlsx` (380KB)

**배포**: GitHub Pages → https://vgolftradingpost-jinkim.github.io/golf-registration-app/app/

---

## 2. 앱 전체 워크플로우 (사용 흐름)

```
[사용자]
    │
    ▼
① 앱 실행 → API Key 설정 (최초 1회)
    │  localStorage에 claude_api_key + claude_model 저장
    │
    ▼
② Screen 1: Capture (촬영)
    │  Club Type 사전 선택 (선택적)
    │  Head1 / Head2 / Shaft1 / Shaft2 사진 촬영
    │  → onCapture() → resizeImage(1024px) → STATE.images에 저장
    │  Head 1장 이상 촬영 시 [Analyze with AI] 버튼 활성화
    │
    ▼
③ [Analyze with AI] 클릭
    │  → analyzePhotos()
    │  → callClaudeVision(images, preType)
    │       4장 이미지(base64) + 프롬프트 → Anthropic API 직접 호출
    │       응답: JSON { brand, model, club_type, loft, shaft_brand,
    │                    shaft_model, shaft_flex, shaft_weight, ... }
    │
    ▼
④ Screen 2: Edit (편집)
    │  AI 결과로 폼 자동 채우기 (populateEditForm)
    │  TITLE / SPEC 자동 생성 (regenerateFields)
    │     → type, brand, model, degrees, flex, gender, handed, grip 조합
    │  [🔍 VGT Price] 버튼 → triggerMarketSearch()
    │     → TITLE 내용 그대로 검색어로 사용 ("/" 포함, "()" "°" 만 제거)
    │     → corsproxy.io 경유 golftradingpost.ca/search/suggest.json 호출
    │     → 인앱 패널에 제목 + 가격 표시 (최대 6개)
    │     → 패널 하단에 [Open eBay Canada] 버튼 노출
    │          └─ eBay도 TITLE 전체 그대로 사용 ("/" 포함) + " used" 추가
    │  [Save & Next] 클릭
    │     → saveEntry() → generateCode() → localStorage 저장
    │     → resetCapture() → Screen 1으로 복귀
    │
    ▼
⑤ Screen 3: List (목록)
    │  등록 항목 테이블 표시 + 통계 (Total / Today / Total Value)
    │  행 편집 (openEditModal) / 삭제 (deleteEntry)
    │  [Export CSV] → golf_clubs_YYYYMMDD.csv 다운로드
    │  [Clear All] → 전체 삭제
```

---

## 3. 핵심 함수 상세 설명

### 3-1. 이미지 처리 파이프라인

```javascript
captureImage(part, idx)
  └── file input .click() 트리거

onCapture(part, idx, input)
  └── resizeImage(file, 1024, callback)
        └── FileReader → Image → Canvas (max 1024px, JPEG 85%)
        └── STATE.images[part][idx] = base64 dataUrl
        └── 썸네일 표시, capture-box 상태 업데이트
        └── updateCaptureStatus() → btn-analyze 활성화 여부 판단
```

- 촬영 순서: head[0] → head[1] → shaft[0] → shaft[1]
- Head 1장만 있어도 AI 분석 가능 (shaft는 선택)
- 이미지 전처리로 API 비용 절감 및 속도 향상

---

### 3-2. Claude Vision API 호출

```javascript
callClaudeVision(images, preType)
```

**요청 구조:**
- 최대 4장 이미지 (null인 경우 스킵)
- 각 이미지에 라벨 텍스트 삽입:
  - Photo 1: Head 1 — Brand & Model name
  - Photo 2: Head 2 — Loft angle (degrees)
  - Photo 3: Shaft — Brand name label
  - Photo 4: Shaft — Model name & Flex label
- `preType` 지정 시 → club_type 강제 지정 힌트 추가
- Photo 2는 항상 loft 각도 전용임을 명시하는 힌트 포함

**응답 파싱:**
- JSON 추출 (markdown 코드블록 ` ```json ``` ` 도 처리)
- 실패 시 → `goToEditManual()` (수동 입력 폴백)

**API 설정:**
- `anthropic-dangerous-direct-browser-access: true` 헤더 필수
- 모델: Sonnet 4.6 (기본) / Haiku 4.5 / Opus 4.6 선택 가능
- max_tokens: 1024

---

### 3-3. VGT Price 인앱 조회 (v9 신규)

```javascript
triggerMarketSearch()
```

**동작 방식:**
1. TITLE 필드 값을 검색어로 사용 — `"/"` **그대로 포함**, `()` `°` `"` 만 제거
2. Shopify `/search/suggest.json` 엔드포인트 호출
3. GitHub Pages → Shopify 직접 호출 불가(CORS) → **corsproxy.io 프록시** 경유
4. 결과를 인앱 패널에 카드 형태로 표시 (제목 + 가격, 최대 6개)
5. 타임아웃: 15초 (AbortController 수동 설정)
6. 실패 시 폴백: VGT Store 직접 검색 링크 표시

```javascript
// TITLE 내용 그대로 — "/"는 유지, "()" "°" 만 제거
const searchQ = title.replace(/[\(\)°"]/g, ' ').replace(/\s+/g, ' ').trim();
const shopifyUrl = `https://golftradingpost.ca/search/suggest.json?q=${encodeURIComponent(searchQ)}...`;
const proxyUrl   = `https://corsproxy.io/?${encodeURIComponent(shopifyUrl)}`;
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 15000);
const resp = await fetch(proxyUrl, { signal: controller.signal });
```

**가격 파싱 주의:**
- Shopify는 가격을 센트 단위로 반환하는 경우 있음 (예: 9000 = $90)
- `rawPrice > 1000` 휴리스틱으로 센트/달러 자동 판별

---

### 3-4. eBay Canada 검색

```javascript
triggerEbaySearch()
```

- TITLE 필드 내용 그대로 ("/" 포함) + " used" 추가하여 ebay.ca 새 탭 열기
- 검색 조건: 중고 상품(LH_ItemCondition=3000), 최저가순(_sop=15)
- VGT Price 패널 안에 있는 버튼으로 표시 (패널 열릴 때만 노출)

---

### 3-5. TITLE / SPEC 자동 생성

```javascript
regenerateFields()
```

**TITLE 형식:**
```
{Brand} {Type} / {Model} / {Degrees or ClubNum} / {Flex} [/ Women] [/ Lefty] [* {Condition}]
```

**SPEC 형식:**
```
{Shaft} shaft, {Weight}g, {Flex-full}, [{Pcs},] {Degrees} degrees, {Gender}'s {Handed}-handed[, {Grip} grips][, ** {Condition}]
```

**타입별 특수 처리:**

| Type | 특수 처리 |
|------|-----------|
| Wood / Hybrid | club number dropdown (LOFT_TABLE 참조), degrees 자동 입력 없음 |
| Iron Set | pcs 분석 필드 표시, `parseIronSetPcs()` 호출 |
| Wedge | SW/AW/GW/LW dropdown, flex 기본값 '-' |
| Putter | 길이 필드 표시 (기본 34"), flex 생략 |

**LOFT_TABLE:**
```javascript
Wood  Men:   3W=15.0, 5W=18.5, 7W=21.5 ...
Wood  Women: 3W=16.5, 5W=20.5, 7W=23.5 ...
Hybrid Men:  3H=19.5, 5H=24.5, 7H=30.5 ...
```

**Flex 코드 ↔ 전체 표기:**
```
'-' → (생략)   'R' → Regular-flex   'S' → Stiff-flex
'R(S)' → Stiff/Regular-flex         'X' → eXtra stiff-flex
'L' → Ladies-flex   'A' → A(Senior)-flex   'W' → Wedge-flex
```

---

### 3-6. 코드 생성 규칙

```javascript
generateCode()
```

- 형식: `YYMM` + 4자리 순번 (2001부터 시작)
- 예: 2026년 4월 → `26042001`, `26042002`, ...
- STATE.entries 전체 참조하여 중복 없이 유일한 코드 생성
- 충돌 시 1씩 증가하여 safe 코드 확보

---

### 3-7. 데이터 지속성

```javascript
saveToStorage()    // localStorage.setItem('golf_entries', JSON.stringify(...))
```

- `golf_entries`: 사용자 등록 항목 (localStorage)
- `claude_api_key`: API 키 (localStorage, 마스킹 표시)
- `claude_model`: 선택 모델 (localStorage)

---

### 3-8. CSV 내보내기

```javascript
exportCSV()
```

- 컬럼: `NO, Full Set, TITLE, SPEC, PRICE, COST`
  - ⚠️ 'Full Set' 컬럼명은 실제로 TYPE 필드 (known bug, improve-plan 참조)
- BOM(`\uFEFF`) 포함 → 한글 엑셀 호환
- CSV 인젝션 방어: `=`, `+`, `-`, `@`, 탭, 개행 시작 셀에 `'` 접두사 추가
- 파일명: `golf_clubs_YYYYMMDD.csv`

---

## 4. Service Worker 캐싱 전략

```javascript
// sw.js — CACHE_VERSION = 'v6'
```

| 리소스 | 전략 |
|--------|------|
| index.html, manifest.json 등 정적 자산 | Network-first → Cache fallback |
| api.anthropic.com, corsproxy.io | 캐시 우회 (항상 네트워크) |

- 버전 업 시 sw.js의 `CACHE_VERSION`을 수동으로 올려야 캐시 자동 갱신
- v9: golf_db.json 제거로 SW 캐시 목록도 간소화

---

## 5. 상태(STATE) 객체 구조

```javascript
STATE = {
  images: {
    head:  [dataUrl|null, dataUrl|null],   // Head 1, 2
    shaft: [dataUrl|null, dataUrl|null],   // Shaft 1, 2
  },
  entries:    [...],      // localStorage에서 복원된 등록 항목들
  editIndex:  -1,         // 편집 모달에서 현재 편집 중인 항목 인덱스
  gender:  'Men',         // 마지막 사용된 Gender (다음 등록에 유지)
  handed:  'Right',       // 마지막 사용된 Handed (유지)
  grip:    'Standard',    // 마지막 사용된 Grip (유지)
}
```

> v9에서 제거된 STATE 필드: `golfDb`, `lastAiResult`, `matchedItem`, `_matches`

---

## 6. 코드 리뷰 — 잘된 점 ✅

1. **단일 파일 PWA**: 서버 설정 없이 GitHub Pages에서 즉시 사용 가능. 배포·유지 간편.

2. **이미지 전처리**: API 호출 전 1024px로 리사이징(JPEG 85%)하여 전송 데이터 최소화 → 응답 속도 향상 및 API 비용 절감.

3. **VGT Price 인앱 조회**: corsproxy.io를 통해 자사 Shopify 스토어 가격을 앱 내에서 바로 조회. 실패 시 직접 링크로 자동 폴백.

4. **타입별 동적 UI**: Iron Set pcs 필드, Putter 길이 필드, Wood/Hybrid 클럽 번호 드롭다운이 타입 선택에 따라 자동으로 표시/숨김.

5. **CSV 인젝션 방어**: `=`, `+`, `-`, `@` 시작 값에 `'` 접두사 추가. 엑셀 수식 실행 방지.

6. **XSS 방어**: `escHtml()` 함수로 HTML 렌더링 시 사용자 데이터 이스케이프 처리.

7. **localStorage 손상 처리**: JSON 파싱 실패 시 try/catch로 초기화, 경고 토스트 표시.

8. **지속적 Gender/Handed/Grip 유지**: 저장 시 STATE에 마지막 값 기억 → 같은 조건 연속 등록 시 편의성.

9. **debounce 처리**: `regenerateFields()` 연속 호출 시 150ms debounce 적용, 타이핑 중 불필요한 재계산 방지.

10. **AbortController 타임아웃**: `AbortSignal.timeout()` 대신 수동 `AbortController + setTimeout`으로 구형 브라우저 호환성 확보.

11. **DB 제거로 초기 로드 2.8MB 감소**: 앱 실행 시 더 이상 golf_db.json(2.4MB)을 fetch하지 않아 체감 속도 대폭 향상.

---

## 7. 코드 리뷰 — 개선 가능한 점 ⚠️

### 7-1. API 키 보안 (낮은 위험, 개인 사용 범위 내 허용)
- `localStorage`에 평문 저장. 브라우저 개발자도구에서 확인 가능.
- **현재 수준**: 개인 스마트폰 전용 앱이므로 실용적으로 허용 가능.

### 7-2. localStorage 용량 제한
- 브라우저별 5~10MB 한도. 텍스트 데이터만 저장되므로 수천 건도 가능하지만, 적극적인 용량 경고는 없음.
- `saveToStorage()` 실패 시 에러 토스트는 있음.

### 7-3. dead code (경미, 기능에 무영향)
```javascript
// 잔재 1: Storefront API 시도 흔적 — 호출부 없음, 무해
function getVGTToken() { return localStorage.getItem('vgt_storefront_token') || ''; }

// 잔재 2: 미사용 CSS 클래스
.btn-market { ... }
.btn-market-vgt { ... }

// 잔재 3: 미사용 파라미터
function populateEditForm(aiResult, matches = []) { ... }
// matches는 퍼지 매칭 제거 후 사용처 없음
```

### 7-4. 코드 중복: `goToEditManual()` vs `populateEditForm()`
- 두 함수 모두 편집 폼 초기화를 수행하지만 별개로 구현됨.
- 공통 `resetEditForm()` 함수로 추출하면 유지보수 용이.

### 7-5. Service Worker 버전 수동 관리
```javascript
const CACHE_VERSION = 'v6';  // sw.js
```
- 코드 변경 시 이 값을 수동으로 올려야 캐시가 갱신됨.
- 잊으면 사용자가 구버전 캐시를 계속 사용하게 됨.

### 7-6. CSV 헤더 불일치 ✏️ 수정 예정
```javascript
const headers = ['NO','Full Set','TITLE','SPEC','PRICE','COST'];
//                      ^^^^^^^^ 실제 데이터는 TYPE 필드
```
- `'Full Set'` → `'TYPE'` 으로 수정 필요 (improve-plan 2-7 참조)

### 7-7. VGT Price 가격 파싱 휴리스틱
```javascript
rawPrice > 1000 ? (rawPrice / 100).toFixed(0) : rawPrice.toFixed(0)
```
- Shopify 스토어에 따라 센트/달러 혼용. `> 1000` 기준이 정확하지 않을 수 있음.
- 현재 golftradingpost.ca 기준으로는 정상 작동 확인됨.

### 7-8. 이벤트 리스너 중복 등록 ✅ 수정 완료 (2026-04-06)
```javascript
const SKIP_REGEN_IDS = new Set(['f-type', 'f-putter-length']);
document.querySelectorAll('#screen-edit .form-input').forEach(el => {
  el.addEventListener('input', debouncedRegenerate);
  if (!SKIP_REGEN_IDS.has(el.id)) {
    el.addEventListener('change', regenerateFields);
  }
});
```

### 7-9. Iron Set pcs 파싱 엣지케이스 ✅ 수정 완료 (2026-04-06)
```javascript
// 8pcs(3-9) → 수정 전: #3,4,5,6,7,8,9,9 / 수정 후: #3,4,5,6,7,8,9
const endLetters = m[3].split(',')
  .map(l => l.trim().toUpperCase())
  .filter(l => l.length > 0 && isNaN(Number(l)));
```

---

## 8. 데이터 매핑 기준 요약

### TITLE 생성 규칙
| Type | 형식 |
|------|------|
| Driver | `Brand Driver / Model / 10.5 / S` |
| Wood | `Brand Wood / Model / 5W(18.5) / S` |
| Hybrid | `Brand Hybrid / Model / 3H(19.5) / R` |
| Iron Set | `Brand Iron Set / Model / R / 7pcs` |
| Wedge | `Brand Wedge / Model / SW(56.0)` |
| Putter | `Brand Putter / Model / 34"` |

### Flex 코드표
| 코드 | TITLE 표시 | SPEC 표시 |
|------|-----------|-----------|
| R | R | Regular-flex |
| S | S | Stiff-flex |
| R(S) | R(S) | Stiff/Regular-flex |
| X | X | eXtra stiff-flex |
| L | L | Ladies-flex |
| A | A | A(Senior)-flex |
| W | (생략) | Wedge-flex |

---

## 9. 배포 및 운영 가이드

### 로컬 실행
```
start_server.bat 더블클릭
→ http://[IP]:8080/app/
```

### GitHub Pages 배포
```
# push.bat 대신 (원격에 다른 커밋 존재 시):
git push origin main --force

# 일반적인 경우:
push.bat 더블클릭
→ https://vgolftradingpost-jinkim.github.io/golf-registration-app/app/
```

### 코드 변경 후 캐시 갱신
1. `sw.js` 파일 열기
2. 1번 줄 `CACHE_VERSION`을 현재 버전에서 +1 증가 (현재: v6)
3. push → 사용자 기기에서 앱 새로고침

---

## 10. 향후 개발 제안

| 우선순위 | 기능 | 상태 | 설명 |
|----------|------|------|------|
| 🔴 높음 | Iron Set pcs 버그 수정 | ✅ 완료 (v8) | `8pcs(3-9)` 숫자 중복 이슈 수정 |
| 🔴 높음 | DB 퍼지 매칭 제거 + VGT Price 추가 | ✅ 완료 (v9) | DB 의존성 제거, 인앱 가격 조회 구현 |
| 🟡 중간 | 이중 이벤트 호출 수정 | ✅ 완료 (v8) | SKIP_REGEN_IDS 처리 |
| 🟡 중간 | SW 버전 갱신 | ✅ 완료 (v8) | v5 → v6 |
| 🟡 중간 | CSV 컬럼명 수정 | 미완 | 'Full Set' → 'TYPE' |
| 🟡 중간 | Cloud 백업 | 미완 | Shopify/Google Sheets/GitHub Gist 연동 |
| 🟡 중간 | 용량 경고 | 미완 | 4MB 초과 시 토스트 경고 |
| 🟢 낮음 | dead code 정리 | 미완 | getVGTToken(), .btn-market CSS, matches 파라미터 |
| 🟢 낮음 | 코드 모듈화 | 미완 | 단일 파일 → JS/CSS 모듈화 |

---

*분석 작성: Claude (Cowork mode) | 2026-04-06*
*v9 업데이트 반영: 2026-04-08 (DB 퍼지 매칭 제거, VGT Price 인앱 조회 추가)*
