# Golf Club Register App — 향후 개선 계획

> 최초 작성: 2026-04-06 | 최종 업데이트: 2026-04-08 (v9 반영)
> 기준 버전: v9

---

## ✅ 완료된 항목

| 항목 | 버전 | 내용 |
|------|------|------|
| Iron Set pcs 버그 수정 | v8 | `8pcs(3-9)` 숫자 중복 이슈 해결 |
| selectMatch 후 UI 표시 | v8 | readonly 해제 시 배경색 흰색 변경 |
| 이중 이벤트 호출 수정 | v8 | f-type, f-putter-length SKIP_REGEN_IDS 처리 |
| 빈 함수 제거 | v8 | `updateNextShotBtn()` 삭제 |
| SW 버전 갱신 | v8 | v5 → v6 |
| VGT Price 인앱 조회 | v9 | corsproxy.io 경유 Shopify 가격 조회 |
| DB 퍼지 매칭 시스템 완전 제거 | v9 | golf_db.json(2.4MB) + brands.json + golf_inventory.xlsx 삭제, 관련 JS 전부 제거 |

---

## 1. 🔴 높은 우선순위 (기능 결함 / 데이터 손실 위험)

### 1-1. 등록 데이터 Cloud 백업
**문제:** 현재 데이터는 브라우저 localStorage에만 저장됨.
- 브라우저 캐시 삭제 시 모든 등록 데이터 소멸
- 기기 분실 / 교체 시 데이터 복구 불가
- 여러 기기에서 동기화 불가

**개선안 (선택지):**

| 방법 | 난이도 | 비용 | 설명 |
|------|--------|------|------|
| Google Sheets API | 중 | 무료 | OAuth 연동, 스프레드시트에 자동 저장 |
| Shopify Metafield | 중 | 포함 | 기존 Shopify 스토어에 데이터 저장 |
| GitHub Gist API | 하 | 무료 | Personal Access Token만으로 JSON 저장 |
| Firebase Realtime DB | 중 | 무료(소량) | 실시간 동기화, 다기기 지원 |

**권장:** GitHub Gist API — 이미 GitHub 계정 보유, 구현 간단, 비용 없음.

---

### 1-2. 등록 데이터 용량 경고
**문제:** localStorage는 브라우저별 5~10MB 한도. 용량 초과 직전 사용자에게 알림 없음.

**개선안:**
```javascript
function getStorageUsageKB() {
  const data = localStorage.getItem('golf_entries') || '';
  return (new Blob([data]).size / 1024).toFixed(1);
}
// saveToStorage() 내부: 4MB 초과 시 경고 토스트
if (getStorageUsageKB() > 4096) {
  toast(`저장 용량 주의: ${getStorageUsageKB()}KB. CSV 내보내기 후 오래된 항목 정리 권장.`, true);
}
```

---

## 2. 🟡 중간 우선순위 (UX 개선 / 편의 기능)

### 2-1. CSV 컬럼명 수정 (소규모, 즉시 가능)
**문제:** 현재 헤더: `NO, Full Set, TITLE, SPEC, PRICE, COST`
- `'Full Set'`은 실제로 TYPE 필드 → 혼란 유발

**개선안:** 헤더를 TYPE으로 수정, 동시에 컬럼 확장
```javascript
const headers = ['NO', 'TYPE', 'BRAND', 'MODEL', 'TITLE', 'SPEC', 'PRICE', 'COST', 'GENDER', 'HANDED', 'GRIP', 'DATE'];
const rows = STATE.entries.map(e => [
  csvCell(e.no), csvCell(e.type), csvCell(e.brand), csvCell(e.model),
  csvCell(e.title), csvCell(e.spec), csvCell(e.price), csvCell(e.cost),
  csvCell(e.gender), csvCell(e.handed), csvCell(e.grip),
  csvCell(e.timestamp ? e.timestamp.slice(0,10) : '')
]);
```

---

### 2-2. dead code 정리 (소규모, 즉시 가능)
**내용:**
```javascript
// 제거 대상 1: Storefront API 시도 흔적
function getVGTToken() { ... }  // 호출부 없음

// 제거 대상 2: 미사용 CSS 클래스
.btn-market { ... }
.btn-market-vgt { ... }

// 개선 대상 3: 미사용 파라미터
function populateEditForm(aiResult, matches = []) { ... }
// → function populateEditForm(aiResult) { ... } 으로 변경
```

---

### 2-3. AI 프롬프트 품질 개선
**문제:** XXIO, HONMA, PRGR 등 일본 브랜드에서 AI가 브랜드명을 잘못 읽는 경우 발생.

**개선안:**
- 프롬프트에 상위 20개 브랜드 hint 추가
  ```
  브랜드 참고 목록: TaylorMade, Callaway, XXIO, Titleist, HONMA, Mizuno, PING, Odyssey,
  Cleveland, COBRA, Bridgestone, YAMAHA, NIKE, PRGR, Wilson, Scotty Cameron, SRIXON, YONEX, PXG
  ```
