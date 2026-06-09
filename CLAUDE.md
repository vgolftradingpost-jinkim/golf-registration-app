# Golf Club Registration App — Project Context

## 프로젝트 개요
중고 골프채 등록용 모바일 PWA 앱.
스마트폰 카메라로 골프채 사진 촬영 → Claude Vision API 자동 인식 → 가격 조회 → 등록.

**사용자:** Jin (vgolftradingpost@gmail.com)
**GitHub:** https://github.com/vgolftradingpost-jinkim/golf-registration-app
**라이브 URL:** https://vgolftradingpost-jinkim.github.io/golf-registration-app/app/
**로컬 서버:** `start_server.bat` 더블클릭 → http://[IP]:8080/app/

---

## 파일 구조
```
03 registration_app/          ← 폴더명 변경 (구: 03 golf-club-app)
├── app/index.html   ← 메인 앱 (단일 파일 PWA)
├── docs/data_analysis.md
├── CLAUDE.md
├── start_server.bat / push.bat / setup_github.ps1 / reset_and_push.bat
```
> ⚠️ `golf_db.json`, `brands.json`, `golf_inventory.xlsx` 은 v9에서 삭제됨

---

## 앱 구조 (index.html)
- **Screen 1 (Capture):** Head1/Head2/Shaft1/Shaft2 사진 촬영 → AI 분석
- **Screen 2 (Edit):** AI 결과 편집 + VGT Price 인앱 조회 + eBay 링크 + 저장
- **Screen 3 (List):** 등록 목록 + CSV 내보내기
- **API:** `callClaudeVision()` → `https://api.anthropic.com/v1/messages` 직접 호출 (max_tokens: 1024)
- **VGT Price:** `triggerMarketSearch()` → corsproxy.io 경유 → golftradingpost.ca

---

## 데이터 기준 (매핑 규칙)

### TYPE
Driver / Wood / Hybrid / Iron Set / Wedge / Putter / Full Set / Etc / Shaft / Rental

### FLEX 코드 / 전체명
`-`(N/A) / R / S / R(S) / X / L / A / W(Wdg)
Regular-flex / Stiff-flex / Stiff/Regular-flex / eXtra stiff-flex / Ladies-flex / A(Senior)-flex / Wedge-flex

### TITLE 형식
`{Brand} {TYPE} / {Model} / {Degrees or ClubNum} / {Flex} [/ Women] [/ Lefty]`
- Wood/Hybrid: `TaylorMade Wood / SIM / 5W(18.5) / S`
- Iron Set: `Callaway Iron Set / Apex / R / 7pcs`

### SPEC 형식
`{shaft} shaft, {weight}g, {flex-full}, [pcs,] {degrees} degrees, {gender}'s {handed}-handed`
- Iron Set: `Stiff-flex, 7pcs(#4,5,6,7,8,9,P), Men's right-handed`
- Wedge/Putter: flex 생략

### CODE 규칙
`YYMM + 4자리 시퀀스(2001부터)` 예: 26042001

---

## LOFT_TABLE (Wood/Hybrid 자동 도수)
```
Wood Men:   2W=12.0, 3W=15.0, 4W=17.0, 5W=18.5, 7W=21.5, 9W=25.0
Wood Women: 2W=14.0, 3W=16.5, 4W=18.5, 5W=20.5, 7W=23.5, 9W=27.0
Hybrid Men: 2H=17.0, 3H=19.5, 4H=22.0, 5H=24.5, 6H=27.5, 7H=30.5
Hybrid Women: 2H=19.5, 3H=21.5, 4H=24.0, 5H=26.5, 6H=29.5, 7H=32.0
```

---

## 현재 상태 (v16, 2026-06-09) — 직접입력 순서 변경: Model 먼저 → Brand 자동확정(+수정) → Shaft 전체검색 (아래 v16 변경 참조)

## 이전 상태 (v15, 2026-06-04) — 1차 검증 피드백: SHAFT 전체 검색형 + VGT/eBay 조회 쿼리 단순화 (아래 v15 변경 참조)

## 이전 상태 (v14, 2026-06-04) — 직접 입력 UI 개편: 검색형 드롭다운 + 음성 제거 (아래 v14 변경 참조)

