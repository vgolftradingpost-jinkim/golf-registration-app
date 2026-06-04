# -*- coding: utf-8 -*-
"""
build_match_tree.py — 매칭 엑셀 → 자동완성 JSON 2종 변환
================================================================
입력 : data/00 matching data.xlsx  (시트 'final', 컬럼: TYPE / BRAND / MODEL / SHAFT)
출력 : app/data/match_tree.json    (TYPE > BRAND > MODEL:count 계층)
       app/data/shaft_index.json   (byModel / byBrand / byType — SHAFT 폴백용)

실행 : (프로젝트 폴더 03 registration_app 에서)
       py build_match_tree.py
       또는  py build_match_tree.py "data/00 matching data.xlsx"

데이터 갱신 시: 엑셀 수정 → 이 스크립트 재실행 → JSON 2종 재생성 → push
                (push 시 sw.js CACHE_VERSION 자동 갱신됨 — push.bat 참조)
================================================================
"""
import sys, os, json
from collections import defaultdict, Counter

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl 필요: pip install openpyxl --break-system-packages")

# ---- 경로 ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_XLSX = os.path.join(SCRIPT_DIR, "data", "00 matching data.xlsx")
XLSX_PATH = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_XLSX
OUT_DIR = os.path.join(SCRIPT_DIR, "app", "data")
TREE_PATH = os.path.join(OUT_DIR, "match_tree.json")
SHAFT_PATH = os.path.join(OUT_DIR, "shaft_index.json")

# TYPE 표준화 (소문자 흔들림 보정 — 'wood' 1건 등)
TYPE_NORMALIZE = {
    "driver": "Driver", "wood": "Wood", "hybrid": "Hybrid",
    "iron set": "Iron Set", "iron": "Iron Set",
    "wedge": "Wedge", "putter": "Putter", "etc": "Etc",
}

def norm_type(t):
    if not t:
        return ""
    key = str(t).strip().lower()
    return TYPE_NORMALIZE.get(key, str(t).strip())

def clean(x):
    return str(x).strip() if x is not None else ""

def main():
    if not os.path.exists(XLSX_PATH):
        sys.exit(f"엑셀 파일 없음: {XLSX_PATH}")

    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["final"] if "final" in wb.sheetnames else wb.worksheets[0]

    rows = []
    for r in range(2, ws.max_row + 1):
        t, b, m, s = (ws.cell(r, c).value for c in range(1, 5))
        if all(v is None for v in (t, b, m, s)):
            continue
        rows.append((norm_type(t), clean(b), clean(m), clean(s)))

    print(f"읽은 데이터: {len(rows)}건")

    # ---- 1) match_tree: TYPE > BRAND > MODEL:count ----
    tree = defaultdict(lambda: defaultdict(Counter))
    for t, b, m, s in rows:
        if t and b and m:
            tree[t][b][m] += 1

    tree_out = {}
    for t in sorted(tree):
        tree_out[t] = {}
        # 브랜드는 등장 빈도순 정렬
        brand_freq = Counter()
        for b in tree[t]:
            brand_freq[b] = sum(tree[t][b].values())
        for b, _ in brand_freq.most_common():
            # 모델 빈도순 dict (삽입순 = 빈도순)
            tree_out[t][b] = dict(tree[t][b].most_common())

    # ---- 2) shaft_index: byModel / byBrand / byType ----
    by_model = defaultdict(Counter)   # "BRAND||MODEL" -> shaft:count
    by_brand = defaultdict(Counter)   # "BRAND"        -> shaft:count
    by_type  = defaultdict(Counter)   # "TYPE"         -> shaft:count
    for t, b, m, s in rows:
        if not s:
            continue
        if b and m:
            by_model[f"{b}||{m}"][s] += 1
        if b:
            by_brand[b][s] += 1
        if t:
            by_type[t][s] += 1

    shaft_out = {
        "byModel": {k: dict(v.most_common()) for k, v in by_model.items()},
        "byBrand": {k: dict(v.most_common()) for k, v in by_brand.items()},
        # byType 는 폴백 최종 단계 — 상위 12개만 저장(앱에서 8개 사용, 여유분)
        "byType":  {k: dict(v.most_common(12)) for k, v in by_type.items()},
    }

    # ---- 저장 ----
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(TREE_PATH, "w", encoding="utf-8") as f:
        json.dump(tree_out, f, ensure_ascii=False, separators=(",", ":"))
    with open(SHAFT_PATH, "w", encoding="utf-8") as f:
        json.dump(shaft_out, f, ensure_ascii=False, separators=(",", ":"))

    tree_kb = os.path.getsize(TREE_PATH) // 1024
    shaft_kb = os.path.getsize(SHAFT_PATH) // 1024
    print(f"생성: {TREE_PATH}  ({tree_kb} KB)")
    print(f"  TYPE {len(tree_out)}종, BRAND 조합 "
          f"{sum(len(v) for v in tree_out.values())}개")
    print(f"생성: {SHAFT_PATH}  ({shaft_kb} KB)")
    print(f"  byModel {len(shaft_out['byModel'])} / "
          f"byBrand {len(shaft_out['byBrand'])} / "
          f"byType {len(shaft_out['byType'])}")
    print("완료.")

if __name__ == "__main__":
    main()
