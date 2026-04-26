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
03 golf-club-app/
├── app/index.html   ← 메인 앱 (단일 파일 PWA, ~1,637줄)
├── docs/data_analysis.md
├── CLAUDE.md
├── start_server.bat / push.bat / setup_github.ps1
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

## 현재 상태 (v9, 2026-04-08)
- VGT Price 인앱 조회 정상 동작 확인
- 4차 테스트 대기 중
- Dead code: `getVGTToken()` 함수, `.btn-market` CSS (기능 영향 없음)
