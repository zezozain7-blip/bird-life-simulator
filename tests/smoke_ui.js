module.exports=async function({send,ev,sleep,shot}){
  const o={}; await sleep(3500);
  o.cls=await ev(`document.body.className`);
  o.hud=await ev(`(()=>{const r=document.getElementById('hud-top').getBoundingClientRect();const L=[...document.querySelectorAll('#hud-top>*')].map(e=>e.getBoundingClientRect().bottom);return {h:Math.round(Math.max(...L)),w:r.width}})()`);
  o.nav=await ev(`[...document.querySelectorAll('#bottom-nav button')].map(b=>{const r=b.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)})`);
  o.overflow=await ev(`document.documentElement.scrollWidth>innerWidth`);
  o.birdsTxt=await ev(`document.getElementById('h-birds').textContent`);
  await shot('ui_farm');
  const steps=[['birds','ui_birds'],['shop','ui_shop'],['tasks','ui_tasks'],['more','ui_more']];
  for(const [t,n] of steps){ await ev(`BLS_V31.go('${t}')`); await sleep(500); await shot(n); }
  o.moreBtns=await ev(`document.querySelectorAll('.ov28 .moregrid button').length`);
  for(const [i,n] of [[0,'ui_breeding'],[1,'ui_manage'],[2,'ui_coll'],[3,'ui_comp'],[4,'ui_ach'],[5,'ui_market'],[6,'ui_roster'],[8,'ui_src'],[10,'ui_tools']]){
    await ev(`BLS_V31.go('more')`); await sleep(300); await ev(`document.querySelectorAll('.ov28 .moregrid button')[${i}].click()`); await sleep(600); await shot(n);
    await ev(`(document.querySelector('.ov28')||{remove(){}}).remove(); BLS.UI.close()`);
  }
  await ev(`BLS.UI.close()`); await sleep(300);
  // bird chip
  const p=await ev(`(()=>{const b=BLS.Sim.G.birds[0];const s=BLS.Scene.toScreen(b.x,b.y,b.z||0);return [s[0],s[1]-20,b.id]})()`);
  o.pickPos=p;
  await ev(`BLS.UI.onPick({type:'bird',id:${p[2]}})`); await sleep(500); await shot('ui_chip');
  o.chip=await ev(`(()=>{const c=document.querySelector('.bird-float-chip');const r=c.getBoundingClientRect();return {shown:c.style.display,l:r.left>=0,r:r.right<=innerWidth,t:Math.round(r.top)}})()`);
  await ev(`document.querySelector('.bird-float-chip button').click()`); await sleep(600); await shot('ui_bird');
  await ev(`BLS.UI.close()`);
  // sheet open time & toast
  o.toast=await ev(`(()=>{BLS.Sim.emit('toast','test');return 0})()`); await sleep(400); o.toastTop=await ev(`Math.round(document.getElementById('toast').getBoundingClientRect().top)`); await shot('ui_toast');
  // edit mode
  await ev(`BLS_EDIT.toggle(true)`); await sleep(500); await shot('ui_edit'); o.edHud=await ev(`getComputedStyle(document.getElementById('hud')).display+'/'+getComputedStyle(document.getElementById('bottom-nav')).display`); await ev(`BLS_EDIT.cancel()`); await sleep(300);
  // old look round trip
  await ev(`BLS_V31.setTheme(false)`); await sleep(400); o.oldCls=await ev(`document.body.className`); o.oldNav=await ev(`getComputedStyle(document.getElementById('nav')).display+'/'+getComputedStyle(document.getElementById('bottom-nav')).display`); await shot('ui_old');
  await ev(`BLS_V31.setTheme(true)`); await sleep(300); o.newCls=await ev(`document.body.className`);
  console.log(JSON.stringify(o));
};
