# 개선 계획서 — 자판/음성 입력 + 계층형 자동완성

> 작성: 2026-06-04 | 기준 버전: v12 | 상태: **계획 (미구현, 승인 대기)**
> 대상: `app/index.html`, `app/rules.js`, 신규 `app/match.js`, 신규 `app/data/match_tree.json`
> 데이터 출처: `00 matching data.xlsx` (final 시트, 7,120건)

---

## 1. 목적 / 배경

현재 앱은 **사진 4장 → Claude Vision API → 폼 자동 채움** 단일 경로다.
문제점:
- 사진 인식 정확도 편차 (특히 XXIO / HONMA / PRGR 등 일본 브랜드 모델명)
- 촬영·업로드·API 대기 등 번거로움

개선 방향(사용자 확정):
1. **사진 입력 / 직접 입력 둘 다 유지(선택식)** — 기존 AI 사진 경로는 그대로 두고 직접 입력 경로를 추가
2. TYPE 선택 후 **BRAND / MODEL / SHAFT 3개**만 자판·음성으로 입력 → 기존 데이터(7,120건) 참고로 정확·빠르게
3. 위 3개가 제대로 들어가면 나머지(loft, flex, weight, gender 등)는 기본 세팅 조정으로 처리

> ⚠️ 이는 v9에서 제거했던 로컬 DB 매칭을 **사진 인식이 아닌 "입력 자동완성" 형태로 재도입**하는 것이다.
> v9 DB(golf_db.json 2.4MB)와 달리 이번엔 BRAND/MODEL/SHAFT 3컬럼만 추출 → 계층 JSON 약 **55KB**로 매우 가벼움.

---

## 2. 데이터 분석 결과 (검증 완료)

| 항목 | 값 |
|------|-----|
| 총 데이터 | 7,120건 |
| 컬럼 | TYPE / BRAND / MODEL / SHAFT |
| TYPE 종류 | Driver(1583) / Wood(1347) / Iron Set(1249) / Wedge(1031) / Hybrid(863) / Putter(808) / Etc(238) |
| 고유 BRAND | 184개 |
| 고유 MODEL | 2,402개 |
| 고유 SHAFT | 2,291개 |
| BRAND+MODEL 조합 | 2,416개 |
| 데이터 품질 | 표기 변형 거의 없음 (POWER BILT/PowerBilt 1건, 공백 6건) — 정제 부담 적음 |

**계층형 자동완성 적합성:** 매우 높음
- TYPE 선택 → BRAND 후보 자동 축소 (예: Driver 56개, Putter 95개 브랜드)
- BRAND → MODEL 빈도순 (예: TaylorMade Driver → M2 83, SIM MAX 48, M6 40 …)

**SHAFT 폴백 검증 (사용자 추가 요청 반영):**
- BRAND+MODEL 조합의 **75%가 샤프트 후보 1개** → 1차 매칭 시 거의 자동 입력
- 단, 1개뿐이라는 건 **새 샤프트 유입 가능성도 높다**는 의미 → 폴백 + 직접 보정 필수
- BRAND 단계 평균 후보 15개, TYPE 전체 단계는 빈도 상위가 명확 (Driver: TENSEI BLUE TM50, FUBUKI TM5 …)

---

## 3. SHAFT 단계적 폴백 전략 (사용자 추가 요청)

샤프트는 분산이 커서(고유 2,291개) BRAND/MODEL만큼 정밀 매칭이 어렵다.
따라서 **점진적으로 후보 범위를 넓히는 3단계 폴백 + 직접 보정** 구조로 설계한다.

```
[SHAFT 후보 결정 로직]

1차) BRAND + MODEL 조합으로 검색
        └─ 후보 있음 → 빈도순 노출 (조합의 75%는 후보 1개 → 사실상 자동)
        └─ 후보 없음/부족 → 2차로

2차) BRAND 단위로 확장 검색
        └─ 해당 브랜드가 그간 쓴 샤프트 전체 (평균 15개) 빈도순

3차) TYPE 전체로 확장 검색 (최종 폴백)
        └─ 그 타입에서 가장 많이 쓰인 샤프트 상위 N개

★ 어느 단계든: 사용자가 후보 선택 OR 자판/음성으로 직접 입력/덮어쓰기 가능
```

