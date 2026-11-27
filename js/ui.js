// DOM UI: HUD, bottom sheet panels, bird card. Reads and writes only through BLS.Sim.
BLS.UI = (function(){
  var Sim=BLS.Sim, C=BLS.CFG, T=BLS.T, Spr=BLS.Sprites, Gen=BLS.Gen;
  var $=function(id){return document.getElementById(id);};
  var sheet, body, cur={kind:null}, toastT=0, lastEvent=null;
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function toast(m,ms){ var t=$('toast'); t.innerHTML=BLS.Icons.emo(esc(m)); t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('show');},ms||2200); }
  function applyLang(){ var G=Sim.G; document.documentElement.lang=G.lang; $('b-lang').textContent=G.lang==='ar'?'EN':'ع';
    document.querySelectorAll('[data-i]').forEach(function(e){ e.textContent=T(e.getAttribute('data-i')); }); sheet.classList.toggle('rtl',G.lang==='ar'); $('nav').classList.toggle('rtl-nav',G.lang==='ar'); }
  function ad(n){ return String(n); }
  function G_lang(){ return Sim.G.lang; }
  function timeStr(hh,mm){ var ar=G_lang()==='ar'; return (ar?'اليوم ':'D')+ad(Sim.dayNum())+' · '+ad(hh%12||12)+':'+ad((mm<10?'0':'')+mm)+' '+(ar?(hh<12?'ص':'م'):(hh<12?'AM':'PM')); }
  var lastCoins=null;
  function hud(){
    var G=Sim.G; if(lastCoins!==null&&G.coins>lastCoins) BLS.FX.coins(G.coins-lastCoins); lastCoins=G.coins;
    var fb=$('b-fly'); if(fb) fb.classList.toggle('ready',G.flyDay!==Sim.dayNum()&&!Sim.isNight()&&Sim.flockReady().length>1);
    $('h-lvl').textContent=G.level; $('h-xp').style.width=(G.xp/(100*G.level)*100)+'%';
    $('h-coins').textContent=G.coins.toLocaleString('en'); $('h-feed').textContent=G.feed.toFixed(2)+' kg'; $('h-birds').textContent=G.birds.length;
    var h=Sim.hourOfDay(), hh=Math.floor(h), mm=Math.floor((h-hh)*60); $('h-time').textContent=timeStr(hh,mm)+' · '+T('w_'+(G.weather||'clear'));
    var wi=(h>=19||h<5)?'moon':(h<7||h>=17)?'dusk':'sun'; if($('h-wic').getAttribute('data-ic')!==wi){ $('h-wic').setAttribute('data-ic',wi); BLS.Icons.fill($('h-wic').parentNode); }
    var n=Sim.claimable(); var bd=$('h-badge'); bd.style.display=n?'flex':'none'; bd.textContent=n;
    $('b-speed').textContent='x'+G.speed;
  }
  function open(kind,title,html,opts){ var hh0=document.getElementById('hint'); if(hh0){ hh0.remove(); if(Sim.G) Sim.G.seenHint=1; } if(!cur.kind){ try{ history.pushState({bls:1},''); }catch(e){} } cur={kind:kind,args:opts||{}}; $('sheet-title').innerHTML=BLS.Icons.emo(esc(title)); body.innerHTML=BLS.Icons.emo(html); sheet.classList.toggle('shop',kind==='shop'); sheet.classList.remove('hidden'); body.scrollTop=0; setNav(kind); }
  function close(fromPop){ var was=cur.kind; sheet.classList.add('hidden'); cur={kind:null}; if(was&&fromPop!==true){ try{ if(history.state&&history.state.bls) history.back(); }catch(e){} } BLS.Scene.restore(); BLS.Scene.select(-1); setNav('farm'); }
  function setNav(k){ var m={build:'farm',tree:'birds',bird:'birds',birds:'birds',breeding:'breeding',nest:'breeding',egg:'breeding',shop:'market',manage:'manage',comp:'manage',tasks:'manage',pick:'birds'}[k]||'farm'; document.querySelectorAll('#nav button').forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-nav')===m); }); }
  function bar(v,good){ v=Math.max(0,Math.min(100,v)); var col=good?(v>60?'#6fcf4a':v>30?'#e6c03a':'#e0553a'):(v<40?'#6fcf4a':v<70?'#e6c03a':'#e0553a'); return '<div class="bar"><i style="width:'+v+'%;background:'+col+'"></i></div>'; }
  function portrait(b,size){ var cn=document.createElement('canvas'); cn.width=size*2; cn.height=size*1.7; cn.style.width=size+'px'; cn.style.height=(size*0.85)+'px'; var c=cn.getContext('2d'); c.scale(2,2); c.fillStyle='#00000030'; c.beginPath(); c.ellipse(size*0.5,size*0.78,size*0.28,size*0.06,0,0,6.3); c.fill();
    Spr.draw(c,size*0.5,size*0.8,size/68,1,{br:Gen.breedOf(b.g),col:Gen.phenoColor(b.g),pat:Gen.phenoPattern(b.g),pose:'stand',ph:0,stage:Sim.stageOf(b)==='squab'?'squab':Sim.stageOf(b)}); return cn; }
  function stageTxt(b){ return T(Sim.stageOf(b)); }
  function sexTxt(b){ return (b.sex==='M'?'♂ ':'♀ ')+T(b.sex==='M'?'male':'female'); }
  function archName(id){ var a=Sim.G.archive[id]; return a?a.name:T('unknown'); }
  // ----- bird card
  function pairWarn(b){ if(!b||b.mate<0||b.mate==null) return ''; var m=Sim.bird(b.mate); if(!m) return ''; var G=Sim.G, eggs=0, sq=0, n; for(n=0;n<G.nests.length;n++){ var o=G.nests[n]; if(o&&(o.m===b.id||o.f===b.id)){ eggs+=G.eggs.filter(function(e){return e.nest===n&&!e.dead;}).length; sq+=G.birds.filter(function(x){return x.nest===n&&Sim.stageOf(x)==='squab';}).length; } } return T('pw_pair',b.name,m.name,m.name)+(eggs?T('pw_eggs',eggs):'')+(sq?T('pw_sq',sq,m.name):'')+((eggs||sq)?'':T('pw_none')); }
  function showBird(id,keep){
    var b=Sim.bird(id); if(!b) return close();
    BLS.Scene.select(id); if(!keep){ BLS.Scene.focus(b.x,b.y,b.z); }
    var G=Sim.G, mate=b.mate>=0?Sim.bird(b.mate):null, stg=Sim.stageOf(b);
    var h='<div class="row"><div id="pt"></div><div style="flex:1"><div style="font-size:19px;font-weight:800">'+esc(b.name)+'</div><div>'+sexTxt(b)+' · '+stageTxt(b)+'</div>'
      +'<div><span class="tag">'+T('br_'+Gen.breedOf(b.g))+'</span><span class="tag">'+T(Gen.colorName(b.g))+'</span><span class="tag">'+T(Gen.patternName(b.g))+'</span>'+(b.sickFlag?'<span class="tag warn">⚠ '+T('health')+'</span>':'')+'</div></div></div>'
      +'<div class="row"><span class="lab">🌾 '+T('fullness')+'</span>'+bar(100-b.hunger,true)+'</div>'
      +'<div class="row"><span class="lab">💧 '+T('hydration')+'</span>'+bar(100-b.thirst,true)+'</div>'
      +'<div class="row"><span class="lab">❤ '+T('health')+'</span>'+bar(b.health,true)+'</div>'
      +'<div class="row"><span class="lab">✨ '+T('cleanliness')+'</span>'+bar(b.clean,true)+'</div>'
      +'<div class="row"><span class="lab">😌 '+T('mood')+'</span>'+bar(b.mood,true)+'</div>'
      +'<div class="row"><span class="lab">😰 '+T('stress')+'</span>'+bar(100-b.stress,true)+'</div>'
      +'<div class="kv"><span>'+T('personality')+'</span><span>'+T(Sim.PERS[b.pers].k)+'</span></div>'
      +(Sim.symptoms(b).length?'<div class="kv"><span>'+T('signs')+'</span><span>'+Sim.symptoms(b).map(function(k){return T(k);}).join('، ')+'</span></div>':'')
      +'<div class="kv"><span>'+T('age')+'</span><span>'+(b.age/24).toFixed(1)+' '+T('days')+'</span></div>'
      +'<div class="kv"><span>'+T('weight')+'</span><span>'+Sim.weightOf(b)+' g</span></div>'
      +'<div class="kv"><span>'+T('genes')+'</span><span dir="ltr">'+Gen.geneString(b.g)+'</span></div>'
      +'<div class="kv"><span>'+T('size')+' / '+T('vitality')+' / '+T('fertility')+'</span><span>'+b.g.size+' / '+b.g.vit+' / '+b.g.fert+'</span></div>'
      +'<div class="kv"><span>'+T('parents')+'</span><span>'+(b.parents[0]>0?esc(archName(b.parents[0]))+' × '+esc(archName(b.parents[1])):T('unknown'))+'</span></div>'
      +'<div class="kv"><span>'+T('mate')+'</span><span>'+(mate?esc(mate.name)+' (🥚 '+T('nest')+' '+(b.nest+1)+')':T('none'))+'</span></div>'
      +'<div class="row" style="margin-top:10px"><button class="btn2" id="a-feed">🌾 '+T('feed')+'</button><button class="btn2" id="a-water">💧 '+T('water')+'</button>'+((b.health<95||b.dis)?'<button class="btn2 alt" id="a-heal">💊 '+T('heal')+' ('+Sim.healCost()+')</button>':'')+'</div>'
      +((b.dis||b.iso)?'<div class="row"><button class="btn2 alt" id="a-iso">🏥 '+T(b.iso?'iso_off':'iso_btn')+'</button></div>':'')+'<div class="row"><button class="btn2 alt" id="a-pair">'+(mate?'💔 '+T('unpair'):'❤ '+T('pair'))+'</button><button class="btn2 alt" id="a-follow">🎥 '+T('follow')+'</button><button class="btn2 alt" id="a-tree">🌳 '+T('tree')+'</button></div>'
      +'<div class="row"><input class="name" id="a-name" value="'+esc(b.name)+'" maxlength="14"><button class="btn2 alt" id="a-ren" style="flex:0 0 auto">'+T('rename')+'</button></div>'
      +'<div class="row"><button class="btn2 red" id="a-sell">'+T('sell')+' · 🪙 '+Sim.sellPrice(b)+'</button></div>';
    open('bird',T('my_birds'),h,{id:id}); $('pt').appendChild(portrait(b,120));
    $('a-feed').onclick=function(){ Sim.feedBird(b); showBird(id,1); };
    $('a-water').onclick=function(){ Sim.waterBird(b); showBird(id,1); };
    if($('a-heal')) $('a-heal').onclick=function(){ Sim.healBird(b); showBird(id,1); };
    if($('a-iso')) $('a-iso').onclick=function(){ Sim.isolate(b,!b.iso); showBird(id,1); };
    $('a-pair').onclick=function(){ if(mate){ Sim.unpair(b); showBird(id,1); } else showPick(id); };
    $('a-tree').onclick=function(){ showTree(id); };
    $('a-follow').onclick=function(){ BLS.Scene.setFollow(!BLS.Scene.isFollow()); toast(BLS.Scene.isFollow()?'🎥 ON':'🎥 OFF'); };
    $('a-ren').onclick=function(){ var v=$('a-name').value.trim(); if(v){ b.name=v; Sim.G.archive[b.id].name=v; showBird(id,1); } };
    $('a-sell').onclick=function(){ if(this.dataset.s){ Sim.sell(b); close(); } else { this.dataset.s=1; var pw=pairWarn(b); if(pw) toast('⚠ '+pw,7000); this.innerHTML=BLS.Icons.emo(T('sure')+' '+T('sell')+' 🪙 '+Sim.sellPrice(b)); } };
  }
  function showPick(id){
    var b=Sim.bird(id), h='<div class="row">'+T('pick_partner')+'</div>';
    var list=Sim.G.birds.filter(function(o){ return o.id!==id&&o.sex!==b.sex; });
    if(Sim.stageOf(b)!=='adult') h+='<div class="warn">'+T('juvenile')+'</div>';
    h+='<div class="grid" id="pg"></div>'; if(!list.length) h+='<p>'+T('no_partner')+'</p>';
    open('pick',T('pair'),h,{id:id}); var g=$('pg');
    list.forEach(function(o){ var ok=Sim.canPair(b,o), rel=Sim.related(b,o); var d=document.createElement('div'); d.className='card'; d.style.opacity=ok?1:0.5; d.appendChild(portrait(o,96)); var n=document.createElement('div'); n.className='nm'; n.textContent=o.name; d.appendChild(n); var s=document.createElement('div'); s.className='sm'; s.textContent=rel?T('related'):(o.mate>=0?'❤':stageTxt(o)); d.appendChild(s);
      d.onclick=function(){ if(!ok) return toast(rel?T('related'):T('no_partner')); if(Sim.freeNest()<0) return toast(T('nonest')); Sim.pairUp(b,o); showBird(id,1); }; g.appendChild(d); });
  }
  // ----- panels
  function showBirds(){
    var G=Sim.G, h='<div class="grid" id="bg"></div>'; open('birds',T('my_birds')+' ('+G.birds.length+')',h); var g=$('bg');
    G.birds.slice().sort(function(a,b){return a.id-b.id;}).forEach(function(b){ var d=document.createElement('div'); d.className='card'; d.appendChild(portrait(b,96)); var n=document.createElement('div'); n.className='nm'; n.textContent=(b.sex==='M'?'♂ ':'♀ ')+b.name; d.appendChild(n); var s=document.createElement('div'); s.className='sm'; s.textContent=T('br_'+Gen.breedOf(b.g))+' · '+stageTxt(b)+(b.mate>=0?' ❤':''); d.appendChild(s); d.onclick=function(){ showBird(b.id); }; g.appendChild(d); });
    if(!G.birds.length) body.innerHTML='<p>'+T('nothing')+'</p>';
  }
  function showBreeding(){
    var G=Sim.G, h='<div class="grid" id="ng"></div><p style="color:#c9b78d;font-size:12px">'+T('hatch_tip')+'</p>'; open('breeding',T('nests'),h);
    var g=$('ng');
    for(var n=0;n<G.nestsOpen;n++){ (function(n){ var o=G.nests[n], d=document.createElement('div'); d.className='card'; var inner='<div class="nm">🪺 '+T('nest')+' '+(n+1)+'</div>';
      if(!o){ inner+='<div class="sm">'+T('free')+'</div>'; }
      else { var m=Sim.bird(o.m), f=Sim.bird(o.f); inner+='<div class="sm">'+(m?esc(m.name):'?')+' ♂ + '+(f?esc(f.name):'?')+' ♀</div>';
        var eggs=G.eggs.filter(function(e){return e.nest===n;}); var sq=G.birds.filter(function(b){return b.nest===n&&Sim.stageOf(b)==='squab';});
        inner+='<div class="sm">'+eggs.map(function(e){ return e.dead?'🪨':'🥚'; }).join('')+sq.map(function(){return '🐣';}).join('')+(Sim.covered(n)?' 🔥':'')+'</div>';
        if(eggs.length){ var mp=Math.max.apply(null,eggs.map(function(e){return e.dead?0:e.prog;})); inner+='<div class="prog"><i style="width:'+(mp/C.EGG_INCUBATION_H*100)+'%"></i></div>'; d.style.paddingBottom='18px'; } }
      d.innerHTML=inner; d.onclick=function(){ showNest(n); }; g.appendChild(d); })(n); }
  }
  function showNest(n){
    var G=Sim.G, o=G.nests[n], h='';
    if(!o){ h+='<p>'+T('empty')+'. '+T('pair')+': '+T('my_birds')+' ›</p><button class="btn2" id="n-b">'+T('my_birds')+'</button>'; open('nest',T('nest')+' '+(n+1),h); $('n-b').onclick=showBirds; return; }
    var m=Sim.bird(o.m), f=Sim.bird(o.f);
    h+='<div class="kv"><span>♂</span><span>'+(m?esc(m.name):'?')+'</span></div><div class="kv"><span>♀</span><span>'+(f?esc(f.name):'?')+'</span></div>';
    var sitter=G.birds.filter(function(x){return x.nest===n&&x.st==='sit'&&Sim.stageOf(x)!=='squab';})[0];
    h+='<div class="kv"><span>'+T('n_sit')+'</span><span>'+(sitter?(sitter.sex==='M'?'♂ ':'♀ ')+esc(sitter.name):T('n_none'))+'</span></div>';
    function eggSvg(k){ var fill=k==='dead'?'#6b6358':k==='inf'?'#fff6c8':k==='fert'?'#ffb15a':'#f4ecd8', ex=k==='fert'?'<path d="M20 26 q4 6 0 12 M20 32 q-6 2 -9 6 M20 32 q6 1 9 5 M20 30 l0 8" stroke="#b3361f" stroke-width="1.4" fill="none"/><circle cx="20" cy="33" r="3" fill="#8e1f12"/>':k==='dead'?'<circle cx="15" cy="30" r="2" fill="#3b352d"/><circle cx="25" cy="35" r="2.5" fill="#3b352d"/>':''; return '<svg width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="28" rx="15" ry="19" fill="'+fill+'" stroke="#8a7a55" stroke-width="1.5"/>'+ex+'</svg>'; }
    G.eggs.filter(function(e){return e.nest===n;}).forEach(function(e,i){ var left=Math.max(0,C.EGG_INCUBATION_H-e.prog); var k=e.dead?'dead':(e.prog>C.EGG_CANDLE_H?(e.fertile?'fert':'inf'):'unk'); var st=k==='dead'?(e.fertile?T('cold'):T('n_dead')):k==='fert'?T('n_fert'):k==='inf'?T('n_inf'):T('n_unk',Math.ceil(C.EGG_CANDLE_H-e.prog));
      h+='<h4>🥚 '+T('egg')+' '+(i+1)+'</h4><div class="row" style="align-items:center;gap:10px">'+eggSvg(k)+'<div style="flex:1">'+bar(e.prog/C.EGG_INCUBATION_H*100,true)+'<div class="sm">'+st+'</div></div></div><div class="kv"><span>'+Math.round(e.prog/C.EGG_INCUBATION_H*100)+'%</span><span>'+((k==='dead'||k==='inf')?'':T('hatch_in',Math.ceil(left)))+'</span></div>'+(e.dead?'':'<div class="kv"><span>❄</span><span>'+Math.round(e.cold)+' / '+C.EGG_COLD_LIMIT_H+' h</span></div>')+'<div class="row"><button class="btn2 alt" data-se="'+e.id+'">'+T('sell_egg')+'</button></div>'; });
    G.birds.filter(function(b){return b.nest===n&&Sim.stageOf(b)==='squab';}).forEach(function(b){ var lf=Math.max(0,C.SQUAB_H-b.age); h+='<h4>🐣 '+esc(b.name)+'</h4><div class="kv"><span>'+T('n_age')+'</span><span>'+(b.age/24).toFixed(1)+' '+T('days')+'</span></div>'+bar(100-b.hunger,true)+'<div class="kv"><span>'+T('n_left',Math.ceil(lf))+'</span><span></span></div><div class="row"><button class="btn2 alt" data-b="'+b.id+'">'+T('my_birds')+'</button></div>'; });
    if(!G.eggs.some(function(e){return e.nest===n;})&&!G.birds.some(function(b){return b.nest===n&&Sim.stageOf(b)==='squab';})) h+='<p class="sm">'+T('n_ready')+'</p>';
    h+='<div class="row">'+(m?'<button class="btn2 alt" data-b="'+m.id+'">♂ '+esc(m.name)+'</button>':'')+(f?'<button class="btn2 alt" data-b="'+f.id+'">♀ '+esc(f.name)+'</button>':'')+'</div>';
    open('nest',T('nest')+' '+(n+1),h); body.querySelectorAll('[data-b]').forEach(function(e){ e.onclick=function(){ showBird(+e.getAttribute('data-b')); }; }); body.querySelectorAll('[data-se]').forEach(function(e){ e.onclick=function(){ Sim.sellEgg(+e.getAttribute('data-se')); showNest(n); }; });
    BLS.Scene.focus(2.4,BLS.LAYOUT.nestPos(n).y,BLS.LAYOUT.nestPos(n).z);
  }
  // ----- shop
  var shopTab='feed', sellArm=null;
  var TABS=[['feed','grain'],['pigeons','birds'],['aviary','egg'],['gear','build'],['sell','coin'],['orders','tasks']];
  function art(inner,bg){ return '<svg viewBox="0 0 80 64" class="art">'+inner+'</svg>'; }
  function sackArt(col,mark,star){ return art('<ellipse cx="40" cy="58" rx="26" ry="4" fill="#0005"/><path d="M22 57Q14 34 27 19H53Q66 34 58 57Z" fill="'+col+'" stroke="#6b4a1e" stroke-width="2"/><path d="M27 19L24 9Q40 15 56 9L53 19Z" fill="'+col+'" stroke="#6b4a1e" stroke-width="2"/><path d="M27 20H53" stroke="#6b4a1e" stroke-width="4"/><circle cx="40" cy="39" r="11" fill="#fff4cf"/><path d="M40 48V31M40 36l-6-5M40 36l6-5M40 42l-6-5M40 42l6-5" stroke="'+mark+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+(star?'<path d="M62 8l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#ffd23f" stroke="#8a5a00"/>':'')); }
  var GEAR_ART={
    feeder:'<ellipse cx="40" cy="52" rx="30" ry="11" fill="#8a6a3f"/><ellipse cx="40" cy="50" rx="24" ry="8" fill="#5e4528"/><ellipse cx="40" cy="44" rx="18" ry="7" fill="#e0b53a"/><circle cx="32" cy="40" r="3" fill="#f0cf5a"/><circle cx="46" cy="39" r="3" fill="#f0cf5a"/>',
    water:'<ellipse cx="40" cy="56" rx="24" ry="8" fill="#b32424"/><rect x="28" y="14" width="24" height="42" rx="9" fill="#e8f3f9"/><rect x="30" y="26" width="20" height="28" rx="7" fill="#5aaae6"/>',
    nest:'<ellipse cx="40" cy="46" rx="28" ry="13" fill="#b98b3e"/><ellipse cx="40" cy="43" rx="20" ry="8" fill="#6e4c1c"/><ellipse cx="34" cy="37" rx="7" ry="10" fill="#fdf8ea"/><ellipse cx="48" cy="38" rx="7" ry="10" fill="#eee5cd"/><path d="M14 46q26 16 52 0M18 52q22 10 44 0" stroke="#e8c26a" stroke-width="2" fill="none"/>',
    perch:'<rect x="36" y="22" width="8" height="36" fill="#7a5028"/><rect x="14" y="16" width="52" height="9" rx="4" fill="#a8743f"/><rect x="24" y="56" width="32" height="5" rx="2" fill="#5b3a1c"/>',
    heat:'<rect x="18" y="16" width="44" height="42" rx="6" fill="#8a2c20"/><path d="M26 24v26M34 24v26M42 24v26M50 24v26" stroke="#ffb03a" stroke-width="4"/><path d="M30 12q-5-5 0-9M44 12q-5-5 0-9" stroke="#ff8a3a" stroke-width="2.5" fill="none"/>',
    vent:'<rect x="14" y="8" width="52" height="50" rx="8" fill="#cfd8de"/><circle cx="40" cy="33" r="19" fill="#43525c"/><g fill="#9fd4f2"><ellipse cx="40" cy="23" rx="6" ry="10"/><ellipse cx="49" cy="39" rx="6" ry="10" transform="rotate(120 49 39)"/><ellipse cx="31" cy="39" rx="6" ry="10" transform="rotate(240 31 39)"/></g><circle cx="40" cy="33" r="4" fill="#fff"/>',
    nursery:'<rect x="12" y="30" width="56" height="28" rx="6" fill="#a8743f"/><path d="M10 32L40 8l30 24z" fill="#c0503a"/><ellipse cx="40" cy="45" rx="9" ry="11" fill="#fdf8ea"/><circle cx="40" cy="25" r="5" fill="#ffd77a"/>',
    vet:'<rect x="14" y="18" width="52" height="40" rx="7" fill="#f2f5f4"/><path d="M30 18v-7h20v7" stroke="#8a9aa0" stroke-width="4" fill="none"/><path d="M35 26h10v9h9v10h-9v9H35v-9h-9V35h9z" fill="#d6332a"/>',
    flight:'<rect x="10" y="10" width="60" height="48" rx="6" fill="#7fb9e6"/><path d="M22 10v48M34 10v48M46 10v48M58 10v48M10 26h60M10 42h60" stroke="#e8f4ff" stroke-width="1.2"/><path d="M22 38q12-16 20-2 8-14 20-6-14 2-20 16-8-10-20-8z" fill="#fff"/>',
    cam:'<rect x="14" y="18" width="42" height="26" rx="6" fill="#d8dde2"/><circle cx="52" cy="31" r="12" fill="#22303a"/><circle cx="52" cy="31" r="6" fill="#4aa8e0"/><path d="M28 44l-6 14h18" stroke="#8a949c" stroke-width="5" fill="none"/><circle cx="22" cy="25" r="3" fill="#e33"/>',
    iso:'<rect x="14" y="14" width="52" height="44" rx="5" fill="#35505c"/><path d="M24 14v44M34 14v44M44 14v44M54 14v44" stroke="#bcd0d8" stroke-width="2.5"/><rect x="10" y="8" width="60" height="8" rx="3" fill="#e8b84a"/>',
    guard:'<path d="M40 6l26 9v18q-3 18-26 26Q17 51 14 33V15z" fill="#2f5d9a" stroke="#ffd36a" stroke-width="3"/><path d="M28 32l9 9 17-18" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>'
  };
  function priceBtn(act,price,label){ var poor=Sim.G.coins<price; return '<button class="buy'+(poor?' poor':'')+'" data-act="'+act+'">'+(label?'<span>'+label+'</span>':'')+'<b>'+price.toLocaleString('en')+'</b><i></i></button>'; }
  function lockBtn(lv){ return '<button class="buy lock" disabled>🔒 '+T('lv_need',lv)+'</button>'; }
  function sellBtn(act,price){ var armed=sellArm===act; return '<button class="buy sell'+(armed?' armed':'')+'" data-act="'+act+'"><span>'+(armed?T('sure'):T('sell'))+'</span><b>'+price.toLocaleString('en')+'</b><i></i></button>'; }
  function item(pic,name,desc,btns,ribbon,cls){ return '<div class="item '+(cls||'')+'">'+(ribbon?'<em class="rib">'+ribbon+'</em>':'')+'<div class="pic">'+pic+'</div><div class="nm">'+name+'</div>'+(desc?'<div class="sm">'+desc+'</div>':'')+'<div class="btns">'+btns+'</div></div>'; }
  function sec(t,html){ return '<h4 class="shop-h">'+t+'</h4><div class="shelf">'+html+'</div>'; }
  function slot(k){ return '<span class="slot" data-pic="'+k+'"></span>'; }
  function trendTag(k){ var t=Sim.trend(k); return '<span class="trend '+t+'">'+(t==='up'?'▲':t==='down'?'▼':'●')+' '+T('mk_'+t)+'</span>'; }
  function canvasFor(key){
    var p=key.split(':'), G=Sim.G;
    if(p[0]==='br'){ var B=BLS.BREEDS[p[1]]; return portrait({g:{br:p[1],c:[B.base||'G',B.base||'G'],p:['B','B']},age:999},104); }
    if(p[0]==='bird'){ var b=Sim.bird(+p[1]); return b?portrait(b,104):null; }
    if(p[0]==='sp'){ var s=BLS.SPECIES[p[1]], cn=document.createElement('canvas'); cn.width=180; cn.height=130; cn.style.width='90px'; cn.style.height='65px'; var c=cn.getContext('2d'); c.scale(2,2); c.fillStyle='#00000030'; c.beginPath(); c.ellipse(46,56,22,4,0,0,6.3); c.fill(); Spr.small(c,48,54,s,1.8,1); return cn; }
    return null;
  }
  function shopHtml(tab){
    var G=Sim.G, P=C.PRICE, h='', a=Sim.aviary(), room=Math.min(C.MAX_BIRDS,Sim.popCap());
    if(tab==='feed'){
      h+=sec(T('tab_feed'), item(sackArt('#d9b46e','#8a5a14'),T('feed_sack'),T('feed_sack_d')+' '+trendTag('feed'),priceBtn('feed',Sim.feedPrice()),C.FEED_BAG+' kg')
        +item(sackArt('#8fbf5a','#2f6a1c',1),T('mix_sack'),T('mix_sack_d'),priceBtn('mix',Sim.mixPrice()),C.FEED_BAG+' kg','gold'));
      h+='<div class="note">'+T('feedstock')+': <b dir="ltr">'+G.feed.toFixed(2)+' kg</b></div>';
    } else if(tab==='pigeons'){
      h+='<div class="note">'+T('loft_room')+': <b dir="ltr">'+G.birds.length+' / '+room+'</b></div>';
      h+=sec(T('quick_buy'), item(slot('br:baladi'),T('buy_bird'),T('rand_d'),priceBtn('rbird',P.bird))+item(slot('br:homer'),T('buy_pair'),T('pair_d'),priceBtn('rpair',P.pair),'×2','gold'));
      h+=sec(T('breeds_shop'), Object.keys(BLS.BREEDS).map(function(k){ var B=BLS.BREEDS[k], lock=G.level<B.lv, p=Sim.breedPrice(k);
        return item(slot('br:'+k),T('br_'+k),T('rar'+BLS.rarityOf(k))+' · '+T('pair_mkt')+' <b dir="ltr">'+B.pp+' EGP</b>',lock?lockBtn(B.lv):priceBtn('br:'+k+':M',p,'♂')+priceBtn('br:'+k+':F',p,'♀'),BLS.rarityOf(k)>=2?T('rare'):'',(lock?'locked ':'')+(BLS.rarityOf(k)>=2?'gold':'')); }).join(''));
    } else if(tab==='aviary'){
      h+='<div class="note">'+T('aviary')+': <b dir="ltr">'+Sim.avCount()+' / '+BLS.AVIARY_CAP+'</b><br>'+T('aviary_info')+'</div>';
      h+=sec(T('tab_aviary'), Object.keys(BLS.SPECIES).map(function(k){ var s=BLS.SPECIES[k], lock=G.level<s.lv, n=a[k]||0;
        return item(slot('sp:'+k),T('sp_'+k),T('av_own')+': '+n,lock?lockBtn(s.lv):priceBtn('av:'+k,s.price,T('pair_w')),s.price>=600?T('rare'):'',(lock?'locked ':'')+(s.price>=600?'gold':'')); }).join(''));
    } else if(tab==='gear'){
      function gear(id,name,desc,cost,owned){ return item(art(GEAR_ART[id]),name,desc,owned?'<button class="buy owned" disabled>✔ '+T('up_owned')+'</button>':priceBtn('gear:'+id,cost),'',owned?'done':''); }
      var nf=G.nestsOpen>=C.NEST_COUNT, pf=G.perches.length>=BLS.LAYOUT.perchSpots.length;
      h+=sec(T('build'), gear('nest',T('buy_nest'),'<b dir="ltr">'+G.nestsOpen+' / '+C.NEST_COUNT+'</b>',Sim.nestCost(),nf)+gear('perch',T('buy_perch'),'<b dir="ltr">'+G.perches.length+' / '+BLS.LAYOUT.perchSpots.length+'</b>',150,pf));
      function gearU(id,name,desc,list,costs){ var n=list.length, mx=C.EXTRA_UNIT_LV.length, btn; if(n>=mx) btn='<button class="buy owned" disabled>✔ '+T('up_owned')+'</button>'; else if(G.level<C.EXTRA_UNIT_LV[n]) btn='<button class="buy poor" disabled>🔒 '+T('lv_need',C.EXTRA_UNIT_LV[n])+'</button>'; else btn=priceBtn('gear:'+id,costs[n]); return item(art(GEAR_ART[id]),name,desc+' <b dir="ltr">'+(n+1)+' / '+(mx+1)+'</b>',btn,'',n>=mx?'done':''); }
      h+=sec(T('yard_sec'), gearU('feeder',T('buy_feeder'),T('feeder_d'),G.xf||[],C.EXTRA_FEEDER_COST)+gearU('water',T('buy_waterer'),T('waterer_d'),G.xw||[],C.EXTRA_WATER_COST));
      h+=sec(T('farm_up'), ['heat','vent','nursery','vet','flight','cam'].map(function(k){ var d=T('up_'+k+'_d'); if(d==='up_'+k+'_d') d=T('gd_'+k); return gear(k,T('up_'+k),d,C.UP_COST[k],G.up&&G.up[k]); }).join('')
        +gear('iso',T('iso_name'),T('gd_iso'),C.ISO_COST,G.isoUnit)+gear('guard',T('guard_name'),T('gd_guard'),C.GUARD_COST,G.guard));
    } else if(tab==='sell'){
      h+='<div class="note">'+T('mk_title')+': '+T('mk_G')+' '+trendTag('G')+' '+T('mk_R')+' '+trendTag('R')+' '+T('mk_W')+' '+trendTag('W')+'</div>';
      var bs=G.birds.slice().sort(function(x,y){return Sim.sellPrice(y)-Sim.sellPrice(x);});
      h+=sec(T('sell_pigeons'), bs.map(function(b){ return item(slot('bird:'+b.id),(b.sex==='M'?'♂ ':'♀ ')+esc(b.name),T('br_'+Gen.breedOf(b.g))+' · '+stageTxt(b)+(b.mate>=0?' · ❤ '+T('paired_w'):''),sellBtn('sb:'+b.id,Sim.sellPrice(b)),G.comp&&G.comp.entry===b.id?T('comp'):''); }).join('')||'<p>'+T('nothing_sell')+'</p>');
      if(G.eggs.length) h+=sec(T('sell_eggs'), G.eggs.map(function(e){ return item(art('<ellipse cx="40" cy="56" rx="18" ry="4" fill="#0005"/><ellipse cx="40" cy="33" rx="17" ry="23" fill="'+(e.dead?'#9a958a':'#fbf4e0')+'"/><ellipse cx="34" cy="24" rx="5" ry="8" fill="#fff8"/>'),T('egg')+' · '+T('nest')+' '+(e.nest+1),T('br_'+Gen.breedOf(e.g)),sellBtn('se:'+e.id,Sim.eggPrice(e))); }).join(''));
      var own=Object.keys(a).filter(function(k){return a[k]>0;});
      if(own.length) h+=sec(T('sell_birds'), own.map(function(k){ return item(slot('sp:'+k),T('sp_'+k),T('av_own')+': '+a[k],sellBtn('sa:'+k,Sim.avSellPrice(k)),'×'+a[k]); }).join(''));
    } else {
      Sim.ensureOrders(); h+='<div class="note">'+T('orders_note')+'</div>';
      h+=G.orders.map(function(o){ var cn=T({G:'grey',R:'red',W:'white'}[o.col]), pn=o.pat?' '+T(o.pat==='B'?'bar':'check'):''; var ms=G.birds.filter(function(b){return Sim.orderMatch(b,o);});
        return '<div class="order"><div class="o-top"><i class="dot '+o.col+'"></i><div><b>'+esc(o.who)+'</b><div class="sm">'+T('o_want',cn+pn)+(o.minQ?' (★'+o.minQ+'+)':'')+'</div></div><div class="o-pay"><b>'+o.pay+'</b><i></i></div></div>'
          +(ms.length?'<div class="btns">'+ms.slice(0,4).map(function(b){ var act='or:'+o.id+':'+b.id, armed=sellArm===act; return '<button class="buy sell'+(armed?' armed':'')+'" data-act="'+act+'">'+(armed?T('sure')+' ':T('o_fill')+' ')+esc(b.name)+' · '+T('br_'+Gen.breedOf(b.g))+'</button>'; }).join('')+'</div>':'<div class="sm">'+T('o_none')+'</div>')+'</div>'; }).join('')||'<p>'+T('orders_empty')+'</p>';
    }
    return h;
  }
  function shopAct(act){
    var p=act.split(':'), G=Sim.G;
    // selling needs a second tap
    if(/^(sb|se|sa|or)$/.test(p[0])&&sellArm!==act){ sellArm=act; if(p[0]==='sb'){ var wb=Sim.bird(+p[1]); var pw=pairWarn(wb); if(pw) toast('⚠ '+pw,7000); } else if(p[0]==='or'){ var wb2=Sim.bird(+p[2]); var pw2=pairWarn(wb2); if(pw2) toast('⚠ '+pw2,7000); } return showShop(shopTab); }
    sellArm=null;
    if(p[0]==='feed') Sim.buyFeed(); else if(p[0]==='mix') Sim.buyMix(); else if(p[0]==='rbird') Sim.buyBird(); else if(p[0]==='rpair') Sim.buyPair();
    else if(p[0]==='br') Sim.buyBreed(p[1],p[2]); else if(p[0]==='av') Sim.avBuy(p[1]);
    else if(p[0]==='gear'){ var g=p[1]; if(g==='nest') Sim.buyNest(); else if(g==='perch') Sim.buyPerch(); else if(g==='feeder') Sim.buyFeederUnit(); else if(g==='water') Sim.buyWaterUnit(); else if(g==='iso') Sim.buyIso(); else if(g==='guard') Sim.buyGuard(); else Sim.buyUp(g); }
    else if(p[0]==='sb'){ var b=Sim.bird(+p[1]); if(b) Sim.sell(b); } else if(p[0]==='se') Sim.sellEgg(+p[1]); else if(p[0]==='sa') Sim.avSell(p[1]); else if(p[0]==='or') Sim.fillOrder(+p[1],+p[2]);
    hud(); showShop(shopTab);
  }
  function showShop(tab){
    tab=tab||shopTab; var same=cur.kind==='shop'&&shopTab===tab, y=same?body.scrollTop:0; if(!same) sellArm=null; shopTab=tab;
    var tabs=TABS.map(function(t){ return '<button class="tab'+(t[0]===tab?' on':'')+'" data-tab="'+t[0]+'"><span data-ic="'+t[1]+'" data-sz="22"></span><small>'+T('tab_'+t[0])+'</small></button>'; }).join('');
    open('shop',T('market'),'<div class="shop-top"><div class="wallet"><i></i><b dir="ltr">'+Sim.G.coins.toLocaleString('en')+'</b></div><div class="tabs">'+tabs+'</div></div>'+shopHtml(tab));
    BLS.Icons.fill(body); body.scrollTop=y;
    body.querySelectorAll('[data-pic]').forEach(function(e){ var cn=canvasFor(e.getAttribute('data-pic')); if(cn) e.appendChild(cn); });
    body.querySelectorAll('[data-tab]').forEach(function(e){ e.onclick=function(){ showShop(e.getAttribute('data-tab')); }; });
    body.querySelectorAll('[data-act]').forEach(function(e){ e.onclick=function(){ shopAct(e.getAttribute('data-act')); }; });
  }
  function showComp(){
    var G=Sim.G; Sim.ensureComp(); var K=G.comp, left=Math.max(0,Math.ceil(K.nextShow-G.t)), me=Sim.bird(K.entry);
    var h='<div class="kv"><span>'+T('comp_week')+' #'+(K.week+1)+'</span><span>'+T('comp_next')+' '+T('comp_h',ad(left))+'</span></div>';
    h+='<p style="color:#c9b78d;font-size:12px">'+T('comp_info')+'</p>';
    if(me&&Sim.stageOf(me)==='adult') h+='<div class="row"><div style="flex:1">'+T('comp_ent')+': <b>'+esc(me.name)+'</b> · '+T('comp_score')+' '+ad(Sim.birdScore(me))+'</div><button class="btn2 red" id="c-wd" style="flex:0 0 auto">'+T('comp_withdraw')+'</button></div>';
    var ad_=G.birds.filter(function(b){return Sim.stageOf(b)==='adult';}).sort(function(a,b){return Sim.birdScore(b)-Sim.birdScore(a);});
    h+='<h4>'+T('comp_pick')+'</h4>'; if(!ad_.length) h+='<p>'+T('comp_none')+'</p>';
    ad_.slice(0,8).forEach(function(b){ h+='<div class="row"><div style="flex:1">'+esc(b.name)+' <span style="color:#c9b78d;font-size:12px">'+T('comp_score')+' '+ad(Sim.birdScore(b))+'</span></div><button class="btn2'+(b.id===K.entry?' alt':'')+'" data-e="'+b.id+'" style="flex:0 0 auto">'+T('comp_enter')+'</button></div>'; });
    var board=[{n:T('comp_you'),p:K.pts,you:1}].concat(K.rivals.map(function(r){return {n:r.n,p:r.pts};})).sort(function(a,b){return b.p-a.p;});
    h+='<h4>'+T('comp_rank')+'</h4>'; board.forEach(function(r,i){ h+='<div class="kv"><span>'+ad(i+1)+'. '+esc(r.n)+(r.you?' ★':'')+'</span><span>'+ad(r.p)+' '+T('comp_pts')+'</span></div>'; });
    if(K.last){ var L=K.last; h+='<h4>'+T('comp_last')+' #'+ad(L.week)+'</h4>'; if(L.place) h+='<div class="kv"><span>'+T('comp_place',ad(L.place))+' · '+esc(L.bird)+'</span><span>'+T('comp_prize')+' '+ad(L.prize)+'</span></div>'; else h+='<p>'+T('comp_missed')+'</p>'; L.res.forEach(function(r){ h+='<div class="kv"><span>'+(r.you?'★ '+T('comp_you'):esc(r.n))+'</span><span>'+ad(r.score)+'</span></div>'; }); }
    open('comp',T('comp'),h);
    body.querySelectorAll('[data-e]').forEach(function(e){ e.onclick=function(){ Sim.enterShow(+e.getAttribute('data-e')); showComp(); }; });
    var wd=$('c-wd'); if(wd) wd.onclick=function(){ Sim.withdrawShow(); showComp(); };
  }
  function pendHtml(){ var G=Sim.G, h=''; if(!(G.pend&&G.pend.length)) return ''; h+='<h4>'+T('ev_title')+'</h4>';
    G.pend.forEach(function(e){ var yes={stray:'e_adopt',rare:'e_buy',trader:'e_sell',injured:'e_treat'}[e.k], no={stray:'e_pass',rare:'e_pass',trader:'e_pass',injured:'e_wait'}[e.k], note=e.pay?' 🪙 '+e.pay:e.cost?' 🪙 '+e.cost:'';
      h+='<div class="row" style="flex-wrap:wrap"><div style="flex:1 1 100%">'+esc(T('evp_'+e.k,e.name||''))+note+'</div><button class="btn2" data-ev="'+e.id+':1">'+T(yes)+'</button><button class="btn2 alt" data-ev="'+e.id+':0">'+T(no)+'</button></div>'; });
    return h; }
  function showColl(){
    var L=Sim.collList(), h='<p style="color:#c9b78d;font-size:12px">'+T('coll_hint')+'</p>';
    L.forEach(function(x){ var nm=x.type==='breed'?T({G:'grey',R:'red',W:'white'}[x.k[0]])+' '+T(x.k[2]==='B'?'bar':'check'):T(x.k);
      h+='<div class="row"><div style="flex:1">'+(x.got?'✅ ':x.have?'🟡 ':'🔒 ')+(x.have?nm:'???')+'<div style="font-size:11px;color:#c9b78d">🪙 '+x.r+(x.have?'':' · '+T('coll_locked'))+'</div></div>'+(x.have&&!x.got?'<button class="btn2" style="flex:0 0 auto" data-c="'+x.k+'">'+T('claim')+'</button>':'')+'</div>'; });
    open('coll',T('coll'),h); body.querySelectorAll('[data-c]').forEach(function(e){ e.onclick=function(){ Sim.claimColl(e.getAttribute('data-c')); showColl(); }; });
  }
  function showManage(){
    var G=Sim.G, s=G.stats;
    var h='<h4>'+T('stats')+'</h4><div class="kv"><span>'+T('level')+'</span><span>'+G.level+'</span></div><div class="kv"><span>'+T('day')+'</span><span>'+Sim.dayNum()+'</span></div><div class="kv"><span>'+T('hatched')+'</span><span>'+s.hatched+'</span></div><div class="kv"><span>'+T('sold')+'</span><span>'+s.sold+'</span></div><div class="kv"><span>'+T('bought')+'</span><span>'+s.bought+'</span></div><div class="kv"><span>'+T('died')+'</span><span>'+s.died+'</span></div>'
      +'<h4>'+T('speed')+'</h4><div class="row"><button class="btn2 alt" data-sp="1">x1</button><button class="btn2 alt" data-sp="2">x2</button><button class="btn2 alt" data-sp="4">x4</button></div>'
      +'<h4>'+T('skip')+'</h4><div class="row"><button class="btn2 alt" id="k6">'+T('skip6')+'</button><button class="btn2 alt" id="k24">'+T('skip24')+'</button></div>'
      +'<h4>'+T('tasks')+'</h4><div id="tl"></div><div class="row" style="margin-top:14px"><button class="btn2 red" id="rs">'+T('reset')+'</button></div>';
    open('manage',T('manage'),pendHtml()+'<div class="row"><button class="btn2" id="m-comp">'+T('comp')+'</button><button class="btn2" id="m-coll">'+T('coll')+(Sim.collList().some(function(x){return x.have&&!x.got;})?' 🟡':'')+'</button></div><div class="kv"><span>'+T('season')+'</span><span>'+T('se_'+Sim.season())+' · '+T('w_'+(G.weather||'clear'))+'</span></div><div class="kv"><span>'+T('farm_lv')+'</span><span>'+T(Sim.skillLabel())+'</span></div><div class="kv"><span>'+T('dirt')+'</span><span>'+ad(Math.round(G.dirt||0))+' / 100</span></div><div class="row" style="flex-wrap:wrap"><button class="btn2 alt" style="flex:1 1 45%" id="m-clean">'+T('clean')+'</button>'+['heat','vent','nursery','vet','flight','cam'].map(function(k){ return (G.up&&G.up[k])?'<div class="kv" style="flex:1 1 100%"><span>✔ '+T('up_'+k)+'</span><span></span></div>':'<button class="btn2 alt" style="flex:1 1 45%" data-up="'+k+'">'+T('up_'+k)+' · '+C.UP_COST[k]+(T('up_'+k+'_d')!=='up_'+k+'_d'?'<br><small>'+T('up_'+k+'_d')+'</small>':'')+'</button>'; }).join('')+(G.isoUnit?'':'<button class="btn2 alt" style="flex:1 1 45%" id="m-iso">'+T('iso_buy')+' · '+C.ISO_COST+'</button>')+(G.guard?'':'<button class="btn2 alt" style="flex:1 1 45%" id="m-guard">'+T('guard')+' · '+C.GUARD_COST+'</button>')+'</div>'+h); $('m-comp').onclick=showComp; $('m-clean').onclick=function(){ Sim.cleanLoft(); showManage(); }; if($('m-coll')) $('m-coll').onclick=showColl; body.querySelectorAll('[data-ev]').forEach(function(e){ e.onclick=function(){ var a=e.getAttribute('data-ev').split(':'); Sim.resolveEvent(+a[0],+a[1]); showManage(); }; }); body.querySelectorAll('[data-up]').forEach(function(e){ e.onclick=function(){ Sim.buyUp(e.getAttribute('data-up')); showManage(); }; }); if($('m-iso')) $('m-iso').onclick=function(){ Sim.buyIso(); showManage(); };
    if($('m-guard')) $('m-guard').onclick=function(){ Sim.buyGuard(); showManage(); };
    body.querySelectorAll('[data-sp]').forEach(function(e){ e.onclick=function(){ G.speed=+e.getAttribute('data-sp'); hud(); }; });
    $('k6').onclick=function(){ Sim.skip(6); toast('+6h'); showManage(); }; $('k24').onclick=function(){ Sim.skip(24); toast('+24h'); showManage(); };
    $('rs').onclick=function(){ if(confirm(T('reset_q'))){ var l=G.lang; Sim.newGame(l); Sim.save(); location.reload(); } };
    tasksInto($('tl'),showManage);
  }
  function tasksInto(el,again){
    Sim.TASKS.forEach(function(t){ var done=Sim.G.tasks[t.id], ok=t.ok(); var r=document.createElement('div'); r.className='row'; r.innerHTML='<div style="flex:1">'+(done?'✅ ':ok?'🟡 ':'⬜ ')+T(t.k)+'<div style="font-size:11px;color:#c9b78d">'+T('reward')+': 🪙 '+t.r+'</div></div>'+(done?'<span class="ok">'+T('claimed')+'</span>':'<button class="btn2" style="flex:0 0 auto" '+(ok?'':'disabled')+'>'+T('claim')+'</button>');
      var b=r.querySelector('button'); if(b) b.onclick=function(){ Sim.claim(t.id); again(); }; el.appendChild(r); });
  }
  function showTasks(){
    Sim.ensureQuests(); var Q=Sim.G.quests, h='';
    if(Sim.loginReady()) h+='<div class="row"><button class="btn2" id="q-login">'+T('login_claim',ad(Q.streak%7+1),ad(Sim.LOGIN[Q.streak%7]))+'</button></div>'; else h+='<div class="kv"><span>'+T('login')+'</span><span>'+T('login_done')+'</span></div>';
    function sec(title,arr,base,kind){ h+='<h4>'+title+'</h4>'; arr.forEach(function(q,i){ var pg=Sim.qProg(q,base), ok=pg>=q.t; h+='<div class="row"><div style="flex:1">'+(q.got?'✅ ':ok?'🟡 ':'⬜ ')+T(q.k)+' ('+ad(pg)+'/'+ad(q.t)+')<div style="font-size:11px;color:#c9b78d">'+T('reward')+': 🪙 '+ad(q.r)+'</div></div>'+(q.got?'<span class="ok">'+T('claimed')+'</span>':'<button class="btn2" style="flex:0 0 auto" data-q="'+kind+i+'" '+(ok?'':'disabled')+'>'+T('claim')+'</button>')+'</div>'; }); }
    sec(T('daily'),Q.dq,Q.dbase,'d'); sec(T('weekly'),Q.wq,Q.wbase,'w'); h+='<h4>'+T('goals')+'</h4><div id="tl"></div>';
    open('tasks',T('tasks'),h); tasksInto($('tl'),showTasks);
    var lg=$('q-login'); if(lg) lg.onclick=function(){ Sim.claimLogin(); showTasks(); };
    body.querySelectorAll('[data-q]').forEach(function(e){ e.onclick=function(){ var a=e.getAttribute('data-q'); Sim.claimQuest(a[0],+a.slice(1)); showTasks(); }; });
  }
  function showBuild(){
    var G=Sim.G, nc=Sim.nestCost(), full=G.nestsOpen>=C.NEST_COUNT, pf=G.perches.length>=BLS.LAYOUT.perchSpots.length;
    var h='<div class="kv"><span>🪙 '+T('coins')+'</span><span>'+G.coins+'</span></div>'
     +'<h4>🪺 '+T('nests_open')+': '+G.nestsOpen+' / '+C.NEST_COUNT+'</h4><div class="row"><button class="btn2" id="bn" '+(full?'disabled':'')+'>'+(full?T('maxed'):T('buy_nest')+' · '+nc)+'</button></div>'
     +'<h4>🪵 '+T('perch_stands')+': '+G.perches.length+' / '+BLS.LAYOUT.perchSpots.length+'</h4><div class="row"><button class="btn2" id="bp" '+(pf?'disabled':'')+'>'+(pf?T('maxed'):T('buy_perch')+' · 150')+'</button></div>';
    open('build',T('build'),h); $('bn').onclick=function(){ Sim.buyNest(); showBuild(); }; $('bp').onclick=function(){ Sim.buyPerch(); showBuild(); };
  }
  function treeNode(id,hl){ var a=Sim.G.archive[id], alive=!!Sim.bird(id); if(!a) return '<div class="tn gone">?</div>';
    var col={G:'#8b95a4',R:'#a95740',W:'#f1f0ec'}[a.col]||'#8b95a4';
    return '<div class="tn'+(hl?' hl':'')+(alive?'':' gone')+'" data-id="'+id+'"><i style="background:'+col+'"></i>'+(a.sex==='M'?'♂ ':'♀ ')+esc(a.name)+(alive?'':'<small>'+T('gone')+'</small>')+'</div>'; }
  function showTree(id){
    var G=Sim.G, a=G.archive[id]; if(!a) return;
    var P=a.parents||[-1,-1], gp=[]; P.forEach(function(p){ var q=(p>0&&G.archive[p])?G.archive[p].parents:[-1,-1]; gp.push(q[0],q[1]); });
    function row(ids,label){ return '<div class="tl">'+label+'</div><div class="trow">'+ids.map(function(i){ return i>0?treeNode(i):'<div class="tn gone">?</div>'; }).join('')+'</div>'; }
    var kids=Sim.childrenOf(id);
    var h=row(gp,T('grandp'))+'<div class="tarrow">▼</div>'+row(P,T('parents'))+'<div class="tarrow">▼</div><div class="trow">'+treeNode(id,1)+'</div>'
      +'<div class="tarrow">▼</div><div class="tl">'+T('children')+'</div><div class="trow">'+(kids.length?kids.map(function(k){return treeNode(k);}).join(''):'<span style="color:#c9b78d">'+T('no_kids')+'</span>')+'</div>';
    open('tree','🌳 '+T('tree'),h); body.querySelectorAll('.tn[data-id]').forEach(function(e){ e.onclick=function(){ var i=+e.getAttribute('data-id'); if(Sim.bird(i)) showBird(i); else showTree(i); }; });
  }
  function showWelcome(w){
    var h='<div class="wel"><div><span>'+T('away')+'</span><b>'+ad(w.h)+' h</b></div><div><span>'+T('w_eggs')+'</span><b>'+ad(w.eggs)+'</b></div><div><span>'+T('w_hatch')+'</span><b>'+ad(w.hatched)+'</b></div><div><span>'+T('w_died')+'</span><b>'+ad(w.died)+'</b></div><div><span>'+T('w_grain')+'</span><b>'+ad(w.grain.toFixed(2))+' kg</b></div><div><span>'+T('w_water')+'</span><b>'+ad(Math.round(w.water))+'</b></div></div><p style="color:#c9b78d;font-size:12px">'+T('w_note')+'</p><div class="row"><button class="btn2" id="w-ok">'+T('ok')+'</button></div>';
    open('welcome',T('welcome'),h); var wok=$('w-ok'); var wc=function(e){ if(e&&e.preventDefault) e.preventDefault(); close(); }; wok.onclick=wc; wok.onpointerup=wc;
  }
  // ----- events
  function onPick(hit){
    if(hit&&hit.type==='ground'){ if(cur.kind) return close(); if(Sim.toss(hit.x,hit.y)) hud(); return; }
    if(!hit){ if(cur.kind==='bird'||cur.kind==='pick') close(); else if(cur.kind) close(); return; }
    if(hit.type==='bird') showBird(hit.id);
    else if(hit.type==='nest') { if(hit.n>=Sim.G.nestsOpen) showBuild(); else showNest(hit.n); }
    else if(hit.type==='feeder') Sim.refillFeeder();
    else if(hit.type==='water') Sim.refillWater();
    else if(hit.type==='sacks') showShop('feed');
    else if(hit.type==='aviary') showShop('aviary');
  }
  function welcomeBack(){ var w=Sim.G.welcome; if(!w) return; delete Sim.G.welcome; if(w.h<4&&!w.eggs&&!w.hatched&&!w.died) return; var hh=document.getElementById('hint'); if(hh){ hh.remove(); Sim.G.seenHint=1; } showWelcome(w); }
  function init(){
    sheet=$('sheet'); body=$('sheet-body'); $('sheet-x').onclick=function(){ close(); }; window.addEventListener('popstate',function(){ if(cur.kind) close(true); });
    var G0=Sim.G; if(!G0.seenHint){ var hn=document.createElement('div'); hn.id='hint'; hn.innerHTML='<b>🕊️</b> '+T('tap_hint')+'<br><small>'+T('hatch_tip')+'</small>'; hn.onclick=function(){ hn.remove(); G0.seenHint=1; }; document.body.appendChild(hn); setTimeout(function(){ if(hn.parentNode){ hn.remove(); G0.seenHint=1; } },14000); }
    Sim.on('toast',toast);
    Sim.on('fx',BLS.Scene.fx);
    Sim.on('levelup',function(lv,gift){ var lines=['+'+gift+' '+T('coins')];
      Object.keys(BLS.BREEDS).forEach(function(k){ if(BLS.BREEDS[k].lv===lv) lines.push(T('unlock')+': '+T('br_'+k)); });
      Object.keys(BLS.SPECIES).forEach(function(k){ if(BLS.SPECIES[k].lv===lv) lines.push(T('unlock')+': '+T('sp_'+k)); });
      BLS.FX.levelCard(T('level')+' '+lv,lines); });
    $('b-fly').onclick=function(){ if(Sim.flyFlock()){ if(cur.kind) close(); BLS.Scene.watchSky(); setTimeout(function(){ BLS.Scene.center(); },14500); } hud(); };
    Sim.on('event',function(m,go,id){ lastEvent={go:go,id:id}; var t=$('ticker'); $('tick-txt').innerHTML=BLS.Icons.emo(esc(m)); t.style.display='flex'; clearTimeout(t._h); t._h=setTimeout(function(){t.style.display='none';},9000); toast(m); });
    $('ticker').onclick=function(){ $('ticker').style.display='none'; if(lastEvent&&lastEvent.go==='comp') showComp(); else if(lastEvent&&lastEvent.go==='breeding') showBreeding(); else if(lastEvent&&lastEvent.id) showBird(lastEvent.id); else if(lastEvent&&lastEvent.go==='birds') showBirds(); else if(lastEvent&&lastEvent.go==='market') showShop('feed'); else if(lastEvent&&lastEvent.go==='manage') showManage(); else if(lastEvent&&lastEvent.go==='aviary') showShop('aviary'); else if(lastEvent&&lastEvent.go==='farm') close(); };
    document.querySelectorAll('#nav button').forEach(function(b){ b.onclick=function(){ var k=b.getAttribute('data-nav'); if(k==='farm') close(); else if(k==='birds') showBirds(); else if(k==='breeding') showBreeding(); else if(k==='market') showShop(); else showManage(); }; });
    $('b-zin').onclick=function(){ BLS.Scene.cam.z*=1.25; }; $('b-zout').onclick=function(){ BLS.Scene.cam.z/=1.25; };
    $('b-center').onclick=function(){ BLS.Scene.center(); };
    $('b-tasks').onclick=showTasks;
    $('b-speed').onclick=function(){ var G=Sim.G; G.speed=G.speed===1?2:G.speed===2?4:1; hud(); toast('x'+G.speed); };
    function sndIc(){ $('b-snd').setAttribute('data-ic',BLS.Audio.isOn()?'sound':'mute'); BLS.Icons.fill($('b-snd').parentNode); }
    $('b-snd').onclick=function(){ BLS.Audio.toggle(); BLS.Audio.start(); sndIc(); }; sndIc(); $('b-tools').onclick=function(){ $('tools').classList.toggle('hidden'); }; $('b-build').onclick=showBuild;
    $('b-feeder').onclick=Sim.refillFeeder; $('b-water').onclick=Sim.refillWater;
    $('b-skip').onclick=function(){ Sim.skip(6); toast('+6h'); };
    $('b-lang').onclick=function(){ var G=Sim.G; G.lang=G.lang==='ar'?'en':'ar'; applyLang(); if(cur.kind) close(); hud(); };
    BLS.Icons.fill(document); applyLang(); hud(); welcomeBack(); setInterval(hud,250);
  }
  return {welcomeBack:welcomeBack,showShop:showShop,init:init,applyLang:applyLang,onPick:onPick,toast:toast,hud:hud,showBird:showBird,showBreeding:showBreeding,close:close,showNest:showNest,showTree:showTree,showBuild:showBuild,showComp:showComp,showColl:showColl,showTasks:showTasks,showManage:showManage,showBirds:showBirds};
})();
