# Golf Inventory Data Analysis
**원본 분석 파일**: `data/golf_inventory.xlsx` *(v9에서 저장소에서 제거됨 — 본 문서는 참고 기준치로만 유지)*
**최초 분석일**: 2026-03-29
**최종 동기화**: 2026-05-30 *(Flex 표 §7-3을 코드 `flexMap`과 일치화)*
**목적**: 이미지 판독 데이터를 일관된 형식으로 매핑하기 위한 정규화 기준

---

## 1. 전체 데이터 구조

### 기본 정보
| 항목 | 값 |
|------|-----|
| 시트 수 | 1개 (`data`) |
| 전체 행 수 | 6,297개 |
| 컬럼 수 | 5개 |

### 컬럼 정의

| 컬럼명 | 데이터 타입 | 결측값 | 설명 |
|--------|------------|--------|------|
| `CODE` | float64 | 87개 | 상품 코드 (예: 23072001) |
| `TYPE` | object | 0개 | 클럽 종류 (Driver, Wood, Iron Set 등) |
| `PRODUCT NAME` | object | 0개 | 브랜드 + 종류 + 모델 + 스펙 요약 |
| `SPECIFICATION` | object | 4개 | 샤프트 상세 정보 (소재, 무게, flex, 도수 등) |
| `PRICE` | float64 | 0개 | 판매가격 (USD) |

### 예시 데이터
```
CODE:          23072001
TYPE:          Driver
PRODUCT NAME:  NIKE Driver / SUMO 5000 HL / 12.0 / R
SPECIFICATION: SASQUATCH Diamana R-65 shaft, 65g, R-flex, 12.0 degrees, Men's right-handed
PRICE:         90.0
```

---

## 2. 브랜드 목록 (정규화 기준, 상위 브랜드)

총 **177개** 고유 브랜드 확인 (대소문자 포함 시 표기 방식 혼재 있음)

| 브랜드 | 항목 수 |
|--------|---------|
| TaylorMade | 1,796 |
| Callaway | 643 |
| XXIO | 559 |
| Titleist | 486 |
| HONMA | 368 |
| Mizuno | 361 |
| PING | 338 |
| Odyssey | 302 |
| Cleveland | 242 |
| COBRA | 126 |
| Bridgestone | 103 |
| YAMAHA | 75 |
| NIKE | 74 |
| PRGR | 66 |
| Wilson | 66 |
| ADAMS | 47 |
| Scotty Cameron | 40 |
| SRIXON | 36 |
| YONEX | 34 |
| PXG | 31 |

> ⚠️ **브랜드 표기 불일치**: 동일 브랜드가 대소문자 혼재로 다르게 집계됨
> - 예: `TaylorMade`, `Taylormade`, `TAYLORMDE` → 동일 브랜드
> - 예: `HONMA`, `Honma` → 동일 브랜드
> - 예: `PING`, `Ping` → 동일 브랜드
> - 이미지 매핑 시 브랜드 정규화(normalize) 처리 필요

---

## 3. TYPE(카테고리) 별 분포

| TYPE | 항목 수 | 비고 |
|------|---------|------|
| Driver | 1,436 | |
| Wood | 1,165 | `wood`(소문자 1건) 혼재 |
| Iron Set | 1,102 | `Iron set`(1건) 혼재 |
| Wedge | 888 | 중복 `Wedge` 키(4건 별도 집계) |
| Hybrid | 734 | `Hybrid`(1건 별도) 혼재 |
| Putter | 724 | |
| Etc | 173 | 싱글 아이언, 특수 클럽 등 |
| Full Set | 52 | |
| Shaft | 6 | 샤프트 단품 |
| Rental | 4 | 렌탈 세트 |

> ⚠️ **표기 불일치**: `Iron Set` / `Iron set`, `Wedge` 중복 등 → 매핑 시 대소문자 정규화 필요

---

## 4. PRODUCT NAME 컬럼 패턴 분석

### 기본 구조
```
{브랜드명} {TYPE} / {모델명} / {도수 or 구성} / {Flex} [/ Women or Lefty]
```

### TYPE별 패턴

