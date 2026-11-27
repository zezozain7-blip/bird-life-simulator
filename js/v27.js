// v0.49: PWA registration, level signpost (labelled estimate), loft share card, RTL polish.
(function(){
  var Sim=BLS.Sim;
  function ar(){ var G=Sim.G; return !G||(G.lang||'ar')==='ar'; }
  // --- PWA (only over http/https; the single-file copy opened from disk skips it)
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]test=1\b/.test(location.search)){ window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); }); }
  // --- XP log for a days-to-next-level estimate
  function totalXp(G){ var t=G.xp||0; for(var l=1;l<(G.level||1);l++) t+=100*l; return t; }
  function logXp(){ var G=Sim.G; if(!G||!G.birds) return; var L=G.xpLog=G.xpLog||[]; var last=L[L.length-1]; if(!last||G.t-last[0]>=12){ L.push([Math.round(G.t),totalXp(G)]); if(L.length>40) L.shift(); } }
  setInterval(logXp,20000);
  function levelEstimate(){
    var G=Sim.G, L=G.xpLog||[]; if(L.length<2) return null;
    var a=L[0], b=L[L.length-1], dh=b[0]-a[0]; if(dh<24) return null;
    var rate=(b[1]-a[1])/(dh/24); if(rate<=0.01) return null;
    var need=100*G.level-(G.xp||0), days=need/rate;
    return {need:need,days:days,real:days*96/60};
  }
  function signpost(){
    var G=Sim.G, a=ar(), est=levelEstimate();
    var txt=a?('المستوى '+(G.level+1)+': محتاج '+(100*G.level-(G.xp||0))+' نقطة خبرة'):('Level '+(G.level+1)+': '+(100*G.level-(G.xp||0))+' XP to go');
    if(est) txt+=a?(' · تقدير (مش مضمون): حوالي '+Math.max(1,Math.round(est.days))+' يوم في اللعبة ≈ '+(est.real<48?Math.max(1,Math.round(est.real))+' ساعة':Math.round(est.real/24)+' يوم')+' فعلي'):(' · ESTIMATE from your recent pace: about '+Math.max(1,Math.round(est.days))+' game days (about '+(est.real<48?Math.max(1,Math.round(est.real))+' real h':Math.round(est.real/24)+' real days')+')');
    else txt+=a?' · لسه مفيش تقدير (محتاج يوم أو اتنين لعب)':' · no estimate yet (needs a day or two of play)';
    return '<div id="sgn" class="note" style="margin:8px 0">🧭 '+txt+'</div>';
  }
  // --- loft share card (image + JSON text)
  function loftCard(){
    var G=Sim.G, a=ar(), seen=Object.keys(G.seen||{}).length, cv=document.createElement('canvas'); cv.width=600; cv.height=800; var x=cv.getContext('2d');
    var g=x.createLinearGradient(0,0,0,800); g.addColorStop(0,'#2a2418'); g.addColorStop(1,'#14110b'); x.fillStyle=g; x.fillRect(0,0,600,800);
    x.strokeStyle='#d8b04a'; x.lineWidth=6; x.strokeRect(18,18,564,764); x.textAlign='center'; x.direction=a?'rtl':'ltr';
    x.fillStyle='#ffe9a8'; x.font='800 38px system-ui,sans-serif'; x.fillText('Bird Life Simulator',300,90);
    x.fillStyle='#f5ead2'; x.font='800 44px system-ui,sans-serif'; x.fillText(a?'عشتي':'My loft',300,170);
    var rows=[[a?'اليوم':'Day',Sim.dayNum()],[a?'المستوى':'Level',G.level],[a?'الطيور':'Birds',G.birds.length],[a?'فقس':'Hatched',G.stats.hatched||0],[a?'مبيع':'Sold',G.stats.sold||0],[a?'تركيبات لون اتكتشفت':'Colour combos found',seen],[a?'شارات المواسم':'Season badges',(G.badges||[]).length]];
    rows.forEach(function(r,i){ var y=250+i*64; x.fillStyle='#0006'; x.fillRect(60,y-34,480,50); x.textAlign='left'; x.direction='ltr'; x.fillStyle='#d8c9a0'; x.font='600 26px system-ui,sans-serif'; x.fillText(r[0],80,y); x.textAlign='right'; x.fillStyle='#ffe9a8'; x.font='800 30px system-ui,sans-serif'; x.fillText(String(r[1]),520,y); });
    x.textAlign='center'; x.direction=a?'rtl':'ltr'; x.fillStyle='#8a7a55'; x.font='600 20px system-ui,sans-serif'; x.fillText(a?'تعالى ربّي حمامك معايا':'Come raise pigeons with me',300,765);
    var json=JSON.stringify({game:'Bird Life Simulator',day:Sim.dayNum(),level:G.level,birds:G.birds.length,hatched:G.stats.hatched||0,sold:G.stats.sold||0,colourCombos:seen,badges:(G.badges||[]).length});
    cv.toBlob(function(b){
      var file=new File([b],'my-loft.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})) navigator.share({files:[file],title:'Bird Life Simulator',text:json}).catch(function(){});
      else { var u=document.createElement('a'); u.href=URL.createObjectURL(b); u.download='my-loft.png'; document.body.appendChild(u); u.click(); u.remove(); }
    },'image/png');
  }
  window.BLS_LOFT={card:loftCard,estimate:levelEstimate,log:logXp};
  // --- inject into sheets/hub as they appear
  new MutationObserver(function(){
    var tl=document.getElementById('tl'); if(tl&&!document.getElementById('sgn')&&tl.closest('#sheet')&&!tl.closest('#sheet').classList.contains('hidden')){ var h=tl.parentNode.querySelector('h4'); tl.parentNode.insertAdjacentHTML('afterbegin',signpost()); }
    var hub=document.getElementById('hub'); if(hub&&hub.style.display==='flex'&&!document.getElementById('hl')){ var he=document.getElementById('he'); if(he){ var b=document.createElement('button'); b.id='hl'; b.textContent=ar()?'🏠 كارت العشة (صورة)':'🏠 Loft card (image)'; b.onclick=function(){ BLS_LOFT.card(); }; he.parentNode.insertBefore(b,he); } }
  }).observe(document.body,{childList:true,subtree:true});
  // --- crisp Arabic overlays
  var st=document.createElement('style');
  st.textContent='#sheet.rtl,#sheet.rtl #sheet-body{direction:rtl;text-align:right}#sheet.rtl .kv,#sheet.rtl .row{direction:rtl}html[lang=ar] body{font-family:"Noto Sans Arabic","Segoe UI","Geeza Pro","Tahoma",system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}html[lang=ar] #sheet-title,html[lang=ar] .item .nm{letter-spacing:0;font-weight:800}';
  document.head.appendChild(st);
})();
