# Code Review — Golf Club Registration App

> 리뷰 일자: 2026-05-30
> 대상 버전: v11 (`app/index.html` 1,723줄, `app/sw.js` 46줄)
> 검토자: Claude (Cowork mode)
> 검토 범위: 전체 파일 정밀 분석 (소스/문서/배치 스크립트)

---

## 0. 한눈에 보기 (Executive Summary)

| 영역 | 상태 | 핵심 발견 |
|------|------|-----------|
| 프로세스 흐름 | 양호 | Capture → Edit → List 분리 명확, 단일 파일 PWA로 배포 간단 |
| 데이터 정합성 | 결함 | **CSV 헤더 `Full Set` ≠ 실제 데이터 `TYPE`** (improve-plan 2-7 미수정) |
| Service Worker | 결함 | **삭제된 `golf_db.json` / `brands.json`을 SW가 여전히 캐시 시도** (404 발생) |
| 중복/Dead Code | 보통 | `populateEditForm` ↔ `goToEditManual` 70% 중복, `getVGTToken` 등 잔재 |
| 문서·지침 일관성 | 보통 | docs/data_analysis.md의 Flex 정규화와 실제 코드 매핑이 불일치 |
| 보안 | 양호 | API Key 마스킹, XSS escHtml, CSV 인젝션 방어 OK. localStorage 평문은 개인용 허용 |
| 오류 복원력 | 보통 | localStorage 손상 처리는 OK, 그러나 AI JSON 파싱·네트워크 실패 시 사용자 안내가 단순 |

**즉시 수정 권장 (4건)**: SW 캐시 항목 정리 / CSV 헤더 수정 / Dead code 제거 / docs Flex 규격 코드와 일치화.

---

## 1. 전반적인 프로세스 점검 및 개선사항

### 1-1. 프로세스 흐름 (현재)

```
[Capture] 사진 6장 → resizeImage(1024px) → STATE.images
    │
[Analyze] callClaudeVision() → Anthropic API 직접 호출 → JSON 파싱
    │
[Edit] populateEditForm() → regenerateFields() → TITLE/SPEC 자동생성
    │   ├─ triggerMarketSearch (corsproxy.io → Shopify)
    │   └─ triggerEbaySearch (ebay.ca)
    │
[Save] generateCode() → STATE.entries.push → saveToStorage(localStorage)
    │
[List] renderList() → exportCSV()
```

흐름은 직관적이고 단계 분리가 명확하지만, 다음 구조적 개선 여지가 있음:

#### 개선 1) "정제 규칙"이 코드와 문서 두 곳에 따로 존재 — Single Source of Truth 부재

`docs/data_analysis.md`의 7-3절(Flex 정규화)은 **SPECIFICATION 표기를 `Regular`, `Stiff`, `Extra Stiff`, `Senior`** 로 명시하지만, `app/index.html` 1291–1301줄의 `flexMap`은 **`Regular-flex`, `Stiff-flex`, `eXtra stiff-flex`, `A(Senior)-flex`** 로 다르게 매핑되어 있음. 즉 docs와 코드가 서로 다른 규칙을 주장 중.

→ 권장: docs를 코드의 실제 동작에 맞춰 갱신하거나, 매핑 테이블을 `app/rules.js` 하나로 추출하고 docs는 그 파일을 참조하게 함. (코드 모듈화 전이라도 `index.html` 상단에 `const RULES = { flexMap: ..., loftTable: ..., brandNormalization: ... }` 객체로 한곳에 모으는 것만으로도 개선됨.)

#### 개선 2) 데이터 정규화(Brand/Type) 단계가 사실상 빠져있음

docs 7-1, 7-2는 브랜드/타입 표기 정규화를 명시하지만, 코드에는 `taylormade` → `TaylorMade` 같은 변환 로직이 **없음**. AI가 반환한 값이 그대로 TITLE에 들어가므로, AI 출력에 따라 표기가 흔들리면 CSV/엑셀 데이터가 비일관해짐.

→ 권장: `populateEditForm()` 진입 직후 `normalizeBrand()`/`normalizeType()` 호출 추가. 약 30줄 분량의 lookup 테이블이면 충분.