#### Driver / Wood / Hybrid / Wedge
```
TaylorMade Driver / R11 / 9.0 / S
PING Driver / G25 / 9.5 / R(S)
TaylorMade Driver / M4 D-type / 10.5 / Lefty / R
Cleveland Driver / HI BORE / 16.0 / Women
COBRA Hybrid / Baffler / 3H / 20.0 / S
Callaway Wedge / Big Bertha / 52.0
```
- 슬래시(`/`) 구분자 사용
- Part[0]: 브랜드명 + TYPE → 브랜드는 공백 전 첫 단어
- Part[1]: 모델명
- Part[2]: 도수 (degrees) 또는 번수 (3H, 5W 등)
- Part[3]: Flex (`R`, `S`, `X`, `L`, `SR`, `Ladies` 등)
- Part[4]: 선택적 (`Women`, `Lefty`)

#### Iron Set
```
TaylorMade Iron Set / M2 / 7pcs / R
Mizuno Iron Set / JPX 921 Hot Metal / 7pcs / Lefty / R
```
- Part[2]: 피스 수 (예: `7pcs`, `9pcs`)
- Part[3]: Flex 또는 `Lefty`

#### Putter
```
Carbite Putter / Polar Balanced / 35"
Odyssey Putter / Dual Force / 34"
```
- Part[2]: 길이 (인치)
- Flex 없음

#### Full Set
```
Callaway Full set / Strata / 10 pcs / Uni
Wilson Full Set / Hope Platinum / 11pcs / Women
TaylorMade/ Titleist Full Set / 12pcs / S
```
- 복수 브랜드 포함 가능

---

## 5. SPECIFICATION 컬럼 패턴 분석

### 기본 구조
```
{샤프트명}, {무게}g, {Flex}-flex, {도수} degrees, {성별} right/left-handed
```

### TYPE별 예시

#### Driver
```
TaylorMade BLUR Fujicura 60 shaft, S-flex, 9.0 degrees, Men's right-handed
TaylorMade Rocketfuel Fujicura shaft, 50 grams, R-flex, 10.5 degrees(+,-), Men's right-handed
XXIO MP500 Driver shaft, 42g, 43.5", 12.5 degrees, Women's right-handed
```

#### Wood
```
ALDILA Voodoo SVS7 Graphite shaft, S-flex, 3w, 15.0 degrees, Men's right-handed
PING TFC 169 F Graphite shaft, S-flex, 5W, 18.0 degrees, Men's right-handed
```

#### Hybrid
```
Callaway original stock shaft, R-flex, 65g, 5Hybrid, 27.0 degrees, Men's right-handed
Diamana 82 HY graphite shaft, S-flex, 5 Hybrid, 24.0 degrees(+,-), Men's right-handed
```

#### Iron Set
```
TaylorMade REAX FAST High Launch Steel shaft, 88gram, R-flex, 7pcs(4.5.6.7.8.9.P), Men's right-handed
Callway original shaft, 65g, A(Senior)-flex, 6pcs(5,6,7,8,9,P), Men's right-handed
```

#### Wedge
```
Cleveland Wedge 588 RTX ROTEX Face 60.0 degrees, steel shaft, Men's right-handed
Callaway steelhead x-14 Gap wedge, Steel shaft, S-flex, 52.0 degrees, Men's right-handed
```

#### Putter
```
Carbite DH Polar Balanced putter 35" steel shaft, Men's right-handed
PING A Blade 36" Steel shaft, Men's right-handed
```

#### Full Set
```
Pick up only, Strata 10 pcs Complete Set for Starter(No bag), Driver, 3wood, 4,5Hybrid, Iron set, Putter, Men's right-handed
```

### SPECIFICATION에서 추출 가능한 필드

| 필드 | 추출 패턴 예시 |
|------|--------------|
| 샤프트명 | `Fujicura 60`, `REAX FAST`, `N.S. Pro 950` |
| 샤프트 소재 | `Graphite`, `Steel`, `steel shaft` 키워드 |
| 샤프트 무게 | `65g`, `88gram`, `50 grams` |
| Flex | `R-flex`, `S-flex`, `L-flex`, `A(Senior)-flex` |
| 도수 | `9.0 degrees`, `10.5 degrees(+,-)` |
| 성별/방향 | `Men's right-handed`, `Women's right-handed`, `Men's left-handed` |

---

## 6. 이미지 → 데이터 매핑 가이드

### 매핑 대상 필드 (이미지에서 읽어야 할 항목)