**1차 매칭 후 샤프트만 별도 보정 흐름:**
- BRAND/MODEL 확정 → 화면에 "추천 샤프트" 칩(빈도순) 표시
- 칩 영역에는 단계 라벨 노출: `이 모델 기준` / `이 브랜드 기준` / `타입 전체` 로 출처를 구분
- 사용자는 ① 칩 탭 ② 자판 입력 ③ 음성 입력 중 택1
- 입력값은 SHAFT 사전과 퍼지 매칭하여 오타/음성 오인식 보정 후 확정
- 매칭 안 되는 신규 샤프트는 입력값 그대로 저장 (강제 매칭 안 함)

---

## 4. UI / 사용자 흐름 설계

### 4-1. Screen 1 (Capture) — 입력 방식 선택 추가

```
┌─────────────────────────────────┐
│ Club Type  [ Select Type ▾ ]     │   ← 기존 유지
├─────────────────────────────────┤
│  [ 📷 사진으로 분석 ]  [ ⌨️ 직접 입력 ]  │   ← 신규: 2-버튼 선택
└─────────────────────────────────┘
   │                      │
   ▼ (기존 그대로)          ▼ (신규 경로)
 Head/Shaft 촬영 →        직접 입력 패널 → Screen 2(Edit)로 채워서 이동
 Analyze with AI
```

- 기존 사진 캡처 카드/AI 분석은 **무수정 유지** (회귀 위험 0)
- "직접 입력" 선택 시 신규 입력 패널 표시 (또는 Edit 화면 상단에 간이 입력 위젯)

### 4-2. 직접 입력 패널 (신규)

```
TYPE: Driver  (Screen1에서 선택된 값 표시)

BRAND  [ 자판 입력 ⌨️ ] [ 🎤 ]
       추천: TaylorMade · Callaway · XXIO · Titleist · PING …   (TYPE 기준 빈도순)

MODEL  [ 자판 입력 ⌨️ ] [ 🎤 ]   (BRAND 확정 후 활성화)
       추천: M2 · SIM MAX · M6 · STEALTH …                      (BRAND 기준 빈도순)

SHAFT  [ 자판 입력 ⌨️ ] [ 🎤 ]   (MODEL 확정 후 활성화)
       추천: TENSEI RED TM50 …   [이 모델 기준]                  (3-1 폴백 로직)
            (없으면) [이 브랜드 기준] / [타입 전체]

      [ 이 정보로 계속 → Edit ]
```

- 추천은 **칩(버튼) 형태**, 탭하면 즉시 입력. 자판 입력 시 실시간 필터.
- 음성(🎤): 브라우저 내장 `webkitSpeechRecognition` / `SpeechRecognition` 사용 (설치 불필요)
- 음성 결과 → SHAFT/MODEL 사전과 퍼지 매칭하여 보정 후보 제시

### 4-3. Edit 화면 연계

- 직접 입력으로 BRAND/MODEL/SHAFT 확정 → 기존 `populateEditForm()` 경로 재활용하여 Edit 폼 채움
- 나머지 필드는 `FORM_DEFAULTS` 기본값 + TYPE별 자동 규칙(LOFT_TABLE 등) 그대로 적용
- 사용자는 Edit 화면에서 loft/flex/weight/gender 등만 조정 후 저장

---

## 5. 음성 입력 설계

| 항목 | 방식 |
|------|------|
| 엔진 | 브라우저 내장 Web Speech API (`SpeechRecognition`) — 외부 라이브러리/비용 없음 |
| 언어 | 영어(`en-US`) 기본 + 필요 시 한국어 토글 (브랜드는 영문 표기라 en 권장) |
| 지원 | Chrome/Edge/안드로이드 정상, iOS Safari는 제한적 → **미지원 시 자판 입력으로 자동 폴백** |
| 보정 | 인식 텍스트를 해당 필드 사전과 퍼지 매칭(아래 6장) 후 상위 후보 제시 |
| 권한 | 마이크 권한 1회 요청, 거부 시 자판 입력만 |

