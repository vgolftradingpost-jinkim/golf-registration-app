매칭 DB 갱신용 반입 폴더 (방법 B)
=====================================

폰에 쌓인 등록 데이터를 자동완성 기준 DB에 흡수시킬 때 사용합니다.

[사용 순서]
 1. 폰 앱 → List 화면 → [Export DB (자동완성 갱신용)] 버튼
    → match_add_YYYYMMDD.xlsx 다운로드
 2. 그 파일을 PC로 옮겨 이 폴더(data/incoming/)에 그대로 넣기
 3. 프로젝트 폴더에서:  py build_match_tree.py
      · 미리보기만 하려면:  py build_match_tree.py --dry-run
 4. push.bat 실행 → GitHub 반영 → 폰 PWA 새로고침 시 새 후보 수신

[자동 처리되는 것]
 · 마스터(data/00 matching data.xlsx) 백업 → data/backup/
 · 신규 행만 마스터에 흡수 (SRC_NO 기준 중복 제거)
 · 처리 끝난 파일은 done/ 으로 이동
 → 같은 파일을 두 번 넣어도 중복 집계되지 않습니다.

[파일 형식]
 시트명 final / 헤더 TYPE, BRAND, MODEL, SHAFT, SRC_NO
 .csv 도 같은 형식이면 읽습니다 (앱의 xlsx CDN 실패 시 폴백).