| 이미지 판독 필드 | 매핑 위치 | 비고 |
|----------------|----------|------|
| Type | `TYPE` | Driver, Wood, Iron Set 등 |
| 브랜드 | `PRODUCT NAME` 첫 단어 | 대소문자 정규화 필요 |
| 모델 | `PRODUCT NAME` Part[1] (슬래시 분리) | |
| Degrees (도수) | `PRODUCT NAME` Part[2] / `SPECIFICATION` | Driver·Wood·Wedge에 주로 존재 |
| 샤프트명 | `SPECIFICATION` 앞부분 | |
| 샤프트 무게 | `SPECIFICATION` 내 `g` / `gram` | |
| Flex | `PRODUCT NAME` 마지막 / `SPECIFICATION` | R, S, X, L, SR, A |

### PRODUCT NAME 생성 규칙
```
{브랜드} {TYPE} / {모델} / {도수 or 구성} / {Flex} [/ Women] [/ Lefty]
```

### SPECIFICATION 생성 규칙
```
{샤프트명} shaft, {무게}g, {Flex}-flex, {도수} degrees, {성별}'s {방향}-handed
```

---

## 7. 매핑 데이터 지침 (Mapping Data Standards)

> 이미지 판독 데이터를 엑셀로 변환할 때 아래 지침을 반드시 따른다.

---

### 7-1. 브랜드 표기 정규화

모든 브랜드명은 **공식 표기(Mixed Case)**로 통일한다.

| 원본 (혼재) | 정규화 결과 |
|------------|-----------|
| `TAYLORMADE`, `Taylormade`, `taylormde`, `TAYLORMDE` | **TaylorMade** |
| `CALLAWAY`, `Callway`, `callaway` | **Callaway** |
| `TITLEIST`, `titleist` | **Titleist** |
| `XXIO`, `Xxio` | **XXIO** |
| `HONMA`, `Honma` | **HONMA** |
| `MIZUNO`, `mizuno` | **Mizuno** |
| `PING`, `Ping` | **PING** |
| `ODYSSEY`, `odyssey` | **Odyssey** |
| `CLEVELAND`, `cleveland` | **Cleveland** |
| `COBRA`, `Cobra` | **COBRA** |
| `BRIDGESTONE`, `bridgestone` | **Bridgestone** |
| `YAMAHA`, `Yamaha` | **YAMAHA** |
| `NIKE`, `Nike` | **NIKE** |
| `PRGR`, `Prgr` | **PRGR** |
| `WILSON`, `wilson` | **Wilson** |
| `ADAMS`, `Adams` | **ADAMS** |
| `SCOTTY CAMERON`, `Scotty Cameron` | **Scotty Cameron** |
| `SRIXON`, `Srixon` | **SRIXON** |
| `YONEX`, `Yonex` | **YONEX** |
| `PXG`, `Pxg` | **PXG** |

> 신규 브랜드 발견 시 공식 브랜드 표기를 확인하여 이 목록에 추가한다.

---

### 7-2. TYPE 표기 정규화

| 원본 (혼재) | 정규화 결과 |
|------------|-----------|
| `driver`, `DRIVER` | **Driver** |
| `wood`, `WOOD` | **Wood** |
| `Iron set`, `iron set`, `IRON SET` | **Iron Set** |
| `hybrid`, `HYBRID` | **Hybrid** |
| `wedge`, `WEDGE` | **Wedge** |
| `putter`, `PUTTER` | **Putter** |
| `full set`, `FULL SET` | **Full Set** |
| `etc`, `ETC` | **Etc** |
| `shaft`, `SHAFT` | **Shaft** |
| `rental`, `RENTAL` | **Rental** |

---

### 7-3. Flex 표기 정규화

PRODUCT NAME(TITLE)과 SPECIFICATION에서 Flex 표기를 아래와 같이 통일한다.
*(코드 단일 소스: `app/rules.js` 의 `RULES.flexMap` — v12 이후 모듈 분리, 2026-05-30 동기화)*

> 본 표를 수정할 경우 `app/rules.js`의 `RULES.flexMap`도 함께 수정해야 한다 (양쪽 일치 필수).

