# Golf Club Register App — 향후 개선 계획

> 최초 작성: 2026-04-06 | 최종 업데이트: 2026-05-30 (v12)
> 기준 버전: **v12** (2026-05-30 Code Review 1차/2차 즉시 수정 반영)

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
| Screen 2 Save/Save&Next 분리 | v11 | 동일 항목 일부만 바꿔 재저장 가능 |
| SW 캐시 정리 + v7 승급 | v12 (1차) | 삭제된 golf_db/brands.json 캐시 항목 제거, icon-192/512 추가, corsproxy/golftradingpost 캐시 우회 |
| CSV 헤더 수정 | v12 (1차) | `Full Set` → `TYPE` (실제 데이터와 일치) |
| Dead code 제거 | v12 (1차) | `getVGTToken()`, `.btn-market*` CSS, `CAPTURE_SEQUENCE`, `populateEditForm` `matches` 파라미터 |
| docs Flex 표 코드 일치화 | v12 (1차) | data_analysis.md §7-3을 코드 `flexMap`과 동기화 |
| RULES / FORM_DEFAULTS 상수화 | v12 (2차) | flexMap, loftTable, typeNormalize, brandNormalize, conditionMap을 RULES 객체로 통합. 폼 default도 FORM_DEFAULTS에 집약 |
| resetEditForm / buildEntry 공통화 | v12 (2차) | populateEditForm↔goToEditManual 폼 리셋 통합, saveOnly↔saveEntry는 buildEntry/persistEntry로 통합. -약 60줄 절감 |
| 브랜드 정규화 적용 | v12 (2차) | populateEditForm 진입 시 `normalizeBrand()` 자동 적용 (대소문자/표기 흔들림 보정) |
| AI JSON 파싱 try/catch | v12 (2차) | JSON.parse 실패 시 raw 로깅 + 사용자 친화 메시지 |
| 네트워크 에러 분기 세분화 | v12 (2차) | 401/429/529/parse_error/AbortError/network 별 메시지 분리, 오프라인 사전 감지 |
| localStorage 4MB 임계 경고 | v12 (2차) | saveToStorage가 4MB 초과 시 토스트 경고 (세션당 1회) |
| push.bat 안전화 | v12 (2차) | 상시 `--force` 제거, push 실패 시 reset_and_push.bat 안내 |
| sw.js CACHE_VERSION 자동 갱신 | v12 (2차) | push.bat이 push 직전 sw.js 버전을 오늘 날짜(YYYYMMDD)로 자동 치환 |
| AI 프롬프트 영문화 + 브랜드 hint + putter_length | v12 (3차) | `RULES.brandNormalize` 20종을 hint로 주입, JSON 응답 필드에 `putter_length` 추가 |
| xlsx 출력 (SheetJS) | v12 (3차) | Export XLSX 버튼, 셀 배경 무색(글로벌 규칙) 강제, CDN 실패 시 CSV 폴백 |
| 모듈 분리 | v12 (3차) | `app/rules.js`, `app/ai.js`, `app/export.js` 분리. index.html 인라인은 `<script defer>` |
| docs Flex 단일 소스 명시 | v12 (3차) | docs §7-3에 `rules.js` 참조 메모 추가 |

---

## 1. 🔴 높은 우선순위 (기능 결함 / 데이터 손실 위험)

### 1-1. 등록 데이터 Cloud 백업
**문제:** 현재 데이터는 브라우저 localStorage에만 저장됨.
- 브라우저 캐시 삭제 시 모든 등록 데이터 소멸
- 기기 분실 / 교체 시 데이터 복구 불가
- 여러 기기에서 동기화 불가
- `generateCode()`가 단일 기기 STATE만 참조하므로, 다기기 사용 시 코드 충돌 가능

**개선안 (선택지):**

| 방법 | 난이도 | 비용 | 설명 |
|------|--------|------|------|
| GitHub Gist API | 하 | 무료 | Personal Access Token 1개로 JSON 동기화 (권장) |
| Google Sheets API | 중 | 무료 | OAuth 연동, 스프레드시트 자동 저장 |
| Shopify Metafield | 중 | 포함 | 기존 Shopify 스토어에 데이터 저장 |
| Firebase Realtime DB | 중 | 무료(소량) | 실시간 동기화, 다기기 지원 |

**권장:** GitHub Gist API — 이미 GitHub 계정 보유, 구현 간단.

### 1-2. `api/` 폴더 토큰 평문 파일 git 추적 확인
**문제:** `api/github_access tokens_20260423.txt`, `api/phone_api.txt`, `api/laptop_api.md`가 평문으로 존재. 이미 커밋된 이력이 있는지 확인 필요.

**개선안:**
```
# .gitignore 보강
api/*token*
api/*api*
api/secrets/
```
그리고 `git ls-files api/`로 추적 여부 확인 후, 필요 시 `git rm --cached`.

---

## 2. 🟡 중간 우선순위 (UX 개선 / 편의 기능)

### 2-1. CSV 컬럼 확장 (선택)
v12에서 헤더 `Full Set` → `TYPE` 수정 완료. 사용자 글로벌 규칙(엑셀화)에 맞춰 컬럼 확장도 고려 가능.
```javascript
const headers = ['NO', 'TYPE', 'BRAND', 'MODEL', 'TITLE', 'SPEC', 'PRICE', 'COST', 'GENDER', 'HANDED', 'GRIP', 'DATE'];
```