#### 개선 3) 엑셀 출력이 CSV 1종뿐 — 사용자 글로벌 규칙과 불일치

사용자 글로벌 지시: "골프 클럽 데이터는 엑셀 형식으로 변환해줘", "엑셀 파일 생성 시 데이터 셀 배경색은 항상 무색". 그러나 현재 `exportCSV()`만 존재. 향후 .xlsx 다운로드(SheetJS 등) 추가 시 글로벌 규칙(배경 무색) 일치 가능.

#### 개선 4) AI 호출 단계의 비용/안정성 보강 여지

- 6장(head 3 + shaft 3) × 1024px JPEG → 1회 호출당 약 400~700KB. 호출당 토큰량 큼.
- `max_tokens: 1024` 고정 — 응답이 잘리는 케이스에 대한 retry 없음.
- 네트워크 일시 오류 시 자동 1회 재시도(`retry: 1, backoff 1s`) 추가 권장.

#### 개선 5) Screen 2의 "동일 항목 일부만 바꿔 재저장" UX

`saveOnly()`로 같은 폼에서 반복 저장 가능. 매우 유용한 패턴이지만, **저장된 항목과 폼이 동기화되지 않음** — 동일 폼에서 저장 후 가격만 바꿔 누르면 새 코드가 부여된 별도 항목이 추가됨. 사용자가 의도한 행위가 "복제 저장"인지 "수정"인지 모호.

→ 권장: `saveOnly()` 직후 토스트에 "마지막 항목 수정" 버튼을 노출하거나, 명시적 모드(복제/수정) 선택을 도입.

### 1-2. Service Worker — 캐시 목록 무효 (즉시 수정)

`sw.js` 2–10번줄:
```js
const ASSETS = [
  './', './index.html', './manifest.json',
  './golf_db.json',   // ← v9에서 삭제됨
  './brands.json'     // ← v9에서 삭제됨
];
```
삭제된 파일을 매번 install 시 fetch 시도 → 404. `Promise.allSettled`로 감싸서 전체 설치 실패는 막혀 있지만, 매 install 마다 콘솔 404 + 불필요한 네트워크 트래픽 발생.

→ 권장: ASSETS를 다음으로 축소.
```js
const ASSETS = ['./', './index.html', './manifest.json',
                './icon-192.png', './icon-512.png'];
```
그리고 `CACHE_VERSION = 'v7'`로 1단계 올려 사용자 기기 갱신.

### 1-3. 캐시 우회 규칙 누락

`sw.js` 33번줄은 `api.anthropic.com`만 캐시 우회. 그러나 `corsproxy.io` 경유 Shopify 호출도 동적 데이터이므로 캐시되면 안 됨.

→ 권장:
```js
if (e.request.url.includes('api.anthropic.com') ||
    e.request.url.includes('corsproxy.io') ||
    e.request.url.includes('golftradingpost.ca')) return;
```

---

## 2. 중복 코드 및 규칙 개선사항

### 2-1. `populateEditForm` ↔ `goToEditManual` (약 30줄 중복)

두 함수가 폼 리셋 로직 거의 동일. 차이점은 "AI 결과 채우기 vs 빈 값". `index.html` 950~1017줄과 1089~1125줄.

→ 권장 리팩토링:
```js
function resetEditForm() {
  // 모든 f-* 필드 default 적용 (preview img, iron-pcs-group 숨김 등)
  ...
}
function populateEditForm(aiResult) {
  resetEditForm();
  // AI 값 덮어쓰기만 수행
  ...
}
function goToEditManual() {
  resetEditForm();
  showScreen('edit');
}
```
약 35줄 절감 + 폼 default 변경 시 한 곳만 수정.

### 2-2. `saveOnly` ↔ `saveEntry` (약 25줄 중복)

`saveOnly`(1483–1515)와 `saveEntry`(1520–1553)의 차이는 마지막 2줄(`resetCapture()` + `showScreen('capture')` 유무)뿐.