## 이전 상태 (v13, 2026-06-04) — 자판/음성 직접 입력 추가 (아래 v13 변경 참조)

## 이전 상태 (v12, 2026-05-30)
- 폴더명 변경: `03 golf-club-app` → `03 registration_app` (v11)
- Screen 2 하단 버튼 2개로 분리 (v11):
  - `Save` — 저장 후 현재 화면 유지 (일부 항목만 바꿔 재저장 가능)
  - `Save & Next` — 저장 후 캡처 화면으로 이동 (기존 동작)
- GitHub push 방식: git 히스토리 orphan 리셋 완료 (토큰 노출 커밋 제거)
- push.bat 경로 수정 완료 (`03 registration_app`)

### v12 변경 (2026-05-30, Code Review 1~3차 반영)

**1차 — 즉시 수정 4건**
- **SW 캐시 정리**: `sw.js` ASSETS에서 삭제된 `golf_db.json`/`brands.json` 제거, `icon-192/512.png` 추가, `CACHE_VERSION` v6 → **v7** 승급
- **캐시 우회 확장**: `corsproxy.io`, `golftradingpost.ca` 도메인도 항상 네트워크 직접 호출
- **CSV 헤더 수정**: `'Full Set'` → **`'TYPE'`** (실제 `e.type` 데이터와 일치)
- **Dead code 제거**: `getVGTToken()` 함수, `.btn-market`/`.btn-market-vgt` CSS, `CAPTURE_SEQUENCE` 상수, `populateEditForm`의 `matches` 파라미터
- **문서 동기화**: `docs/data_analysis.md` §7-3 Flex 표를 코드와 일치화

**2차 — 구조 개선 6건**
- **RULES / FORM_DEFAULTS 상수화**: flexMap, loftTable, typeNormalize, brandNormalize, conditionMap 통합
- **resetEditForm / buildEntry 공통화**: populateEditForm/goToEditManual/saveOnly/saveEntry 중복 통합 (-약 60줄)
- **AI JSON try/catch + 에러 분기**: parse_error/401/429/529/AbortError/network/오프라인 7단계
- **localStorage 4MB 경고**: saveToStorage 시 임계 초과 시 토스트 (세션당 1회)
- **push.bat 안전화**: 상시 `--force` 제거, sw.js `CACHE_VERSION` 자동 갱신(YYYYMMDD)
- **improve-plan.md v12 정리**: 완료 항목 18건 이동, 우선순위 재정렬

**3차 — 모듈 분리 및 기능 추가 4건**
- **AI 프롬프트 영문화** + RULES.brandNormalize 기반 브랜드 hint 20종 주입 + `putter_length` 응답 필드
- **xlsx 출력 도입**: SheetJS CDN 임베드, `Export XLSX` 버튼, 셀 배경 무색(글로벌 규칙) 강제, CDN 실패 시 CSV 자동 폴백
- **모듈 분리**: `app/rules.js`, `app/ai.js`, `app/export.js` 신규 파일. index.html 인라인 `<script defer>`로 변경
- **docs Flex 표 추가 메모**: `app/rules.js`의 `RULES.flexMap`을 단일 소스로 명시

### 새 파일 구조 (v12)
```
app/
├── index.html        ← UI + STATE + 폼 로직 (인라인 <script defer>)
├── rules.js          ← RULES / FORM_DEFAULTS / normalizeBrand / LOFT_TABLE
├── ai.js             ← callClaudeVision / analyzePhotos
├── export.js         ← csvCell / exportCSV / exportXLSX
├── sw.js             ← Service Worker (v7, 모듈 JS도 캐시)
├── manifest.json
└── icon-*.png/svg
```

### v13 변경 (2026-06-04, 자판/음성 직접 입력 + 계층 자동완성)

계획서: `docs/improve-plan_manual-input_20260604.md` (9장 순서대로 구현)