| Flex 값 | TITLE 표기 | SPECIFICATION 표기 |
|---------|------------|-------------------|
| (해당 없음) | (생략) | (생략) |
| Regular | `R` | `Regular-flex` |
| Stiff | `S` | `Stiff-flex` |
| Stiff/Regular | `R(S)` | `Stiff/Regular-flex` |
| eXtra Stiff | `X` | `eXtra stiff-flex` |
| Ladies | `L` *(Women 동반 시 생략)* | `Ladies-flex` |
| Senior | `A` | `A(Senior)-flex` |
| Uniflex | `Uni` | `Uniflex` |
| Wedge | (생략) | `Wedge-flex` |

**AI/원본 입력 정규화 매핑**:

| 원본 | → TITLE | → SPECIFICATION |
|------|---------|----------------|
| `R-flex`, `Regular`, `(R)`, `Reg` | `R` | `Regular-flex` |
| `S-flex`, `Stiff`, `(S)` | `S` | `Stiff-flex` |
| `SR`, `R/S`, `RS` | `R(S)` | `Stiff/Regular-flex` |
| `L-flex`, `Ladies` | `L` | `Ladies-flex` |
| `A-flex`, `A(Senior)`, `Senior` | `A` | `A(Senior)-flex` |
| `X-flex`, `XS`, `eXtra Stiff` | `X` | `eXtra stiff-flex` |
| `Uniflex`, `Uni` | `Uni` | `Uniflex` |
| `W-flex`, `Wedge flex` | (TITLE 생략) | `Wedge-flex` |

---

### 7-4. 도수(Degrees) 표기 정규화

모든 도수는 **소수점 첫째 자리까지** 숫자만 표기한다.

| 원본 | 정규화 결과 |
|------|-----------|
| `9.0 degrees` | `9.0` |
| `9.0(+,-)` | `9.0` |
| `10.5 degrees(+,-)` | `10.5` |
| `9` (정수) | `9.0` |
| `52` (정수) | `52.0` |
| `12.5 degrees` | `12.5` |

> 규칙: 숫자만 추출 → 소수점 첫째 자리까지 표시 (정수인 경우 `.0` 추가)

---

### 7-5. 샤프트 무게 표기 정규화

모든 샤프트 무게는 **숫자 + `g`** 형식으로 통일한다.

| 원본 | 정규화 결과 |
|------|-----------|
| `65g` | `65g` |
| `65 grams` | `65g` |
| `65gram` | `65g` |
| `88 gram` | `88g` |
| `50 grams` | `50g` |

> 규칙: 숫자만 추출 → `g` 접미사 추가 (공백 없음)

---

### 7-6. CODE 부여 체계

기존 결측값(87개) 및 신규 이미지 매핑 데이터에 대해 아래 체계로 CODE를 자동 부여한다.

**형식**: `{YYMM}{순번 4자리}`

| 구성 요소 | 설명 | 예시 |
|----------|------|------|
| `YYMM` | 해당 연월 (2자리 년 + 2자리 월) | `2604` (2026년 4월) |
| 순번 | 해당 월 내 자동 증가 번호 (2001부터 시작) | `2001`, `2002`, `2003` ... |

**생성 예시** (2026년 4월 기준):

| 순서 | CODE |
|------|------|
| 1번째 상품 | `26042001` |
| 2번째 상품 | `26042002` |
| 3번째 상품 | `26042003` |
| ... | ... |
| 999번째 상품 | `26042999` |

> 규칙:
> - 매월 1일 기준으로 순번이 `2001`부터 재시작
> - 동일 월 내에서 순번은 자동 증가
> - 기존 데이터의 CODE와 중복되지 않도록 해당월 기준으로 부여

---

### 7-7. 정규화 적용 전/후 종합 예시

**이미지 판독 원본 데이터**:
```
Type:      driver
Brand:     taylormade
Model:     SIM2 MAX
Degrees:   10.5 degrees(+,-)
Shaft:     Fujikura Ventus Blue 60 graphite
Weight:    62 grams
Flex:      S-flex
Gender:    Men's right-handed
```

**정규화 후 엑셀 데이터**:

| CODE | TYPE | PRODUCT NAME | SPECIFICATION | PRICE |
|------|------|-------------|---------------|-------|
| 26042001 | Driver | TaylorMade Driver / SIM2 MAX / 10.5 / S | Fujikura Ventus Blue 60 Graphite shaft, 62g, Stiff-flex, 10.5 degrees, Men's right-handed | (별도 책정) |

---

*분석 작성: Claude (Cowork mode) | 최초 2026-03-29 | Flex 표 코드 일치화 2026-05-30*
