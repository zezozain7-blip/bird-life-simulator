module.exports=async function({send,ev,sleep,shot,tap,logs}){
  await sleep(3500); const o={clicks:0}; await ev(`window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;window.print=()=>{};`); const seen=[];
  for(let i=0;i<45;i++){
    const r=await ev(`(()=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&getComputedStyle(e).visibility!=='hidden'};
      const sel=Math.random();let pool;
      if(sel<0.2) pool=[...document.querySelectorAll('#bottom-nav button')];
      else pool=[...document.querySelectorAll('.ov28 button, #sheet button, #sheet .card, #sheet .tab, #side-r button, #side-l button, #hubb, #hub button, #goal button')];
      pool=pool.filter(e=>vis(e)&&!e.disabled&&!/reset|إعادة|حذف|delete|wipe|مسح|Erase|ابدأ من/i.test(e.textContent+(e.id||'')));
      if(!pool.length) return 'none'; const e=pool[Math.floor(Math.random()*pool.length)]; const t=(e.id||e.textContent||'').trim().slice(0,20); e.click(); return t})()`);
    o.clicks++; seen.push(r); if(i%10===0) console.log(i,seen.slice(-10).join(' | ')); if(i%25===0){ await ev(`BLS_TEST.ff(3)`); } if(i%40===0) await ev(`(document.querySelector('.ov28')||{remove(){}}).remove()`);
    await sleep(60);
  }
  o.state=await ev(`JSON.stringify(BLS_TEST.state())`); o.over=await ev(`document.documentElement.scrollWidth>innerWidth`);
  await shot('monkey'); console.log(JSON.stringify(o));
};
