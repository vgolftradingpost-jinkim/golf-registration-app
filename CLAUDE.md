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
`{Brand} {TYPE} / {Model} / {Degrees or ClubNum} [/ pcs] [/ Women] [/ Lefty] / {Flex}`  ← Flex는 항상 맨 뒤
- Wood/Hybrid: `TaylorMade Wood / SIM / 5W(18.5) / S`
- Iron Set: `Callaway Iron Set / Apex / 7pcs / R`

**TITLE의 Flex 표기 규칙 (v21)** — 코드 단일 소스: `app/rules.js` `titleFlexLabel()` / `normalizeTitleTags()`

| 조건 | TITLE 표기 | 예시 |
|------|-----------|------|
| Gender=**Women** + Flex `L` | **`L` 생략** (Women 태그로 이미 Ladies 사양이 드러남) | `XXIO Driver / 12 / 11.5 / Women` |
| Flex `A` | **`A(Senior)`** (다른 flex는 원본 유지) | `HONMA Wood / TW / 3W(15.0) / A(Senior)` |
| Flex `-`(N/A), `W`(Wedge) | 생략 (기존과 동일) | `TaylorMade Wedge / MG4 / SW(56.0)` |

> Export(CSV/XLSX)는 출력 직전 `normalizeTitleTags(e.title, e.gender)`를 거치므로
> **구 규칙으로 저장된 항목도 내보내기 결과에는 위 규칙이 적용**된다(저장 데이터 자체는 무변경).

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

## 현재 상태 (v22, 2026-08-27) — VGT Store 조회 복구: corsproxy.io 익명 사용 중단(403) 대응 프록시 폴백 체인 도입 (아래 v22 변경 참조)

## 이전 상태 (v21, 2026-08-22) — TITLE flex 표기 규칙 정정: Women+`L` 생략 / `A` → `A(Senior)`, Export 시점 정규화 도입 (아래 v21 변경 참조)

## 이전 상태 (v20, 2026-08-18) — DB 갱신을 **월 1회 수작업**으로 전환: `Export DB` 버튼 철회, `incoming/` + 양식 파일 유지 (아래 v20 변경 참조)

## 이전 상태 (v19, 2026-08-18) — 폰 누적분 → 기준 DB 흡수 경로 개통 (⚠️ **앱 부분은 v20에서 철회**)

## 이전 상태 (v18, 2026-08-17) — 저장소 정비: `.gitattributes`로 CRLF 노이즈 차단 + `sync_pull.bat` 안전화 (앱 코드 무변경)

## 이전 상태 (v17, 2026-06-28) — TITLE flex 위치 수정: flex가 항상 맨 뒤로 (아래 v17 변경 참조)

## 이전 상태 (v16, 2026-06-09) — 직접입력 순서 변경: Model 먼저 → Brand 자동확정(+수정) → Shaft 전체검색 (아래 v16 변경 참조)

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

### v22 변경 (2026-08-27, VGT Store 조회 실패 복구 — 프록시 폴백 체인)

폰에서 신규 등록 후 `VGT Price` 를 누르면 `조회 실패 (HTTP 403)` 만 나오는 문제. **앱 회귀가 아니라 외부 서비스 정책 변경**이었다.

**원인 규명 (라이브 앱 URL에서 실측)**

| 호출 방식 | 결과 |
|---|---|
| 기존 코드 `corsproxy.io/?<encoded>` | **403** `keyless_legacy_url` — "Anonymous legacy proxy URLs are no longer supported. Use the CORSPROXY API with an API key." |
| 신형식 `corsproxy.io/?url=<encoded>` | **401** "A valid API key is required" |
| 프록시 없이 직접 호출 | **CORS 차단**(status 0) — Shopify `suggest.json` 은 `Access-Control-Allow-Origin` 을 주지 않음 |

→ ① 프록시는 앞으로도 필요하고 ② 쓰던 프록시가 무료 익명 사용을 닫은 것. TITLE/SPEC·eBay 버튼(단순 링크)·AI 분석은 무관하며 v21 과도 무관.

**부수 발견 — SW 캐시 우회 목록이 프록시 교체의 숨은 함정**
`sw.js` 의 fetch 핸들러는 우회 목록(`api.anthropic.com`/`corsproxy.io`/`golftradingpost.ca`)에 없는 URL을 가로채고, 실패하면 `caches.match()` 의 `undefined` 를 `respondWith` 로 넘긴다. 그러면 페이지에는 **원인 없는 `Failed to fetch`** 만 보인다. 실제로 새 프록시 후보들을 앱 페이지에서 테스트하니 전부 즉시 실패했고, 같은 코드가 외부 오리진(example.com)에서는 정상 동작했다. **프록시를 추가할 때 SW 우회 목록을 같이 고치지 않으면 새 프록시도 죽는다.**

