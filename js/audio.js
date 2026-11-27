// Ambient sound, no music. Real recordings (public domain / CC0, see assets/audio/CREDITS.txt): pigeon coos, rain, thunder.
// Synthesized with WebAudio: wind, town hum, night crickets, wing flaps and the small UI chimes.
BLS.Audio = (function(){
  var flapBuf=null, paused=false, ac=null, master=null, muted=false, lastFlap=0, bufs={}, beds=null, mixT=null, nextThunder=0;
  try{ muted=localStorage.getItem('bls_mute')==='1'; }catch(e){}
  function pause(on){ paused=on; if(ac){ if(on) ac.suspend(); else ac.resume(); } }
  function loadBuf(name){
    var D=BLS.ASSET_DATA||{}, url=D['audio/'+name]||('assets/audio/'+name+'.ogg');
    try{ fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(ab){ return new Promise(function(ok,no){ ac.decodeAudioData(ab,ok,no); }); }).then(function(b){ bufs[name]=b; if(name==='amb_rain') startRain(); }).catch(function(){}); }catch(e){}
  }
  function start(){
    if(ac){ if(ac.state==='suspended'&&!paused) ac.resume(); return; }
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    ac=new AC(); master=ac.createGain(); master.gain.value=muted?0:0.9; master.connect(ac.destination);
    ['amb_coo1','amb_coo2','amb_rain','amb_thunder'].forEach(loadBuf); buildBeds(); mix(); mixT=setInterval(mix,1500);
  }
  function noiseBuf(sec){ var b=ac.createBuffer(1,ac.sampleRate*sec,ac.sampleRate), d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
  function noiseLoop(type,freq,q){ var s=ac.createBufferSource(); s.buffer=noiseBuf(4); s.loop=true; var f=ac.createBiquadFilter(); f.type=type; f.frequency.value=freq; if(q) f.Q.value=q; var g=ac.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start(); return {g:g,f:f}; }
  function buildBeds(){
    var wind=noiseLoop('bandpass',420,0.7), hum=noiseLoop('lowpass',230,0.5);
    var lfo=ac.createOscillator(), lg=ac.createGain(); lfo.frequency.value=0.11; lg.gain.value=160; lfo.connect(lg); lg.connect(wind.f.frequency); lfo.start();
    beds={wind:wind,hum:hum,rain:null};
  }
  function startRain(){ if(!ac||!beds||beds.rain||!bufs.amb_rain) return; var s=ac.createBufferSource(); s.buffer=bufs.amb_rain; s.loop=true; var g=ac.createGain(); g.gain.value=0; s.connect(g); g.connect(master); s.start(); beds.rain={g:g}; }
  function setG(n,v){ if(n&&n.g) n.g.gain.setTargetAtTime(v,ac.currentTime,1.5); }
  function mix(){
    if(!ac||!beds) return; var G=BLS.Sim&&BLS.Sim.G; if(!G) return; var night=BLS.Sim.isNight(), w=G.weather;
    setG(beds.wind, w==='wind'?0.16:(night?0.02:0.045)); setG(beds.hum, night?0.012:0.03); setG(beds.rain, w==='rain'?0.9:0);
  }
  function env(g,t,a,d,v){ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  function tone(type,f0,f1,t,dur,vol,dest){ var o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); env(g,t,0.02,dur,vol); o.connect(g); g.connect(dest||master); o.start(t); o.stop(t+dur+0.1); }
  // real coo: a random slice of a real recording, slightly re-pitched and panned
  function coo(p){
    if(!ac||muted) return; var b=bufs[Math.random()<0.75?'amb_coo1':'amb_coo2']||bufs.amb_coo1||bufs.amb_coo2; if(!b) return synthCoo(p);
    var t=ac.currentTime+0.02, len=Math.min(b.duration,1.2+Math.random()*1.6), off=Math.random()*Math.max(0,b.duration-len);
    var s=ac.createBufferSource(); s.buffer=b; s.playbackRate.value=(p||1)*(0.93+Math.random()*0.14); var g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.5+Math.random()*0.3,t+0.12); g.gain.linearRampToValueAtTime(0.0001,t+len);
    var pan=ac.createStereoPanner?ac.createStereoPanner():null; s.connect(g); if(pan){ pan.pan.value=Math.random()*1.4-0.7; g.connect(pan); pan.connect(master); } else g.connect(master); s.start(t,off,len+0.05);
  }
  function synthCoo(p){ var t=ac.currentTime+0.01; p=p||1; var lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; lp.connect(master);
    [[300,380,0.0,0.16],[360,260,0.2,0.3],[330,250,0.58,0.26]].forEach(function(n){ var o=ac.createOscillator(), g=ac.createGain(); o.type='triangle'; o.frequency.setValueAtTime(n[0]*p,t+n[2]); o.frequency.linearRampToValueAtTime(n[1]*p,t+n[2]+n[3]); env(g,t+n[2],0.04,n[3],0.11); o.connect(g); g.connect(lp); o.start(t+n[2]); o.stop(t+n[2]+n[3]+0.15); }); }
  function thunder(){ var b=bufs.amb_thunder; if(!ac||muted||!b) return; var s=ac.createBufferSource(); s.buffer=b; var g=ac.createGain(); g.gain.value=0.55; s.connect(g); g.connect(master); var off=Math.random()*(b.duration-6); s.start(ac.currentTime+0.05,off,6); g.gain.setValueAtTime(0.55,ac.currentTime+4.5); g.gain.linearRampToValueAtTime(0,ac.currentTime+6); }
  function crickets(){ var t0=ac.currentTime; for(var k=0;k<4;k++){ var t=t0+Math.random()*4, f=3900+Math.random()*500; for(var i=0;i<4;i++){ var o=ac.createOscillator(), g=ac.createGain(); o.type='sine'; o.frequency.value=f; env(g,t+i*0.07,0.008,0.04,0.012); o.connect(g); g.connect(master); o.start(t+i*0.07); o.stop(t+i*0.07+0.08); } } }
  function flap(){
    if(!ac||muted) return; var now=ac.currentTime; if(now-lastFlap<0.35) return; lastFlap=now;
    for(var i=0;i<4;i++){ var s=ac.createBufferSource(); s.buffer=flapBuf||(flapBuf=noiseBuf(0.12)); var f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=900+Math.random()*500; f.Q.value=0.9; var g=ac.createGain(); env(g,now+i*0.09,0.01,0.07,0.07); s.connect(f); f.connect(g); g.connect(master); s.start(now+i*0.09); }
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
  // every 4.5 s: coos by day (more at dawn and when the flock is big), crickets at night, thunder in rain
  function tick(){ if(!ac||muted||document.hidden||paused) return; var G=BLS.Sim.G; if(!G) return; var night=BLS.Sim.isNight(), h=BLS.Sim.hourOfDay();
    if(night){ crickets(); } else { var n=G.birds.filter(function(b){return BLS.Sim.stageOf(b)!=='squab';}).length; var dawn=(h>=5.5&&h<9)?1.6:1; if(n&&Math.random()<Math.min(0.65,(0.12+n*0.05)*dawn)) coo(0.9+Math.random()*0.2); }
    if(G.weather==='rain'&&ac.currentTime>nextThunder){ if(Math.random()<0.25){ thunder(); nextThunder=ac.currentTime+25+Math.random()*40; } } }
  return {debug:function(){ return {ac:ac&&ac.state,bufs:Object.keys(bufs),rain:!!(beds&&beds.rain),g:beds?[beds.wind.g.gain.value,beds.hum.g.gain.value]:null}; },pause:pause,start:start,play:play,tick:tick,toggle:function(){ setMuted(!muted); return !muted; },isOn:function(){return !muted;}};
})();
