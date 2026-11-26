(function(){
  var Sim=BLS.Sim;
  if(!Sim.load()) Sim.newGame('ar');
  BLS.Scene.init(document.getElementById('game'));
  BLS.Art.init(function(){ if(BLS.Art.count()&&BLS.Scene.rebuild) BLS.Scene.rebuild(); });
  BLS.UI.init();
  var A=BLS.Audio;
  Sim.on('sfx',function(n){ A.play(n); });
  ['pointerdown','touchstart','keydown'].forEach(function(e){ window.addEventListener(e,function(){ A.start(); },{passive:true}); });
  document.addEventListener('click',function(e){ if(e.target.closest&&e.target.closest('button')) A.play('click'); });
  setInterval(A.tick,4500);
  var last=performance.now();
  function tick(now){ var dt=(now-last)/1000; last=now; Sim.update(dt); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  setInterval(Sim.save,5000);
  document.addEventListener('visibilitychange',function(){ if(document.hidden) Sim.save(); });
  window.addEventListener('pagehide',Sim.save);
  window.BLS_DEBUG={Sim:Sim};
})();
