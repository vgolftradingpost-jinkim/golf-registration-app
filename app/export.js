/* ================================================================
   export.js — CSV / XLSX 출력
   의존: app.js의 STATE, toast, escHtml(미사용), csvCell 자체 포함
   외부: SheetJS (window.XLSX, CDN 또는 폴백)
   v12 (2026-05-30) 모듈 분리
   ================================================================ */

/* CSV 셀 값을 안전하게 이스케이프: 따옴표 처리 + 수식 인젝션 방어 */
function csvCell(val) {
  const s = String(val ?? '');
  const safe = /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s;
  return safe.includes('"') || safe.includes(',') || safe.includes('\n')
    ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function exportCSV() {
  if (STATE.entries.length === 0) { toast('No data to export', true); return; }
  const headers = ['NO','TYPE','TITLE','SPEC','PRICE','COST'];
  const rows = STATE.entries.map(e => [
    csvCell(e.no),
    csvCell(e.type),
    csvCell(e.title),
    csvCell(e.spec),
    csvCell(e.price),
    csvCell(e.cost)
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  a.download = `golf_clubs_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported!');
}

/* ================================================================
   EXPORT XLSX (SheetJS) — CDN 로드 실패 시 CSV로 자동 폴백
   사용자 글로벌 규칙: 데이터 셀 배경색 무색(배경 없음) 유지
   ================================================================ */
function exportXLSX() {
  if (STATE.entries.length === 0) { toast('No data to export', true); return; }

  if (typeof XLSX === 'undefined') {
    toast('xlsx 라이브러리 로드 실패 — CSV로 내보냅니다.', true);
    exportCSV();
    return;
  }

  const headers = ['NO','TYPE','BRAND','MODEL','TITLE','SPEC','PRICE','COST','GENDER','HANDED','GRIP','DATE'];
  const aoa = [headers];
  STATE.entries.forEach(e => {
    aoa.push([
      e.no, e.type, e.brand, e.model, e.title, e.spec,
      e.price || 0, e.cost || 0,
      e.gender, e.handed, e.grip,
      e.timestamp ? e.timestamp.slice(0,10) : ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    {wch:10},{wch:9},{wch:14},{wch:18},{wch:38},{wch:48},
    {wch:8},{wch:8},{wch:7},{wch:7},{wch:9},{wch:11}
  ];

  // 데이터 셀 배경 무색 강제
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = Object.assign({}, ws[addr].s, {
        fill: { patternType: 'none' }
      });
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'data');
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  XLSX.writeFile(wb, `golf_clubs_${dateStr}.xlsx`);
  toast('XLSX exported!');
}

/* ================================================================
   EXPORT MATCH DB (v19) — 자동완성 기준 DB 갱신용 4열 내보내기
   ----------------------------------------------------------------
   방법 B(주기적 재빌드) 운영용. build_match_tree.py 가 수정 없이
   그대로 읽는 형식으로 출력한다.
     · 시트명 : final
     · 헤더   : TYPE / BRAND / MODEL / SHAFT / SRC_NO
   SRC_NO(등록 CODE)는 재흡수 방지 키 — 빌드 스크립트가 이미 흡수한
   SRC_NO 는 건너뛰므로 같은 파일을 두 번 넣어도 중복 집계되지 않는다.
   ※ 빈도(count)가 후보 순위에 반영되므로 중복 "조합"은 일부러 남긴다.
   운영 흐름: 폰 Export DB → data/incoming/ 에 저장 → py build_match_tree.py → push.bat
   ================================================================ */

/* shaftBrand + shaftModel → 기준 엑셀의 SHAFT 단일 문자열로 합성.
   기준 데이터가 'TaylorMade REAX' 처럼 브랜드+모델 합본이라 맞춰준다.
   shaftModel 이 이미 브랜드로 시작하면 접두 중복을 피한다.
   (직접입력 경로는 shaftBrand 가 비고 shaftModel 에 전체 문자열이 들어옴) */
function shaftFull(e) {
  const b = String(e.shaftBrand || '').trim();
  const m = String(e.shaftModel || '').trim();
  if (!b) return m;
  if (!m) return b;
  const nz = s => s.toLowerCase().replace(/[\s\-_.]/g, '');
  return nz(m).startsWith(nz(b)) ? m : `${b} ${m}`;
}

/* 기준 DB 갱신용 행 배열 — TYPE/BRAND/MODEL 이 모두 있는 항목만 */
function matchRows() {
  return STATE.entries
    .filter(e => e.type && e.brand && e.model)
    .map(e => [e.type, e.brand, e.model, shaftFull(e), e.no || '']);
}

const MATCH_HEADERS = ['TYPE', 'BRAND', 'MODEL', 'SHAFT', 'SRC_NO'];

function exportMatchXLSX() {
  const rows = matchRows();
  if (rows.length === 0) { toast('No data to export', true); return; }

  if (typeof XLSX === 'undefined') {
    toast('xlsx 라이브러리 로드 실패 — CSV로 내보냅니다.', true);
    exportMatchCSV();
    return;
  }

  const ws = XLSX.utils.aoa_to_sheet([MATCH_HEADERS, ...rows]);
  ws['!cols'] = [{wch:10},{wch:16},{wch:22},{wch:26},{wch:12}];

  // 데이터 셀 배경 무색 강제 (글로벌 규칙)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = Object.assign({}, ws[addr].s, { fill: { patternType: 'none' } });
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'final');   // 시트명 고정: build_match_tree.py 가 찾는 이름
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  XLSX.writeFile(wb, `match_add_${dateStr}.xlsx`);
  toast(`매칭 DB용 ${rows.length}행 내보냄`);
}

/* CDN 실패 시 폴백 — 빌드 스크립트가 CSV(.csv)도 동일 형식으로 읽는다 */
function exportMatchCSV() {
  const rows = matchRows();
  if (rows.length === 0) { toast('No data to export', true); return; }
  const csv = [MATCH_HEADERS.join(',')]
    .concat(rows.map(r => r.map(csvCell).join(',')))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  a.download = `match_add_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`매칭 DB용 ${rows.length}행 내보냄 (CSV)`);
}
