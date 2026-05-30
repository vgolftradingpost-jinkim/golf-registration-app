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
