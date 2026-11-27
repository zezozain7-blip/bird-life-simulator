module.exports=async function({send,ev,sleep,shot}){
  const o={}; await sleep(3500);
  await ev(`BLS.Sim.G.birds.forEach(b=>{b.st='fly';b.z=2;})`); await sleep(800);
  o.afterTakeoff=await ev(`BLS.Scene.particles().live`);
  await shot('feathers');
  await ev(`BLS.Sim.G.birds.forEach(b=>{b.st='idle';b.z=0;})`); await sleep(500);
  o.afterLand=await ev(`BLS.Scene.particles().live`);
  await shot('dust');
  await sleep(4000); o.later=await ev(`BLS.Scene.particles().live`);
  console.log(JSON.stringify(o));
};
