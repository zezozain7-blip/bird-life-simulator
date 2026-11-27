module.exports=async function({send,ev,sleep,shot}){
  const o={}; await sleep(3500);
  const J=async(e)=>JSON.parse(await ev(`JSON.stringify(${e})`));
  const mouse=async(t,p)=>send('Input.dispatchMouseEvent',{type:t,x:p[0],y:p[1],button:'left',clickCount:1});
  const drag=async(from,to,hold)=>{ await mouse('mousePressed',from); for(let i=1;i<=8;i++){ await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:from[0]+(to[0]-from[0])*i/8,y:from[1]+(to[1]-from[1])*i/8,button:'left'}); await sleep(30);} if(hold){ await shot(hold); o[hold+'Save']=await ev(`document.getElementById('ed-save').disabled`);} await mouse('mouseReleased',to); await sleep(150); };
  const at=(x,y)=>J(`BLS.Scene.toScreen(${x},${y},0)`);
  await ev(`BLS.Sim.G.perches.length||BLS.Sim.G.perches.push(0); BLS_EDIT.toggle(true)`); await sleep(500);
  o.hudHidden=await ev(`getComputedStyle(document.getElementById('hud')).display`);
  o.bars=await ev(`!!document.getElementById('ed30t')&&!!document.getElementById('ed30d')`);
  await shot('e0');
  let p=await at(6.2,6.0), q=await at(8.5,4.5);
  await drag(p,q,'valid'); o.f1=await J(`BLS.LAYOUT.feeder`); o.undoEn=await ev(`!document.getElementById('ed-undo').disabled`);
  // invalid: drag drinker onto feeder, release
  p=await at(4.3,7.2); q=await at(8.5,4.5);
  await drag(p,q,'invalid'); o.w1=await J(`BLS.LAYOUT.water`); o.afterBadSave=await ev(`document.getElementById('ed-save').disabled`);
  // invalid: off the floor
  p=await at(4.3,7.2); await drag(p,[p[0],40]); o.w2=await J(`BLS.LAYOUT.water`);
  // undo moves feeder back
  await ev(`document.getElementById('ed-undo').click()`); o.fUndo=await J(`BLS.LAYOUT.feeder`);
  // move again then cancel
  p=await at(6.2,6.0); q=await at(7.5,5); await drag(p,q); o.fMoved=await J(`BLS.LAYOUT.feeder`);
  await ev(`document.getElementById('ed-cancel').click()`); o.fCancel=await J(`BLS.LAYOUT.feeder`); o.hudBack=await ev(`getComputedStyle(document.getElementById('hud')).display`);
  // move, save, reload
  await ev(`BLS_EDIT.toggle(true)`); await sleep(300); p=await at(6.2,6.0); q=await at(8.0,4.5); await drag(p,q);
  await ev(`document.getElementById('ed-save').click()`); o.saved=await J(`BLS.Sim.G.pos`);
  await send('Page.reload'); await sleep(4000); o.reloaded=await J(`BLS.LAYOUT.feeder`);
  // reset 2-tap
  await ev(`BLS_EDIT.toggle(true)`); await ev(`document.getElementById('ed-reset').click()`); o.rs1=await J(`BLS.LAYOUT.feeder`); await ev(`document.getElementById('ed-reset').click()`); o.rs2=await J(`BLS.LAYOUT.feeder`);
  await ev(`document.getElementById('ed-save').click()`); o.posAfter=await J(`BLS.Sim.G.pos`);
  console.log(JSON.stringify(o));
};