**개선 내용**
- **`app/index.html` — `MARKET_PROXIES` + `fetchViaProxies()` 신설**: 프록시를 순서대로 시도해 첫 성공 응답 사용. 순서는 `cors.sh`(8s) → `corsproxy`(8s, 키 발급 시 즉시 부활하는 자리) → `allorigins`(20s, 느리지만 살아 있는 예비).
  - **200 이어도 실패 판정**: JSON 파싱 실패(`JSON 아님`) 또는 `resources` 키 부재(`형식 불일치`)면 다음 프록시로. 프록시가 에러 HTML 을 200 으로 돌려주는 흔한 사고 방어.
  - 프록시별 개별 `AbortController` 타임아웃 → 전체 대기시간 상한 확보.
  - 예비 경로로 넘어가면 검색 라벨에 `· 예비 경로(이름)` 표기. 전부 실패 시 에러 메시지에 시도 이력 전부 표시(`cors.sh:HTTP 403 / corsproxy:HTTP 401 / ...`).
  - `buildMarketQuery()`·`triggerEbaySearch()`·TITLE/SPEC 로직은 **무변경**.
- **`app/sw.js`**: 우회 목록에 `proxy.cors.sh`·`api.allorigins.win` 추가(+ 함정 주석). `CACHE_VERSION` → `20260827-2200`.
  - ⚠️ 겸사겸사 정리: 직전 커밋 `2ecd911` 이 `CACHE_VERSION` 을 `20260822-2340` → `20260822-1716` 로 **되돌려** 놓은 상태였다(v21 배포분보다 낮은 값). SW 는 문자열 일치 비교라 치명적이진 않지만 배포 이력과 어긋나므로 새 값으로 승급.
- **검증**
  - `node --check`: index.html 인라인 스크립트(1,160줄)·`sw.js` 통과. NUL 0바이트, 1,841줄, `</html>` 정상 종료.
  - **폴백 로직 6케이스**(fetch 모킹, Node): ① 1순위 성공 ② 403→401→성공 ③ 200인데 HTML → 폴백 ④ 200인데 형식불일치 → 폴백 ⑤ 전부 실패 시 시도 이력 취합 예외 ⑥ 1순위 타임아웃(8초 후 폴백) 전부 통과.
  - **실네트워크 E2E**(라이브 앱 페이지에 신규 함수 주입, Chrome): `TaylorMade Driver M2`/`Callaway Iron Set Apex`/`PXG Driver 0811 X+` 3건 모두 `via=cors.sh`, 155~464ms, 상품 6건·가격 파싱 정상.
  - **실패 폴백 실측**: 죽은 corsproxy 2종을 1·2순위로 배치 → `corsproxy:HTTP 401` → `corsproxy-legacy:HTTP 403` → `cors.sh` 성공, 총 481ms.
- ⚠️ **한계**: 1·3순위 모두 제3자 무료 서비스라 같은 사고가 재발할 수 있다. 폴백 체인은 그때 버텨주는 장치일 뿐이며, 근본 해결은 **자체 프록시(Cloudflare Workers)** 또는 **Shopify Storefront API 전환**(CORS 허용이라 프록시 자체가 불필요). 별도 과제로 남김.
- ⚠️ **미커밋**: 마운트에서 git 명령 금지 규칙에 따라 커밋·푸시는 Windows 에서 `push.bat` 실행. 이후 폰 PWA 완전 종료 후 재실행.

### v21 변경 (2026-08-22, TITLE flex 표기 규칙 정정 + Export 정규화)

엑셀 Export 결과에서 ① 여성 클럽(Women)인데 `… / Women / L` 처럼 **`L`이 남아 있고**, ② Flex `A`가 `A(Senior)`가 아닌 `A`로만 나온다는 보고.

**원인 규명 (회귀 아님)**
- `git log -L 1400,1416:app/index.html` 로 추적한 결과, Women+`L` 생략 조건(`!(flex==='L' && gender==='Women')`)은 **v11 최초 커밋부터 한 번도 삭제된 적 없음**. v17은 flex 위치만 뒤로 옮겼고, 최근 커밋(`dfca006`/`bbd43f2`/`be69aae`)은 TITLE 로직 무변경. 현재 소스를 jsdom으로 재현 실행해도 `Women + L → … / Women`(정상)이었다. → **코드 회귀가 아니라 아래 경로 문제**
- **주원인 ①** `saveEditModal()`이 TITLE을 재조립하지 않음. 목록 편집 모달에서 Gender를 Men→Women으로 바꿔도 이미 굳은 `… / L` 이 그대로 남고, Export는 그 문자열을 그대로 출력.
- **원인 ②** v17 이전 저장분은 옛 표기 유지(당시 노트에도 명시). Export는 저장값을 가공 없이 출력하는 구조였음(`e.title` 직행).
- **원인 ③** `sw.js CACHE_VERSION`이 `20260817-1811`에서 멈춰 있어 폰에서 구버전 `index.html`이 서빙될 여지.
- **Flex `A` → `A(Senior)`는 회귀가 아니라 미구현 신규 규칙**. SPEC은 `RULES.flexMap`으로 이미 `A(Senior)-flex`를 내보내고 있어 TITLE만 어긋나 있었다.