- **입력 방식 선택 추가**: Screen 1에 `📷 사진으로 분석` / `⌨️ 직접 입력` 2-버튼. 기존 사진/AI 경로는 **무수정 유지**(회귀 위험 0). 사진 영역은 `#photo-mode-wrap`, 직접입력은 `#manual-mode-wrap`으로 토글(`setInputMode`).
- **직접 입력(Quick Entry)**: TYPE 선택 → BRAND → MODEL → SHAFT 계층 자동완성(빈도순 칩 + 자판 실시간 필터 + 🎤 음성). BRAND/MODEL 확정 시 `populateEditForm()` 재활용해 Edit로 이동, 나머지는 FORM_DEFAULTS/LOFT_TABLE 자동.
- **SHAFT 3단계 폴백**: BRAND+MODEL(`이 모델 기준`) → BRAND(`이 브랜드 기준`) → TYPE 전체 상위 8개(`타입 전체`). 추천에 없으면 입력값 그대로 등록(강제 매칭 금지).
- **음성**: 브라우저 내장 Web Speech `en-US` 고정. 미지원 시 마이크 버튼 자동 비활성(자판 폴백). 인식 텍스트는 퍼지 매칭(점수≥0.8)으로 보정.
- **방법 A 자동 학습**: 자동완성 후보 = `match_tree.json`(기준 7,120건) + `STATE.entries`(직접 등록) 런타임 병합. 한 번 등록한 모델/샤프트는 다음부터 후보로 노출. → `buildEntry()`에 `shaftBrand`/`shaftModel` 필드 추가됨.
- **데이터 파이프라인**: `build_match_tree.py` (프로젝트 폴더에서 `py build_match_tree.py`) → `app/data/match_tree.json`(49KB) + `app/data/shaft_index.json`(209KB). 엑셀 원본 `data/00 matching data.xlsx`.
- **SW**: `CACHE_VERSION` → `20260604`, ASSETS에 `match.js` + JSON 2종 추가.

### 새 파일 구조 (v13)
```
app/
├── index.html        ← UI + STATE + 폼 로직 + 직접입력(Quick Entry) 컨트롤러
├── rules.js          ← RULES / FORM_DEFAULTS / normalizeBrand / LOFT_TABLE
├── ai.js             ← callClaudeVision / analyzePhotos
├── export.js         ← csvCell / exportCSV / exportXLSX
├── match.js          ← (신규) 계층 자동완성 / SHAFT 폴백 / 퍼지매칭 / Web Speech / 방법A 병합
├── sw.js             ← Service Worker (20260604, match.js+JSON 캐시)
├── data/match_tree.json   ← (신규) TYPE>BRAND>MODEL:count
├── data/shaft_index.json  ← (신규) byModel/byBrand/byType
├── manifest.json
└── icon-*.png/svg
build_match_tree.py   ← (신규) 엑셀→JSON 변환
data/00 matching data.xlsx ← (신규) 매칭 원본 7,120건
```

### v16 변경 (2026-06-09, 직접입력 순서 Model-first 전환)

2차 피드백: 직접입력 시 Brand부터 좁혀가는 대신 **Model을 먼저** 입력하는 게 자연스럽다는 요청. 계획서 `docs/improve-plan_model-first_20260609.md`.

- **입력 순서 변경**: Quick Entry 가 `Brand→Model→Shaft` 에서 **`Model→Brand→Shaft`** 로 변경. Model 입력칸이 첫 활성, Brand는 Model 확정 후 활성, Shaft는 기존대로 전체검색.
- **Model→Brand 자동확정(+수정가능)**: Model 선택 시 그 모델 보유 브랜드가 **1개면 Brand 자동 채움**, 0/다중이면 비워 사용자 선택 유도. 자동확정돼도 Brand 칸 편집 가능. (실데이터: Driver 489개 모델 중 다중브랜드는 1개뿐 → 거의 자동확정)
- **match.js 함수 2개 신규**: `getAllModelCandidates(type)`(TYPE 전체 모델 빈도순) + `getBrandCandidatesByModel(type, model)`(모델 보유 브랜드 역조회). **JSON 재생성 불필요** — 기존 `match_tree.json` 런타임 역순회. 기존 `getBrandCandidates`/`getModelCandidates`는 롤백용으로 **보존**(미사용).
- **index.html**: HTML Brand↔Model 블록 위치 교체, `ddCandidates`(brand/model 분기 의미 반전), `pick`(model 선택 시 Brand 자동확정 + 하위 리셋 방향 반전), `syncStages`(model→brand→shaft 활성화 체인), `resetManual`(초기 disabled = brand/shaft) 수정.
- **무영향**: 사진→AI, Edit/Save/List/Export, shaft 전체검색(v15), 방법A 자동학습 모두 그대로. `manualContinue`→`populateEditForm` 전달값 동일(순서 무관).
- **SW**: `CACHE_VERSION` `20260604`(작업본 실제값) → **`20260609`**. ⚠️ CLAUDE.md v15엔 `20260604c`로 기재됐으나 작업본 sw.js 실제값은 base `20260604`였음(56줄 정상, 절단 없음).
- **검증**: match.js/sw.js `node --check`, index.html NUL 0·1797줄·`</html>` 종료 확인. Node(vm) 실데이터: M2→TaylorMade 자동확정, ASIRI→[KAMUI,Kamui Works] 다중노출, SIM2 Max→TaylorMade, 미등록모델→빈후보(입력값 진행), 방법A 학습 반영 전부 통과.

