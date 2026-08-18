매칭 DB 반입 폴더 — 월 1회 수작업 갱신
=========================================

자동완성(직접입력의 MODEL / BRAND / SHAFT 후보)이 참조하는 기준 DB를
갱신할 때 쓰는 폴더입니다. 한 달에 한 번 정도 신규 모델/샤프트를
손으로 채워 넣고 반영하면 됩니다.

[사용 순서]
 1. _template.xlsx 를 복사해서 새 이름으로 저장
       예: 2026-09.xlsx
       ※ 파일명이 _ 로 시작하면 빌드가 건너뜁니다.
          _template.xlsx 원본은 그대로 두세요.
 2. final 시트에 신규 데이터를 채웁니다 (TYPE / BRAND / MODEL / SHAFT)
       - TYPE/BRAND/MODEL 필수, SHAFT 는 비워도 됨(퍼터 등)
       - SHAFT 는 브랜드+모델을 한 칸에: TaylorMade REAX
       - 작성요령 시트에 예시가 있습니다
 3. 그 파일을 이 폴더(data/incoming/)에 두고, 프로젝트 폴더에서:
       py build_match_tree.py --dry-run     <- 먼저 확인 (파일 안 건드림)
       py build_match_tree.py               <- 실제 반영
 4. push.bat 실행
 5. 폰에서 앱 완전 종료 후 재실행 -> 새 후보 수신

[자동 처리되는 것]
 - 마스터(data/00 matching data.xlsx) 백업 -> data/backup/
 - 신규 행을 마스터에 흡수
 - 처리 끝난 파일은 done/ 으로 이동하고 done/_processed.json 에 기록
 -> 같은 파일을 두 번 넣어도 중복 반영되지 않습니다 (내용 해시로 판별)

[파일 형식]
 시트명 final / 헤더 TYPE, BRAND, MODEL, SHAFT
 .csv 도 같은 형식이면 읽습니다 (UTF-8).