---

## 6. 퍼지 매칭 (오타/음성 오인식 보정)

- 대상: BRAND(184), MODEL(2402), SHAFT(2291) 사전
- 알고리즘: 정규화(소문자/공백제거) + 부분 일치 우선 + Levenshtein 거리 보조 (경량 자체 구현, 외부 라이브러리 불필요)
- 예: "스텔스"→STEALTH, "엑시오"→XXIO, "벤투스"→VENTUS
- BRAND는 기존 `RULES.brandNormalize` 재활용 + 데이터 기반 확장
- 매칭 임계값 미달 시 **강제 변환하지 않고** 사용자 입력 원본 유지(신규 모델 대응)

---

## 7. 데이터 파이프라인 (빌드 단계)

```
00 matching data.xlsx
   │  build_match_tree.py (신규, 오프라인 1회 실행 — Cowork/로컬)
   ▼
app/data/match_tree.json   (≈55KB)
   {
     "Driver": { "TaylorMade": { "M2": 83, "SIM MAX": 48, ... }, ... },
     ...
   }
app/data/shaft_index.json  (SHAFT 폴백용)
   {
     "byModel": { "TaylorMade||STEALTH": {"TENSEI RED TM50":51, ...} },
     "byBrand": { "TaylorMade": {...} },
     "byType":  { "Driver": {...} }
   }
```

- 데이터 갱신 시: 엑셀 교체 → 스크립트 재실행 → JSON 2개 재생성 → push
- 글로벌 규칙(일본어 상품명 영어 번역)은 이미 데이터가 영문이라 추가 처리 불필요

---

## 8. 영향받는 파일 / 변경 범위

| 파일 | 변경 | 비고 |
|------|------|------|
| `app/index.html` | Screen1 입력방식 2-버튼 + 직접입력 패널 HTML/JS 추가 | 기존 캡처/AI 코드는 미수정 |
| `app/match.js` | **신규** — 계층 자동완성 + SHAFT 폴백 + 퍼지매칭 + 음성 | 모듈 분리 원칙 따름 |
| `app/data/match_tree.json` | **신규** — 계층 데이터 | ≈55KB |
| `app/data/shaft_index.json` | **신규** — 샤프트 폴백 인덱스 | |
| `build_match_tree.py` | **신규** — 엑셀→JSON 변환 스크립트 | 오프라인 빌드용 |
| `app/sw.js` | CACHE_VERSION 승급(v7→v8) + 신규 JSON/JS 캐시 등록 | 회귀 방지 필수 |
| `app/rules.js` | brandNormalize 데이터 기반 보강(선택) | |
| `docs/data_analysis.md` | 매칭 데이터 구조/폴백 규칙 메모 추가 | 규칙4(문서 동기화) |

---

## 9. 구현 단계 (승인 후 진행 순서)

1. **빌드 스크립트** `build_match_tree.py` 작성 → JSON 2종 생성 + 검증
2. **match.js** 작성: 계층 자동완성 → SHAFT 3단계 폴백 → 퍼지매칭 → Web Speech → **STATE.entries 병합(방법 A 자동 학습)**
3. **index.html** Screen1 입력방식 선택 + 직접입력 패널 추가, Edit 연계
4. **sw.js** 캐시 등록 + 버전 승급
5. **검증**: 대표 케이스 자동완성/폴백/음성 폴백 동작 확인 (TaylorMade STEALTH, PING G25, 신규 모델 등)
6. **문서 갱신**: CLAUDE.md(v13), improve-plan.md, data_analysis.md 동기화 (규칙4)

---

## 10. 리스크 / 검토 포인트

