// v0.54: UI redesign layer ("Ghieh & Terracotta"). Pure presentation: no game numbers live here.
// body.ui2 = new look, no class = the old look. Saved in localStorage 'bls_ui' ('old' = old look, anything else = new).
(function(){
  var UI=BLS.UI, Sim=BLS.Sim;
  function $(i){ return document.getElementById(i); }
  function ar(){ return !(Sim.G&&Sim.G.lang==='en'); }
  function tx(a,e){ return ar()?a:e; }
  function isNew(){ try{ return localStorage.getItem('bls_ui')!=='old'; }catch(e){ return true; } }
  function apply(){ document.body.classList.toggle('ui2',isNew()); var m=document.querySelector('meta[name=theme-color]'); if(m) m.content=isNew()?'#7EC4CF':'#1b1710'; if(!isNew()) hideChip(); }
  function setTheme(n){ try{ localStorage.setItem('bls_ui',n?'new':'old'); }catch(e){} apply(); sync(); }
  // ---- bottom tab bar
  var ICON={
    farm:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    birds:'<path d="M4 16c0-5 4-9 9-9 2 0 3 1 3 3 0 4-3 8-8 8-2 0-4-1-4-2z"/><path d="M16 10l4-2-2 4"/><circle cx="14" cy="9" r=".8"/>',
    shop:'<path d="M4 8h16l-1.5 11h-13z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    tasks:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 12l2 2 4-4"/>',
    more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  var TABS=[['farm','الغِيَّة','Loft'],['birds','الطيور','Birds'],['shop','السوق','Shop'],['tasks','المهام','Tasks'],['more','المزيد','More']];
  var nav=document.createElement('nav'); nav.id='bottom-nav'; nav.setAttribute('role','tablist'); document.body.appendChild(nav);
  function buildNav(){ nav.dir=ar()?'rtl':'ltr'; nav.innerHTML=TABS.map(function(t){ return '<button role="tab" data-t="'+t[0]+'" aria-selected="false"><span class="ind"><svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[t[0]]+'</svg></span><span>'+tx(t[1],t[2])+'</span>'+(t[0]==='tasks'?'<span class="nav-badge" id="nb-tasks"></span>':'')+'</button>'; }).join(''); nav.querySelectorAll('button').forEach(function(b){ b.onclick=function(){ go(b.getAttribute('data-t')); }; }); sync(); }
  function go(t){ var o=document.querySelector('.ov28'); if(o) o.remove(); hideChip();
    if(t==='farm') UI.close(); else if(t==='birds') UI.showBirds(); else if(t==='shop') UI.showShop(); else if(t==='tasks') UI.showTasks(); else more(); sel(t); }
  function sel(t){ nav.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-selected',b.getAttribute('data-t')===t?'true':'false'); }); }
  var KIND={build:'farm',tree:'birds',bird:'birds',birds:'birds',pick:'birds',shop:'shop',tasks:'tasks',breeding:'more',nest:'more',egg:'more',manage:'more',comp:'more',coll:'more'};
  function sync(){ var sh=$('sheet'); var open=sh&&!sh.classList.contains('hidden'); var k='farm'; if(open){ var t=($('sheet-title')||{}).textContent||''; k=curKind()||'farm'; k=KIND[k]||'more'; } if(document.querySelector('.ov28')) k='more'; sel(k);
    var n=Sim.G?Sim.claimable():0, nb=$('nb-tasks'); if(nb){ nb.style.display=n?'flex':'none'; nb.textContent=n>9?'9+':n; } }
  function curKind(){ var c=$('sheet'); if(!c) return null; return c.getAttribute('data-kind'); }
  // record the open sheet kind so the tab bar can follow it
  var sh0=$('sheet'); if(sh0) new MutationObserver(sync).observe(sh0,{attributes:true,attributeFilter:['class','data-kind']});
  var os=UI.showShop; // data-kind is set from the wrappers below
  ['showBird','showBirds','showBreeding','showShop','showTasks','showManage','showColl','showComp','showNest','showBuild','showTree'].forEach(function(n){ var f=UI[n]; if(!f) return; var kind={showBird:'bird',showBirds:'birds',showBreeding:'breeding',showShop:'shop',showTasks:'tasks',showManage:'manage',showColl:'coll',showComp:'comp',showNest:'nest',showBuild:'build',showTree:'tree'}[n]; UI[n]=function(){ var s=$('sheet'); if(s) s.setAttribute('data-kind',kind); hideChip(); var r=f.apply(this,arguments); sync(); return r; }; });
  // ---- "More" grid
  function more(){
    var V=window.BLS_V29||{};
    var items=[['🧬',tx('التزاوج','Breeding'),function(){ UI.showBreeding(); }],['📋',tx('الإدارة','Manage'),function(){ UI.showManage(); }],['📖',tx('الموسوعة','Collection'),function(){ UI.showColl(); }],['🏅',tx('المسابقات','Competitions'),function(){ UI.showComp(); }],['🏆',tx('الإنجازات','Achievements'),function(){ V.ach&&V.ach(); }],['📈',tx('السوق (أسعار)','Market prices'),function(){ V.market&&V.market(); }],['🕊️',tx('كشف القطيع','Roster'),function(){ V.roster&&V.roster(); }],['✋',tx('تحريك الأدوات','Move items'),function(){ BLS_EDIT.toggle(true); }],['📚',tx('المصادر','Sources'),function(){ BLS_SRC.open(); }],['🖼️',tx('كارت العشة','Share card'),function(){ V.card&&V.card(); }],['🧰',tx('أدوات المزرعة','Farm tools'),function(){ V.menu&&V.menu(); }],['🎨',tx('الشكل القديم','Old look'),function(){ setTheme(false); }]];
    UI.close();
    var o=BLS_OV('<h3>'+tx('المزيد','More')+'</h3><div class="moregrid">'+items.map(function(a,i){ return '<button data-i="'+i+'"><span aria-hidden="true">'+a[0]+'</span>'+a[1]+'</button>'; }).join('')+'</div><button id="mg-x" style="margin-top:10px;width:100%">'+tx('إغلاق','Close')+'</button>');
    o.querySelector('#mg-x').onclick=function(){ o.remove(); sync(); };
    o.querySelectorAll('[data-i]').forEach(function(b){ b.onclick=function(){ o.remove(); items[+b.getAttribute('data-i')][2](); sync(); }; });
    new MutationObserver(function(){ if(!document.body.contains(o)){ sync(); this.disconnect(); } }).observe(document.body,{childList:true});
    sel('more');
  }
  // ---- Farm tools menu gets the look toggle (new look <-> old look)
  new MutationObserver(function(){ var b=document.querySelector('.ov28 [data-m=ed]'); if(b&&!document.getElementById('th31')){ var t=document.createElement('button'); t.id='th31'; t.textContent='🎨 '+tx('الشكل: ','Look: ')+(isNew()?tx('جديد (اضغط للقديم)','new (tap for old)'):tx('قديم (اضغط للجديد)','old (tap for new)')); t.onclick=function(){ var o=t.closest('.ov28'); if(o) o.remove(); setTheme(!isNew()); }; b.parentNode.appendChild(t); } var h=$('he'); var hub=$('hub'); if(hub&&hub.style.display==='flex'&&!$('h31')&&h){ var q=document.createElement('button'); q.id='h31'; q.textContent='🎨 '+tx('الشكل: ','Look: ')+(isNew()?tx('جديد (اضغط للقديم)','new (tap for old)'):tx('قديم (اضغط للجديد)','old (tap for new)')); q.onclick=function(){ hub.style.display='none'; setTheme(!isNew()); }; h.parentNode.insertBefore(q,h); } }).observe(document.body,{childList:true,subtree:true});
  // in the old look a small button brings the new one back (the old hub also has it)
  // ---- drag handle on the sheet (swipe down closes)
  var sheet=$('sheet');
  if(sheet&&!sheet.querySelector('.sheet-drag-zone')){ var z=document.createElement('div'); z.className='sheet-drag-zone'; z.innerHTML='<i></i>'; sheet.insertBefore(z,sheet.firstChild);
    var y0=null; z.addEventListener('pointerdown',function(e){ y0=e.clientY; z.setPointerCapture&&z.setPointerCapture(e.pointerId); });
    z.addEventListener('pointermove',function(e){ if(y0!==null){ var d=Math.max(0,e.clientY-y0); sheet.style.transition='none'; sheet.style.transform='translateY('+d+'px)'; } });
    function endDrag(e){ if(y0===null) return; var d=e.clientY-y0; y0=null; sheet.style.transition=''; sheet.style.transform=''; if(d>80) UI.close(); }
    z.addEventListener('pointerup',endDrag); z.addEventListener('pointercancel',function(){ y0=null; sheet.style.transition=''; sheet.style.transform=''; }); }
  // ---- bird info chip (tap a bird: chip first, details on the chevron)
  var chip=document.createElement('div'); chip.className='bird-float-chip'; chip.style.display='none'; chip.setAttribute('role','status'); document.body.appendChild(chip);
  var chipId=null, raf=0;
  function hideChip(){ chipId=null; chip.style.display='none'; }
  function bird(id){ return Sim.G&&Sim.G.birds.filter(function(b){ return b.id===id; })[0]; }
  function mini(v,good){ v=Math.max(0,Math.min(100,v)); var c=good?(v>60?'#2E8540':v>30?'#D97706':'#C92A2A'):(v<40?'#2E8540':v<70?'#D97706':'#C92A2A'); return '<div class="mb"><i style="width:'+v+'%;background:'+c+'"></i></div>'; }
  function place(){ if(chipId===null) return; var b=bird(chipId); if(!b||!isNew()){ hideChip(); return; }
    var p=BLS.Scene.toScreen(b.x,b.y,b.z||0), w=chip.offsetWidth||170, h=chip.offsetHeight||56, W=innerWidth, H=innerHeight;
    var x=Math.min(Math.max(8,p[0]-w/2),W-w-8), y=Math.min(Math.max(150,p[1]-110),H-h-90); chip.style.left=x+'px'; chip.style.top=y+'px';
    chip.querySelector('[data-hu]').innerHTML=mini(100-b.hunger,true); chip.querySelector('[data-th]').innerHTML=mini(100-b.thirst,true);
    raf=requestAnimationFrame(place); }
  function showChip(id){ var b=bird(id); if(!b) return; chipId=id; chip.dir=ar()?'rtl':'ltr';
    chip.innerHTML='<div style="flex:1;min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(b.sex==='M'?'♂ ':'♀ ')+String(b.name).replace(/[<>&]/g,'')+'</div><div style="font-weight:400;font-size:12px;color:var(--text-secondary)">'+tx('جوع / عطش','Hunger / thirst')+'</div><div data-hu></div><div data-th></div></div><button aria-label="'+tx('التفاصيل','Details')+'">'+(ar()?'‹':'›')+'</button>';
    chip.querySelector('button').onclick=function(e){ e.stopPropagation(); var i=chipId; hideChip(); UI.showBird(i); };
    chip.style.display='flex'; BLS.Scene.select(id); cancelAnimationFrame(raf); place(); setTimeout(function(){ if(chipId===id) hideChip(); },9000); }
  var po=UI.onPick; UI.onPick=function(h){ if(isNew()&&h&&h.type==='bird'){ if(window.BLS_EDIT&&BLS_EDIT.on) return; var s=$('sheet'); if(s&&!s.classList.contains('hidden')) UI.close(); showChip(h.id); return; } hideChip(); return po.apply(this,arguments); };
  // ---- HUD: the coins pill opens the shop (new look only); the feed pill gets an amber border under 2 kg; toasts dismiss on tap
  var hc=$('h-coins'); if(hc&&hc.parentNode) hc.parentNode.addEventListener('click',function(){ if(isNew()) UI.showShop(); });
  var toast=$('toast'); if(toast) toast.addEventListener('click',function(){ toast.classList.remove('show'); toast.style.opacity='0'; });
  var ph=UI.hud; UI.hud=function(){ var r=ph.apply(this,arguments); try{ var f=$('h-feed'); if(f&&f.parentNode) f.parentNode.style.borderColor=(Sim.G.feed<2)?'#D97706':''; sync(); }catch(e){} return r; };
  var lg=null; setInterval(function(){ if(Sim.G){ var l=Sim.G.lang; if(lg!==null&&l!==lg) buildNav(); lg=l; sync(); } },1000);
  apply(); buildNav();
  var al=UI.applyLang; UI.applyLang=function(){ var r=al.apply(this,arguments); buildNav(); return r; };
  window.BLS_V31={setTheme:setTheme,isNew:isNew,more:more,go:go};
})();
