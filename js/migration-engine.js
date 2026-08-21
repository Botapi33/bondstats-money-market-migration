export const POOL_ORDER=['deposits','mmf','tbills','rrp','reserves'];

export function pctChange(values,horizon){
  const days={ '1w':7,'1m':30,'3m':91,'1y':365 }[horizon] ?? 30;
  const clean=values.filter(x=>Number.isFinite(x.value));
  if(clean.length<2)return null;
  const last=clean[clean.length-1];
  const target=new Date(last.date+'T00:00:00Z');target.setUTCDate(target.getUTCDate()-days);
  let prior=null;
  for(const x of clean){
    if(new Date(x.date+'T00:00:00Z')<=target)prior=x;else break;
  }
  if(!prior||!prior.value)return null;
  return (last.value/prior.value-1)*100;
}
export function migrationSignals(data,horizon='1m'){
  const out={};
  for(const key of POOL_ORDER){
    const p=data.pools[key],hist=data.history[key]||[];
    out[key]={key,label:p.label,change:p.changes?.[horizon] ?? pctChange(hist,horizon),freshness:p.freshness_days,frequency:p.frequency};
  }
  return out;
}
export function migrationState(signals){
  const mean=keys=>{
    const v=keys.map(k=>signals[k]?.change).filter(Number.isFinite);
    return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
  };
  const market=mean(['mmf','tbills']),bank=mean(['deposits','reserves']),spread=market-bank;
  let state='BALANCED';
  if(spread>2)state='MOVING INTO MARKET INSTRUMENTS';
  else if(spread>.5)state='TILTING TO MARKET INSTRUMENTS';
  else if(spread<-2)state='MOVING INTO BANK LIQUIDITY';
  else if(spread<-.5)state='TILTING TO BANK LIQUIDITY';
  const all=Object.values(signals).filter(s=>Number.isFinite(s.change));
  const avg=all.length?all.reduce((a,s)=>a+Math.abs(s.change),0)/all.length:0;
  const strength=avg>=4?'HIGH':avg>=1.5?'MODERATE':'LOW';
  const ranked=[...all].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
  return {state,strength,spread,primary:ranked[0]?.label||'—'};
}
export function normalizedFlow(signals){
  const vals=Object.values(signals).map(s=>s.change).filter(Number.isFinite);
  const max=Math.max(...vals.map(Math.abs),.01);
  return Object.fromEntries(Object.entries(signals).map(([k,s])=>[k,{...s,score:Number.isFinite(s.change)?s.change/max:0}]));
}