| 리스크 | 대응 |
|--------|------|
| iOS Safari 음성 미지원 | 자판 입력 자동 폴백, 음성 버튼 숨김/비활성 |
| 신규 모델/샤프트가 데이터에 없음 | 강제 매칭 금지, 입력 원본 저장 + 폴백으로 후보만 제시 |
| 데이터 노후화 | 빌드 스크립트로 주기적 재생성, 갱신 절차 문서화 |
| 기존 사진 경로 회귀 | 사진/AI 코드 미수정, 입력 경로만 추가 (분리 설계) |
| JSON 55KB 추가 로드 | SW 캐시 등록으로 최초 1회만 다운로드, 체감 영향 미미 |

---

## 10-B. 데이터 유지보수 — 신규 모델/샤프트 반영 전략

> 배경: 신규 모델/샤프트는 계속 생긴다. 운영 환경은 **GitHub 보관 + 모바일 PWA 적용**.

### 대전제 (중요)
`match_tree.json` / `shaft_index.json`은 **"추천 후보"일 뿐 입력을 제한하지 않는다.**
데이터에 없는 신규 모델/샤프트도 자판·음성으로 그대로 입력·등록 가능(10장 "강제 매칭 금지" 원칙).
→ 따라서 데이터 갱신은 **긴급 작업이 아니라, "다음에 추천 후보로 뜨게 할지"의 선택적 주기 작업**이다.

### 방법 A — 등록 데이터로 자동 학습 (1차 구현 포함, 권장 기본값)
- 자동완성 후보 = `match_tree.json`(기준 7,120건) **+ 내가 직접 등록한 항목(STATE.entries)** 을 런타임 병합
- 새 클럽을 한 번 등록하면 그 BRAND/MODEL/SHAFT가 **다음 입력부터 후보로 노출**
- 빌드/푸시 불필요, 모바일에서 그대로 누적됨
- 한계: "최초 1회 입력"은 후보에 없음(직접 입력으로 해결) / 내 기기에만 누적 → **Cloud 백업(improve-plan §1-1 GitHub Gist)과 묶으면 다기기 공유**
- 구현 위치: `match.js`의 후보 생성 함수에서 `STATE.entries`를 같은 (type>brand>model / shaft) 구조로 집계해 병합

### 방법 B — 주기적 엑셀 재빌드 (정제용, 분기 1회 권장)  ※ v19에서 자동화 완료
- `data/00 matching data.xlsx`에 신규 데이터 추가 → `py build_match_tree.py` 재실행 → JSON 2종 재생성 → push
- 정확하고 깔끔하나 **PC에서 수동**(모바일 불가)
- 방법 A로 누적된 항목을 가끔 엑셀에 흡수시켜 기준 데이터를 정제하는 용도

**(v19, 2026-08-18) 실행 경로 개통 — 수동 복붙 불필요**

당초 계획에는 "엑셀에 신규 데이터 추가"의 *구체적 수단*이 비어 있었음. 실제로는 폰 누적분을 꺼낼 방법이 없었는데, 원인은 `exportXLSX()`에 **SHAFT 열이 없어서** 빌드 스크립트가 요구하는 4열을 만들 수 없었던 것. v19에서 다음을 추가해 경로를 뚫음.

| 구성 | 내용 |
|------|------|
| `exportMatchXLSX()` (export.js) | List 화면 `Export DB` 버튼. 시트 `final` / 헤더 `TYPE·BRAND·MODEL·SHAFT·SRC_NO` |
| `data/incoming/` | 내려받은 파일을 넣어두는 반입 폴더 (README.txt 동봉) |
| `build_match_tree.py` | incoming 자동 병합 + 마스터 백업 + `done/` 이동 + `--dry-run` |
| `SRC_NO` (등록 CODE) | 재흡수 방지 키 — 같은 파일 두 번 넣어도 중복 집계 안 됨 |

```
폰 List → [Export DB] → PC의 data/incoming/ → py build_match_tree.py → push.bat → 폰 새로고침
```

- **SHAFT 합성 규칙**: 기준 엑셀 SHAFT는 `TaylorMade REAX` 같은 브랜드+모델 합본 단일 문자열. 앱의 `shaftBrand`+`shaftModel`을 합치되, `shaftModel`이 이미 브랜드로 시작하면 접두 중복을 피함.
- **중복 "조합"은 남긴다**: 빈도(count)가 후보 순위에 직결되므로 같은 BRAND+MODEL 반복 등록은 제거 대상이 아님. 제거하는 것은 *같은 SRC_NO의 재흡수*뿐.
- ⚠️ 실제 흡수는 **Windows에서** 실행할 것. 샌드박스 마운트는 rename 불가라 `done/` 이동이 실패함(`--dry-run`은 안전).

