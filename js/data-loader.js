export async function loadData(){
  const r=await fetch('./data/money_market.json',{cache:'no-store'});
  if(!r.ok) throw new Error(`money_market.json: HTTP ${r.status}`);
  const data=await r.json();
  if(!data || !data.pools || !data.history) throw new Error('Invalid money market dataset');
  return data;
}