### 2-2. xlsx 출력 도입
사용자 글로벌 규칙: "엑셀 파일 생성 시 데이터 셀 배경색은 항상 무색". 현재 CSV만 지원.
- SheetJS(xlsx 라이브러리) CDN 임베드로 .xlsx 다운로드 추가
- 셀 스타일은 배경 무색 강제

### 2-3. AI 프롬프트 품질 개선
**문제:** XXIO, HONMA, PRGR 등 일본 브랜드 모델명 오인식 빈도가 있음.

**개선안:**
- 프롬프트에 상위 20개 브랜드 hint 추가 (RULES.brandNormalize 키 활용 가능)
- AI 응답 영문화 강제(현재 한국어 지시문 일부 혼재)
- `logo_text` 필드 활용도 높이기

### 2-4. Putter 길이 AI 인식 연동
AI 프롬프트에 `putter_length` 필드 추가 → `populateEditForm`이 Putter 타입일 때 자동 적용.

### 2-5. 등록 취소 / 되돌리기 기능
`Save & Next` 직후 3초간 토스트에 "실행 취소" 버튼 노출.
```javascript
function undoLastEntry() {
  STATE.entries.pop();
  saveToStorage();
  toast('마지막 항목이 취소되었습니다.');
}
```

### 2-6. 검색 / 필터 (List 화면)
- 브랜드 / 타입 / 가격대 필터 드롭다운
- TITLE 키워드 실시간 필터링
- 날짜 정렬 (최신순 / 오래된순)

### 2-7. 이미지 함께 저장 (IndexedDB)
현재 이미지는 등록 완료 후 즉시 버려짐. IndexedDB에 base64 저장 → List 화면 썸네일.
용량 주의: 항목당 ~200~400KB.

### 2-8. parseIronSetPcs 입력 검증 강화
`7pcs(4-P,A,A)`처럼 중복 letter 통과, `0pcs(...)` 같은 비논리 입력 통과.
→ letters dedup + 1~14 범위 체크.

### 2-9. CSV 파일명에 시각 포함
`golf_clubs_YYYYMMDD_HHmm.csv`로 변경 → 같은 날 여러 번 export 시 충돌 방지.

### 2-10. Wood/Hybrid SPEC 표기 단복수 통일
`5 Woods` (복수) vs `3 Hybrid` (단수) 불일치 → docs 기준에 맞춰 통일.

---

## 3. 🟢 낮은 우선순위 (기술 부채 / 장기 개선)

### 3-1. corsproxy.io 의존성 리스크
VGT Price 조회가 외부 무료 프록시에 의존. 서비스 중단 가능성.
- Shopify 공식 CORS 허용 엔드포인트 탐색
- 또는 Cloudflare Workers 무료 티어로 자체 경량 프록시 배포

### 3-2. 코드 모듈화
`index.html` 단일 파일이 여전히 1,700줄+. v12에서 RULES/FORM_DEFAULTS 분리는 완료했으나, 장기적으로 파일 분리:
```
app/
├── index.html        ← HTML 구조만
├── style.css         ← 모든 CSS
├── rules.js          ← RULES + FORM_DEFAULTS
├── app.js            ← 메인 앱 로직
├── ai.js             ← Claude Vision API
└── export.js         ← CSV / xlsx 내보내기
```

### 3-3. SPEC 빌더 분기 객체화
`regenerateFields()` 내 SPEC 조립부의 Wood/Hybrid/Wedge/Putter/Etc 분기를 `SPEC_BUILDERS[type]` 객체로 분리.

### 3-4. start_server.bat IP 파싱 개선
가상 어댑터(WSL/VPN/Hyper-V)가 먼저 등장하면 폰 접속 불가. `netsh interface` 활용으로 활성 인터페이스만 필터링.

### 3-5. 배치 등록 모드
1개 클럽 → 4장 → 저장 → 반복 대신, 여러 클럽을 연속 촬영 후 일괄 AI 분석.

### 3-6. 문서 자동 갱신
사용자 규칙 4번 "오류 및 개선사항을 관련문서에 업데이트". 현재 수동. push 시 git log에서 자동 CHANGELOG append 고려.

---

## 4. 개선 우선순위 로드맵

```
[즉시 = 완료]              [1~2주]             [1개월]           [장기]
   │                          │                    │                 │
v12 1차/2차 모두 적용    Cloud 백업         이미지 저장        코드 모듈화
                         AI 프롬프트 개선   검색/필터          배치 등록
                         api/ 토큰 점검    Undo 기능          corsproxy 대체
                         xlsx 출력         CSV 컬럼 확장
```

---

*작성: Claude (Cowork mode) | 2026-04-06*
*v9 업데이트: 2026-04-08 — VGT Price/DB 제거 완료 항목 반영, corsproxy 리스크 항목 신규 추가*
*v12 업데이트: 2026-05-30 — Code Review 1차(SW/CSV/dead code/docs Flex) 및 2차(상수화/공통화/AI catch/4MB 경고/push.bat) 일괄 반영*
