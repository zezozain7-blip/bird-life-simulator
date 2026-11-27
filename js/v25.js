/* v0.25 tutorial: short guided tour of the main buttons on the first play. Replayable from the profile hub. */
(function(){
var $=function(i){return document.getElementById(i);};
var ar=function(){return BLS.T('tasks')==='المهام';};
var ST=[
 {t:null,ar:'أهلاً في مزرعتك! دوس على أي طائر تشوف كارته وحالته. ودوس على الأرض ترمي حبوب.',en:'Welcome to your farm! Tap a bird to see its card. Tap the ground to throw grain.'},
 {t:'b-feeder',ar:'ده المعلف. املاه بالعلف عشان الطيور متجوعش.',en:'This is the feeder. Fill it so the birds do not go hungry.'},
 {t:'b-water',ar:'ودي المية. املاها كل شوية.',en:'This is the water. Refill it now and then.'},
 {t:'nav-breeding',ar:'التزاوج: الطيور الكبيرة بتتجوز لوحدها، وهنا بتتابع البيض والفراخ.',en:'Breeding: adult birds pair up by themselves. Follow eggs and chicks here.'},
 {t:'nav-market',ar:'السوق: اشتري علف وطيور وعصافير، وبيع الطيور والبيض.',en:'Market: buy feed, pigeons and small birds, and sell birds and eggs.'},
 {t:'nav-manage',ar:'الإدارة: المهام والمسابقات والإحصائيات.',en:'Manage: tasks, competitions and statistics.'},
 {t:'b-fly',ar:'لما يبقى عندك طيرين أو أكتر بصحة كويسة، دوس هنا مرة كل يوم عشان السرب يطير.',en:'With two or more healthy adults, tap here once a day to send the flock flying.'},
 {t:'hubb',ar:'هنا ملف المزرعة والنسخة الاحتياطية وأحداث المواسم. بالتوفيق!',en:'Your farm profile, backup and season events live here. Good luck!'}
];
var ring,card,i=-1,ready=false;
function target(id){ if(!id) return null; if(id.indexOf('nav-')===0) return document.querySelector('[data-nav='+id.slice(4)+']'); return $(id); }
function place(){
  var s=ST[i]; if(!s||!ring) return; var e=target(s.t);
  if(!e||e.offsetParent===null&&getComputedStyle(e).position!=='fixed'){ ring.style.display='none'; card.style.top='150px'; return; }
  var r=e.getBoundingClientRect(); ring.style.display='block'; card.style.top=(r.top<innerHeight*0.45)?Math.round(innerHeight*0.5)+'px':'150px';
  ring.style.left=(r.left-6)+'px'; ring.style.top=(r.top-6)+'px'; ring.style.width=(r.width+12)+'px'; ring.style.height=(r.height+12)+'px';
}
function render(){
  var s=ST[i],G=BLS.Sim.G,a=ar(); G.tut=i;
  card.dir=a?'rtl':'ltr';
  card.innerHTML='<div class="tt">'+(i+1)+'/'+ST.length+'</div><div>'+(a?s.ar:s.en)+'</div><div class="tb"><button id="tut-skip">'+(a?'تخطّي':'Skip')+'</button><button id="tut-next" class="go">'+(i===ST.length-1?(a?'يلا نلعب':'Play'):(a?'التالي':'Next'))+'</button></div>';
  card.style.display='block'; place();
  $('tut-next').onclick=next; $('tut-skip').onclick=finish;
}
function next(){ i++; if(i>=ST.length) return finish(); render(); }
function finish(){ var G=BLS.Sim.G; if(G) G.tut=99; i=-1; if(ring) ring.style.display='none'; if(card) card.style.display='none'; }
function start(){ if(!ready) return; var h=$('hint'); if(h) h.remove(); if(BLS.Sim.G) BLS.Sim.G.seenHint=1; i=0; render(); }
function loop(){
  var G=BLS.Sim&&BLS.Sim.G; if(!G||!card) return;
  var sheetOpen=$('sheet')&&!$('sheet').classList.contains('hidden');
  if(i<0){ return; }
  card.style.visibility=sheetOpen?'hidden':'visible'; ring.style.visibility=sheetOpen?'hidden':'visible'; place();
}
function init(){
  var Sim=BLS.Sim; if(ready||!Sim||!Sim.G) return; ready=true;
  var css=document.createElement('style');
  css.textContent='#tut-ring{position:fixed;z-index:26;display:none;border:3px solid #ffd36a;border-radius:16px;pointer-events:none;box-shadow:0 0 14px #ffd36acc;animation:tutp 1.1s ease-in-out infinite}@keyframes tutp{50%{transform:scale(1.07)}}@media (prefers-reduced-motion:reduce){#tut-ring{animation:none}}'
   +'#tut-card{position:fixed;left:12px;right:12px;top:150px;z-index:27;display:none;background:#1f1b15f2;border:1.5px solid #d8b04a;border-radius:16px;padding:12px 14px;color:#f5ead2;font-size:15px;line-height:1.6}'
   +'#tut-card .tt{color:#c9b78d;font-size:12px;margin-bottom:2px}#tut-card .tb{display:flex;gap:8px;margin-top:10px}#tut-card button{flex:1;padding:10px;border-radius:12px;border:1.5px solid #6d5a34;background:#2d271e;color:#f5ead2;font:inherit;font-weight:700}#tut-card button.go{background:#d8b04a;color:#241c0a;border-color:#d8b04a}';
  document.head.appendChild(css);
  ring=document.createElement('div'); ring.id='tut-ring'; document.body.appendChild(ring);
  card=document.createElement('div'); card.id='tut-card'; document.body.appendChild(card);
  window.BLS_TUT={start:start};
  var G=Sim.G;
  if(G.tut===undefined){ G.tut=(G.level>1||G.stats.hatched>0||(G.stats.sold||0)>0)?99:0; }
  window.addEventListener('resize',place);
  setInterval(loop,300);
  if(G.tut<99){ setTimeout(function(){ if(Sim.G.tut<99){ i=Math.min(Sim.G.tut,ST.length-1); var h=$('hint'); if(h) h.remove(); render(); } },1500); }
}
var w=setInterval(function(){ if(window.BLS&&BLS.Sim&&BLS.Sim.G&&window.BLS_FX){ clearInterval(w); init(); } },500);
})();
