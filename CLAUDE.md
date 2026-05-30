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

## 현재 상태 (v12, 2026-05-30)
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

### 회귀 방지 메모
- Code Review 본문: `docs/code_review_20260530.md`
- Flex/브랜드/타입 규칙 변경 시 **반드시 `app/rules.js`와 `docs/data_analysis.md §7-3` 동시 수정**
