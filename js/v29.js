// v0.50: Feed All, roster, training drills, 12 achievements, market sparkline, competition log, pair preview, volume, shortcuts, 1080 share card.
(function(){
  var Sim=BLS.Sim, Gen=BLS.Gen||window.Gen;
  function G(){ return Sim.G; }
  function ar(){ var g=G(); return !g||(g.lang||'ar')==='ar'; }
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function tx(a,e){ return ar()?a:e; }
  var st=document.createElement('style');
  st.textContent='.ov28 .rw{display:flex;gap:6px;align-items:center;border-top:1px solid #4a3d22;padding:6px 0}.ov28 .rw .nm{flex:1}.ov28 .bar{height:5px;background:#4a3d22;border-radius:3px;overflow:hidden;margin-top:2px}.ov28 .bar i{display:block;height:100%}.ov28 .mini{min-height:32px;padding:4px 8px;font-size:12px}.ov28 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ov28 .done{color:#9ed59e}.ov28 .todo{color:#9a8a68}';
  document.head.appendChild(st);
  function OV(h){ return BLS_OV(h); }
  function stage(b){ return Sim.stageOf(b); }

  // ---- Feed All (uses the same numbers as feeding one bird by hand: 0.01 kg and -45 hunger each)
  function feedAll(){
    var g=G(), n=0, w=0; g.birds.forEach(function(b){ if(b.thirst>25){ b.thirst=0; w++; } if(b.hunger>25&&g.feed>=0.01){ g.feed-=0.01; b.hunger=Math.max(0,b.hunger-45); n++; } });
    Sim.emit('toast',n||w?('🌾 '+tx('اتأكل '+n+' واتسقى '+w,'Fed '+n+', watered '+w)):tx('محدش محتاج دلوقتي أو العلف خلص','Nobody needs it now, or out of feed'));
    if(n) Sim.emit('sfx','click'); return n;
  }
  // ---- training drills (GAME MECHANIC, numbers ESTIMATE)
  function drill(b){
    var g=G(); g.train=g.train||{n:0,last:{}}; var d=Sim.dayNum();
    if(stage(b)!=='adult') return tx('الطير لازم يكون بالغ','Adult birds only');
    if(g.train.last[b.id]===d) return tx('اتدرّب النهارده','Already trained today');
    if((b.tr||0)>=10) return tx('وصل أقصى مستوى تدريب','Max training reached');
    if(g.feed<0.02) return tx('العلف خلص','Out of feed');
    if(b.health<50||b.dis) return tx('الطير تعبان','Bird is unwell');
    g.feed-=0.02; b.tr=(b.tr||0)+1; b.hunger=Math.min(100,b.hunger+8); b.stress=Math.min(100,(b.stress||0)+3); g.train.last[b.id]=d; g.train.n++; Sim.addXp(2); return '';
  }
  // ---- pair preview
  function pairPreview(m,f){
    var cs={}, ps={}; m.g.c.forEach(function(a){ f.g.c.forEach(function(c){ var k=Gen.colorName({c:[a,c]}); cs[k]=(cs[k]||0)+1; }); });
    m.g.p.forEach(function(a){ f.g.p.forEach(function(c){ var k=Gen.patternName({p:[a,c]}); ps[k]=(ps[k]||0)+1; }); });
    function pct(o){ return Object.keys(o).map(function(k){ return k+' '+Math.round(o[k]*25)+'%'; }).join(' · '); }
    var br=m.g.br===f.g.br?(BLS.BREEDS[m.g.br]?m.g.br:'baladi')+' 100%':m.g.br+' 45% · '+f.g.br+' 45% · baladi 10%';
    function rg(k){ var v=(m.g[k]+f.g[k])/2; return Math.round(Math.max(20,v-8))+'-'+Math.round(Math.min(100,v+8)); }
    var h='<h3>🧬 '+tx('توقّع الفراخ','Chick preview')+'</h3><div class="it"><b>'+esc(m.name)+' × '+esc(f.name)+'</b></div>'
     +'<div class="it">'+tx('اللون','Colour')+': '+esc(pct(cs))+'</div><div class="it">'+tx('النقشة','Pattern')+': '+esc(pct(ps))+'</div><div class="it">'+tx('السلالة','Breed')+': '+esc(br)+'</div>'
     +'<div class="it">'+tx('الحجم / الحيوية / الخصوبة','Size / vigour / fertility')+': '+rg('size')+' / '+rg('vit')+' / '+rg('fert')+'</div>'
     +'<div class="it">'+tx('بيضتين في الدورة (1-2)، الحضانة حوالي ','Clutch 1-2 eggs, incubation about ')+Math.round(BLS.CFG.EGG_INCUBATION_H/24)+tx(' يوم (طبيعي، الساعة بس هي اللي أسرع)',' days (natural; only the clock is faster)')+'</div>'
     +'<p class="est">'+tx('ميكانيكا لعبة مبسّطة (مش نموذج بيطري). نسبة الطفرة 3% مش محسوبة.','Simplified GAME MECHANIC, not a veterinary model. The 3% mutation chance is not shown.')+'</p><button id="pv-x">'+tx('إغلاق','Close')+'</button>';
    var o=OV(h); o.querySelector('#pv-x').onclick=function(){ o.remove(); };
  }
  // ---- roster drawer
  function roster(){
    var g=G(), bs=g.birds.slice().sort(function(a,b){ return (b.hunger+b.thirst+(100-b.health)+(b.dis?60:0))-(a.hunger+a.thirst+(100-a.health)+(a.dis?60:0)); });
    var h='<h3>🕊️ '+tx('كشف القطيع','Flock roster')+' ('+bs.length+')</h3><div><button id="ro-fa">🌾 '+tx('أطعم وسقّي الكل','Feed all')+'</button><button id="ro-cl">🧹 '+tx('نضّف العشة','Clean loft')+'</button></div>';
    bs.forEach(function(b){ var hp=Math.round(b.health); h+='<div class="rw"><div class="nm" data-id="'+b.id+'" style="cursor:pointer"><b>'+esc(b.name)+'</b> '+(b.sex==='M'?'♂':'♀')+' · '+tx({squab:'زغلول',juvenile:'يافع',adult:'بالغ'}[stage(b)]||'',stage(b))+(b.dis?' 🤒':'')+(b.tr?' 🏋️'+b.tr:'')+'<div class="bar"><i style="width:'+hp+'%;background:'+(hp>60?'#6fbf6f':hp>35?'#e0b53a':'#d96a5a')+'"></i></div><small>❤ '+hp+' · 🌾 '+Math.round(100-b.hunger)+' · 💧 '+Math.round(100-b.thirst)+'</small></div>'
      +(stage(b)==='adult'?'<button class="mini" data-dr="'+b.id+'">🏋️</button>':'')+(b.mate>=0&&b.sex==='M'?'<button class="mini" data-pv="'+b.id+'">🧬</button>':'')+'</div>'; });
    h+='<button id="ro-x">'+tx('إغلاق','Close')+'</button>'; var o=OV(h);
    o.querySelector('#ro-x').onclick=function(){ o.remove(); };
    o.querySelector('#ro-fa').onclick=function(){ feedAll(); o.remove(); roster(); };
    o.querySelector('#ro-cl').onclick=function(){ Sim.cleanLoft(); };
    o.querySelectorAll('[data-id]').forEach(function(e){ e.onclick=function(){ o.remove(); BLS.UI.showBird(+e.getAttribute('data-id')); }; });
    o.querySelectorAll('[data-dr]').forEach(function(e){ e.onclick=function(){ var b=Sim.bird(+e.getAttribute('data-dr')), r=drill(b); if(r) Sim.emit('toast','🏋️ '+r); else { Sim.emit('toast','🏋️ '+b.name+' +1'); } o.remove(); roster(); }; });
    o.querySelectorAll('[data-pv]').forEach(function(e){ e.onclick=function(){ var m=Sim.bird(+e.getAttribute('data-pv')), f=Sim.bird(m.mate); if(f) { o.remove(); pairPreview(m,f); } }; });
  }
  // ---- achievements (badges only, no coins: they do not change the economy)
  var ACH=[
   ['hatch1','🥚','أول فقس','First hatch',function(g){return g.stats.hatched>=1;}],
   ['hatch20','🐣','20 فرخ','20 chicks hatched',function(g){return g.stats.hatched>=20;}],
   ['sold10','🪙','بعت 10 طيور','Sold 10 birds',function(g){return (g.stats.sold||0)>=10;}],
   ['lv5','⭐','مستوى 5','Level 5',function(g){return g.level>=5;}],
   ['lv10','🌟','مستوى 10','Level 10',function(g){return g.level>=10;}],
   ['flock10','🕊️','قطيع 10','Flock of 10',function(g){return g.birds.length>=10;}],
   ['coin5k','💰','5000 عملة','5,000 coins',function(g){return g.coins>=5000;}],
   ['clean10','🧹','نضّفت 10 مرات','Cleaned 10 times',function(g){return (g.stats.cleaned||0)>=10;}],
   ['ord5','📦','5 طلبات للجيران','5 neighbour orders',function(g){return (g.stats.orders||0)>=5;}],
   ['streak7','🔥','7 أيام متتالية','7-day login streak',function(g){return g.quests&&g.quests.streak>=7;}],
   ['seen6','🎨','6 ألوان مكتشفة','6 colour combos found',function(g){return Object.keys(g.seen||{}).length>=6;}],
   ['drill15','🏋️','15 تدريب','15 training drills',function(g){return g.train&&g.train.n>=15;}]];
  function checkAch(){ var g=G(); if(!g||!g.birds) return; g.ach=g.ach||{}; ACH.forEach(function(a){ if(!g.ach[a[0]]&&a[4](g)){ g.ach[a[0]]=Sim.dayNum(); Sim.emit('toast','🏆 '+tx(a[2],a[3])); Sim.emit('sfx','level'); } }); }
  function achPanel(){ var g=G(); checkAch(); var n=0; var h='<h3>🏆 '+tx('الإنجازات','Achievements')+'</h3>'; ACH.forEach(function(a){ var d=g.ach&&g.ach[a[0]]; if(d) n++; h+='<div class="rw '+(d?'done':'todo')+'"><span>'+a[1]+'</span><span class="nm">'+tx(a[2],a[3])+'</span><span>'+(d?('✅ '+tx('يوم ','day ')+d):'⬜')+'</span></div>'; }); h+='<p>'+n+'/12 · '+tx('شارات بس، من غير مكافأة عملات.','Badges only, no coin reward.')+'</p><button id="ac-x">'+tx('إغلاق','Close')+'</button>'; var o=OV(h); o.querySelector('#ac-x').onclick=function(){ o.remove(); }; }
  // ---- market sparkline (same deterministic formula as Sim.dailyMarket)
  function hash01(n){ var x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
  function mval(d,i){ return 0.75+0.6*(hash01(d*7+i*131)+hash01((d-1)*7+i*131))/2; }
  function spark(i,col){ var d=Sim.dayNum(), pts=[], v; for(var k=13;k>=0;k--){ v=mval(d-k,i); pts.push(((13-k)*(120/13)).toFixed(1)+','+(36-(v-0.75)/0.6*32).toFixed(1)); } return '<svg width="120" height="40" viewBox="0 0 120 40"><polyline fill="none" stroke="'+col+'" stroke-width="2" points="'+pts.join(' ')+'"/></svg>'; }
  function market(){ var d=Sim.dayNum(), L=[['feed',tx('العلف','Feed'),'#e0b53a'],['G',tx('حمام رمادي','Grey pigeons'),'#9aa3ad'],['R',tx('حمام أحمر','Red pigeons'),'#d96a5a'],['W',tx('حمام أبيض','White pigeons'),'#f5ead2']];
    var h='<h3>📈 '+tx('أسعار السوق (14 يوم)','Market prices (14 days)')+'</h3>'; L.forEach(function(x,i){ var v=mval(d,i); h+='<div class="rw"><span class="nm">'+x[1]+'<br><b>×'+v.toFixed(2)+'</b> '+(v>1.12?'↑':v<0.9?'↓':'→')+'</span>'+spark(i,x[2])+'</div>'; });
    h+='<p class="est">'+tx('الأسعار بتتغير كل يوم لعبة بنفس الطريقة لو الرقم اليوم نفسه (من 0.75 لـ 1.35). النطاق تقدير مش بيانات سوق حقيقية.','Prices change once per game day and are the same for a given day (0.75 to 1.35). The band is an ESTIMATE, not real market data.')+'</p><button id="mk-x">'+tx('إغلاق','Close')+'</button>'; var o=OV(h); o.querySelector('#mk-x').onclick=function(){ o.remove(); }; }
  // ---- competition log
  function trackComp(){ var g=G(); if(!g||!g.comp||!g.comp.last) return; var L=g.comp.log=g.comp.log||[], l=g.comp.last; if(!L.length||L[L.length-1].week!==l.week){ L.push({week:l.week,place:l.place,score:l.score,bird:l.bird,prize:l.prize}); if(L.length>20) L.shift(); } }
  function compLog(){ var g=G(); trackComp(); var L=(g.comp&&g.comp.log)||[]; var h='<h3>🏅 '+tx('سجل المسابقات','Competition log')+'</h3>'; if(!L.length) h+='<p>'+tx('لسه مفيش جولات اتلعبت.','No rounds played yet.')+'</p>'; L.slice().reverse().forEach(function(r){ h+='<div class="rw"><span class="nm">'+tx('الأسبوع ','Week ')+r.week+' · '+esc(r.bird||'-')+'</span><span>'+(r.place?('#'+r.place):tx('مشاركتش','no entry'))+' · '+r.score+' · 🪙'+(r.prize||0)+'</span></div>'; }); h+='<button id="cl-x">'+tx('إغلاق','Close')+'</button>'; var o=OV(h); o.querySelector('#cl-x').onclick=function(){ o.remove(); }; }
  // ---- 1080x1080 share card with loft name, level and streak
  function loftName(){ var g=G(); if(!g.loftName){ var n=null; try{ n=prompt(tx('اسم عشتك؟','Name your loft?'),tx('عشة الحمام','My Loft')); }catch(e){} g.loftName=(n||tx('عشة الحمام','My Loft')).slice(0,24); Sim.save(); } return g.loftName; }
  function card(){
    var g=G(), cv=document.createElement('canvas'); cv.width=cv.height=1080; var x=cv.getContext('2d'), a=ar(), nm=loftName(), seen=Object.keys(g.seen||{}).length, streak=(g.quests&&g.quests.streak)||0, ach=Object.keys(g.ach||{}).length;
    var gr=x.createLinearGradient(0,0,0,1080); gr.addColorStop(0,'#33492b'); gr.addColorStop(1,'#14110b'); x.fillStyle=gr; x.fillRect(0,0,1080,1080);
    x.strokeStyle='#d8b04a'; x.lineWidth=10; x.strokeRect(30,30,1020,1020); x.textAlign='center'; x.direction=a?'rtl':'ltr';
    x.fillStyle='#ffe9a8'; x.font='800 76px system-ui,sans-serif'; x.fillText(nm,540,170); x.fillStyle='#d8c9a0'; x.font='600 34px system-ui,sans-serif'; x.fillText('Bird Life Simulator',540,225);
    var rows=[[a?'المستوى':'Level',g.level],[a?'اليوم':'Day',Sim.dayNum()],[a?'الطيور':'Flock',g.birds.length],[a?'سلسلة الدخول':'Login streak',streak+' 🔥'],[a?'فقس':'Hatched',g.stats.hatched||0],[a?'ألوان مكتشفة':'Colours found',seen],[a?'إنجازات':'Achievements',ach+'/12']];
    rows.forEach(function(r,i){ var y=330+i*98; x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(110,y-56,860,76); x.direction='ltr'; x.textAlign='left'; x.fillStyle='#d8c9a0'; x.font='600 40px system-ui,sans-serif'; x.fillText(r[0],140,y); x.textAlign='right'; x.fillStyle='#ffe9a8'; x.font='800 46px system-ui,sans-serif'; x.fillText(String(r[1]),940,y); });
    x.textAlign='center'; x.fillStyle='#8a7a55'; x.font='600 30px system-ui,sans-serif'; x.fillText(a?'تعالى ربّي حمامك معايا':'Come raise pigeons with me',540,1030);
    var json=JSON.stringify({game:'Bird Life Simulator',loft:nm,level:g.level,day:Sim.dayNum(),birds:g.birds.length,streak:streak,achievements:ach});
    cv.toBlob(function(b){ var f=new File([b],'my-loft.png',{type:'image/png'}); if(navigator.canShare&&navigator.canShare({files:[f]})) navigator.share({files:[f],title:nm,text:json}).catch(function(){}); else { var u=document.createElement('a'); u.href=URL.createObjectURL(b); u.download='my-loft.png'; document.body.appendChild(u); u.click(); u.remove(); } },'image/png');
    return json;
  }
  if(window.BLS_LOFT) window.BLS_LOFT.card=card; else window.BLS_LOFT={card:card};
  // ---- menu
  function menu(){
    var vol=BLS.Audio&&BLS.Audio.getVol?BLS.Audio.getVol():0.9;
    var h='<h3>🧰 '+tx('أدوات المزرعة','Farm tools')+'</h3><div class="grid2"><button data-m="fa">🌾 '+tx('أطعم الكل','Feed all')+' (F)</button><button data-m="ro">🕊️ '+tx('كشف القطيع','Roster')+' (R)</button><button data-m="cl">🧹 '+tx('نضّف العشة','Clean loft')+' (C)</button><button data-m="mk">📈 '+tx('السوق','Market')+' (K)</button><button data-m="ac">🏆 '+tx('الإنجازات','Achievements')+' (A)</button><button data-m="lg">🏅 '+tx('سجل المسابقات','Comp log')+'</button><button data-m="cd">🖼️ '+tx('كارت العشة','Share card')+'</button><button data-m="sr">📚 '+tx('المصادر','Sources')+' (?)</button><button data-m="rm">🎞️ '+tx('حركة أقل: ','Reduced motion: ')+(BLS.REDUCED?tx('شغّال','on'):tx('مقفول','off'))+'</button><button data-m="ed">✋ '+tx('تحريك الأكل والمية والأعواد','Move feeders, drinkers, perches')+' (E)</button></div>'
     +'<div class="it">🔊 '+tx('الصوت','Volume')+' <input type="range" id="vol29" min="0" max="100" value="'+Math.round(vol*100)+'" aria-label="volume"> (M = '+tx('كتم','mute')+')</div><div class="it"><small>'+tx('اختصارات: 1-5 للتنقل، Esc للإغلاق','Shortcuts: 1-5 tabs, Esc closes')+'</small></div><button id="mn-x">'+tx('إغلاق','Close')+'</button>';
    var o=OV(h); o.querySelector('#mn-x').onclick=function(){ o.remove(); };
    o.querySelector('#vol29').oninput=function(){ if(BLS.Audio&&BLS.Audio.setVol) BLS.Audio.setVol(this.value/100); };
    var A={fa:feedAll,ro:roster,cl:function(){ Sim.cleanLoft(); },mk:market,ac:achPanel,lg:compLog,cd:card,sr:function(){ BLS_SRC.open(); },ed:function(){ BLS_EDIT.toggle(true); },rm:function(){ try{ localStorage.setItem('bls_rm',BLS.REDUCED?'0':'1'); }catch(e){} Sim.emit('toast','🎞️ '+tx(BLS.REDUCED?'الحركة الأقل شغّالة':'الحركة الأقل مقفولة','Reduced motion '+(BLS.REDUCED?'on':'off'))); }};
    o.querySelectorAll('[data-m]').forEach(function(e){ e.onclick=function(){ var k=e.getAttribute('data-m'); if(k!=='fa'&&k!=='cl'&&k!=='cd'&&k!=='rm') o.remove(); A[k](); }; });
  }
  window.BLS_V29={feedAll:feedAll,drill:drill,roster:roster,market:market,ach:achPanel,checkAch:checkAch,card:card,menu:menu,compLog:compLog,pairPreview:pairPreview,ACH:ACH};
  new MutationObserver(function(){ var hub=$('hub'); if(hub&&hub.style.display==='flex'&&!$('h29')){ var he=$('he'); if(he){ var b=document.createElement('button'); b.id='h29'; b.textContent='🧰 '+tx('أدوات المزرعة','Farm tools'); b.onclick=function(){ hub.style.display='none'; menu(); }; he.parentNode.insertBefore(b,he); } } }).observe(document.body,{childList:true,subtree:true});
  setInterval(function(){ if(G()&&G().birds){ checkAch(); trackComp(); } },5000);
  // ---- keyboard shortcuts
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey||e.metaKey||e.altKey) return; var t=(e.target&&e.target.tagName)||''; if(/INPUT|TEXTAREA|SELECT/.test(t)) return; if(!G()||!G().birds) return;
    var k=e.key, ov=document.querySelector('.ov28');
    if(k==='Escape'){ if(window.BLS_EDIT&&BLS_EDIT.on){ BLS_EDIT.cancel(); return; } if(ov) ov.remove(); else BLS.UI.close(); return; }
    if(ov) return;
    if(/^[1-5]$/.test(k)){ var bs=document.querySelectorAll('#nav button'); if(bs[+k-1]) bs[+k-1].click(); }
    else if(k==='f'||k==='F') feedAll(); else if(k==='c'||k==='C') Sim.cleanLoft(); else if(k==='r'||k==='R') roster(); else if(k==='k'||k==='K') market(); else if(k==='a'||k==='A') achPanel(); else if(k==='m'||k==='M'){ var s=$('b-snd'); if(s) s.click(); } else if(k==='?') BLS_SRC.open(); else if(k==='t'||k==='T') menu(); else if(k==='e'||k==='E') BLS_EDIT.toggle();
  });
})();
