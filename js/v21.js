/* v0.21 addon: seasonal event with exclusive badges, new-colour discovery, hub screen, notifications, bailout */
(function(){
var TK=[
{ar:'اتنين فرخ يفقسوا',en:'Hatch 2 chicks',n:2,v:function(G,b){return G.stats.hatched-b.h;}},
{ar:'ارمي حبوب 6 مرات',en:'Throw grain 6 times',n:6,v:function(G,b){return G.ftue.seeds-b.s;}},
{ar:'بيع طيرين',en:'Sell 2 birds',n:2,v:function(G,b){return (G.stats.sold||0)-b.d;}}];
var ready=false,$=function(i){return document.getElementById(i);};
var isAr=function(){return BLS.T('tasks')==='المهام';};
function fx(){return window.BLS_FX||{burst:function(){},log:function(){},A:function(){return{s:[],e:[],first:Date.now()};}};}
function notify(m){try{if(document.hidden&&window.Notification&&Notification.permission==='granted')new Notification('Bird Life Simulator',{body:m});}catch(e){}}
function tick(){
  var Sim=BLS.Sim,G=Sim.G,el=$('sev'),ar=isAr();
  if(!G||!G.stats||!G.ftue||!el)return;
  if(G.coins<30&&G.feed<0.2&&G.bail!==Sim.dayNum()){G.bail=Sim.dayNum();G.coins+=80;Sim.emit('toast',(ar?'🆘 مساعدة الجيران: ':'🆘 Neighbours help: ')+'+80');}
  if(G.ftue.i<7){el.style.display='none';return;}
  var c=Math.floor((Sim.dayNum()-1)/15);
  if(!G.sev||G.sev.c!==c)G.sev={c:c,b:{h:G.stats.hatched,s:G.ftue.seeds,d:G.stats.sold||0},p:[0,0,0],done:0};
  var S=G.sev,cur=-1;
  TK.forEach(function(t,i){
    var v=t.v(G,S.b);
    if(!S.p[i]&&v>=t.n){S.p[i]=1;G.coins+=100;Sim.emit('toast','🎉 +100');Sim.emit('sfx','coin');fx().burst('🎉✨🪙');}
    if(!S.p[i]&&cur<0)cur=i;
  });
  if(cur<0&&!S.done){S.done=1;G.badges=G.badges||[];G.badges.push(c+1);G.coins+=300;Sim.emit('toast',(ar?'🏅 شارة الموسم ':'🏅 Season badge ')+(c+1)+' +300');fx().burst('🏅🎉⭐✨');fx().log('badge',c+1);}
  var left=15-((Sim.dayNum()-1)%15),t=TK[cur];
  el.dir=ar?'rtl':'ltr';
  el.innerHTML=BLS.Icons.emo(cur<0?'🏅 '+(ar?'خلّصت حدث الموسم ':'Season event complete ')+(c+1)
    :'🎉 '+(ar?'حدث الموسم ':'Season ')+(c+1)+' · '+(ar?t.ar:t.en)+' <b>'+Math.min(t.n,t.v(G,S.b))+'/'+t.n+'</b> · '+left+(ar?' يوم':'d'));
  el.style.display='block';
}
function hub(){
  var Sim=BLS.Sim,G=Sim.G,ar=isAr(),a=fx().A(),h=$('hub');if(!G)return;
  var days=Math.max(1,Math.ceil((Date.now()-a.first)/864e5)),seen=Object.keys(G.seen||{}).length;
  var L=ar?['ملف المزرعة','اليوم','المستوى','فقس','مبيع','تركيبات ألوان مكتشفة','جلسات','أيام منذ أول لعب','شارات المواسم','لسه مفيش','فعّل الإشعارات','إغلاق']
          :['Farm profile','Day','Level','Hatched','Sold','Colour combos found','Sessions','Days since first play','Season badges','None yet','Enable notifications','Close'];
  var M=ar?['💾 نسخة احتياطية','📂 استرجاع نسخة','📤 شارك أحسن طير']:['💾 Export backup','📂 Import backup','📤 Share my best bird'];
  h.dir=ar?'rtl':'ltr';
  h.innerHTML=BLS.Icons.emo('<div class="c"><h3>🏅 '+L[0]+'</h3>'+L[1]+': '+Sim.dayNum()+'<br>'+L[2]+': '+G.level+'<br>'+L[3]+': '+G.stats.hatched+'<br>'+L[4]+': '+(G.stats.sold||0)+'<br>'+L[5]+': '+seen+'<br>'+L[6]+': '+a.s.length+'<br>'+L[7]+': '+days+'<br>'+L[8]+': '+((G.badges||[]).map(function(n){return '🏅'+n;}).join(' ')||L[9])+'<button id="hn">'+L[10]+'</button><button id="he">'+M[0]+'</button><button id="hi">'+M[1]+'</button><button id="hs">'+M[2]+'</button><button id="ht">'+(ar?'🎓 إعادة الشرح':'🎓 Replay tutorial')+'</button><button id="hx">'+L[11]+'</button></div>');
  h.style.display='flex';
  $('hx').onclick=function(){h.style.display='none';}; $('ht').onclick=function(){h.style.display='none';if(window.BLS_TUT)BLS_TUT.start();};
  $('he').onclick=BLS_BK.exp;$('hi').onclick=BLS_BK.imp;$('hs').onclick=BLS_BK.share;
  $('hn').onclick=function(){try{Notification.requestPermission();}catch(e){}};
}
function init(){
  var Sim=BLS.Sim;if(ready||!Sim||!Sim.G||!window.BLS_FX)return;ready=true;
  $('hubb').onclick=hub; $('hubb').innerHTML=BLS.Icons.emo('🏅');
  Sim.on('fx',function(k,b){
    var G=Sim.G;if(k!=='hatch'||!b||!b.g||!G)return;
    var key=BLS.Gen.phenoColor(b.g)+'|'+BLS.Gen.phenoPattern(b.g);
    G.seen=G.seen||{};
    if(!G.seen[key]){G.seen[key]=1;G.coins+=40;Sim.emit('toast',(isAr()?'✨ تركيبة لون جديدة +40':'✨ New colour combo +40'));fx().burst('✨🌈🐣⭐');fx().log('combo',Object.keys(G.seen).length);}
    notify(isAr()?'فرخ جديد فقس!':'A chick hatched!');
  });
  Sim.on('levelup',function(lv){notify((isAr()?'مستوى جديد: ':'Level up: ')+lv);});
  setInterval(tick,1000);
}
var w=setInterval(function(){if(window.BLS&&BLS.Sim&&BLS.Sim.G&&window.BLS_FX){clearInterval(w);init();}},500);
})();
