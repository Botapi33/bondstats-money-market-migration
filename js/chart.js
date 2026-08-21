function fmtDate(iso){
  const d=new Date(iso+'T00:00:00Z');
  return d.toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'});
}
function downsample(arr,max=220){
  if(arr.length<=max)return arr;
  const step=(arr.length-1)/(max-1),out=[];
  for(let i=0;i<max;i++)out.push(arr[Math.round(i*step)]);
  return out;
}
function indexed(series,startDate){
  const f=series.filter(x=>x.date>=startDate&&Number.isFinite(x.value));
  if(f.length<2)return[];
  const base=f[0].value;
  return f.map(x=>({date:x.date,value:base?100*x.value/base:100}));
}
export function drawHistory(canvas,history,keys,range){
  const years={1:1,3:3,5:5};
  const y=years[parseInt(range)]||1;
  const dates=keys.flatMap(k=>history[k]||[]).map(x=>x.date).sort();
  if(!dates.length)return;
  const end=dates[dates.length-1],start=new Date(end+'T00:00:00Z');start.setUTCFullYear(start.getUTCFullYear()-y);
  const startDate=start.toISOString().slice(0,10);
  const colors={deposits:'#748da2',mmf:'#c6a86d',tbills:'#bd8358',rrp:'#ae625b',reserves:'#77a494'};
  const series=keys.map(k=>({key:k,color:colors[k],values:downsample(indexed(history[k]||[],startDate))})).filter(s=>s.values.length>1);
  if(!series.length)return;
  const dpr=Math.max(1,devicePixelRatio||1),r=canvas.getBoundingClientRect(),W=Math.max(1,r.width),H=Math.max(1,r.height);
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const p={l:46,r:18,t:18,b:36},pw=W-p.l-p.r,ph=H-p.t-p.b;
  const all=series.flatMap(s=>s.values.map(v=>v.value));let min=Math.min(...all),max=Math.max(...all);const pad=Math.max(1,(max-min)*.14);min-=pad;max+=pad;
  const t0=+new Date(startDate+'T00:00:00Z'),t1=+new Date(end+'T00:00:00Z');
  const x=d=>p.l+pw*((+new Date(d+'T00:00:00Z')-t0)/(t1-t0||1)), yy=v=>p.t+ph*(max-v)/(max-min||1);
  c.font='9px Inter,system-ui,sans-serif';
  for(let i=0;i<=4;i++){
    const v=min+(max-min)*i/4,Y=yy(v);c.strokeStyle='#1a1a1a';c.beginPath();c.moveTo(p.l,Y);c.lineTo(W-p.r,Y);c.stroke();
    c.fillStyle='#62615d';c.textAlign='right';c.textBaseline='middle';c.fillText(v.toFixed(0),p.l-8,Y);
  }
  for(let i=0;i<=4;i++){
    const d=new Date(t0+(t1-t0)*i/4),iso=d.toISOString().slice(0,10),X=x(iso);
    c.fillStyle='#62615d';c.textAlign='center';c.textBaseline='top';c.fillText(fmtDate(iso),X,H-p.b+12);
  }
  const baseY=yy(100);c.strokeStyle='#34322d';c.setLineDash([4,4]);c.beginPath();c.moveTo(p.l,baseY);c.lineTo(W-p.r,baseY);c.stroke();c.setLineDash([]);
  series.forEach(s=>{
    c.strokeStyle=s.color;c.lineWidth=2;c.lineJoin='round';c.lineCap='round';c.beginPath();
    s.values.forEach((d,i)=>i?c.lineTo(x(d.date),yy(d.value)):c.moveTo(x(d.date),yy(d.value)));c.stroke();
  });
}