→ 권장:
```js
function buildEntry() { /* 폼 → entry 객체 변환 */ }
function persistEntry() {
  const e = buildEntry();
  if (!e) return false;          // 검증 실패
  STATE.entries.push(e);
  saveToStorage();
  return true;
}
function saveOnly()  { if (persistEntry()) toast('Saved!'); }
function saveEntry() { if (persistEntry()) { toast('Saved!'); resetCapture(); showScreen('capture'); } }
```

### 2-3. 폼 default 값이 여러 곳에 흩어짐

`f-putter-length='34"'`, `f-flex='R'`(manual) 또는 `'-'`(Wedge/Putter), `Graphite` 등이 `populateEditForm`, `goToEditManual`, `type-change` 리스너 세 곳에서 각자 명시. 한 곳에서 default를 바꾸면 다른 곳을 잊기 쉬움.

→ 권장: 모듈 상단에 `const FORM_DEFAULTS = { ... }` 객체 도입.

### 2-4. SPEC 생성 분기 복잡도

`regenerateFields()` 1304–1366의 SPEC 조립부에 `isWoodHybrid`, `Wedge`, `Putter`, `Etc`, `degrees only`, 5개 분기가 if/else로 늘어져 있음. 향후 새 타입 추가 시 누락 위험.

→ 권장: 타입별 SPEC 생성 함수를 객체로 분리.
```js
const SPEC_BUILDERS = {
  'Wood':   ({clubNumRaw, degrees}) => ...,
  'Hybrid': ({clubNumRaw, degrees}) => ...,
  'Wedge':  ({clubNumRaw, degrees}) => ...,
  'Putter': ({putterLen}) => ...,
  'Iron Set': ({ironPcs}) => ...,
  default:  ({degrees}) => ...
};
```

### 2-5. Wood/Hybrid에서 `Woods` vs `Hybrid` 단복수 불일치

1320–1322줄: Hybrid는 단수 `"3 Hybrid"`, Wood는 복수 `"5 Woods"`. 의도된 규칙인지, 표기 오류인지 docs로 확정 필요. docs 5-Wood 예시(`5W, 18.0 degrees`)와도 양식이 다름.

### 2-6. `head1-sub`/`head2-sub`/`head3-sub` 동적 라벨이 무의미

`onCaptureTypeChange()` 802–804줄에서 `isWH` 분기가 양 분기 모두 동일 문자열을 세팅함. 함수 자체가 사실상 no-op.

```js
document.getElementById('head1-sub').textContent = isWH ? 'Brand / Model' : 'Brand / Model';
```
→ 제거하거나, 실제로 Wood/Hybrid 시 다른 안내(`'Sole / Loft'` 등)를 노출하도록 의도를 살림.

### 2-7. CSV 컬럼명 결함 — `'Full Set'` (1694줄, **즉시 수정 권장**)

```js
const headers = ['NO','Full Set','TITLE','SPEC','PRICE','COST'];
//                      ^^^^^^^^ 실제 e.type
```
improve-plan 2-1이 미완 상태. `'TYPE'`으로 즉시 교체. 더불어 사용자 글로벌 지시(엑셀화)에 맞춰 컬럼 확장 권장:
```js
const headers = ['NO','TYPE','BRAND','MODEL','TITLE','SPEC','PRICE','COST','GENDER','HANDED','GRIP','DATE'];
```

### 2-8. localStorage 키 네임스페이스

`claude_api_key`, `claude_model`, `golf_entries`, `vgt_storefront_token` 4개 키가 평면적으로 존재. 향후 백업/리셋 시 누락 위험.

→ 권장: `const STORAGE_KEYS = { ... }` 상수화 + `resetAllStorage()` 유틸 도입.

---

## 3. 기타 과거 실행오류 등 불필요한 지침 효율화 대상

### 3-1. Dead Code (즉시 제거 권장)

