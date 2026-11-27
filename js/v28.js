// v0.50 drop 1 (safety): ?test=1 hook, update banner, safe import with preview + snapshot, sources drawer.
(function(){
  var Sim=BLS.Sim, TEST=/[?&]test=1\b/.test(location.search);
  function ar(){ var G=Sim.G; return !G||(G.lang||'ar')==='ar'; }
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var st=document.createElement('style');
  st.textContent='.ov28{position:fixed;inset:0;z-index:99990;background:rgba(10,8,4,.78);display:flex;align-items:center;justify-content:center;padding:14px}.ov28 .bx{background:#241d12;color:#f5ead2;border:2px solid #d8b04a;border-radius:14px;max-width:420px;width:100%;max-height:86vh;overflow:auto;padding:14px;font:14px/1.5 system-ui,sans-serif}.ov28 h3{margin:0 0 8px}.ov28 button{font:inherit;padding:9px 12px;border-radius:10px;border:1px solid #d8b04a;background:#3a2f1a;color:#ffe9a8;margin:4px 4px 0 0;min-height:40px}.ov28 .est{color:#ffb86b}.ov28 .src{color:#9ed59e}.ov28 .it{border-top:1px solid #4a3d22;padding:6px 0}.ov28 .it b{color:#ffe9a8}#upd28{position:fixed;left:8px;right:8px;bottom:84px;z-index:99991;background:#2f4a2a;color:#fff;border:2px solid #9ed59e;border-radius:12px;padding:10px;display:flex;gap:8px;align-items:center;justify-content:space-between;font:14px system-ui,sans-serif}#upd28 button{font:inherit;padding:8px 12px;border-radius:9px;border:0;background:#ffe9a8;color:#1b1710}button:focus-visible{outline:3px solid #ffe9a8;outline-offset:2px}';
  document.head.appendChild(st);
  function overlay(html){ var o=document.createElement('div'); o.className='ov28'; o.dir=ar()?'rtl':'ltr'; o.innerHTML='<div class="bx" role="dialog" aria-modal="true">'+html+'</div>'; o.addEventListener('click',function(e){ if(e.target===o) o.remove(); }); document.body.appendChild(o); return o; }
  window.BLS_OV=overlay;

  // ---------- update banner (service worker)
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !TEST){
    navigator.serviceWorker.getRegistration().then(function(reg){
      function banner(w){ if($('upd28')) return; var d=document.createElement('div'); d.id='upd28'; d.dir=ar()?'rtl':'ltr'; d.innerHTML='<span>'+(ar()?'🔄 فيه تحديث جديد للعبة':'🔄 A new version is ready')+'</span><button>'+(ar()?'حدّث دلوقتي':'Update now')+'</button>'; d.querySelector('button').onclick=function(){ try{Sim.save();}catch(e){} w.postMessage('skip'); }; document.body.appendChild(d); }
      if(!reg) return;
      if(reg.waiting&&navigator.serviceWorker.controller) banner(reg.waiting);
      reg.addEventListener('updatefound',function(){ var w=reg.installing; if(w) w.addEventListener('statechange',function(){ if(w.state==='installed'&&navigator.serviceWorker.controller) banner(w); }); });
      var rl=false; navigator.serviceWorker.addEventListener('controllerchange',function(){ if(rl) return; rl=true; location.reload(); });
      setInterval(function(){ reg.update().catch(function(){}); },3600000);
    });
  }

  // ---------- safe import with preview + pre-import snapshot
  var SNAP='bls_preimport_snapshot';
  function valid(d){
    if(!d||typeof d!=='object'||!Array.isArray(d.birds)||!Array.isArray(d.eggs)) return 'shape';
    if(!isFinite(d.coins)||!isFinite(d.t)||!isFinite(d.level)||d.level<1) return 'numbers';
    if((d.saveVersion||0)>6) return 'newer';
    for(var i=0;i<d.birds.length;i++){ var b=d.birds[i]; if(!b||typeof b!=='object'||!isFinite(b.age)||b.id==null) return 'bird'; }
    return '';
  }
  function summary(d){ var day=Math.floor((8+d.t)/24)+1; return {day:day,level:d.level,coins:Math.round(d.coins),birds:d.birds.length,eggs:d.eggs.length,ver:d.saveVersion||1}; }
  function previewImport(d){
    var cur=Sim.G, a=summary(cur), b=summary(d), L=ar()?{t:'معاينة النسخة قبل الاستيراد',day:'اليوم',lv:'المستوى',c:'العملات',bd:'الطيور',eg:'البيض',v:'نسخة الملف',now:'الحالي',file:'الملف',note:'هنحفظ نسخة من تقدمك الحالي الأول، وتقدر ترجعها من «البيانات والمصادر».',ok:'استورد',no:'إلغاء'}:{t:'Import preview',day:'Day',lv:'Level',c:'Coins',bd:'Birds',eg:'Eggs',v:'File version',now:'Current',file:'File',note:'Your current progress is saved as a snapshot first. You can restore it from Data & sources.',ok:'Import',no:'Cancel'};
    var rows=[['day',a.day,b.day],['lv',a.level,b.level],['c',a.coins,b.coins],['bd',a.birds,b.birds],['eg',a.eggs,b.eggs],['v',a.ver,b.ver]].map(function(r){ return '<div class="it"><b>'+L[r[0]]+'</b>: '+L.now+' '+r[1]+' → '+L.file+' '+r[2]+'</div>'; }).join('');
    var o=overlay('<h3>'+L.t+'</h3>'+rows+'<p>'+L.note+'</p><button id="ip-ok">'+L.ok+'</button><button id="ip-no">'+L.no+'</button>');
    o.querySelector('#ip-no').onclick=function(){ o.remove(); };
    o.querySelector('#ip-ok').onclick=function(){
      try{ var snap=JSON.stringify({at:Date.now(),data:cur}); localStorage.setItem(SNAP,snap); localStorage.setItem('bls_before_import',JSON.stringify(cur)); }catch(e){ Sim.emit('toast',ar()?'⚠️ مقدرتش أحفظ النسخة، الاستيراد اتلغى':'⚠️ Could not save a snapshot, import cancelled'); return; }
      var G=Sim.G; Object.keys(G).forEach(function(k){ delete G[k]; }); Object.assign(G,d); Sim.save(); location.reload();
    };
  }
  function imp(){
    var inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
    inp.onchange=function(){ var f=inp.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ var d; try{ d=JSON.parse(r.result); }catch(e){ d=null; } var bad=valid(d); if(bad){ Sim.emit('toast',ar()?(bad==='newer'?'⚠️ الملف من نسخة أحدث من اللعبة':'⚠️ الملف مش نسخة صالحة'):(bad==='newer'?'⚠️ File is from a newer game version':'⚠️ Not a valid save file')); return; } previewImport(d); }; r.readAsText(f); };
    inp.click();
  }
  window.BLS_BK.imp=imp; window.BLS_IMPORT={valid:valid,preview:previewImport};
  function restoreSnap(){ var raw=localStorage.getItem(SNAP); if(!raw) return; var s; try{ s=JSON.parse(raw); }catch(e){ return; } if(!confirm(ar()?'ترجع النسخة اللي اتحفظت قبل آخر استيراد؟':'Restore the snapshot saved before the last import?')) return; var G=Sim.G; Object.keys(G).forEach(function(k){ delete G[k]; }); Object.assign(G,s.data); Sim.save(); location.reload(); }

  // ---------- sources / estimates catalog (kept in step with assets/REALISM.md)
  var CAT=[
   ['s','وزن كل سلالة / Breed weights','Real breed weights (BLS.BREEDS), see REALISM.md "Adult body weight". Pouter 600 g is an estimate.'],
   ['s','مدة الحضانة والفقس / Incubation','Real pigeon biology: about 17-19 days (game clock is 15x faster, rates stay natural).'],
   ['s','عمر الحمام / Lifespan','Domestic up to 15 y, feral about 3 y (RSPCA, WDFW, allaboutbirds.org). 10 y in game is an ESTIMATE inside that range.'],
   ['s','كوكسيديا الفراخ / Coccidiosis','Young-pigeon mortality 5-70% (PubMed 19530399). 8% juvenile figure is an ESTIMATE inside the range.'],
   ['s','سعر العلف / Feed price','Poultry feed 22,300-26,000 EGP per tonne, Nov 2026 (almalnews.com, 27-11-2026). 20 EGP/kg in game is an ESTIMATE in that range.'],
   ['s','أسعار الأدوات / Gear prices','From real listings, see assets/PRICES.md (v0.47).'],
   ['e','معدل الأمراض / Disease rates','0.12 cases per bird per year clean, plus dirt, stress, crowding, hunger and weather add-ons. ESTIMATES, no incidence source found.'],
   ['e','عمر ومصاريف الأدوات / Gear life and run cost','ALL ESTIMATES.'],
   ['e','هجوم الجوارح / Predator attacks','About 1.5 attempts per year. ESTIMATE; guard cuts it by 85%.'],
   ['e','جوايز المسابقات / Competition prizes','400/200/100 EGP. ESTIMATE, no real Egyptian show data.'],
   ['e','تذبذب السوق / Market swings','Clamp, pull and noise are ESTIMATES (real feed moves a few % a month).'],
   ['e','علاج وبيطري / Medicine and vet','25 EGP per bird, vet 40. ESTIMATES (UK reference price converted by a guessed rate).'],
   ['e','سعر زوج السلالات النادرة / Rare pair prices','Roller, swallow, nun, helmet, maltese, pouter, trumpeter, jacobin: ESTIMATES (PRICES.md).'],
   ['e','تقدير أيام المستوى / Days to next level','Computed from your own recent XP pace. A labelled ESTIMATE.'],
   ['g','وراثة وتربية / Genetics and lineage','GAME MECHANIC: simplified colour/trait inheritance, not a veterinary model.'],
   ['g','مراحل الفرخ / Chick stages','GAME MECHANIC: squab, juvenile, adult.']
  ];
  var TAG={s:['مصدر / Sourced','src'],e:['تقدير / ESTIMATE','est'],g:['ميكانيكا لعبة / Game mechanic','est']};
  function drawer(){
    var h='<h3>'+(ar()?'📚 البيانات والمصادر':'📚 Data & sources')+'</h3><p>'+(ar()?'كل رقم هنا إما له مصدر حقيقي أو متعلّم إنه تقدير. التفاصيل الكاملة في assets/REALISM.md.':'Each number is either sourced or marked as an estimate. Full detail: assets/REALISM.md.')+'</p>';
    CAT.forEach(function(c){ h+='<div class="it"><b>'+esc(c[1])+'</b> <span class="'+TAG[c[0]][1]+'">['+TAG[c[0]][0]+']</span><br>'+esc(c[2])+'</div>'; });
    var has=!!localStorage.getItem(SNAP);
    h+='<div style="margin-top:10px"><button id="dr-rs"'+(has?'':' disabled')+'>↩ '+(ar()?'استرجاع نسخة ما قبل الاستيراد':'Restore pre-import snapshot')+'</button><button id="dr-x">'+(ar()?'إغلاق':'Close')+'</button></div>';
    var o=overlay(h); o.querySelector('#dr-x').onclick=function(){ o.remove(); }; o.querySelector('#dr-rs').onclick=restoreSnap;
  }
  window.BLS_SRC={open:drawer,catalog:CAT};
  new MutationObserver(function(){ var hub=$('hub'); if(hub&&hub.style.display==='flex'&&!$('hsrc')){ var he=$('he'); if(he){ var b=document.createElement('button'); b.id='hsrc'; b.textContent=ar()?'📚 البيانات والمصادر':'📚 Data & sources'; b.onclick=drawer; he.parentNode.insertBefore(b,he); } } }).observe(document.body,{childList:true,subtree:true});

  // ---------- headless test hook: ?test=1
  if(TEST){
    var s=12345; Math.random=function(){ s|=0; s=s+0x6D2B79F5|0; var t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    window.BLS_TEST={
      seed:function(n){ s=n|0; },
      ff:function(hours){ var G=Sim.G, sp=G.speed; G.speed=8; var n=Math.ceil(hours*240/8/0.5); for(var i=0;i<n;i++) Sim.update(0.5); G.speed=sp; return Sim.dayNum(); },
      set:function(k,v){ Sim.G[k]=v; },
      state:function(){ var G=Sim.G; return {day:Sim.dayNum(),hour:Sim.hourOfDay(),coins:G.coins,level:G.level,birds:G.birds.length,eggs:G.eggs.length,lang:G.lang,ver:G.saveVersion}; },
      skipTutorial:function(){ var b=[].slice.call(document.querySelectorAll('button')).find(function(x){ return /تخطّ|Skip/.test(x.textContent)&&x.offsetParent; }); if(b) b.click(); },
      importObj:function(d){ var bad=valid(d); if(bad) return bad; previewImport(d); return 'preview'; }
    };
    var iv=setInterval(function(){ if(Sim.G){ clearInterval(iv); document.body.setAttribute('data-test-ready','1'); var k=0, j=setInterval(function(){ BLS_TEST.skipTutorial(); if(++k>15) clearInterval(j); },400); } },200);
  }
})();
