#!/usr/bin/env python3
import csv, io, json, urllib.parse, urllib.request
from pathlib import Path
from datetime import datetime, timezone, date

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"money_market.json"

FRED={
  "deposits":("DPSACBW027SBOG","Bank Deposits","Deposits","USD billions","weekly"),
  "mmf":("BOGZ1FL634090073Q","Money Market Funds","MMFs","USD millions","quarterly"),
  "rrp":("RRPONTSYD","ON RRP","RRP","USD billions","daily"),
  "reserves":("WRESBAL","Reserve Balances","Reserves","USD billions","weekly"),
  "tbill_rate":("DTB3","3-Month Treasury Bill","3M Bill","percent","daily")
}
TREASURY="https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_1"

def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":"BondStats-Money-Market-Migration/1.0"})
    with urllib.request.urlopen(req,timeout=45) as r:
        return r.read().decode()

def fred_series(series):
    text=get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}")
    rd=csv.DictReader(io.StringIO(text))
    fields=rd.fieldnames or []
    vkey=series if series in fields else fields[-1]
    dkey=next((f for f in fields if f!=vkey),fields[0])
    out=[]
    for row in rd:
        raw=row.get(vkey)
        if raw in (None,"","."): continue
        try: out.append({"date":row[dkey],"value":float(raw)})
        except ValueError: pass
    if len(out)<2: raise RuntimeError(f"{series}: insufficient data")
    return out

def treasury_bills():
    params={
      "fields":"record_date,security_type_desc,security_class_desc,debt_held_public_mil_amt",
      "filter":"security_type_desc:eq:Marketable,security_class_desc:eq:Bills",
      "sort":"record_date",
      "page[size]":"5000"
    }
    url=TREASURY+"?"+urllib.parse.urlencode(params,safe=",:[]")
    obj=json.loads(get(url));rows=obj.get("data",[])
    best={}
    for r in rows:
        try:
            d=r["record_date"];v=float(r["debt_held_public_mil_amt"]);best[d]=max(best.get(d,0),v)
        except (KeyError,TypeError,ValueError): pass
    out=[{"date":d,"value":best[d]} for d in sorted(best)]
    if len(out)<12: raise RuntimeError("Treasury bill series unavailable")
    return out

def prior_value(series,days):
    last=series[-1]
    target=date.fromordinal(date.fromisoformat(last["date"]).toordinal()-days)
    c=[x for x in series if date.fromisoformat(x["date"])<=target]
    return c[-1] if c else None

def change(series,days):
    p=prior_value(series,days)
    if not p or not p["value"]: return None
    return round((series[-1]["value"]/p["value"]-1)*100,3)

def freshness(d):
    return max(0,(datetime.now(timezone.utc).date()-date.fromisoformat(d)).days)

def pool(label,short,unit,freq,series):
    last=series[-1]
    return {
      "label":label,"short_label":short,"value":last["value"],"unit":unit,"frequency":freq,
      "observation_date":last["date"],"freshness_days":freshness(last["date"]),
      "changes":{"1w":change(series,7),"1m":change(series,30),"3m":change(series,91),"1y":change(series,365)}
    }

series={}
for key,(sid,*_) in FRED.items():
    series[key]=fred_series(sid)
try:
    series["tbills"]=treasury_bills()
except Exception as e:
    print("WARNING: Treasury Fiscal Data unavailable:",e)
    prior=json.loads(OUT.read_text()) if OUT.exists() else {}
    series["tbills"]=prior.get("history",{}).get("tbills",[])
    if len(series["tbills"])<2:
        raise

pools={
 "deposits":pool(*FRED["deposits"][1:],series["deposits"]),
 "mmf":pool(*FRED["mmf"][1:],series["mmf"]),
 "tbills":pool("Treasury Bills","T-Bills","USD millions","monthly",series["tbills"]),
 "rrp":pool(*FRED["rrp"][1:],series["rrp"]),
 "reserves":pool(*FRED["reserves"][1:],series["reserves"])
}

obj={
 "generated_at":datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
 "status":"live",
 "pools":pools,
 "history":{k:v[-520:] for k,v in series.items() if k in pools},
 "context":{"tbill_rate":{"value":series["tbill_rate"][-1]["value"],"date":series["tbill_rate"][-1]["date"]}},
 "sources":[
  {"name":"Federal Reserve H.8 / FRED","description":"Deposits, All Commercial Banks (weekly).","url":"https://fred.stlouisfed.org/series/DPSACBW027SBOG"},
  {"name":"Federal Reserve Financial Accounts","description":"Money market fund total financial assets.","url":"https://fred.stlouisfed.org/series/BOGZ1FL634090073Q"},
  {"name":"U.S. Treasury Fiscal Data","description":"Monthly Statement of the Public Debt — marketable Treasury bills held by the public.","url":"https://fiscaldata.treasury.gov/datasets/monthly-statement-public-debt/"},
  {"name":"Federal Reserve / FRED","description":"Overnight Reverse Repurchase Agreements.","url":"https://fred.stlouisfed.org/series/RRPONTSYD"},
  {"name":"Federal Reserve / FRED","description":"Reserve Balances with Federal Reserve Banks.","url":"https://fred.stlouisfed.org/series/WRESBAL"},
  {"name":"Federal Reserve / FRED","description":"3-Month Treasury Bill secondary market rate.","url":"https://fred.stlouisfed.org/series/DTB3"}
 ]
}
tmp=OUT.with_suffix(".json.tmp")
tmp.write_text(json.dumps(obj,indent=2)+"\n")
tmp.replace(OUT)
print("Updated",OUT)
for k,p in pools.items(): print(k,p["observation_date"],p["value"])
