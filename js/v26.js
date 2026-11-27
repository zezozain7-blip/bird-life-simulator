// v0.46: season banner (#sev) and goal banner (#goal) show for 8 s when they change, then hide; tap to dismiss; small icon brings them back.
(function(){
  var st=document.createElement('style');
  st.textContent='body.bn-hide #sev,body.bn-hide #goal{display:none !important}#sev,#goal{pointer-events:auto !important}#bnb{position:fixed;right:58px;bottom:calc(132px + env(safe-area-inset-bottom));width:36px;height:36px;border-radius:50%;background:linear-gradient(#3b342a,#1f1b15);border:1.5px solid #d8b04a;font-size:17px;z-index:7;color:#f5ead2;padding:0}';
  document.head.appendChild(st);
  var b=document.createElement('button'); b.id='bnb'; b.textContent='🎯'; b.setAttribute('aria-label','goals'); document.body.appendChild(b);
  var until=Date.now()+8000, last={};
  function show(){ until=Date.now()+8000; document.body.classList.remove('bn-hide'); }
  b.onclick=show;
  ['sev','goal'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('click',function(){ until=0; document.body.classList.add('bn-hide'); }); });
  setInterval(function(){
    ['sev','goal'].forEach(function(id){ var e=document.getElementById(id); if(!e) return; var t=e.textContent.replace(/\s*·\s*[0-9\u0660-\u0669]+\s*(d|يوم)\s*$/,''); if(last[id]!==undefined&&last[id]!==t&&t){ show(); } last[id]=t; });
    if(Date.now()>until) document.body.classList.add('bn-hide');
  },400);
})();
