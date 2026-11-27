// v0.51: move feeders, drinkers and perches (edit mode). Positions saved in G.pos; old saves keep defaults.
(function(){
  var Sim=BLS.Sim, L=BLS.LAYOUT;
  function ar(){ var g=Sim.G; return !g||(g.lang||'ar')==='ar'; }
  function tx(a,e){ return ar()?a:e; }
  function $(i){ return document.getElementById(i); }
  var DEF={f:[L.feeder.x,L.feeder.y], w:[L.water.x,L.water.y], p:L.perchSpots.map(function(s){ return [s[0],s[1]]; })};
  var E={on:false,sel:null,drag:null};
  // ---- targets: main feeder/drinker (layout), bought extra units (stored on the unit), owned perches (layout slots)
  function targets(){
    var G=Sim.G, t=[]; if(!G) return t;
    t.push({id:'f0',x:L.feeder.x,y:L.feeder.y,set:function(x,y){ L.feeder.x=x; L.feeder.y=y; }});
    (G.xf||[]).forEach(function(u,i){ t.push({id:'f'+(i+1),x:u.x,y:u.y,set:function(x,y){ u.x=x; u.y=y; }}); });
    t.push({id:'w0',x:L.water.x,y:L.water.y,set:function(x,y){ L.water.x=x; L.water.y=y; }});
    (G.xw||[]).forEach(function(u,i){ t.push({id:'w'+(i+1),x:u.x,y:u.y,set:function(x,y){ u.x=x; u.y=y; }}); });
    (G.perches||[]).forEach(function(pi){ var s=L.perchSpots[pi]; t.push({id:'p'+pi,x:s[0],y:s[1],set:function(x,y){ s[0]=x; s[1]=y; }}); });
    return t;
  }
  // ---- bounds: inside the walkable floor with a margin, clear of nests (x<2.9), sacks, aviary; not on top of another item
  function okSpot(x,y,self){
    var m=0.35; if(!(L.walkable(x,y)&&L.walkable(x+m,y)&&L.walkable(x-m,y)&&L.walkable(x,y+m)&&L.walkable(x,y-m))) return false;
    if(x<3.4||x>11.1||y<3.8) return false;
    var ts=targets(); for(var i=0;i<ts.length;i++){ if(ts[i].id===self) continue; if(Math.hypot(ts[i].x-x,ts[i].y-y)<1.5) return false; }
    return true;
  }
  function savePos(){ var G=Sim.G; if(!G) return; var p={}; G.pos={f:[L.feeder.x,L.feeder.y],w:[L.water.x,L.water.y],p:{}}; (G.perches||[]).forEach(function(pi){ G.pos.p[pi]=[L.perchSpots[pi][0],L.perchSpots[pi][1]]; }); Sim.save(); }
  function applyPos(G){
    L.feeder.x=DEF.f[0]; L.feeder.y=DEF.f[1]; L.water.x=DEF.w[0]; L.water.y=DEF.w[1]; L.perchSpots.forEach(function(s,i){ s[0]=DEF.p[i][0]; s[1]=DEF.p[i][1]; });
    var p=G&&G.pos; if(!p) return;
    function good(a){ return a&&isFinite(a[0])&&isFinite(a[1])&&L.walkable(a[0],a[1]); }
    if(good(p.f)){ L.feeder.x=p.f[0]; L.feeder.y=p.f[1]; } if(good(p.w)){ L.water.x=p.w[0]; L.water.y=p.w[1]; }
    if(p.p) Object.keys(p.p).forEach(function(k){ var s=L.perchSpots[+k]; if(s&&good(p.p[k])){ s[0]=p.p[k][0]; s[1]=p.p[k][1]; } });
  }
  function reset(){
    var G=Sim.G; delete G.pos; applyPos(null);
    (G.xf||[]).forEach(function(u,i){ var s=L.feederSlots[i]; if(s){ u.x=s.x; u.y=s.y; } }); (G.xw||[]).forEach(function(u,i){ var s=L.waterSlots[i]; if(s){ u.x=s.x; u.y=s.y; } });
  }
  function snap(){ var o={}; targets().forEach(function(t){ o[t.id]=[t.x,t.y]; }); return o; }
  function restore(o){ targets().forEach(function(t){ if(o[t.id]) t.set(o[t.id][0],o[t.id][1]); }); }
  // ---- input (captured before the scene's own pan/tap handlers). The item follows the finger (snapped to a 0.5 grid);
  // green footprint = valid, red = invalid. An invalid drop flashes red and returns to the last valid spot.
  var S0=null, undo=[], flash=null, rsT=0;
  function SN(v){ return Math.round(v*2)/2; }
  function hit(sx,sy){ var S=BLS.Scene, best=null, bd=1e9, z=S.cam.z; targets().forEach(function(t){ var p=S.toScreen(t.x,t.y,0), d=Math.hypot(p[0]-sx,(p[1]-sy)*1.6); if(d<46*z+8&&d<bd){ bd=d; best=t; } }); return best; }
  function dock(){ var s=$('ed-save'); if(s) s.disabled=!!(E.drag&&E.drag.bad); var u=$('ed-undo'); if(u) u.disabled=!undo.length; }
  window.addEventListener('pointerdown',function(e){
    if(!E.on||!e.target||e.target.tagName!=='CANVAS') return;
    var t=hit(e.clientX,e.clientY); if(!t) return;
    var g=BLS.Scene.gridAt(e.clientX,e.clientY); E.drag={id:t.id,dx:t.x-g.x,dy:t.y-g.y,pid:e.pointerId,start:snap(),last:[t.x,t.y],bad:false}; E.sel=t.id; e.stopPropagation(); e.preventDefault(); dock();
  },true);
  window.addEventListener('pointermove',function(e){
    if(!E.drag||e.pointerId!==E.drag.pid) return; e.stopPropagation(); e.preventDefault();
    var g=BLS.Scene.gridAt(e.clientX,e.clientY), nx=SN(g.x+E.drag.dx), ny=SN(g.y+E.drag.dy), t=targets().filter(function(q){ return q.id===E.drag.id; })[0]; if(!t) return;
    nx=Math.max(0,Math.min(14,nx)); ny=Math.max(0,Math.min(14,ny)); t.set(nx,ny); var ok=okSpot(nx,ny,t.id); E.drag.bad=!ok; if(ok) E.drag.last=[nx,ny]; dock();
  },true);
  function end(e){
    if(!E.drag||e.pointerId!==E.drag.pid) return; e.stopPropagation(); var d=E.drag; E.drag=null;
    var t=targets().filter(function(q){ return q.id===d.id; })[0];
    if(t){ if(d.bad){ flash={id:d.id,x:t.x,y:t.y,until:Date.now()+450}; t.set(d.start[d.id][0],d.start[d.id][1]); if(navigator.vibrate) try{ navigator.vibrate(40); }catch(x){} } else if(Math.hypot(t.x-d.start[d.id][0],t.y-d.start[d.id][1])>0.01){ undo.push(d.start); } }
    dock();
  }
  window.addEventListener('pointerup',end,true); window.addEventListener('pointercancel',end,true);
  var po=BLS.UI.onPick; BLS.UI.onPick=function(h){ if(E.on) return; return po.apply(this,arguments); };
  // ---- overlay drawn inside the scene
  E.draw=function(c,P,pass){
    var ts=targets(), d=E.drag, dt=d&&ts.filter(function(q){ return q.id===d.id; })[0];
    if(pass==='grid'){
      for(var gx=3;gx<=11.5;gx+=0.5) for(var gy=3.5;gy<=11.5;gy+=0.5){ if(!L.walkable(gx,gy)) continue; var near=dt&&Math.hypot(gx-dt.x,gy-dt.y)<2.6, p=P(gx,gy,0), big=(gx%1===0&&gy%1===0); c.fillStyle=near?'rgba(255,233,168,0.85)':(big?'rgba(255,255,255,0.32)':'rgba(255,255,255,0.14)'); c.beginPath(); c.arc(p[0],p[1],near?2.4:(big?1.8:1.1),0,6.3); c.fill(); }
      return;
    }
    ts.forEach(function(t){ var p=P(t.x,t.y,0), sel=E.sel===t.id, isd=dt&&dt.id===t.id;
      c.save();
      if(isd){ var ok=!d.bad; c.fillStyle=ok?'rgba(80,200,110,0.32)':'rgba(230,70,60,0.38)'; c.strokeStyle=ok?'#59d27a':'#ff5a4d'; c.lineWidth=3; c.beginPath(); c.ellipse(p[0],p[1],38,17,0,0,6.3); c.fill(); c.stroke(); c.fillStyle='rgba(20,12,0,0.35)'; c.beginPath(); c.ellipse(p[0]+4,p[1]+14,30,9,0,0,6.3); c.fill(); }
      else { c.setLineDash([6,4]); c.lineWidth=sel?3.5:2; c.strokeStyle=sel?'#ffe9a8':'rgba(255,214,110,0.95)'; c.beginPath(); c.ellipse(p[0],p[1],34,15,0,0,6.3); c.stroke(); }
      c.restore(); });
    if(flash&&Date.now()<flash.until){ var q=P(flash.x,flash.y,0), k=(flash.until-Date.now())/450, sh=Math.sin(k*30)*6*k; c.save(); c.strokeStyle='rgba(255,70,60,'+k+')'; c.lineWidth=4; c.beginPath(); c.ellipse(q[0]+sh,q[1],38,17,0,0,6.3); c.stroke(); c.restore(); }
  };
  // ---- top bar and bottom dock (HUD and tabs are hidden while editing)
  var st=document.createElement('style'); st.textContent='body.ed30 #hud,body.ed30 #goal,body.ed30 #sev,body.ed30 #hubb,body.ed30 #alerts,body.ed30 #nav{display:none!important}#ed30t,#ed30d{position:fixed;left:8px;right:8px;z-index:99980;background:rgba(30,24,14,.94);color:#fff;border:2px solid #d8b04a;border-radius:12px;padding:8px 10px;font:14px system-ui,sans-serif;display:flex;gap:8px;align-items:center}#ed30t{top:calc(8px + env(safe-area-inset-top))}#ed30d{bottom:calc(12px + env(safe-area-inset-bottom));justify-content:space-between}#ed30t button,#ed30d button{font:inherit;padding:10px 14px;border-radius:10px;border:0;background:#ffe9a8;color:#1b1710;min-height:44px;min-width:44px}#ed30d button{flex:1}#ed30d button:disabled,#ed30t button:disabled{opacity:.4}#ed-cancel{background:#5a4a2c!important;color:#ffe9a8!important}#ed-reset{background:#7a3a2c!important;color:#fff!important}';
  document.head.appendChild(st);
  function close(){ E.on=false; E.sel=null; E.drag=null; flash=null; document.body.classList.remove('ed30'); ['ed30t','ed30d'].forEach(function(i){ var b=$(i); if(b) b.remove(); }); if(BLS.Scene.rebuild) BLS.Scene.rebuild(); }
  function toggle(v){
    var want=(v===undefined)?!E.on:!!v; if(want===E.on) return;
    if(!want){ savePos(); close(); return; }
    E.on=true; E.sel=null; E.drag=null; S0=snap(); undo=[]; document.body.classList.add('ed30');
    var t=document.createElement('div'); t.id='ed30t'; t.dir=ar()?'rtl':'ltr'; t.innerHTML='<b style="flex:1">✋ '+tx('تحريك الأدوات','Move items')+'</b><button id="ed-undo" disabled>↶ '+tx('تراجع','Undo')+'</button>';
    var d=document.createElement('div'); d.id='ed30d'; d.dir=ar()?'rtl':'ltr'; d.innerHTML='<button id="ed-save">✔ '+tx('حفظ','Save')+'</button><button id="ed-cancel">✖ '+tx('إلغاء','Cancel')+'</button><button id="ed-reset">↺ '+tx('الأصلي','Reset')+'</button>';
    document.body.appendChild(t); document.body.appendChild(d);
    $('ed-undo').onclick=function(){ var s=undo.pop(); if(s) restore(s); dock(); };
    $('ed-save').onclick=function(){ if(E.drag&&E.drag.bad) return; savePos(); close(); Sim.emit('toast','✔ '+tx('اتحفظت الأماكن','Positions saved')); };
    $('ed-cancel').onclick=function(){ restore(S0); close(); };
    $('ed-reset').onclick=function(){ var b=$('ed-reset'); if(Date.now()<rsT){ rsT=0; undo.push(snap()); reset(); b.textContent='↺ '+tx('الأصلي','Reset'); dock(); Sim.emit('toast','↺ '+tx('رجّعت الأماكن الأصلية (اضغط حفظ)','Defaults restored (press Save)')); } else { rsT=Date.now()+3000; b.textContent=tx('اضغط تاني للتأكيد','Tap again to confirm'); setTimeout(function(){ if(Date.now()>=rsT){ rsT=0; var r=$('ed-reset'); if(r) r.textContent='↺ '+tx('الأصلي','Reset'); } },3100); } };
    if(BLS.Scene.rebuild) BLS.Scene.rebuild();
  }
  window.BLS_EDIT=E; E.toggle=toggle; E.targets=targets; E.reset=reset; E.apply=applyPos; E.okSpot=okSpot; E.cancel=function(){ if(E.on){ restore(S0); close(); } };
  // ---- keep layout in step with whichever save is active (load, import, new game)
  var lastG=null; setInterval(function(){ var G=Sim.G; if(G&&G!==lastG){ lastG=G; applyPos(G); } },300);
})();
