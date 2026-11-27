// Inline SVG icons (no emoji fonts needed, so they never render as empty boxes).
BLS.Icons = (function(){
  var P = {
    farm:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    birds:'<path d="M3 16c4 0 6-3 7-6 1-3 4-4 7-3l3 1-3 1c0 5-4 10-10 10H4z"/><circle cx="15" cy="9" r=".6"/>',
    egg:'<path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z"/>',
    market:'<path d="M3 4h3l2 11h10l2-8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    manage:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="M4 7l6-3 6 5 5-4"/>',
    coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1.2 1-2 2.5-2s2.5.8 2.5 2-1 1.6-2.5 2-2.5.8-2.5 2 1 2 2.5 2 2.5-.8 2.5-2"/>',
    grain:'<path d="M12 21V8"/><path d="M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zM12 8c3 0 4-2 4-4-3 0-4 2-4 4zM12 14c-3 0-4-2-4-4 3 0 4 2 4 4zM12 14c3 0 4-2 4-4-3 0-4 2-4 4z"/>',
    drop:'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
    ff:'<path d="M4 6l8 6-8 6zM12 6l8 6-8 6z"/>',
    sound:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    build:'<path d="M14 6l4 4M4 20l9-9M13 4l3-1 5 5-1 3-3 1-6-6z"/>',
    tasks:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12l2 2 4-4M8.5 17h7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
    center:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    tools:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    moon:'<path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/>',
    dusk:'<path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 6v3M5 10l2 2M19 10l-2 2"/>',
    tree:'<path d="M12 21v-6M12 15c-4 0-6-3-5-6-2-3 0-6 3-6 1-2 5-2 6 0 3 0 4 4 2 6 1 3-1 6-6 6z"/>',
    heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    star:'<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/>',
    lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v5M12 17.5v.5"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    dot:'<circle cx="12" cy="12" r="5"/>', box:'<rect x="5" y="5" width="14" height="14" rx="3"/>',
    snow:'<path d="M12 3v18M4 7.5l16 9M4 16.5l16-9"/>',
    chev:'<path d="M9 5l7 7-7 7"/>'
  };
  function svg(n,sz){ sz=sz||22; return '<svg viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(P[n]||'')+'</svg>'; }
  function fill(root){ (root||document).querySelectorAll('[data-ic]').forEach(function(e){ e.innerHTML=svg(e.getAttribute('data-ic'),+e.getAttribute('data-sz')||22); }); }
  var MAP={'🌾':'grain','💧':'drop','🪙':'coin','🥚':'egg','🪺':'egg','🐣':'egg','🕊':'birds','🌳':'tree','🎥':'center','💊':'plus','💔':'heart','❤':'heart','🔥':'sun','🪨':'minus','❄':'snow','⭐':'star','🔒':'lock','⚠':'warn','🔨':'build','🪵':'build','✅':'check','🟡':'dot','⬜':'box','🎯':'check','🏅':'star','🎉':'star','🆘':'warn','✨':'star','💾':'box','📂':'box','📤':'chev','♂':null,'♀':null};
  var RX=new RegExp('('+Object.keys(MAP).filter(function(k){return MAP[k];}).join('|')+')\\uFE0F?','g');
  function emo(str){ return String(str).replace(RX,function(m,k){ return '<span class="ei">'+svg(MAP[k],15)+'</span>'; }); }
  return {svg:svg,fill:fill,emo:emo};
})();
