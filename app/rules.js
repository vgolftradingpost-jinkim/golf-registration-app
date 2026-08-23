/* ================================================================
   rules.js — 매핑 규칙 / 폼 기본값 / 공용 헬퍼
   단일 소스: docs/data_analysis.md §7-3, §7-1 과 동기화
   v12 (2026-05-30) 모듈 분리
   ================================================================ */

const RULES = {
  // Flex 코드 → SPEC 전체 표기 (docs §7-3 과 일치)
  flexMap: {
    '-':    '',
    'R':    'Regular-flex',
    'S':    'Stiff-flex',
    'R(S)': 'Stiff/Regular-flex',
    'X':    'eXtra stiff-flex',
    'L':    'Ladies-flex',
    'A':    'A(Senior)-flex',
    'Uni':  'Uniflex',
    'W':    'Wedge-flex'
  },
  // Wood/Hybrid 클럽 번호별 표준 loft (degrees)
  loftTable: {
    Wood: {
      Men:   { '2W':12.0,'3W':15.0,'4W':17.0,'5W':18.5,'7W':21.5,'9W':25.0 },
      Women: { '2W':14.0,'3W':16.5,'4W':18.5,'5W':20.5,'7W':23.5,'9W':27.0 }
    },
    Hybrid: {
      Men:   { '2H':17.0,'3H':19.5,'4H':22.0,'5H':24.5,'6H':27.5,'7H':30.5 },
      Women: { '2H':19.5,'3H':21.5,'4H':24.0,'5H':26.5,'6H':29.5,'7H':32.0 }
    }
  },
  // AI 응답 club_type → 내부 TYPE 정규화
  typeNormalize: {
    'driver': 'Driver', 'wood': 'Wood', 'hybrid': 'Hybrid',
    'iron set': 'Iron Set', 'iron': 'Iron Set',
    'wedge': 'Wedge', 'putter': 'Putter'
  },
  // 브랜드 표기 정규화 (소문자 → 공식 표기) — docs §7-1
  brandNormalize: {
    'taylormade': 'TaylorMade', 'taylor made': 'TaylorMade', 'taylormde': 'TaylorMade',
    'callaway': 'Callaway', 'callway': 'Callaway',
    'titleist': 'Titleist',
    'xxio': 'XXIO',
    'honma': 'HONMA',
    'mizuno': 'Mizuno',
    'ping': 'PING',
    'odyssey': 'Odyssey',
    'cleveland': 'Cleveland',
    'cobra': 'COBRA',
    'bridgestone': 'Bridgestone',
    'yamaha': 'YAMAHA',
    'nike': 'NIKE',
    'prgr': 'PRGR',
    'wilson': 'Wilson',
    'adams': 'ADAMS',
    'scotty cameron': 'Scotty Cameron',
    'srixon': 'SRIXON',
    'yonex': 'YONEX',
    'pxg': 'PXG'
  },
  // Condition select 값 → SPEC 접미사 매핑
  conditionMap: {
    '(New)':       { spec: '** Brand New' },
    '(Like new)':  { spec: '** Like new' },
    '(Scratches)': { spec: '** Minor scratches, but no impact on performance' },
    '(Dent)':      { spec: '** Minor dent on the head' }
  }
};

/* 헬퍼: 브랜드 정규화 (대소문자 무시, 알려진 표기로 변환) */
function normalizeBrand(raw) {
  if (!raw) return '';
  const key = String(raw).trim().toLowerCase();
  return RULES.brandNormalize[key] || String(raw).trim();
}

/* ================================================================
   TITLE FLEX 표기 규칙 — 단일 소스 (v21, 2026-08-22)
   1) Women(여성 클럽)이면 flex 'L'을 TITLE에 표기하지 않는다
      (Women 태그로 Ladies 사양이 이미 드러나므로 중복 표기)
   2) flex 'A'는 TITLE에 'A(Senior)'로 표기한다
      (R/S/R(S)/X/Uni 등 다른 flex는 기존 표기 유지)
   3) '-'(N/A)와 'W'(Wedge-flex)는 기존대로 항상 생략
   ⚠ TITLE의 flex 표기를 바꿀 때는 반드시 이 두 함수만 수정할 것.
     index.html(regenerateFields)·export.js가 모두 여기를 참조한다.
   ================================================================ */
const TITLE_FLEX_OMIT  = ['', '-', 'W'];            // 항상 생략하는 flex
const TITLE_FLEX_LABEL = { 'A': 'A(Senior)' };      // 특수 표기 flex
/* TITLE 앞 2개 세그먼트({Brand} {TYPE} / {Model})는 태그 판정에서 제외 */
const TITLE_TAG_START  = 2;

/* flex 코드 → TITLE에 넣을 문자열 (빈 문자열이면 표기 생략) */
function titleFlexLabel(flex, gender) {
  const f = String(flex ?? '').trim();
  if (TITLE_FLEX_OMIT.includes(f)) return '';
  if (f === 'L' && gender === 'Women') return '';   // 규칙 1
  return TITLE_FLEX_LABEL[f] || f;                  // 규칙 2 / 그 외 원본
}

/* 이미 만들어진 TITLE 문자열을 현재 규칙으로 교정
   - 구 규칙으로 저장된 항목·수기 편집분을 Export 시점에 맞춰 주기 위함
   - ' / ' 세그먼트 단위로만 판정 → 모델명·도수 등에는 영향 없음
   - Condition 접미사(' * *CHECK' 등)는 잘라 두고 원형 그대로 복원 */
function normalizeTitleTags(title, gender) {
  const raw = String(title ?? '');
  if (!raw) return raw;
  const cut  = raw.indexOf(' * ');                  // condition 접미사 분리
  const body = cut >= 0 ? raw.slice(0, cut) : raw;
  const tail = cut >= 0 ? raw.slice(cut) : '';
  const parts = body.split(' / ');
  const fixed = [];
  parts.forEach((seg, i) => {
    const base = seg.trim();
    if (i < TITLE_TAG_START) { fixed.push(seg); return; }
    if (base === 'L' && gender === 'Women') return;             // 규칙 1
    fixed.push(TITLE_FLEX_LABEL[base] || seg);                  // 규칙 2
  });
  return fixed.join(' / ') + tail;
}

/* ================================================================
   FORM_DEFAULTS — 편집 폼 기본값
   ================================================================ */
const FORM_DEFAULTS = {
  type: 'Driver',
  flex: 'R',           // 기본 flex (Wedge/Putter는 별도 '-'로 강제)
  flexNullable: '-',   // Wedge/Putter 진입 시 강제 flex
  shaftMaterial: 'Graphite',
  putterLength: '34"',
  gender: 'Men',
  handed: 'Right',
  grip: 'Standard'
};

/* 하위 호환: 기존 코드에서 LOFT_TABLE 직접 참조 사용 */
const LOFT_TABLE = RULES.loftTable;