**개선 내용**
- **규칙 단일 소스화**: `app/rules.js`에 `titleFlexLabel(flex, gender)` + `normalizeTitleTags(title, gender)` 신설. 상수 `TITLE_FLEX_OMIT`(`''`/`-`/`W`), `TITLE_FLEX_LABEL`(`A`→`A(Senior)`), `TITLE_TAG_START`(앞 2세그먼트는 태그 판정 제외 → 모델명 `A` 오변환 방지).
- **생성 경로**: `index.html` `regenerateFields()`의 인라인 조건식을 `titleFlexLabel()` 호출로 교체.
- **Export 경로**: `export.js`에 `exportTitle(e)` 추가 → `exportCSV`/`exportXLSX` 모두 출력 직전 정규화. **저장 데이터(`STATE.entries`)는 변경하지 않음** — 구 저장분도 내보내기 결과만 교정된다.
- **편집 모달**: `saveEditModal()` 저장 시 `normalizeTitleTags(e.title, e.gender)` 적용(원인 ①). 수기 편집 문구는 유지하고 flex 태그만 교정.
- **캐시**: `sw.js CACHE_VERSION` → `20260822-2340`.
- **검증**: jsdom 재현 하네스로 생성 경로 9건 + Export 경로 10건 전부 통과. 추가로 SheetJS로 실제 `.xlsx`를 만들어 TITLE 열을 되읽어 4행(일반/Women/A/Women+A) 확인, 원본 `entries` 무변경도 확인.
- ⚠️ **저장된 데이터는 그대로**다. 앱 목록 화면에는 여전히 옛 표기가 보일 수 있고, **Export 결과와 편집 모달 저장분에만** 새 규칙이 반영된다.

### v20 변경 (2026-08-18, DB 갱신을 월 1회 수작업으로 전환 — v19 앱 변경 철회)

v19에서 뚫은 "폰 내보내기 → 흡수" 경로를 실사용 검토 끝에 **철회**. 이유는 운영 실태와 안 맞았기 때문. 사용자의 평소 흐름은 `Export XLSX`(판매용) → `Clear All` 인데, 여기에 `Export DB` 를 매번 끼워 넣어야 학습분이 보존되는 구조였음. 버튼 하나를 빠뜨리면 조용히 유실되는 설계라 **"매월 한 번 손으로 채워 넣는" 명시적 절차**가 더 안전하다고 판단.

- **철회(앱)**: `app/export.js` 의 v19 블록 전량 삭제(`shaftFull`/`matchRows`/`MATCH_HEADERS`/`exportMatchXLSX`/`exportMatchCSV`) → **87줄 원상 복구**. `app/index.html` 의 `Export DB (자동완성 갱신용)` 버튼과 주석 2곳 원복 → **1797줄 원상 복구**. 기존 `Export XLSX`/`CSV` 는 원래부터 무변경.
- **유지(PC)**: `data/incoming/` → `build_match_tree.py` → JSON 재생성 → `push.bat` 파이프라인은 그대로. 반입 수단만 바뀜.
- **중복 방지 기준 교체 — `SRC_NO` → 파일 내용 해시**: v19 는 앱이 찍어주던 등록 CODE 로 재흡수를 막았는데, 수작업 파일에는 그런 ID가 없다. 대신 파일 **sha256** 을 `data/incoming/done/_processed.json` 대장에 기록해 판별. 같은 파일을 두 번 넣으면 "이미 반영된 파일 → 건너뜀" 으로 처리. 마스터 E열(`SRC_NO`)도 폐지 → **4열(TYPE/BRAND/MODEL/SHAFT) 유지**.
- **`_` 접두 파일 건너뛰기**: `data/incoming/_template.xlsx` 가 실수로 흡수되지 않도록 파일명이 `_` 로 시작하면 스킵(`~$` 엑셀 임시파일도 동일).
- **`data/incoming/_template.xlsx` 신규**: 시트 2개 — `final`(헤더만, A열 TYPE 드롭다운 검증 7종) + `작성요령`(절차·규칙·예시 6행). **예시를 별도 시트에 둔 이유**: `final` 에 예시를 넣으면 지우는 걸 잊었을 때 그대로 흡수돼 DB가 오염된다. 빌드는 `final` 시트만 읽는다.
- **정보성 경고 추가**: 반입 행 중 마스터에 이미 있는 조합이 몇 행인지 표시(`그중 N행은 마스터에 이미 있는 조합 — 빈도로 반영됨`). 차단하지는 않는다 — 빈도는 후보 순위의 신호이므로.
- **`.gitignore`**: `!data/incoming/_template.xlsx` 예외 추가(양식과 README 는 저장소에 유지, 실제 반입분·백업은 로컬 전용).
- **검증**: 실데이터 7,120건 사본으로 ① 템플릿만 있을 때 흡수 0 ② 수작업 파일 5행 중 유효 4행 흡수(BRAND 누락 행 무시) ③ 소문자 `wood`→`Wood` 정규화 ④ 빈 SHAFT 행은 tree 에는 들어가고 shaft 인덱스에서만 제외 ⑤ **같은 파일 재투입 시 대장으로 차단** ⑥ 1행 추가한 다른 파일은 정상 흡수 ⑦ 빈도 정합성 — Qi35 2+1+1=4, Vokey SM10 24+1=25, PXG 0811 X+ 1+1+1=3 전부 일치(이중 집계 없음). 실기기 `--dry-run` 으로 마스터 7,120건 정상 판독 확인.

