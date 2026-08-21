import{loadData}from'./data-loader.js';
import{POOL_ORDER,migrationSignals,migrationState,normalizedFlow}from'./migration-engine.js';
import{drawHistory}from'./chart.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const COLORS={deposits:'#748da2',mmf:'#c6a86d',tbills:'#bd8358',rrp:'#ae625b',reserves:'#77a494'};
let data=null,horizon='1m',range='1y',chartKeys=['deposits','mmf','tbills'];

function fmtLevel(p){
  if(p.value==null)return'—';const v=Number(p.value),u=p.unit||'';
  if(u==='USD billions')return v>=1000?`$${(v/1000).toFixed(2)}T`:`$${v.toFixed(0)}B`;
  if(u==='USD millions')return v>=1e6?`$${(v/1e6).toFixed(2)}T`:`$${(v/1000).toFixed(1)}B`;
  if(u==='percent')return `${v.toFixed(2)}%`;return v.toLocaleString('en-US');
}
const cls=v=>!Number.isFinite(v)?'flat':v>0?'up':v<0?'down':'flat';
const ctext=v=>!Number.isFinite(v)?'—':`${v>0?'+':''}${v.toFixed(2)}%`;
const arrow=v=>!Number.isFinite(v)||Math.abs(v)<.01?'→':v>0?'↑':'↓';

function renderPools(){
  $('#pool-grid').innerHTML=POOL_ORDER.map(k=>{const p=data.pools[k],v=p.changes?.['1m'];return `<article class="pool-card" style="--accent:${COLORS[k]}"><div class="pool-name">${p.label}</div><div class="pool-value">${fmtLevel(p)}</div><div class="pool-change ${cls(v)}">${arrow(v)} ${ctext(v)} <span style="color:#666">1M</span></div><div class="pool-freshness"><span>${p.frequency.toUpperCase()}</span><span>${p.freshness_days}D OLD</span></div></article>`}).join('');
}
function renderState(){
  const sig=migrationSignals(data,horizon),st=migrationState(sig);
  $('#migration-state').textContent=st.state;$('#migration-arrow').textContent=st.spread>.1?'↗':st.spread<-.1?'↘':'→';
  $('#signal-strength').textContent=st.strength;$('#coverage').textContent=`${Object.values(sig).filter(x=>Number.isFinite(x.change)).length}/5 POOLS`;$('#primary-driver').textContent=st.primary.toUpperCase();
  const ranked=Object.values(sig).filter(s=>Number.isFinite(s.change)).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)),lead=ranked[0];
  $('#migration-summary').textContent=lead?`${lead.label} is the largest balance-sheet mover over the selected horizon. The state compares market-instrument pools with bank-system liquidity rather than inferring literal dollar-for-dollar transfers.`:'Insufficient comparable observations for the selected horizon.';
}
function renderFlow(){
  const sig=normalizedFlow(migrationSignals(data,horizon));
  $('#flow-bars').innerHTML=POOL_ORDER.map(k=>{const s=sig[k],score=Math.max(-1,Math.min(1,s.score||0)),pct=Math.abs(score)*50;return `<div class="flow-row"><div class="flow-label">${s.label}</div><div class="flow-track"><span class="flow-mid"></span><span class="flow-fill ${score>=0?'pos':'neg'}" style="width:${pct}%"></span></div><div class="flow-value ${cls(s.change)}">${arrow(s.change)} ${ctext(s.change)}</div></div>`}).join('');
}
function renderMetricTabs(){
  $('#metric-tabs').innerHTML=POOL_ORDER.map(k=>`<button class="metric-tab ${chartKeys.includes(k)?'active':''}" data-key="${k}">${data.pools[k].short_label||data.pools[k].label}</button>`).join('');
  $$('.metric-tab').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.key;if(chartKeys.includes(k)){if(chartKeys.length>1)chartKeys=chartKeys.filter(x=>x!==k)}else chartKeys.push(k);renderMetricTabs();renderChart()}));
}
function renderChart(){drawHistory($('#history-chart'),data.history,chartKeys,range)}
function renderChanges(){
  const sig=migrationSignals(data,'1m'),sorted=Object.values(sig).filter(s=>Number.isFinite(s.change)).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
  $('#changes-list').innerHTML=sorted.slice(0,5).map(s=>`<div class="change-item"><div class="change-head"><strong>${s.label}</strong><span class="${cls(s.change)}">${arrow(s.change)} ${ctext(s.change)}</span></div><p>${s.change>0?'The pool expanded':'The pool contracted'} over the latest comparable month. Latest observation is ${s.freshness} days old.</p></div>`).join('');
}
function renderContext(){
  const rate=data.context?.tbill_rate;$('#tbill-rate').textContent=rate?.value!=null?`${Number(rate.value).toFixed(2)}%`:'—';
  $('#yield-context').textContent='Current bill yields help determine the relative attraction of cash-like market instruments versus deposits.';
  $('#rrp-level').textContent=fmtLevel(data.pools.rrp);const r=data.pools.rrp.changes?.['1y'];$('#rrp-context').textContent=Number.isFinite(r)?`The facility is ${Math.abs(r).toFixed(1)}% ${r<0?'below':'above'} its level roughly one year ago.`:'Year-over-year comparison unavailable.';
  $('#reserve-level').textContent=fmtLevel(data.pools.reserves);const v=data.pools.reserves.changes?.['1m'];$('#reserve-context').textContent=Number.isFinite(v)?`Reserve balances changed ${v>0?'+':''}${v.toFixed(2)}% over the latest comparable month.`:'Monthly comparison unavailable.';
}
function renderSources(){$('#sources-panel').innerHTML=(data.sources||[]).map(s=>`<div class="source-row"><strong>${s.name}</strong><span>${s.description}</span><a href="${s.url}" target="_blank" rel="noopener">SOURCE ↗</a></div>`).join('')}
function bind(){
  $$('.horizon').forEach(b=>b.addEventListener('click',()=>{horizon=b.dataset.horizon;$$('.horizon').forEach(x=>x.classList.toggle('active',x===b));renderState();renderFlow()}));
  $$('.range').forEach(b=>b.addEventListener('click',()=>{range=b.dataset.range;$$('.range').forEach(x=>x.classList.toggle('active',x===b));renderChart()}));
  $('#sources-toggle').addEventListener('click',()=>{const p=$('#sources-panel'),open=!p.hidden;p.hidden=open;$('#sources-toggle').setAttribute('aria-expanded',String(!open));$('#sources-toggle').lastElementChild.textContent=open?'+':'−'});
  let t;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(renderChart,120)});
}
function renderAll(){renderPools();renderState();renderFlow();renderMetricTabs();renderChart();renderChanges();renderContext();renderSources()}
async function boot(){try{data=await loadData();$('#last-updated').textContent=data.generated_at||'—';$('#data-status').textContent=data.status==='live'?'LIVE DATA':'LATEST AVAILABLE';$('#data-status').classList.add('live');renderAll();bind()}catch(err){console.error(err);$('#data-status').textContent='DATA ERROR';document.querySelector('main').insertAdjacentHTML('afterbegin','<div class="error-banner">The latest liquidity dataset could not be loaded. The interface has stopped rather than presenting incomplete values as current.</div>')}}
boot();