| 항목 | 위치 | 비고 |
|------|------|------|
| `getVGTToken()` 함수 | index.html 678 | Storefront API 시도 잔재. 호출부 0건 |
| `.btn-market` / `.btn-market-vgt` CSS | index.html 152–154 | HTML에서 사용 안 됨 |
| `populateEditForm(aiResult, matches=[])` 두번째 파라미터 | 950 | 퍼지 매칭 제거 후 미사용 |
| `golf_db.json`/`brands.json` SW 캐시 | sw.js 8–9 | **파일 자체가 삭제됨** |
| `CAPTURE_SEQUENCE` 상수 | 744–751 | 정의만 되고 참조되는 곳 없음 |
| `length-input-wrap` 관련 빈 기본값 | 985, 1109 | 동일 reset 로직 두 곳 — §2-1과 함께 통합 |

### 3-2. 사용되지 않는 PWA 자원

`manifest.json`이 `golf_db.json`을 직접 참조하지는 않지만, SW의 `ASSETS` 목록과 워크플로우 문서의 "v9에서 제거됨" 표시가 코드에 미반영 — 코드와 문서의 시점이 다름.

### 3-3. 워크플로우 문서 시점 불일치

| 문서 | 마지막 갱신 | 실제 코드 시점 |
|------|------------|---------------|
| CLAUDE.md | v11 (2026-04-25) | ✅ 최신 |
| workflow.md | v11 (2026-04-25) | ✅ 최신 |
| improve-plan.md | **v9 (2026-04-08)** | v11과 2버전 차이 |
| docs/data_analysis.md | 2026-03-29 | v11과 2개월 차이, golf_inventory.xlsx 삭제됐는데 여전히 "파일 위치" 표기 |

→ 권장: improve-plan.md를 v11 기준으로 갱신하면서 완료된 §2-1(CSV 헤더), §2-2(dead code)는 "완료"로 옮기거나 우선순위 재정렬.

### 3-4. 배치 스크립트의 `--force` 상시화 위험

`push.bat` 53번줄:
```bat
git push origin main --force
```
과거 토큰 노출 커밋 제거를 위해 도입됐지만 일상 push에 `--force`가 항상 적용되는 상태. 협업/실수로 다른 커밋 덮어쓸 위험. 1인 사용이라도 사고 시 복구 불가.

→ 권장: 일반 푸시는 `git push origin main`으로 되돌리고, 히스토리 재작성 전용 `reset_and_push.bat`만 `--force` 유지.

### 3-5. `start_server.bat`의 IP 파싱 취약점

`ipconfig` 출력 첫 IPv4를 사용하는데, 가상 어댑터(WSL, VPN, Hyper-V)가 먼저 등장하면 폰에서 접근 불가. 한 번 잡힌 IP가 의도한 인터페이스가 아닐 수 있음.

→ 권장: 활성 인터페이스만 필터링(`netsh interface ipv4 show config name="Wi-Fi"`).

### 3-6. AI 프롬프트 내 한국어/영어 혼용

`callClaudeVision()` 863–877은 한국어로 지시문이 작성됨. Claude는 잘 처리하지만, 모델 변경/타사 API 전환 시 호환성 저하. 또한 응답 일관성 측면에서 전체 영문 통일이 안정적.

→ 권장: 프롬프트 영문화 + brand_hint(상위 20개) 추가(improve-plan 2-3 반영).

---

## 4. 오류 재발 방지를 위한 개선사항

### 4-1. AI JSON 파싱 견고성

현재(905–908):
```js
const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
if (codeMatch) jsonStr = codeMatch[1].trim();
return JSON.parse(jsonStr);
```
- `JSON.parse` 실패 시 catch 없음 → `analyzePhotos()`의 상위 catch에서 일반 오류로 표시 → 사용자는 "왜 실패했는지" 모름.
- 응답에 콘솔 로그가 남지 않으면 디버깅 불가.

→ 권장:
```js
try { return JSON.parse(jsonStr); }
catch (e) {
  console.error('AI JSON parse failed. Raw:', text);
  throw new Error('AI 응답 형식 오류 — 다시 시도하거나 수동 입력으로 진행하세요.');
}
```

### 4-2. 네트워크 오류 분류 부족

`analyzePhotos()` catch(936–947)는 `401/authentication/API key`만 분기. 다음 케이스에 사용자 안내가 모호:
- `rate_limit_error` (429)
- `overloaded_error` (529)
- 오프라인 (`navigator.onLine === false`)
- timeout

