/* v0.20 addon: guided first-session goals, big-moment bursts, level-scaled upkeep, local analytics */
(function(){
var GL=[
{ar:'زوّج ذكر وأنثى: اضغط على طير',en:'Pair a male and a female: tap a bird',r:150,ok:function(G){return G.birds.some(function(b){return b.mate;});}},
{ar:'استنى أول بيضة في العش',en:'Wait for the first egg',r:100,ok:function(G){return G.eggs.length>0||G.stats.hatched>0;}},
{ar:'استنى أول فرخ يفقس',en:'Wait for the first chick to hatch',r:200,ok:function(G){return G.stats.hatched>=1;}},
{ar:'ارمي حبوب على الأرض 3 مرات',en:'Tap the ground to throw grain 3 times',r:120,ok:function(G){return G.ftue.seeds>=3;}},
{ar:'نفّذ أول طلب من الجيران',en:'Fill your first neighbour order',r:300,ok:function(G){return (G.stats.orders||0)>=1;}},
{ar:'وصّل المستوى 3',en:'Reach level 3',r:300,ok:function(G){return G.level>=3;}},
{ar:'بيع 3 طيور',en:'Sell 3 birds',r:250,ok:function(G){return (G.stats.sold||0)>=3;}}
];
var AK='bls_ana',ready=false;
function A(){try{return JSON.parse(localStorage.getItem(AK))||{first:Date.now(),s:[],e:[]};}catch(e){return{first:Date.now(),s:[],e:[]};}}
function log(n,v){try{var a=A();a.e.push([Date.now(),n,v||0]);a.e=a.e.slice(-200);localStorage.setItem(AK,JSON.stringify(a));}catch(e){}}
function burst(s){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var a=Array.from(s);
  for(var i=0;i<14;i++){
    var e=document.createElement('div');e.className='bst';e.textContent=a[i%a.length];
    e.style.left='50%';e.style.top='45%';
    var an=Math.random()*6.28,d=80+Math.random()*120;
    e.style.setProperty('--dx',Math.cos(an)*d+'px');e.style.setProperty('--dy',Math.sin(an)*d+'px');
    document.body.appendChild(e);setTimeout(function(x){x.remove();},1200,e);
  }
}
function tick(){
  var Sim=BLS.Sim,G=Sim&&Sim.G,el=document.getElementById('goal');
  if(!G||!G.birds||!G.stats||!el)return;
  if(!G.ftue){
    G.ftue={i:0,seeds:0};
    if(G.stats.hatched>0||G.level>1){while(G.ftue.i<GL.length&&GL[G.ftue.i].ok(G))G.ftue.i++;}
  }
  var g=GL[G.ftue.i];
  if(g&&g.ok(G)){
    G.coins+=g.r;G.ftue.i++;
    Sim.emit('toast','🎯 +'+g.r);Sim.emit('sfx','coin');burst('🎯✨🪙');log('goal',G.ftue.i);
    g=GL[G.ftue.i];
  }
  if(!g){el.style.display='none';return;}
  var ar=BLS.T('tasks')==='المهام';
  el.dir=ar?'rtl':'ltr';
  el.innerHTML=BLS.Icons.emo('🎯 <b>'+(G.ftue.i+1)+'/'+GL.length+'</b> '+(ar?g.ar:g.en)+' (+'+g.r+')');
  el.style.display='block';
}
function init(){
  var Sim=BLS.Sim;if(ready||!Sim||!Sim.G)return;ready=true;
  Object.defineProperty(BLS.CFG,'UPKEEP_PER_BIRD',{configurable:true,get:function(){var G=Sim.G;return 0.4;}});
  Sim.on('fx',function(k){
    var G=Sim.G;if(k==='seed'&&G&&G.ftue)G.ftue.seeds++;
    if(k==='hatch'){burst('🐣🐥✨');log('hatch');}
  });
  Sim.on('levelup',function(lv){burst('⭐🎉✨🪙');log('level',lv);});
  try{var a=A();a.s.push(Date.now());a.s=a.s.slice(-60);localStorage.setItem(AK,JSON.stringify(a));}catch(e){}
  if(window.BLS_DEBUG)window.BLS_DEBUG.analytics=A;
  window.BLS_FX={burst:burst,log:log,A:A};
  setInterval(tick,1000);
}
var w=setInterval(function(){if(window.BLS&&BLS.Sim&&BLS.Sim.G){clearInterval(w);init();}},500);
})();
