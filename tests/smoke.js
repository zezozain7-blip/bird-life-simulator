// Headless smoke test. Usage: node tests/smoke.js  (needs Chrome, started via /tmp/cdp.js style helper)
// Steps run through the CDP helper: W=390 H=844 node cdp.js file://.../index.html /tmp/s  with this file copied to /tmp/steps.js
module.exports=async function({send,ev,sleep,shot}){
  const out={};
  await sleep(1500);
  await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return /تخطّ|Skip/.test(x.textContent)&&x.offsetParent;}); if(b) b.click();})()`);
  out.viewport=await ev(`innerWidth+'x'+innerHeight`);
  out.ar=await ev(`BLS.Sim.G.lang`);
  out.hasManifest=await ev(`!!document.querySelector('link[rel=manifest]')`);
  await ev(`BLS.Sim.G.speed=8; for(var i=0;i<3000;i++){ BLS.Sim.update(0.5); if(i%300==0) BLS_LOFT.log(); }`);
  const day=await ev(`BLS.Sim.dayNum()`); out.day=day;
  await ev(`BLS.Sim.save()`);
  const snap=await ev(`localStorage.getItem('bls_save_v1')`);
  out.saveBytes=snap&&snap.length;
  out.saveVer=await ev(`JSON.parse(localStorage.getItem('bls_save_v1')).saveVersion`);
  await ev(`document.getElementById('hubb').click()`); await sleep(300);
  out.cardBtn=await ev(`!!document.getElementById('hl')`);
  await shot('hub');
  out.tasks=await ev(`(function(){BLS.Sim.ensureQuests(); var b=document.querySelectorAll('#nav button'); out_nav=b.length; b[b.length-1].click(); return b.length;})()`);
  await sleep(600); out.signpost=await ev(`(document.getElementById('sgn')||{}).textContent||null`);
  await sleep(500); await shot('tasks');
  await send('Page.reload'); await sleep(2500);
  out.afterReloadDay=await ev(`BLS.Sim&&BLS.Sim.G?BLS.Sim.dayNum():-1`);
  console.log(JSON.stringify(out));
};