→ 권장: 진입부에 `if (!navigator.onLine)` 체크, catch에서 상태별 메시지 매핑.

### 4-3. localStorage 용량 임박 경고 (improve-plan 1-2 미완)

`saveToStorage()`(1555)는 실패 시 토스트만. 4MB 임계 도달 시 사전 경고로 데이터 손실 예방.

```js
function saveToStorage() {
  try {
    const json = JSON.stringify(STATE.entries);
    localStorage.setItem('golf_entries', json);
    const sizeKB = new Blob([json]).size / 1024;
    if (sizeKB > 4096) {
      toast(`저장 용량 ${sizeKB|0}KB — CSV 내보내기 후 정리 권장`, true);
    }
  } catch(e) { ... }
}
```

### 4-4. `generateCode` 중복 검사 범위 한계

1466–1477줄: 동일 월(`pfx`) 내 최대 순번 +1. 그러나 `maxSeq=2000` 초기값이라 **빈 월에 첫 등록 시 무조건 2001**. 이미 다른 기기에서 입력한 항목과 충돌 가능(다기기 동기화 시).

→ Cloud 백업 도입 전까지는 큰 문제 없으나, improve-plan 1-1(Cloud 백업)과 함께 묶어 처리 권장.

### 4-5. `regenerateFields()` 입력 이벤트의 race condition

`debouncedRegenerate`(150ms)와 즉시 `regenerateFields()`가 동일 폼에서 둘 다 트리거됨(1417, 1419). `change`로 즉시 호출되면 debounce된 input과 충돌 가능. SKIP_REGEN_IDS 처리가 일부 입력만 면제하므로, 실제로 사용자 체감 버그가 발생하면 진단 어려움.

→ 권장: input은 debounce, change는 즉시 호출이 의도라면 주석으로 명시. 또는 모두 debounce로 단일화.

### 4-6. `parseIronSetPcs` 입력 검증 누락

`7pcs(4-P,A,A)`처럼 중복 letter 입력 시 그대로 통과(`#4,5,6,7,8,9,P,A,A`). 또한 `0pcs(4-P)` 같은 비논리 입력도 통과.

→ 권장: letters dedup + 1≤count≤14 범위 체크.

### 4-7. CSV/엑셀 파일명 충돌

`golf_clubs_YYYYMMDD.csv` — 같은 날 두 번 export 시 브라우저가 `(1)` 접미사로 처리하지만, 의도된 동작은 아님. 권장: `golf_clubs_YYYYMMDD_HHmm.csv`.

### 4-8. PWA 캐시 갱신 누락 위험 (재발 방지 핵심)

`CACHE_VERSION` 수동 +1은 잊기 쉬움. 실제로 v8 → v9 전환 시 사용자 기기에서 구버전 잔존 보고가 있었음을 추정.

→ 권장: `push.bat`이 push 직전 `sw.js`의 `CACHE_VERSION`을 오늘 날짜로 자동 치환(`2026-05-30`). PowerShell 한 줄로 가능.

```bat
powershell -Command "(Get-Content app\sw.js) -replace \"CACHE_VERSION = '[^']*'\", \"CACHE_VERSION = '%date:~10,4%%date:~4,2%%date:~7,2%'\" | Set-Content app\sw.js"
```

### 4-9. API Key 노출 재발 방지

`.gitignore`에 `*.env`, `.env`만 있음. `api/github_access tokens_20260423.txt` 같은 평문 토큰 파일이 `api/` 폴더에 들어가 있음 — **이미 커밋되었다면 위험**. 다음을 .gitignore에 추가 권장:
```
api/*token*
api/*api*
api/secrets/
```
그리고 `api/github_access tokens_20260423.txt`의 git 추적 상태 확인(`git ls-files api/`).

### 4-10. 문서 갱신 자동화