#### 운영 순서 (v20 확정)
```
data/incoming/_template.xlsx 복사 → 2026-09.xlsx 등으로 저장
  → final 시트에 신규 TYPE/BRAND/MODEL/SHAFT 手입력
  → data/incoming/ 에 두고
       py build_match_tree.py --dry-run     (확인)
       py build_match_tree.py               (반영)
  → push.bat
  → 폰 앱 완전 종료 후 재실행
```
주기는 월 1회. 폰 등록분(방법 A)은 그 기기 안에서만 후보로 뜨고 `Clear All` 시 사라진다 — 이제 **영구 반영 경로는 이 수작업 절차 하나뿐**이다.

### v19 변경 (2026-08-18, 방법 B 실행 경로 개통 — 폰 누적분을 기준 DB로 흡수)

> ⚠️ **이 절의 앱 변경(`Export DB` 버튼·`exportMatchXLSX`)은 v20에서 전량 철회됨.** `incoming/` + `build_match_tree.py` 파이프라인만 살아 있고, 반입 수단이 "폰 내보내기" → "월 1회 수작업"으로 바뀌었다. 아래 내용은 경위 기록으로만 읽을 것.

폰에 쌓인 등록 데이터(방법 A, `localStorage.golf_entries`)를 기준 DB로 흡수하려는 요청. 확인해 보니 **경로 자체가 막혀 있었음**: `exportXLSX()` 컬럼이 `NO/TYPE/BRAND/MODEL/TITLE/SPEC/PRICE/COST/GENDER/HANDED/GRIP/DATE` 로 **SHAFT가 없어서**, `build_match_tree.py`가 요구하는 TYPE/BRAND/MODEL/**SHAFT** 4열을 만들 수 없었음(= `shaft_index.json` 학습분 전량 유실). `buildEntry()`에는 `shaftBrand`/`shaftModel`이 이미 저장되고 있어 데이터는 있었고 **내보내기만 빠져 있던 상태**.

- **`app/export.js` — `exportMatchXLSX()` 신규**: 시트명 `final`, 헤더 `TYPE/BRAND/MODEL/SHAFT/SRC_NO`. `build_match_tree.py`가 수정 없이 그대로 읽는 형식. CDN 실패 시 `exportMatchCSV()` 폴백(빌드 스크립트가 .csv도 동일 형식으로 읽음). 기존 `exportXLSX`/`exportCSV`는 **무변경**(판매용 출력과 용도 분리).
- **`shaftFull(e)` 합성 규칙**: 기준 엑셀 SHAFT는 `TaylorMade REAX` 처럼 **브랜드+모델 합본 단일 문자열**. 앱은 `shaftBrand`/`shaftModel` 분리 저장(직접입력 경로는 shaftBrand가 비고 shaftModel에 전체가 들어옴). → 둘을 합치되 `shaftModel`이 이미 브랜드로 시작하면 접두 중복을 피함(`ALDILA` + `ALDILA ASCENT` → `ALDILA ASCENT`).
- **`app/index.html`**: List 화면에 `Export DB (자동완성 갱신용)` 버튼 1개 추가(기존 버튼 줄 아래 별도 행). 모듈 주석 2곳 동기화. 1797 → 1802줄.
- **`build_match_tree.py` — incoming 자동 병합**: `data/incoming/*.xlsx|*.csv` 를 마스터와 함께 읽어 **신규 행만 마스터에 흡수** 후 JSON 2종 재생성. 부가 동작 3가지 — ① 덮어쓰기 전 `data/backup/` 자동 백업 ② 처리한 파일은 `data/incoming/done/` 으로 이동(이름 충돌 시 타임스탬프 접미) ③ `--dry-run` 플래그로 흡수 없이 미리보기. 기존 인자(`py build_match_tree.py "경로.xlsx"`)와 출력 JSON 스키마는 **하위호환**.
- **중복 재흡수 방지 = `SRC_NO`(등록 CODE)**: 마스터 E열에 출처 CODE를 남기고, 이미 있는 SRC_NO는 건너뜀. **같은 파일을 두 번 넣어도 중복 집계되지 않음.** ⚠️ 단, 빈도(count)가 후보 순위에 직결되므로 **중복 "조합"(같은 BRAND+MODEL 반복 등록)은 일부러 제거하지 않음** — 그건 노이즈가 아니라 신호임.
- **`.gitignore`**: `data/incoming/*`(단 `README.txt` 예외) + `data/backup/` 제외. 반입 원본·백업은 로컬 전용.
- **`data/incoming/README.txt` 신규**: 폴더에 들어온 사람이 바로 따라 할 수 있는 4단계 운영 순서.
- **SW**: `CACHE_VERSION` `20260628` → 배포 시 `push.bat` 이 자동 갱신(실제 반영값 **`20260817`** — 작업 세션은 UTC 기준 8/18이었으나 push.bat 은 PC 로컬 날짜(America/Vancouver)를 쓰므로 8/17로 기록됨. SW 는 문자열 일치 비교라 순서 역전은 무해). `export.js`는 이미 ASSETS에 있어 목록 변경 불필요.
- **검증**: 마스터 실데이터 7,120건 사본으로 샌드박스 전 구간 통과 — ① xlsx 5행 + csv 1행 흡수 → 7,126건, JSON 재생성(byModel 2,418→2,419, byBrand 181→182) ② **같은 파일 재투입 시 신규 0행 / 중복 6행 건너뜀**(멱등성) ③ csv BOM + 소문자 type(`wood`→`Wood`) 정규화 ④ 백업·done 이동·충돌 리네임 ⑤ `shaftFull` 5개 케이스 Node 검증(빈 브랜드/접두중복/정상결합/샤프트없음/브랜드누락 제외). 실기기 `--dry-run`으로 실제 마스터 정상 판독(7,120건, 부작용 0) 확인.
- ⚠️ **샌드박스에서 실행 금지**: 마운트 FS는 rename/unlink 불가라 `shutil.move`(done 이동)가 실패함. `build_match_tree.py`의 실제 흡수는 **반드시 Windows에서** 실행할 것(`--dry-run`은 마운트에서도 안전).

- **배치 스크립트 3종 경로 하드코딩 제거**: `push.bat`·`reset_and_push.bat`·`start_server.bat` 의 `cd /d "C:\Users\redru\Desktop\01 Work_ai\03 registration_app"` (존재하지 않는 옛 경로)를 **`cd /d "%~dp0"`** 로 교체. `cd /d` 는 경로가 없어도 **에러 한 줄 찍고 그냥 진행**하므로, 그대로 두면 엉뚱한 폴더에서 `git push --force` 가 돌 수 있었음. 함께 **루트 검증 가드** 추가 — git 계열 2개는 `.git` 부재 시, `start_server.bat` 은 `app\index.html` 부재 시 즉시 `exit /b 1`. `commit.bat`/`sync_pull.bat` 은 이미 `%~dp0` 사용 중이라 무변경, `setup_github.ps1` 은 `Split-Path $MyInvocation` 방식이라 문제 없음.

#### 배포 사고 (2026-08-18) — `index.lock` 때문에 "Done!" 인데 아무것도 안 올라감

`push.bat` 실행 결과: `git add -A` / `git commit` 이 둘 다 `fatal: Unable to create '.../.git/index.lock': File exists` 로 실패했는데, 화면에는 `Everything up-to-date` → `Done!` 이 찍혀 **성공처럼 보였음**. 실제 HEAD 는 `dfca006` 그대로. 원인은 두 겹.

1. **스테일 잠금**: Cowork 세션이 마운트 경유로 `git status` 를 실행하면 git 이 `.git/index.lock` 을 만든 뒤 **unlink 불가(Operation not permitted)** 로 못 지워 0바이트 파일이 남는다. 남아 있는 동안 로컬 git 의 add/commit 이 전부 막힌다.
2. **실패 은폐**: 기존 `push.bat` 은 `git push` 의 errorlevel 만 검사했다. 커밋이 0건이면 push 는 정상적으로 "up-to-date" 를 반환하므로, **커밋 실패가 성공 메시지로 덮였다.**

- **대응**: `push.bat` 에 **Step 0(스테일 `index.lock` 자동 삭제)** 추가 + `git add`/`git commit` 각각 `if errorlevel 1 goto COMMIT_FAIL` 로 **즉시 중단**. push 실패는 `:PUSH_FAIL` 로 분리. 성공 시 `git log --oneline -1` 과 잔여 `git status -s` 를 함께 출력해 **실제 반영 여부를 눈으로 확인**하게 함. (`commit.bat`·`sync_pull.bat` 은 이미 잠금 삭제 단계 보유)
- ⚠️ **교훈**: 마운트에서 git **읽기 명령(`git status` 포함)** 도 잠금을 남긴다. 세션에서 로컬 repo 상태를 볼 일이 있으면 그 뒤 Windows 쪽 첫 git 작업이 막힐 수 있음을 전제할 것. 배포는 항상 Windows에서, 그리고 **`Done!` 이 아니라 `git log` 해시로 확인**할 것.

#### `CACHE_VERSION` 형식 변경 (2026-08-18) — 같은 날 재배포 시 캐시 미갱신 차단

`push.bat` 의 자동 갱신이 `Get-Date -Format yyyyMMdd`(날짜만)라, **같은 날 두 번째 푸시는 버전 문자열이 동일**해져 SW 가 캐시를 새것으로 인식하지 못했다. v14→v15 때 손으로 `20260604b`/`20260604c` 접미를 붙였던 게 바로 이 증상의 임시 대처였음.

- **형식**: `yyyyMMdd` → **`yyyyMMdd-HHmm`** (예: `20260817-1435`). 분 단위까지 들어가 매 푸시마다 새 버전이 보장됨. 변수명도 `TODAY` → `STAMP`.
- **가드 2종 추가**: ① PowerShell 날짜 취득 실패 시(`STAMP` 공백) 중단 ② 치환 후 `findstr` 로 `sw.js` 에 새 버전이 실제로 박혔는지 확인, 실패면 **커밋 전에** 중단. 치환만 조용히 실패하면 폰이 옛 캐시를 계속 쓰게 되므로.
- **`Get-Content`/`Set-Content` 방식은 유지**: PS 5.1 기본 인코딩이 ANSI라 한글 주석이 깨질 수 있는 구조지만, 실제 푸시 결과물(`app/sw.js` 56줄 UTF-8, 한글 정상)을 GitHub 클론으로 대조해 **현 PC 환경에서는 무해함을 확인**. `sw.js` 절단 이력이 있는 파일이라 검증되지 않은 개선(`[IO.File]::WriteAllText` 등)으로 바꾸지 않았다. 인코딩이 깨지는 날이 오면 그때 교체할 것.
- ※ `Set-Content` 가 LF→CRLF 로 바꾸므로 커밋 시 `CRLF will be replaced by LF` 경고가 뜬다. **`.gitattributes`(v18)가 정규화해 저장소는 LF 유지** — 정상 동작이며 무시해도 된다.

#### 운영 순서 (방법 B, v19 기준)
```
폰 List → [Export DB]  →  match_add_YYYYMMDD.xlsx 다운로드
        → PC의 data/incoming/ 에 저장
        → py build_match_tree.py        (백업·흡수·JSON 재생성 자동)
        → push.bat                      (sw.js CACHE_VERSION 자동 갱신)
        → 폰 PWA 새로고침 → 새 후보 수신
```

### v18 변경 (2026-08-17, 줄바꿈(CRLF) 노이즈 차단 + 동기화 스크립트 안전화)

GitHub 최신본 확인 요청에서 출발. 확인 결과 로컬 `main`은 이미 `origin/main`과 **같은 커밋(`dfca006`)** 이라 내려받을 것이 없었고, `git status`에 뜨던 수정 2건(`app/sw.js`, `docs/improve-plan_model-first_20260609.md`)은 내용 변경이 아니라 **CRLF↔LF 줄바꿈 차이**뿐이었음(`git diff --ignore-cr-at-eol --stat` 출력 공백으로 확인). Windows 마운트를 통해 파일이 열리며 CRLF로 바뀐 것이 원인.

- **`.gitattributes` 신규 추가**: `* text=auto eol=lf` (저장소는 항상 LF 저장/체크아웃) + `*.bat`/`*.cmd`/`*.ps1`은 `eol=crlf`(Windows 스크립트는 CRLF 유지) + `*.png/jpg/ico/webp/xlsx/xls/pdf/zip`은 `binary`. → 워킹트리가 CRLF여도 git이 정규화 후 비교하므로 **가짜 diff 자체가 사라짐**. 적용 직후 `git status`에서 위 2개 파일 소멸 확인.
- **`sync_pull.bat` 로직 교체**: 기존에는 `git checkout -- app/sw.js`로 **파일명을 하드코딩**해 되돌렸음(대상이 늘면 매번 수정 필요, 실제 작업분도 날릴 위험). 이제 `git diff --ignore-cr-at-eol --quiet`(+`--cached`)로 판정해 **줄바꿈 차이만이면 `git checkout -- .`, 실제 내용 변경이 있으면 아무것도 버리지 않고 경고 후 중단**. 단계 4/4 → 5/5.
- ⚠️ **`--name-only`는 `--ignore-cr-at-eol`을 무시함**(git 2.34 실측: CRLF-only 파일도 그대로 나열). 판정에는 반드시 `--quiet`(또는 `--stat`/`--numstat`)를 쓸 것. 이 함정은 `sync_pull.bat` 주석에도 기록해 둠.
- **앱 무영향**: `app/` 하위 코드·`sw.js` `CACHE_VERSION`(`20260628`) 전부 **무변경**. 재배포 불필요.
- **검증**: 파일 NUL 0바이트·`sync_pull.bat` CRLF 56줄·`goto`↔라벨 전부 해소 확인. `git check-attr text eol` 로 `app/sw.js`→`auto/lf`, `sync_pull.bat`→`set/crlf`, `icon-192.png`→`text unset` 확인. 적용 후 `git status`에 `sync_pull.bat`(실제 수정)과 `.gitattributes`(신규)만 남음.
- ⚠️ **미커밋 상태**: 이 세션의 로컬 실행 도구는 네트워크가 막혀 있어(프록시 403) `git fetch`/`push` 불가. 원격 대조는 클라우드 측 `git ls-remote`로 수행. **`.gitattributes`와 `sync_pull.bat` 커밋·푸시는 Windows에서 `push.bat` 실행 필요.**
- 🔴 **`push.bat` 경로 오류 발견** (→ **v19에서 수정 완료**): 4번째 줄이 `cd /d "C:\Users\redru\Desktop\01 Work_ai\03 registration_app"` 로 **실제 경로(`C:\Users\VGPT\Desktop\03 ai_wok\03 registration_app`)와 불일치**. 존재하지 않는 경로라 `cd`가 실패하고 엉뚱한 폴더에서 push가 시도됨. `cd /d "%~dp0"`(다른 스크립트와 동일 방식)로 교체 권장.

### v17 변경 (2026-06-28, TITLE flex 위치 수정 + GitHub 동기화)

수출(xlsx) 결과에서 TITLE의 flex가 `A / Lefty`, `S / 7pcs / Lefty`, `Uni / 7pcs`처럼 중간에 끼어 "섞여" 보이는 문제. 원인은 `regenerateFields()`의 `titleParts` 조립 순서가 **flex → pcs → Women → Lefty**로, flex가 먼저 push되던 것. 문서(이 파일·data_analysis.md)의 TITLE 형식 문자열도 `{Flex} [/ Women] [/ Lefty]`로 flex가 앞에 오게 적혀 있어 코드와 함께 옛 규칙을 따르고 있었음(단, data_analysis.md 예시 120~121줄은 이미 flex-last로 자기모순 상태였음).

- **TITLE 조립 순서 변경**: `app/index.html`의 `regenerateFields()`에서 `titleParts.push(flex)`를 pcs·Women·Lefty·putterLen **뒤로 이동**. 이제 flex가 TITLE **항상 맨 뒤**. SPEC 조립(별도 규칙)은 무변경.
- **문서 동기화**: `CLAUDE.md`·`docs/data_analysis.md`의 TITLE 형식 문자열을 `… [/ pcs] [/ Women] [/ Lefty] / {Flex}`로 통일.
- **검증**: 보고된 4개 행(2~8행 `Lefty / A`, 10행 `7pcs / Lefty / S`, 12행 `7pcs / Uni`, 31행 `2H(17.0) / Lefty / S`) Node 재현 테스트 전부 통과. ⚠️ **기존 저장 항목은 변경되지 않음** — 새로 생성되는 TITLE에만 적용.
- **SW**: `CACHE_VERSION` `20260609` → **`20260628`**.

#### 동기화/복구 사고 (2026-06-28)
- GitHub `origin/main`이 로컬보다 앞서(`6e605c8`) 있어 fast-forward 동기화 진행(로컬 detached HEAD v11 베이스 + 미커밋 v15 작업본 → 전부 origin에 포함돼 손실 없음 확인 후).
- ⚠️ 마운트(샌드박스) FS의 **unlink/rename 'Operation not permitted'** 때문에 git이 `.git/index.lock` 삭제·파일 교체에 실패. fast-forward 시 큰 파일 3개(`CLAUDE.md`·`app/index.html`·`app/match.js`)가 **끝부분 절단**됨(index.html 1798→1729줄). `git show HEAD:파일`로 원본 추출→**Python read-back 검증 쓰기**로 전량 복원 후 수정 재적용. 교훈: 마운트에서 git checkout/merge도 대형 파일 절단을 유발하므로, 배포용 git 작업은 Windows 측에서 수행.

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
- **(v22) VGT 조회가 실패하면 앱 코드보다 프록시 정책 변경을 먼저 의심할 것**. 확인 순서: ① 브라우저 콘솔의 `VGT proxy failed:` 로그로 어느 프록시가 무슨 코드로 죽었는지 확인 ② 해당 프록시 URL을 직접 열어 응답 본문 확인(대개 403/401 + 안내 메시지) ③ 프록시 없이 직접 호출은 **항상 CORS 로 막히는 게 정상**이므로 이걸로 판단하지 말 것.
- **(v22) 프록시를 추가·교체할 때는 반드시 두 곳을 함께 고칠 것**: `app/index.html` 의 `MARKET_PROXIES` 배열 + `app/sw.js` 의 캐시 우회 `if` 목록. SW 우회 목록에 없으면 그 프록시는 SW 에 가로채여 **원인 표시 없이 `Failed to fetch`** 로만 죽는다(v22 조사에서 실제로 겪음).
- Code Review 본문: `docs/code_review_20260530.md`
- Flex/브랜드/타입 규칙 변경 시 **반드시 `app/rules.js`와 `docs/data_analysis.md §7-3` 동시 수정**
- **(v21) TITLE의 flex 표기를 바꿀 때**: `app/rules.js`의 `titleFlexLabel()`·`TITLE_FLEX_LABEL`·`TITLE_FLEX_OMIT` **한 곳만** 수정하면 생성(`regenerateFields`)·Export(`exportTitle`)·편집 모달(`saveEditModal`)에 동시 반영. `index.html`에 조건식을 다시 인라인으로 넣지 말 것(과거 이 인라인 조건이 규칙 이원화의 원인이었음).
- **(v21) "Export에 옛 표기가 나온다"는 보고를 받으면**: 먼저 코드가 아니라 **저장 데이터**를 의심할 것. TITLE은 저장 시점 문자열이 그대로 굳으며, 목록 화면은 정규화를 거치지 않는다. 재현은 `regenerateFields()`를 jsdom으로 직접 돌려 확인(생성 로직 정상 여부) → 정상이면 편집 모달·구 저장분·SW 캐시 3가지를 점검.
- **매칭 데이터 갱신 시**: `data/00 matching data.xlsx` 수정 → `py build_match_tree.py` 재실행 → JSON 2종 재생성 → push (sw.js CACHE_VERSION 자동 갱신). 자세한 운영(방법 A/B/C)은 계획서 §10-B.
- **직접 입력 후보가 안 뜰 때**: ① JSON 로드 실패(콘솔 확인) ② `STATE.entries` 필드명(`type/brand/model/shaftModel`)이 match.js 추출자와 일치하는지 확인.
- **드롭다운(v14)이 안 뜰 때**: ① `loadMatchData()` 완료 전이면 빈 목록 → `setInputMode('manual')`에서 로드 호출함 ② `mi-dd-*` 컨테이너 존재/`.open` 클래스 확인 ③ `MATCH.tree[TYPE]`에 해당 TYPE 키 존재 여부(`miType()` 폴백 Driver).
- **(v15) SHAFT 드롭다운이 비었을 때**: `getAllShaftCandidates()`는 `MATCH.shaft`(shaft_index.json) 로드 여부에 의존 → JSON 로드 실패 시 빈 목록. 콘솔에서 `MATCH.loaded`/`MATCH.shaft` 확인.
- **(v15) VGT/eBay 조회 쿼리 변경 시**: 검색어는 `buildMarketQuery()`(`f-brand`+`f-type`+`f-model`, 순서 **BRAND TYPE MODEL**)에서 단일 생성. 순서/항목 변경은 이 함수 한 곳만 수정하면 VGT·eBay 동시 반영. TITLE 필드(`f-title`)와는 독립.
- **(v15 사고) sw.js 절단 재발**: 작업본 sw.js가 53줄에서 `.catch` 폴백 누락된 채 잘려 있었음. `node --check`(CRLF는 LF 변환 후)로 매 배포 전 검증, 손상 시 `git show HEAD:app/sw.js` 복원 후 버전만 치환.
- **(v18) `git status`에 안 고친 파일이 뜰 때**: 십중팔구 CRLF 노이즈. `git diff --ignore-cr-at-eol --stat` 이 **비어 있으면 내용은 동일**하므로 `sync_pull.bat` 실행으로 정리. `.gitattributes` 가 지워지면 재발하므로 삭제 금지.
- **(v18) 줄바꿈 정책 변경 시**: `.gitattributes` 한 곳만 수정. `.bat/.cmd/.ps1`을 `eol=lf`로 바꾸면 Windows에서 `goto`/라벨이 깨질 수 있으니 CRLF 유지할 것.
- **(v18) 원격 최신 여부 확인법**: 마운트 쪽 `git fetch`는 프록시 403으로 불가. 커밋 해시 대조는 네트워크가 되는 환경에서 `git ls-remote <repo-url>` 로 하고, 실제 pull 은 Windows에서 `sync_pull.bat` 실행.
- **(v20) 폰 누적분이 자동완성에만 있고 DB에 없을 때**: 정상. 방법 A(런타임 병합)는 그 기기 `localStorage` 한정이라 **`Clear All`·캐시 삭제·기기 변경 시 사라짐**. 영구 반영은 월 1회 수작업(`_template.xlsx` 복사 → 작성 → `data/incoming/` → `py build_match_tree.py` → `push.bat`).
- **(v20) 흡수했는데 후보 순위가 안 바뀔 때**: ① `push.bat` 미실행(JSON이 GitHub에 안 올라감) ② 폰 SW 캐시 — `CACHE_VERSION` 승급 여부 확인 ③ 흡수 건수가 기준 7,120건 대비 작아 순위 변동이 안 보이는 것일 수 있음(`match_tree.json`에서 직접 count 확인).
- **(v20) 반입 양식을 바꿀 때**: 열 순서/시트명(`final`)을 바꾸면 `build_match_tree.py` 의 `norm_row()`·`read_incoming_xlsx()` 도 같이 고칠 것. `_template.xlsx` 의 `final` 시트에는 **예시 행을 절대 넣지 말 것**(지우는 걸 잊으면 그대로 흡수됨 — 예시는 `작성요령` 시트에).
- **(v19) 배치 스크립트에 절대경로 쓰지 말 것**: 반드시 `cd /d "%~dp0"`. 폴더명·사용자명이 바뀌어도 따라오고, `cd` 실패가 조용히 넘어가는 사고를 막는다. 새 스크립트를 만들 때도 루트 검증 가드(`if not exist ".git"` 등)를 같이 넣을 것.
- **(v19 사고) `push.bat` 이 Done 인데 GitHub에 반영이 안 됐을 때**: `.git/index.lock` 잔존으로 커밋이 조용히 실패한 경우. 현재 push.bat 은 Step 0 에서 자동 삭제하고 커밋 실패 시 중단하므로 **다시 실행하면 해결**. 반영 확인은 메시지가 아니라 `git log --oneline -1` 해시로 할 것.
- **(v19) Cowork 세션에서 마운트 repo에 git 명령 금지**: 읽기(`git status`)만 해도 `.git/index.lock` 이 남고 마운트에서는 지울 수 없다. 원격 커밋 대조가 필요하면 네트워크 되는 쪽에서 `git ls-remote` 를 쓸 것.
- **(v19) 앱을 고쳤는데 폰에 반영 안 될 때**: `push.bat` 이 `CACHE_VERSION` 을 `yyyyMMdd-HHmm` 으로 갱신하므로 정상이면 매 푸시마다 값이 바뀐다. GitHub의 `app/sw.js` 에서 값이 직전 배포와 같다면 치환 실패 — push.bat 이 findstr 가드로 잡아 커밋 전에 멈춘다. 그래도 안 되면 폰에서 PWA 완전 종료 후 재실행(SW 갱신은 탭 전체가 닫혀야 활성화됨).
- **(v20) 반입 파일이 흡수되지 않을 때**: ① 파일명이 `_` 로 시작하는지(양식으로 간주해 스킵) ② `done/_processed.json` 에 같은 해시가 있는지(이미 반영된 파일) ③ 데이터가 `final` 시트에 있는지 ④ TYPE/BRAND/MODEL 중 빈 칸이 있는 행은 통째로 무시됨.
- **(v20) 잘못 흡수했을 때 되돌리기**: `data/backup/` 의 직전 타임스탬프 파일을 `data/00 matching data.xlsx` 로 되돌린 뒤 `done/_processed.json` 에서 해당 해시 항목을 지우고 재실행.
