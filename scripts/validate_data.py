#!/usr/bin/env python3
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/"data"/"money_market.json").read_text())
required={"deposits","mmf","tbills","rrp","reserves"}
assert required<=set(d["pools"])
for k in required:
    x=d["pools"][k]
    assert isinstance(x["value"],(int,float)) and math.isfinite(x["value"]) and x["value"]>=0,(k,x["value"])
    assert x["observation_date"]
    assert set(x["changes"])=={"1w","1m","3m","1y"}
    h=d["history"][k]
    assert len(h)>=2,k
    dates=[v["date"] for v in h]
    assert dates==sorted(dates),f"{k}: history not sorted"
assert d["context"]["tbill_rate"]["value"]>=0
print(f"Validated {len(required)} liquidity pools")