사용자 프로젝트 규칙 4번 "재오류 방지를 위해 오류 및 개선사항을 관련문서에 업데이트"가 명시되어 있으나, 현재 문서 갱신은 수동. 권장: `push.bat` 또는 별도 `update_docs.bat`이 git log에서 마지막 커밋 메시지를 `CHANGELOG.md`에 append.

---

## 5. 우선순위 정리 (실행 가능 체크리스트)

### 🔴 즉시 (오늘 안에 처리 권장, 30분 이내)
- [ ] `sw.js` ASSETS에서 `golf_db.json`, `brands.json` 제거 + `CACHE_VERSION = 'v7'`
- [ ] `sw.js` 캐시 우회 목록에 `corsproxy.io`, `golftradingpost.ca` 추가
- [ ] `exportCSV()` 헤더 `'Full Set'` → `'TYPE'` 교체
- [ ] Dead code 제거: `getVGTToken`, `.btn-market*`, `CAPTURE_SEQUENCE`, `populateEditForm`의 `matches` 파라미터
- [ ] `api/` 폴더 토큰 파일 git 추적 여부 확인 + `.gitignore` 보강

### 🟡 1~2주 내 (구조 개선)
- [ ] `populateEditForm` ↔ `goToEditManual` ↔ `saveOnly` ↔ `saveEntry` 공통화 (`resetEditForm`, `buildEntry`)
- [ ] `FORM_DEFAULTS`, `RULES`(flexMap, loftTable, brandNorm) 상수화
- [ ] AI JSON 파싱 try/catch + 에러 메시지 세분화
- [ ] localStorage 4MB 임계 경고 추가
- [ ] `push.bat`의 상시 `--force` 제거 + `CACHE_VERSION` 자동 갱신 스크립트
- [ ] `improve-plan.md`를 v11 기준으로 갱신

### 🟢 1개월~장기
- [ ] docs/data_analysis.md의 Flex 표기를 코드와 일치하게 갱신 (또는 코드를 docs에 맞춤)
- [ ] AI 프롬프트 영문화 + 브랜드 hint 20종 + putter_length 필드 추가
- [ ] xlsx 출력(SheetJS) 도입 — 사용자 글로벌 규칙(배경 무색) 반영
- [ ] Cloud 백업(GitHub Gist 권장) — generateCode 충돌 방지와 연계
- [ ] 단일 파일 PWA → 모듈 분리 (`rules.js`, `ai.js`, `export.js`)

---

## 6. 잘 작성된 부분 (유지·확장 권장)

1. **CSV 인젝션 방어**(`csvCell`) — `=,+,-,@,탭,개행` 시작 셀에 `'` prefix. 표준 모범 사례.
2. **XSS 방어**(`escHtml`) — DOM 텍스트 노드를 거쳐 안전한 HTML 생성. 간결하고 정확.
3. **이미지 1024px 리사이즈** — API 비용·속도·대역 모두 절감.
4. **localStorage 손상 복원** — JSON.parse try/catch + 자동 초기화 + 콘솔 경고.
5. **debounce(150ms)** — 타이핑 중 과도한 regenerate 방지. 적절한 값.
6. **AbortController 수동 타임아웃** — `AbortSignal.timeout()`보다 호환성 우수.
7. **Persistent toggles** — Gender/Handed/Grip 마지막 값 유지로 연속 등록 편의성.

---

## 7. 부록 — 측정 가능한 지표

| 지표 | 현재값 | 목표 |
|------|--------|------|
| index.html 총 줄수 | 1,723 | 모듈 분리 후 핵심 JS 800줄 이하 |
| 함수 평균 길이 | ~40줄 | 25줄 이하 |
| 중복 코드 추정 | ~80줄 | §2 처리 시 35줄 |
| Dead code | ~15줄 | 0 |
| 문서-코드 일치율 | docs 7-3절 등 불일치 | 100% |
| SW 캐시 404 | 2건 (golf_db, brands) | 0건 |

---

*리뷰 작성: Claude (Cowork mode) | 2026-05-30*
*검토 기준 파일: `app/index.html` v11, `app/sw.js`, `docs/data_analysis.md`, `workflow.md`, `improve-plan.md`, `CLAUDE.md`, 배치 스크립트 일체*
