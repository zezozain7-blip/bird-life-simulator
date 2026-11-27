// DOM UI: HUD, bottom sheet panels, bird card. Reads and writes only through BLS.Sim.
BLS.UI = (function(){
  var Sim=BLS.Sim, C=BLS.CFG, T=BLS.T, Spr=BLS.Sprites, Gen=BLS.Gen;
  var $=function(id){return document.getElementById(id);};
  var sheet, body, cur={kind:null}, toastT=0, lastEvent=null;
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function toast(m){ var t=$('toast'); t.innerHTML=BLS.Icons.emo(esc(m)); t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('show');},2200); }
  function applyLang(){ var G=Sim.G; document.documentElement.lang=G.lang; $('b-lang').textContent=G.lang==='ar'?'EN':'ع';
    document.querySelectorAll('[data-i]').forEach(function(e){ e.textContent=T(e.getAttribute('data-i')); }); sheet.classList.toggle('rtl',G.lang==='ar'); $('nav').classList.toggle('rtl-nav',G.lang==='ar'); }
  function ad(n){ return G_lang()==='ar'?String(n).replace(/\d/g,function(d){return '٠١٢٣٤٥٦٧٨٩'[d];}):String(n); }
  function G_lang(){ return Sim.G.lang; }
  function timeStr(hh,mm){ var ar=G_lang()==='ar'; return (ar?'اليوم ':'D')+ad(Sim.dayNum())+' · '+ad(hh%12||12)+':'+ad((mm<10?'0':'')+mm)+' '+(ar?(hh<12?'ص':'م'):(hh<12?'AM':'PM')); }
  function hud(){
    var G=Sim.G; $('h-lvl').textContent=G.level; $('h-xp').style.width=(G.xp/(100*G.level)*100)+'%';
    $('h-coins').textContent=G.coins.toLocaleString('en'); $('h-feed').textContent=G.feed.toFixed(1)+' kg'; $('h-birds').textContent=G.birds.length;
    var h=Sim.hourOfDay(), hh=Math.floor(h), mm=Math.floor((h-hh)*60); $('h-time').textContent=timeStr(hh,mm)+' · '+T('w_'+(G.weather||'clear'));
    var wi=(h>=19||h<5)?'moon':(h<7||h>=17)?'dusk':'sun'; if($('h-wic').getAttribute('data-ic')!==wi){ $('h-wic').setAttribute('data-ic',wi); BLS.Icons.fill($('h-wic').parentNode); }
    var n=Sim.claimable(); var bd=$('h-badge'); bd.style.display=n?'flex':'none'; bd.textContent=n;
    $('b-speed').textContent='x'+G.speed;
  }
  function open(kind,title,html,opts){ if(!cur.kind){ try{ history.pushState({bls:1},''); }catch(e){} } cur={kind:kind,args:opts||{}}; $('sheet-title').innerHTML=BLS.Icons.emo(esc(title)); body.innerHTML=BLS.Icons.emo(html); sheet.classList.remove('hidden'); body.scrollTop=0; setNav(kind); }
  function close(fromPop){ var was=cur.kind; sheet.classList.add('hidden'); cur={kind:null}; if(was&&fromPop!==true){ try{ if(history.state&&history.state.bls) history.back(); }catch(e){} } BLS.Scene.select(-1); setNav('farm'); }
  function setNav(k){ var m={build:'farm',tree:'birds',bird:'birds',birds:'birds',breeding:'breeding',nest:'breeding',egg:'breeding',market:'market',manage:'manage',comp:'manage',tasks:'manage',pick:'birds'}[k]||'farm'; document.querySelectorAll('#nav button').forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-nav')===m); }); }
  function bar(v,good){ v=Math.max(0,Math.min(100,v)); var col=good?(v>60?'#6fcf4a':v>30?'#e6c03a':'#e0553a'):(v<40?'#6fcf4a':v<70?'#e6c03a':'#e0553a'); return '<div class="bar"><i style="width:'+v+'%;background:'+col+'"></i></div>'; }
  function portrait(b,size){ var cn=document.createElement('canvas'); cn.width=size*2; cn.height=size*1.7; cn.style.width=size+'px'; cn.style.height=(size*0.85)+'px'; var c=cn.getContext('2d'); c.scale(2,2); c.fillStyle='#00000030'; c.beginPath(); c.ellipse(size*0.5,size*0.78,size*0.28,size*0.06,0,0,6.3); c.fill();
    Spr.draw(c,size*0.5,size*0.78,size/46,1,{col:Gen.phenoColor(b.g),pat:Gen.phenoPattern(b.g),pose:'stand',ph:0,stage:Sim.stageOf(b)==='squab'?'squab':Sim.stageOf(b)}); return cn; }
  function stageTxt(b){ return T(Sim.stageOf(b)); }
  function sexTxt(b){ return (b.sex==='M'?'♂ ':'♀ ')+T(b.sex==='M'?'male':'female'); }
  function archName(id){ var a=Sim.G.archive[id]; return a?a.name:T('unknown'); }
  // ----- bird card
  function showBird(id,keep){
    var b=Sim.bird(id); if(!b) return close();
    BLS.Scene.select(id); if(!keep){ BLS.Scene.focus(b.x,b.y,b.z); }
    var G=Sim.G, mate=b.mate>=0?Sim.bird(b.mate):null, stg=Sim.stageOf(b);
    var h='<div class="row"><div id="pt"></div><div style="flex:1"><div style="font-size:19px;font-weight:800">'+esc(b.name)+'</div><div>'+sexTxt(b)+' · '+stageTxt(b)+'</div>'
      +'<div><span class="tag">'+T(Gen.colorName(b.g))+'</span><span class="tag">'+T(Gen.patternName(b.g))+'</span>'+(b.sickFlag?'<span class="tag warn">⚠ '+T('health')+'</span>':'')+'</div></div></div>'
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
      +'<div class="row" style="margin-top:10px"><button class="btn2" id="a-feed">🌾 '+T('feed')+'</button><button class="btn2" id="a-water">💧 '+T('water')+'</button>'+(b.health<95?'<button class="btn2 alt" id="a-heal">💊 '+T('heal')+' ('+C.PRICE.heal+')</button>':'')+'</div>'
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
    $('a-sell').onclick=function(){ if(this.dataset.s){ Sim.sell(b); close(); } else { this.dataset.s=1; this.innerHTML=BLS.Icons.emo(T('sure')+' '+T('sell')+' 🪙 '+Sim.sellPrice(b)); } };
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
    G.birds.slice().sort(function(a,b){return a.id-b.id;}).forEach(function(b){ var d=document.createElement('div'); d.className='card'; d.appendChild(portrait(b,96)); var n=document.createElement('div'); n.className='nm'; n.textContent=(b.sex==='M'?'♂ ':'♀ ')+b.name; d.appendChild(n); var s=document.createElement('div'); s.className='sm'; s.textContent=stageTxt(b)+(b.mate>=0?' ❤':''); d.appendChild(s); d.onclick=function(){ showBird(b.id); }; g.appendChild(d); });
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
    G.eggs.filter(function(e){return e.nest===n;}).forEach(function(e,i){ var left=Math.max(0,C.EGG_INCUBATION_H-e.prog); var st=e.dead?(e.fertile?T('cold'):T('infertile')):(e.prog>24?(e.fertile?T('fertile'):T('infertile')):'…');
      h+='<h4>🥚 '+T('egg')+' '+(i+1)+'</h4><div class="row">'+bar(e.prog/C.EGG_INCUBATION_H*100,true)+'</div><div class="kv"><span>'+st+'</span><span>'+((e.dead||(e.prog>24&&!e.fertile))?'':T('hatch_in',Math.ceil(left)))+'</span></div><div class="kv"><span>❄</span><span>'+Math.round(e.cold)+' / '+C.EGG_COLD_LIMIT_H+' h</span></div><div class="row"><button class="btn2 alt" data-se="'+e.id+'">'+T('sell_egg')+'</button></div>'; });
    G.birds.filter(function(b){return b.nest===n&&Sim.stageOf(b)==='squab';}).forEach(function(b){ h+='<h4>🐣 '+esc(b.name)+'</h4><div class="kv"><span>'+T('age')+'</span><span>'+(b.age/24).toFixed(1)+' '+T('days')+'</span></div><div class="row"><button class="btn2 alt" data-b="'+b.id+'">'+T('my_birds')+'</button></div>'; });
    h+='<div class="row">'+(m?'<button class="btn2 alt" data-b="'+m.id+'">♂ '+esc(m.name)+'</button>':'')+(f?'<button class="btn2 alt" data-b="'+f.id+'">♀ '+esc(f.name)+'</button>':'')+'</div>';
    open('nest',T('nest')+' '+(n+1),h); body.querySelectorAll('[data-b]').forEach(function(e){ e.onclick=function(){ showBird(+e.getAttribute('data-b')); }; }); body.querySelectorAll('[data-se]').forEach(function(e){ e.onclick=function(){ Sim.sellEgg(+e.getAttribute('data-se')); showNest(n); }; });
    BLS.Scene.focus(2.4,BLS.LAYOUT.nestPos(n).y,BLS.LAYOUT.nestPos(n).z);
  }
  function showMarket(){
    var G=Sim.G, P=C.PRICE;
    var h='<div class="kv"><span>🪙 '+T('coins')+'</span><span>'+G.coins+'</span></div><div class="kv"><span>🌾 '+T('feedstock')+'</span><span>'+G.feed.toFixed(1)+' kg</span></div>'
     +'<div class="row"><button class="btn2" id="m-f">🌾 '+T('buy_feed')+' · '+Sim.feedPrice()+'</button></div><div class="row"><button class="btn2 alt" id="m-mix">🌾 '+T('buy_mix')+' · '+Sim.mixPrice()+'</button></div><div class="row"><button class="btn2" id="m-b">🕊️ '+T('buy_bird')+' · '+P.bird+'</button></div><div class="row"><button class="btn2" id="m-p">🕊️🕊️ '+T('buy_pair')+' · '+P.pair+'</button></div>'
     +'<p style="color:#c9b78d;font-size:12px">'+T('sell')+': '+T('my_birds')+' › '+T('sell')+'</p>';
    h+='<h4>'+T('mk_title')+'</h4>'; [['feed','mk_feed'],['G','mk_G'],['R','mk_R'],['W','mk_W']].forEach(function(p){ var t=Sim.trend(p[0]); h+='<div class="kv"><span>'+T(p[1])+'</span><span>'+(t==='up'?'▲ ':t==='down'?'▼ ':'● ')+T('mk_'+t)+' (x'+G.mkt[p[0]].toFixed(2)+')</span></div>'; });
    Sim.ensureOrders(); h+='<h4>'+T('orders')+'</h4>';
    G.orders.forEach(function(o){ var cn=T({G:'grey',R:'red',W:'white'}[o.col]), pn=o.pat?' '+T(o.pat==='B'?'bar':'check'):'';
      var ms=G.birds.filter(function(b){return Sim.orderMatch(b,o);});
      h+='<div class="row" style="flex-wrap:wrap"><div style="flex:1 1 100%">'+esc(o.who)+': '+T('o_want',cn+pn)+' · '+T('o_pay')+' 🪙 '+o.pay+(o.minQ?' (★'+o.minQ+'+)':'')+'</div>'
        +(ms.length?ms.slice(0,3).map(function(b){return '<button class="btn2 alt" data-o="'+o.id+'" data-ob="'+b.id+'">'+T('o_fill')+' '+esc(b.name)+'</button>';}).join(''):'<span style="color:#c9b78d;font-size:12px">'+T('o_none')+'</span>')+'</div>'; });
    open('market',T('market'),h);
    body.querySelectorAll('[data-o]').forEach(function(e){ e.onclick=function(){ Sim.fillOrder(+e.getAttribute('data-o'),+e.getAttribute('data-ob')); showMarket(); }; });
    $('m-mix').onclick=function(){ Sim.buyMix(); showMarket(); }; $('m-f').onclick=function(){ Sim.buyFeed(); showMarket(); }; $('m-b').onclick=function(){ Sim.buyBird(); showMarket(); }; $('m-p').onclick=function(){ Sim.buyPair(); showMarket(); };
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
    $('rs').onclick=function(){ if(confirm(T('reset_q'))){ var l=G.lang; Sim.newGame(l); BLS.UI.applyLang(); close(); location.reload(); } };
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
    var h='<div class="wel"><div><span>'+T('away')+'</span><b>'+ad(w.h)+' h</b></div><div><span>'+T('w_eggs')+'</span><b>'+ad(w.eggs)+'</b></div><div><span>'+T('w_hatch')+'</span><b>'+ad(w.hatched)+'</b></div><div><span>'+T('w_died')+'</span><b>'+ad(w.died)+'</b></div><div><span>'+T('w_grain')+'</span><b>'+ad(w.grain.toFixed(1))+' kg</b></div><div><span>'+T('w_water')+'</span><b>'+ad(Math.round(w.water))+'</b></div></div><p style="color:#c9b78d;font-size:12px">'+T('w_note')+'</p><div class="row"><button class="btn2" id="w-ok">'+T('ok')+'</button></div>';
    open('welcome',T('welcome'),h); $('w-ok').onclick=function(){ close(); };
  }
  // ----- events
  function onPick(hit){
    if(!hit){ if(cur.kind==='bird'||cur.kind==='pick') close(); else if(cur.kind) close(); return; }
    if(hit.type==='bird') showBird(hit.id);
    else if(hit.type==='nest') { if(hit.n>=Sim.G.nestsOpen) showBuild(); else showNest(hit.n); }
    else if(hit.type==='feeder') Sim.refillFeeder();
    else if(hit.type==='water') Sim.refillWater();
    else if(hit.type==='sacks') showMarket();
  }
  function init(){
    sheet=$('sheet'); body=$('sheet-body'); $('sheet-x').onclick=function(){ close(); }; window.addEventListener('popstate',function(){ if(cur.kind) close(true); });
    var G0=Sim.G; if(!G0.seenHint){ var hn=document.createElement('div'); hn.id='hint'; hn.innerHTML='<b>🕊️</b> '+T('tap_hint')+'<br><small>'+T('hatch_tip')+'</small>'; hn.onclick=function(){ hn.remove(); G0.seenHint=1; }; document.body.appendChild(hn); }
    Sim.on('toast',toast);
    Sim.on('event',function(m,go,id){ lastEvent={go:go,id:id}; var t=$('ticker'); $('tick-txt').innerHTML=BLS.Icons.emo(esc(m)); t.style.display='flex'; clearTimeout(t._h); t._h=setTimeout(function(){t.style.display='none';},9000); toast(m); });
    $('ticker').onclick=function(){ $('ticker').style.display='none'; if(lastEvent&&lastEvent.go==='comp') showComp(); else if(lastEvent&&lastEvent.go==='breeding') showBreeding(); else if(lastEvent&&lastEvent.id) showBird(lastEvent.id); else if(lastEvent&&lastEvent.go==='birds') showBirds(); };
    document.querySelectorAll('#nav button').forEach(function(b){ b.onclick=function(){ var k=b.getAttribute('data-nav'); if(k==='farm') close(); else if(k==='birds') showBirds(); else if(k==='breeding') showBreeding(); else if(k==='market') showMarket(); else showManage(); }; });
    $('b-zin').onclick=function(){ BLS.Scene.cam.z*=1.25; }; $('b-zout').onclick=function(){ BLS.Scene.cam.z/=1.25; };
    $('b-center').onclick=function(){ BLS.Scene.center(); };
    $('b-tasks').onclick=showTasks;
    $('b-speed').onclick=function(){ var G=Sim.G; G.speed=G.speed===1?2:G.speed===2?4:1; hud(); toast('x'+G.speed); };
    function sndIc(){ $('b-snd').setAttribute('data-ic',BLS.Audio.isOn()?'sound':'mute'); BLS.Icons.fill($('b-snd').parentNode); }
    $('b-snd').onclick=function(){ BLS.Audio.toggle(); BLS.Audio.start(); sndIc(); }; sndIc(); $('b-tools').onclick=function(){ $('tools').classList.toggle('hidden'); }; $('b-build').onclick=showBuild;
    $('b-feeder').onclick=Sim.refillFeeder; $('b-water').onclick=Sim.refillWater;
    $('b-skip').onclick=function(){ Sim.skip(6); toast('+6h'); };
    $('b-lang').onclick=function(){ var G=Sim.G; G.lang=G.lang==='ar'?'en':'ar'; applyLang(); if(cur.kind) close(); hud(); };
    BLS.Icons.fill(document); applyLang(); hud(); if(Sim.G.welcome){ var w=Sim.G.welcome; delete Sim.G.welcome; var hh=document.getElementById('hint'); if(hh){ hh.remove(); Sim.G.seenHint=1; } showWelcome(w); } setInterval(hud,250);
  }
  return {init:init,applyLang:applyLang,onPick:onPick,toast:toast,hud:hud,showBird:showBird,showBreeding:showBreeding,close:close,showNest:showNest,showTree:showTree,showBuild:showBuild};
})();
