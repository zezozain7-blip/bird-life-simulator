// Procedural sound (WebAudio, no files): coos, wing flaps, chimes, ambience. Starts after the first tap.
BLS.Audio = (function(){
  var ac=null, master=null, muted=false, amb=null, lastFlap=0, lastCoo=0;
  try{ muted=localStorage.getItem('bls_mute')==='1'; }catch(e){}
  // ---- seasonal music (real audio files, one loop per season, crossfaded)
  var mus=[], musSeason=-1, musCur=null, MV=0.32;
  function musicTick(){
    if(!ac||!BLS.Sim.G||!BLS.Art||!BLS.Art.musicSrc) return;
    var s=BLS.Sim.season();
    if(s!==musSeason){ musSeason=s; if(!mus[s]){ var el=new Audio(BLS.Art.musicSrc(s)); el.loop=true; el.volume=0; mus[s]=el; } var p=mus[s].play(); if(p&&p.catch) p.catch(function(){}); }
    for(var i=0;i<mus.length;i++){ var m=mus[i]; if(!m) continue; var target=(i===s&&!muted&&!document.hidden)?MV:0; m.volume=Math.max(0,Math.min(1,m.volume+(target-m.volume)*0.15)); if(i!==s&&m.volume<0.01&&!m.paused) m.pause(); if(i===s&&m.paused&&!muted&&!document.hidden){ var q=m.play(); if(q&&q.catch) q.catch(function(){}); } }
  }
  setInterval(musicTick,400);
  function start(){
    if(ac){ if(ac.state==='suspended') ac.resume(); return; }
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    ac=new AC(); master=ac.createGain(); master.gain.value=muted?0:0.9; master.connect(ac.destination); ambience();
  }
  function noiseBuf(sec){ var b=ac.createBuffer(1,ac.sampleRate*sec,ac.sampleRate), d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
  function ambience(){
    var src=ac.createBufferSource(); src.buffer=noiseBuf(3); src.loop=true; var f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380; var g=ac.createGain(); g.gain.value=0.018; src.connect(f); f.connect(g); g.connect(master); src.start(); amb=g;
  }
  function env(g,t,a,d,v){ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  function tone(type,f0,f1,t,dur,vol,dest){ var o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); env(g,t,0.02,dur,vol); o.connect(g); g.connect(dest||master); o.start(t); o.stop(t+dur+0.1); }
  function coo(p){
    if(!ac||muted) return; var t=ac.currentTime+0.01; p=p||1;
    var lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; lp.connect(master);
    var notes=[[300,380,0.0,0.16],[360,260,0.2,0.3],[330,250,0.58,0.26]];
    notes.forEach(function(n){ var o=ac.createOscillator(), g=ac.createGain(), v=ac.createOscillator(), vg=ac.createGain(); o.type='triangle'; o.frequency.setValueAtTime(n[0]*p,t+n[2]); o.frequency.linearRampToValueAtTime(n[1]*p,t+n[2]+n[3]); v.frequency.value=22; vg.gain.value=14; v.connect(vg); vg.connect(o.frequency); env(g,t+n[2],0.04,n[3],0.11); o.connect(g); g.connect(lp); o.start(t+n[2]); o.stop(t+n[2]+n[3]+0.15); v.start(t+n[2]); v.stop(t+n[2]+n[3]+0.15); });
  }
  function flap(){
    if(!ac||muted) return; var now=ac.currentTime; if(now-lastFlap<0.35) return; lastFlap=now;
    for(var i=0;i<4;i++){ var s=ac.createBufferSource(); s.buffer=noiseBuf(0.12); var f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=900+Math.random()*500; f.Q.value=0.9; var g=ac.createGain(); env(g,now+i*0.09,0.01,0.07,0.07); s.connect(f); f.connect(g); g.connect(master); s.start(now+i*0.09); }
  }
  function chime(notes,vol){ if(!ac||muted) return; var t=ac.currentTime; notes.forEach(function(f,i){ tone('sine',f,null,t+i*0.11,0.35,vol||0.13); tone('triangle',f*2,null,t+i*0.11,0.2,(vol||0.13)*0.3); }); }
  function play(name){
    if(!ac||muted) return;
    if(name==='flap') return flap();
    if(name==='coo') return coo(0.9+Math.random()*0.3);
    if(name==='egg') return chime([660,880],0.12);
    if(name==='hatch') return chime([523,659,784,1046],0.14);
    if(name==='coin') return chime([988,1319],0.1);
    if(name==='level') return chime([523,659,784,1046,1318],0.14);
    if(name==='build'){ var t=ac.currentTime; for(var i=0;i<3;i++) tone('square',140,90,t+i*0.13,0.08,0.08); return; }
    if(name==='sad') return chime([392,330,262],0.12);
    if(name==='click') return tone('sine',700,500,ac.currentTime,0.05,0.07);
  }
  function setMuted(m){ muted=m; try{ localStorage.setItem('bls_mute',m?'1':'0'); }catch(e){} if(master) master.gain.value=m?0:0.9; }
  // random coos while birds are awake
  function tick(){ if(!ac||muted||document.hidden) return; var G=BLS.Sim.G; if(!G||BLS.Sim.isNight()) return;
    var n=G.birds.filter(function(b){return BLS.Sim.stageOf(b)!=='squab';}).length; if(n&&Math.random()<Math.min(0.6,0.15+n*0.06)) coo(0.85+Math.random()*0.35); }
  return {start:start,play:play,tick:tick,toggle:function(){ setMuted(!muted); return !muted; },isOn:function(){return !muted;}};
})();
