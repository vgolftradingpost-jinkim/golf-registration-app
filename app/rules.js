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