### v15 변경 (2026-06-04, 1차 모바일 검증 피드백 2건)

스마트폰 1차 검증에서 나온 2건 반영. 첫째, 직접입력 SHAFT 드롭다운이 모델/브랜드 종속이라 후보가 거의 안 뜸. 둘째, VGT/eBay 조회가 TITLE 전체(도수·Flex 포함)를 검색어로 써 "일치 상품 없음"이 빈번.

- **첨부1 — SHAFT 전체 검색형 전환**: `match.js`에 `getAllShaftCandidates()` 신규 추가 — `shaft_index.json`의 byModel/byBrand/byType + `STATE.entries`를 **전부 합산**해 전체 고유 샤프트(실데이터 2,290건)를 빈도순 반환. `index.html`의 `ddCandidates()` shaft 분기를 3단계 폴백(`getShaftCandidates`) 대신 **전체 풀 + `filterCandidates()` 부분일치**로 교체(BRAND 필드와 동일 동작). 헤드 라벨 `샤프트 검색 (전체, 사용 빈도순)`. → "ALDILA"/"ald" 등 한두 단어로도 전체에서 드롭다운 노출(node 실데이터 검증 통과). `getShaftCandidates`(3단계 폴백)는 코드에 남겨둠(미사용, 향후 참고용).
- **첨부2 — VGT/eBay 조회 쿼리 단순화**: `index.html`에 `buildMarketQuery()` 신규 — `f-brand`+`f-type`+`f-model` **세 항목만 공백 연결**(순서: **BRAND TYPE MODEL**, 예 `TaylorMade Hybrid GAPR LO`). `triggerMarketSearch()`·`triggerEbaySearch()` 둘 다 TITLE 대신 이 쿼리 사용(도수·Flex 제외 → 매칭률↑). 검색 라벨도 새 쿼리 표시. **TITLE 필드·저장 데이터는 무변경**, 조회 쿼리만 변경. 빈 입력 시 토스트 `BRAND/MODEL을 먼저 입력해 주세요`.
- **SW**: `CACHE_VERSION` `20260604` → **`20260604c`**. ⚠️ CLAUDE.md엔 v14에서 `20260604b`로 기재됐으나 실제 sw.js는 base(`20260604`)였음 — 작업본 sw.js가 53줄에서 **잘려 있던(`.catch` 폴백 누락) 손상 상태**라 `git show HEAD:app/sw.js`로 복원 후 버전만 치환해 복구(57줄 정상).
- **검증**: match.js/sw.js `node --check` 통과, index.html NUL 없음·`</html>` 정상 종료(1790→1793줄). Node(vm)로 실데이터 SHAFT 전체검색·ALDILA 필터 통과.

### v14 변경 (2026-06-04, 직접 입력 UI 개편)

1차 모바일 테스트 피드백 반영: 칩이 위쪽에 떠 안 보이고, 자판은 거의 완전히 쳐야 뜨고, 음성(en-US)이 모델명을 정확히 못 잡아 실효성 없음.