### 방법 C — Shopify 자동 동기화 (장기 과제)
- 이미 vgolftradingpost Shopify 스토어에 상품 등록 중 → 실제 판매 상품이 곧 최신 데이터
- 주기적으로 Shopify 상품 데이터를 끌어와 자동완성 갱신
- 가장 현실적이나 구현 부담 큼(Shopify API 연동). 여유 시 검토.

### 권장 운영 조합
```
평소:   방법 A (자동 학습) — 손 안 대도 폰에 누적
가끔:   방법 B (분기 1회) — [Export DB] → incoming/ → 재빌드 → push  (v19부터 자동)
장기:   방법 C — Shopify 동기화 검토
```

### 모바일/GitHub 운영 흐름
- 방법 A: 모바일에서 등록 → localStorage(+Gist 백업 시 클라우드) 누적, push 불필요
- 방법 B: PC에서 엑셀 수정 → 빌드 → push → 모바일 PWA가 SW 갱신으로 새 JSON 수신
  (※ B 실행 시 `sw.js` CACHE_VERSION 승급 필수 — push.bat 자동 갱신 활용)

---

## 11. 확정 사항 (2026-06-04 승인)

1. ✅ 직접 입력 위젯 위치: **Screen 1 내 패널** (TYPE 선택 → '직접 입력' 선택 시 패널 표시 → BRAND/MODEL/SHAFT 확정 후 Edit로 이동)
2. ✅ 음성 인식 언어: **영어 고정** (`en-US`) — 브랜드/모델/샤프트 모두 영문 표기
3. ✅ SHAFT 폴백 3차(TYPE 전체) 노출 후보: **상위 8개**
4. ✅ 빌드 스크립트 위치/실행: 프로젝트 폴더 `03 registration_app`에 `build_match_tree.py` 배치, 해당 폴더에서 실행(Cowork 대행 또는 로컬 `py build_match_tree.py`). 기존 골프 스크립트 운영 방식과 동일.

---

## 12. 구현 완료 (2026-06-04, v13)

9장 순서대로 전부 구현·검증 완료.

| 단계 | 산출물 | 상태 |
|------|--------|------|
| 1 | `build_match_tree.py` + `app/data/match_tree.json`(49KB)/`shaft_index.json`(209KB) | ✅ |
| 2 | `app/match.js` (계층 자동완성/SHAFT 3단계 폴백/퍼지매칭/Web Speech/방법A 병합) | ✅ |
| 3 | `app/index.html` — 입력방식 2-버튼 + Quick Entry 패널 + Edit 연계, `buildEntry`에 shaftBrand/shaftModel 추가 | ✅ |
| 4 | `app/sw.js` — CACHE_VERSION 20260604, match.js+JSON 2종 캐시 등록 | ✅ |
| 5 | 검증 — 실데이터로 계층/폴백/퍼지/칩제한(≤8)/방법A 자동학습 전부 통과 | ✅ |
| 6 | 문서 동기화 — CLAUDE.md(v13), 본 계획서 | ✅ |

**실측 차이 메모**: `shaft_index.json`이 계획 추정(55KB)보다 큰 **209KB** (byModel 2,416조합 전체 수록). 모바일 PWA 1회 캐시이므로 수용. 추후 용량 이슈 시 byModel을 상위 N개로 트림 가능.

**다음 후속 작업 후보** (별도 승인 필요): Cloud 백업(Gist)과 방법 A 연계로 다기기 후보 공유, byModel 트림으로 JSON 경량화.

---

*작성: Claude (Cowork mode) | 2026-06-04*
*확정: 2026-06-04 — 11장 4건 승인.*
*구현 완료: 2026-06-04 — 9장 전 단계 구현·검증 (v13).*