- `logo_text` 필드 활용도 높이기 → 약자 클럽(XCGB 등) 인식 향상

---

### 2-4. Putter 길이 AI 인식 연동
**문제:** 현재 퍼터 길이는 사용자가 수동으로 드롭다운 선택.

**개선안:** AI 프롬프트에 `putter_length` 필드 추가
```
- putter_length: 퍼터 길이 (인치, 예: 34, 33.5 / Putter 타입일 때만)
```
- `populateEditForm()` 에서 Putter 타입 시 자동 적용

---

### 2-5. 등록 취소 / 되돌리기 기능
**문제:** `Save & Next` 클릭 후 실수 등록 시 List 화면에서 찾아 직접 삭제해야 함.

**개선안:** 저장 후 3초간 "실행 취소" 버튼을 토스트에 함께 표시
```javascript
function undoLastEntry() {
  STATE.entries.pop();
  saveToStorage();
  toast('마지막 항목이 취소되었습니다.');
}
```

---

### 2-6. 검색 / 필터 기능 (List 화면)
**문제:** 등록 항목이 많아질수록 원하는 항목을 찾기 어려움.

**개선안:**
- 브랜드 / 타입 / 가격대 필터 드롭다운
- 키워드 검색 (TITLE 기준 실시간 필터링)
- 날짜 정렬 (최신순 / 오래된순)

---

### 2-7. 이미지 함께 저장 (IndexedDB 활용)
**문제:** 현재 이미지는 등록 완료 후 즉시 버려짐.

**개선안:** localStorage 대신 IndexedDB에 이미지(base64) 저장
- 각 entry에 `images: [...]` 필드 추가
- List 화면에서 썸네일 표시
- 단, 용량 증가 주의 (항목당 ~200~400KB 예상)

---

### 2-8. Service Worker 버전 자동 관리
**문제:** 현재 `sw.js`의 `CACHE_VERSION`을 코드 변경 때마다 수동으로 올려야 함.

**개선안 A (간단):** `CACHE_VERSION`을 날짜 기반으로 관리
```javascript
const CACHE_VERSION = '2026-04-08';  // 배포일로 관리
```

**개선안 B (자동화):** `push.bat` 수정 — push 전 `sw.js` 버전을 현재 날짜로 자동 교체

---

## 3. 🟢 낮은 우선순위 (기술 부채 / 장기 개선)

### 3-1. corsproxy.io 의존성 리스크
**문제:** VGT Price 조회가 외부 무료 프록시(corsproxy.io)에 의존.
- 서비스 중단 / 속도 저하 가능성

**개선안:**
- Shopify의 공식 CORS 허용 엔드포인트 탐색 (일부 Shopify 스토어는 CORS 허용)
- 또는 자체 경량 프록시 배포 (Cloudflare Workers 무료 티어)

---

### 3-2. 코드 모듈화
**문제:** `index.html` 단일 파일이 1,637줄 이상으로 비대해짐.

**개선안:** 역할별 파일 분리
```
app/
├── index.html        ← HTML 구조만 (200줄 수준)
├── style.css         ← 모든 CSS
├── app.js            ← 메인 앱 로직
├── ai.js             ← Claude Vision API
└── export.js         ← CSV / 내보내기
```

---

### 3-3. 오프라인 시 AI 분석 대체
**문제:** 인터넷 없으면 AI 분석 불가. 현재는 API 실패 후에야 수동 폴백 처리됨.

**개선안:** 오프라인 사전 감지
```javascript
if (!navigator.onLine) {
  toast('오프라인 상태: AI 분석을 사용할 수 없습니다. 수동으로 입력해 주세요.', true);
  goToEditManual();
  return;
}
```

---

### 3-4. 다국어 지원 (일본어 브랜드 대응)
**문제:** XXIO, HONMA 등 모델명이 일본어로 반환되는 경우 있음.

**개선안:** AI 프롬프트에 명시 추가
```
- model: 영어 표기로 반환 (일본어 표기 시 영문 번역 또는 로마자 표기)
```

---

### 3-5. 배치 등록 모드
**현재:** 1개 골프채 → 사진 4장 → 저장 → 반복
**개선안:** 여러 개 골프채를 연속 촬영 후 일괄 AI 분석
- 실용성: 10~20개 클럽을 한 번에 찍고 나중에 편집

---

## 4. 개선 우선순위 로드맵

```
[즉시]                  [1~2주]                [1개월]              [장기]
   │                        │                      │                   │
CSV 컬럼 수정           Cloud 백업             이미지 저장         코드 모듈화
dead code 정리          AI 프롬프트 개선       검색/필터           배치 등록
용량 경고               SW 버전 자동화         Undo 기능           다국어 지원
                        Putter AI 연동         corsproxy 대체
```

---

*작성: Claude (Cowork mode) | 2026-04-06*
*v9 업데이트: 2026-04-08 — VGT Price/DB 제거 완료 항목 반영, corsproxy 리스크 항목 신규 추가*