- **칩 → 검색형 드롭다운**: BRAND/MODEL/SHAFT 입력칸 바로 아래 `position:absolute` 드롭다운(`.mi-dd`). 다른 요소를 밀지 않음. 포커스 시 전체 후보, 한 글자만 쳐도 실시간 필터(부분일치→없으면 퍼지). ↑↓/Enter/Esc 키보드 네비, 바깥 클릭 시 닫힘.
- **음성 완전 제거**: `match.js`의 `startVoiceInput`/`isSpeechSupported` 삭제, index.html의 `voiceFill`·🎤 버튼·`.mi-mic` 제거.
- **SHAFT 폴백 라벨 유지**: 드롭다운 상단에 `추천 샤프트 (이 모델 기준/이 브랜드 기준/타입 전체)` 출처 표시.
- **함수 재구성**: 신규 `ddCandidates/renderDD/openDD/closeDD/ddKey/pick/syncStages`. `pick()`이 brand→model→shaft 단계 활성화 담당. `setInputMode/miType/resetManual` 유지.
- **검증**: Node(vm)로 실데이터 테스트 — "t/ta/tay" 단계 필터, "tailormade" 오타 보정, SHAFT 3단계 폴백, 음성함수 undefined 전부 통과.
- **SW**: `CACHE_VERSION` `20260604` → `20260604b` (같은 날 재배포 강제 갱신).

### 새 파일 구조 (v14)
v13과 동일(파일 추가/삭제 없음). `match.js`/`index.html` 내용만 수정, `.mi-chip*` CSS 제거.

### 작업 도구 주의 (2026-06-04 사고 기록)
Cowork **Edit 도구로 index.html/match.js/sw.js/CLAUDE.md 수정 시 파일 끝 NUL(\x00) 덧붙음 + 대형 편집 시 뒷부분 절단** 손상 반복 발생(index.html 1794→1503줄, CLAUDE.md 147→115줄로 잘림). 대응: `git show HEAD:파일`로 복원 후 재적용. 권장: 마운트 폴더 대형 파일은 Edit 대신 **Python 문자열 치환 + `.replace(b'\x00',b'')`** 후 `node --check` 검증. v14는 이 방식으로 완료.

### 회귀 방지 메모
- Code Review 본문: `docs/code_review_20260530.md`
- Flex/브랜드/타입 규칙 변경 시 **반드시 `app/rules.js`와 `docs/data_analysis.md §7-3` 동시 수정**
- **매칭 데이터 갱신 시**: `data/00 matching data.xlsx` 수정 → `py build_match_tree.py` 재실행 → JSON 2종 재생성 → push (sw.js CACHE_VERSION 자동 갱신). 자세한 운영(방법 A/B/C)은 계획서 §10-B.
- **직접 입력 후보가 안 뜰 때**: ① JSON 로드 실패(콘솔 확인) ② `STATE.entries` 필드명(`type/brand/model/shaftModel`)이 match.js 추출자와 일치하는지 확인.
- **드롭다운(v14)이 안 뜰 때**: ① `loadMatchData()` 완료 전이면 빈 목록 → `setInputMode('manual')`에서 로드 호출함 ② `mi-dd-*` 컨테이너 존재/`.open` 클래스 확인 ③ `MATCH.tree[TYPE]`에 해당 TYPE 키 존재 여부(`miType()` 폴백 Driver).
- **(v15) SHAFT 드롭다운이 비었을 때**: `getAllShaftCandidates()`는 `MATCH.shaft`(shaft_index.json) 로드 여부에 의존 → JSON 로드 실패 시 빈 목록. 콘솔에서 `MATCH.loaded`/`MATCH.shaft` 확인.
- **(v15) VGT/eBay 조회 쿼리 변경 시**: 검색어는 `buildMarketQuery()`(`f-brand`+`f-type`+`f-model`, 순서 **BRAND TYPE MODEL**)에서 단일 생성. 순서/항목 변경은 이 함수 한 곳만 수정하면 VGT·eBay 동시 반영. TITLE 필드(`f-title`)와는 독립.
- **(v15 사고) sw.js 절단 재발**: 작업본 sw.js가 53줄에서 `.catch` 폴백 누락된 채 잘려 있었음. `node --check`(CRLF는 LF 변환 후)로 매 배포 전 검증, 손상 시 `git show HEAD:app/sw.js` 복원 후 버전만 치환.
