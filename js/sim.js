// Simulation core: state, life cycle (aging, needs, eggs, hatching) and bird behaviour. No drawing here.
BLS.Sim = (function(){
  var C = BLS.CFG, Gen = BLS.Gen;
  var G = null, listeners = {};
  var L = BLS.LAYOUT = {
    nestPos: function(i){ var col=i%4,row=(i/4)|0; return {x:2.2,y:1.3+col*1.05+0.45,z:0.45+row*0.9+0.04}; },
    feeder:{x:6.2,y:6.0}, water:{x:4.3,y:7.2},
    roofZ:2.72,
    perchSpots:[[4.2,4.3],[9.6,4.8],[8.6,6.8],[4.2,9.5]],
    roofPerch: function(){ var pl=G&&G.perches||[]; if(pl.length&&Math.random()<0.5){ var q=pl[(Math.random()*pl.length)|0], sp=L.perchSpots[q]; return {x:sp[0]+(Math.random()-0.5)*0.5,y:sp[1],z:0.95}; } return {x:1.0+Math.random()*1.5,y:1.2+Math.random()*4.4,z:L.roofZ}; },
    walkable: function(x,y){ return (x>2.9&&x<11.5&&y>3.5&&y<7.8) || (x>2.9&&x<6.6&&y>=7.8&&y<11.5); },
    randSpot: function(){ var best=null,bd=-1; for(var i=0;i<24;i++){ var x=3+Math.random()*8.4,y=3.6+Math.random()*7.8; if(!L.walkable(x,y)) continue; var md=9; var bs=G?G.birds:[]; for(var j=0;j<bs.length;j++){ if(bs[j].z>0.05) continue; var d=Math.hypot(bs[j].x-x,bs[j].y-y); if(d<md) md=d; } if(md>bd){ bd=md; best={x:x,y:y,z:0}; } if(bd>1.6) break; } return best||{x:5,y:5,z:0}; }
  };
  function emit(ev,a,b){ (listeners[ev]||[]).forEach(function(f){ f(a,b); }); }
  function on(ev,f){ (listeners[ev]=listeners[ev]||[]).push(f); }
  function T(k){ var s=(BLS.TXT[G&&G.lang||'ar'][k]||k); for(var i=1;i<arguments.length;i++) s=s.replace('{'+(i-1)+'}',arguments[i]); return s; }
  BLS.T = T;

  function stageOf(b){ return b.age<C.SQUAB_H?'squab':(b.age<C.JUVENILE_H?'juvenile':'adult'); }
  function hourOfDay(){ return (8+G.t)%24; }
  function dayNum(){ return Math.floor((8+G.t)/24)+1; }
  function bird(id){ for(var i=0;i<G.birds.length;i++) if(G.birds[i].id===id) return G.birds[i]; return null; }
  function pickName(){
    var list=BLS.NAMES[G.lang||'ar'], used={}; G.birds.forEach(function(b){used[b.name]=1;});
    var free=list.filter(function(n){return !used[n];});
    if(free.length) return Gen.rnd(free);
    return Gen.rnd(list)+' '+(G.nextId);
  }
  function newBird(o){
    var b={ id:G.nextId++, name:o.name||pickName(), sex:o.sex, g:o.g, age:o.age||0, hunger:o.hunger||10, thirst:o.thirst||10,
      health:100, mate:-1, nest:-1, parents:o.parents||[-1,-1], cool:6, clutch:0, layT:0, sickFlag:false,
      x:o.x||5, y:o.y||5, z:o.z||0, face:1, st:'idle', timer:1+Math.random()*2, ph:Math.random()*10, tx:0,ty:0, slot:0 };
    G.birds.push(b); G.archive[b.id]={name:b.name,sex:b.sex,parents:b.parents,col:Gen.phenoColor(b.g),pat:Gen.phenoPattern(b.g)}; return b;
  }
  function newGame(lang){
    G = { v:1, t:0, coins:C.START_COINS, feed:C.START_FEED, xp:0, level:1, birds:[], eggs:[], nests:[], nextId:1,
      feeder:{grain:1.5}, water:{amt:80}, tasks:{}, stats:{hatched:0,sold:0,bought:0,died:0,hand:0,boughtFeed:0},
      lang:lang||'ar', speed:1, archive:{}, log:[], savedAt:Date.now(), nestsOpen:4, perches:[] };
    for(var i=0;i<C.NEST_COUNT;i++) G.nests.push(null);
    var gm={c:['G','R'],p:['B','C'],size:66,vit:70,fert:72}, gf={c:['G','G'],p:['B','B'],size:60,vit:68,fert:74};
    var np=L.nestPos(0), rp=L.roofPerch();
    var m=newBird({sex:'M',g:gm,age:400,x:rp.x,y:rp.y,z:L.roofZ}), f=newBird({sex:'F',g:gf,age:400,x:np.x,y:np.y,z:np.z});
    m.st='perch'; m.timer=4; f.st='sit'; f.timer=3; f.face=-1; m.face=1;
    pairUp(m,f,true); f.cool=10;
    return G;
  }
  // ---------- relations
  function ancestors(id,depth,out){ out=out||{}; var a=G.archive[id]; if(!a||depth<=0) return out; a.parents.forEach(function(p){ if(p>0){ out[p]=1; ancestors(p,depth-1,out);} }); return out; }
  function related(a,b){
    if(a.id===b.id) return true;
    var A=ancestors(a.id,3), B=ancestors(b.id,3);
    if(A[b.id]||B[a.id]) return true;
    for(var k in A) if(B[k]) return true;
    return false;
  }
  function canPair(a,b){ return a&&b&&a.sex!==b.sex&&stageOf(a)==='adult'&&stageOf(b)==='adult'&&a.mate<0&&b.mate<0&&!related(a,b); }
  function freeNest(){ for(var i=0;i<Math.min(G.nests.length,G.nestsOpen);i++) if(!G.nests[i]) return i; return -1; }
  function pairUp(a,b,silent){
    var n=freeNest(); if(n<0) return false;
    var m=a.sex==='M'?a:b, f=a.sex==='M'?b:a;
    m.mate=f.id; f.mate=m.id; m.nest=f.nest=n; G.nests[n]={m:m.id,f:f.id};
    if(!silent) emit('toast',T('paired',m.name,f.name)); return true;
  }
  function nestContents(n){
    var e=G.eggs.filter(function(x){return x.nest===n;}).length;
    var s=G.birds.filter(function(x){return x.nest===n&&stageOf(x)==='squab';}).length;
    return e+s;
  }
  function unpair(b){
    var mt=bird(b.mate); b.mate=-1; if(mt) mt.mate=-1;
    releaseNests();
  }
  function releaseNests(){
    for(var n=0;n<G.nests.length;n++){
      var o=G.nests[n]; if(!o) continue;
      var m=bird(o.m), f=bird(o.f);
      var paired = m&&f&&m.mate===f.id;
      if(!paired && nestContents(n)===0){
        G.nests[n]=null; G.birds.forEach(function(x){ if(x.nest===n&&stageOf(x)!=='squab') x.nest=-1; });
        if(m){m.clutch=0;} if(f){f.clutch=0;}
      }
    }
  }
  function covered(n){ return G.birds.some(function(b){ return b.nest===n&&b.st==='sit'&&stageOf(b)!=='squab'; }); }
  // ---------- life cycle
  function addXp(v){ G.xp+=v; while(G.xp>=100*G.level){ G.xp-=100*G.level; G.level++; emit('toast','⭐ '+T('level')+' '+G.level); emit('sfx','level'); } }
  function layEgg(f,m,n){
    var fert=Math.random() < 0.35+((m.g.fert+f.g.fert)/2)/100*0.62;
    G.eggs.push({id:G.nextId++, nest:n, m:m.id, f:f.id, g:Gen.cross(m.g,f.g), prog:0, cold:0, fertile:fert, dead:false, deadT:0});
    emit('event',T('ev_egg',n+1),'breeding'); emit('sfx','egg'); G.stats.eggs=(G.stats.eggs||0)+1;
    [f,m].forEach(function(x){ if(x.st!=='fly'&&x.st!=='sit'){ x.timer=0; if(x.st==='walk'||x.st==='eat'||x.st==='drink'){} } });
  }
  function hatch(e){
    var m=bird(e.m), f=bird(e.f);
    var b=newBird({sex:Math.random()<0.5?'M':'F',g:e.g,age:0,parents:[e.m,e.f],hunger:20,thirst:20});
    b.nest=e.nest; var pos=L.nestPos(e.nest); b.x=pos.x; b.y=pos.y; b.z=pos.z; b.st='squabnest';
    var slot=G.birds.filter(function(x){return x.nest===e.nest&&stageOf(x)==='squab'&&x.id!==b.id;}).length; b.slot=slot%2;
    G.stats.hatched++; emit('sfx','hatch'); addXp(30); emit('event',T('ev_hatch',e.nest+1),'breeding');
  }
  function stepLife(dt,auto,protect){
    G.t+=dt;
    var i, b, hungerAdd=C.HUNGER_RATE*dt, thirstAdd=C.THIRST_RATE*dt;
    for(i=G.birds.length-1;i>=0;i--){
      b=G.birds[i]; var st0=stageOf(b);
      b.age+=dt; var stg=stageOf(b);
      b.hunger+=hungerAdd*(stg==='squab'?0.8:1); b.thirst+=thirstAdd*(stg==='squab'?0.8:1);
      if(stg==='squab'){
        var par=[bird(b.parents[0]),bird(b.parents[1])].filter(function(p){return p&&p.hunger<78&&p.thirst<85;});
        if(par.length){ b.hunger=Math.max(0,b.hunger-6*dt); b.thirst=Math.max(0,b.thirst-6*dt); }
      }
      if(auto){
        if(b.hunger>35&&G.feeder.grain>0){ var need=b.hunger-10,kg=Math.min(G.feeder.grain,need*C.GRAIN_PER_UNIT); G.feeder.grain-=kg; b.hunger-=kg/C.GRAIN_PER_UNIT; }
        if(b.thirst>35&&G.water.amt>0){ var nw=b.thirst-10,w=Math.min(G.water.amt,nw*C.WATER_PER_UNIT); G.water.amt-=w; b.thirst-=w/C.WATER_PER_UNIT; }
      }
      if(protect){ b.hunger=Math.min(b.hunger,80); b.thirst=Math.min(b.thirst,80); }
      b.hunger=Math.min(100,b.hunger); b.thirst=Math.min(100,b.thirst);
      if(b.hunger>90||b.thirst>90) b.health-=3*dt; else if(b.hunger<60&&b.thirst<60) b.health=Math.min(100,b.health+0.6*dt);
      if(protect&&b.health<30) b.health=30;
      if(b.health<45&&!b.sickFlag){ b.sickFlag=true; emit('event',T('ev_sick',b.name),'birds',b.id); }
      if(b.health>=60) b.sickFlag=false;
      if(b.health<=0){ die(b); continue; }
      if(st0==='squab'&&stg==='juvenile'){ // leaves nest
        var n=b.nest; b.nest=-1; b.st='idle'; b.timer=1; var gp=L.randSpot();
        b.fl={x0:b.x,y0:b.y,z0:b.z,x1:3.3+Math.random()*0.6,y1:L.nestPos(n).y,z1:0,t:0,dur:1.4,arc:0.8}; b.st='fly'; b.after='idle';
        emit('event',T('ev_grow',b.name),'birds',b.id);
        var pf=bird(b.parents[1]); if(pf&&pf.nest===n&&nestContents(n)===0){ pf.cool=Math.min(pf.cool,24); }
      }
      if(st0==='juvenile'&&stg==='adult') emit('event',T('ev_adult',b.name),'birds',b.id);
    }
    // eggs
    for(i=G.eggs.length-1;i>=0;i--){
      var e=G.eggs[i];
      if(e.dead){ if(G.t-e.deadT>12){ G.eggs.splice(i,1); emit('event',T('ev_bad',e.nest+1),'breeding'); } continue; }
      var cov = auto || covered(e.nest);
      if(cov) { e.prog+=dt; e.cold=Math.max(0,e.cold-dt*0.5); } else { e.cold+=dt; if(e.cold>C.EGG_COLD_LIMIT_H){ e.dead=true; e.deadT=G.t; emit('event',T('ev_cold',e.nest+1),'breeding'); continue; } }
      if(e.prog>=C.EGG_INCUBATION_H){
        if(e.fertile){ hatch(e); G.eggs.splice(i,1); } else { e.dead=true; e.deadT=G.t; }
      }
    }
    // laying
    G.birds.forEach(function(f){
      if(f.sex!=='F'||f.mate<0||f.nest<0) return;
      var m=bird(f.mate); if(!m) return; var n=f.nest;
      if(stageOf(f)!=='adult') return;
      f.cool-=dt;
      var cont=nestContents(n);
      if(f.clutch>0&&cont===0&&(f.clutch===2||G.t>f.layT)){ f.clutch=0; f.cool=Math.max(f.cool,30); }
      if(f.clutch===0&&f.cool<=0&&cont===0&&f.hunger<65&&f.thirst<65&&f.health>60){ layEgg(f,m,n); f.clutch=1; f.layT=G.t+24; }
      else if(f.clutch===1&&G.t>=f.layT&&cont<2&&f.hunger<80){ layEgg(f,m,n); f.clutch=2; }
    });
    releaseNests();
    if(G.feeder.grain<=0.001&&!stepLife._fw){ stepLife._fw=1; emit('event',T('ev_hungry'),'farm'); } if(G.feeder.grain>0.2) stepLife._fw=0;
    if(G.water.amt<=0.5&&!stepLife._ww){ stepLife._ww=1; emit('event',T('ev_dry'),'farm'); } if(G.water.amt>10) stepLife._ww=0;
  }
  function die(b){
    var i=G.birds.indexOf(b); if(i>=0) G.birds.splice(i,1);
    if(b.mate>=0){ var m=bird(b.mate); if(m) m.mate=-1; }
    G.stats.died++; emit('sfx','sad'); emit('event',T('ev_die',b.name),'birds'); releaseNests();
  }
  // ---------- behaviour (real time)
  function isNight(){ var h=hourOfDay(); return h>=21||h<5; }
  function needy(b){ return b.hunger>=55||b.thirst>=55; }
  function goto_(b,x,y,then){ b.tx=x; b.ty=y; b.st='walk'; b.after=then||'idle'; }
  function flyTo(b,x,y,z,then,dur){
    var d=Math.sqrt((x-b.x)*(x-b.x)+(y-b.y)*(y-b.y)+(z-b.z)*(z-b.z)); 
    b.fl={x0:b.x,y0:b.y,z0:b.z,x1:x,y1:y,z1:z,t:0,dur:dur||Math.max(0.9,d/2.4),arc:Math.min(1.2,0.35+d*0.08)};
    b.st='fly'; b.after=then||'idle'; setFace(b,x-b.x,y-b.y); emit('sfx','flap');
  }
  function setFace(b,dx,dy){ var sx=dx-dy; if(Math.abs(sx)>0.01) b.face=sx>=0?1:-1; }
  function aroundFeeder(){ var a=Math.random()*6.28; return {x:L.feeder.x+Math.cos(a)*0.55,y:L.feeder.y+Math.sin(a)*0.55}; }
  function aroundWater(){ var a=Math.random()*6.28; return {x:L.water.x+Math.cos(a)*0.45,y:L.water.y+Math.sin(a)*0.45}; }
  function think(b){
    var stg=stageOf(b); if(stg==='squab') return;
    var onGround=b.z<0.05;
    var mate=b.mate>=0?bird(b.mate):null;
    var hasEggs=b.nest>=0&&G.eggs.some(function(e){return e.nest===b.nest&&!e.dead;});
    // 1) needs first
    var fed=b.hunger<=42, wat=b.thirst<=42;
    if(!fed&&G.feeder.grain>0.01){
      if(!onGround){ var s=L.randSpot(); return flyTo(b,s.x,s.y,0,'idle'); }
      var p=aroundFeeder(); return goto_(b,p.x,p.y,'eat');
    }
    if(!wat&&G.water.amt>1){
      if(!onGround){ var s2=L.randSpot(); return flyTo(b,s2.x,s2.y,0,'idle'); }
      var q=aroundWater(); return goto_(b,q.x,q.y,'drink');
    }
    // 2) egg duty
    if(hasEggs&&!needy(b)){
      var want = b.sex==='F' || (mate&&mate.st!=='sit'&&needy(mate)) || !mate;
      if(b.sex==='M'&&mate&&mate.st==='sit') want=false;
      if(want){
        if(b.st==='sit'){ b.timer=1.5; return; }
        var np=L.nestPos(b.nest); return flyTo(b,np.x,np.y,np.z,'sit');
      }
    }
    if(b.st==='sit'&&(!hasEggs)&&isNight()&&b.nest>=0){ b.timer=3; return; }
    // 3) night rest
    if(isNight()){
      if(b.nest>=0&&mate&&!hasEggs){ if(b.st==='sit') {b.timer=3;return;} var n2=L.nestPos(b.nest); return flyTo(b,n2.x,n2.y,n2.z,'sit'); }
      if(b.st==='perch'||b.st==='sit'){ b.timer=3; return; }
      var rp=L.roofPerch(); return flyTo(b,rp.x,rp.y,rp.z,'perch');
    }
    // 4) day life
    if(b.st==='sit'||b.st==='perch'){ // come down
      var s3=L.randSpot(); if(b.st==='perch'&&Math.random()<0.5){ b.timer=3+Math.random()*5; return; }
      return flyTo(b,s3.x,s3.y,0,'idle');
    }
    if(!onGround){ var s4=L.randSpot(); return flyTo(b,s4.x,s4.y,0,'idle'); }
    var r=Math.random();
    if(mate&&mate.st!=='fly'&&r<0.22&&mate.z<0.05){ return goto_(b,mate.x+(Math.random()*0.8-0.4),mate.y+(Math.random()*0.8-0.4),'coo'); }
    if(r<0.5){ var s5=L.randSpot(); return goto_(b,s5.x,s5.y,'idle'); }
    if(r<0.68){ b.st='peck'; b.timer=1.5+Math.random()*2; return; }
    if(r<0.78){ b.st='preen'; b.timer=2+Math.random()*2; return; }
    if(r<0.9){ var rp2=L.roofPerch(); return flyTo(b,rp2.x,rp2.y,rp2.z,'perch'); }
    if(r<0.96){ var s6=L.randSpot(); return flyTo(b,s6.x,s6.y,0,'idle'); }
    b.st='idle'; b.timer=1+Math.random()*2.5;
  }
  function updateBird(b,dt){
    b.ph+=dt;
    var stg=stageOf(b);
    if(stg==='squab'&&b.nest>=0){ b.st='squabnest'; var p=L.nestPos(b.nest); b.x=p.x; b.y=p.y+(b.slot?0.22:-0.22); b.z=p.z; return; }
    if(b.st==='squabnest'){ b.st='idle'; }
    var spd=(stg==='juvenile'?0.7:0.85);
    if(b.st==='fly'){
      var f=b.fl; f.t+=dt; var u=Math.min(1,f.t/f.dur), e=u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
      b.x=f.x0+(f.x1-f.x0)*e; b.y=f.y0+(f.y1-f.y0)*e; b.z=f.z0+(f.z1-f.z0)*e+f.arc*Math.sin(Math.PI*u);
      if(u>=1){ b.x=f.x1;b.y=f.y1;b.z=f.z1; b.st=b.after||'idle'; b.timer=(b.st==='sit'||b.st==='perch')?2+Math.random()*3:1; if(b.st==='eat'||b.st==='drink'){ b.timer=6; } }
      return;
    }
    if(b.st==='walk'){
      var dx=b.tx-b.x, dy=b.ty-b.y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<0.06){ b.st=b.after||'idle'; b.timer=(b.st==='eat'||b.st==='drink')?6:(b.st==='coo'?1.8:1+Math.random()*2); if(b.st==='eat'||b.st==='drink'){} return; }
      var step=Math.min(d,spd*dt); b.x+=dx/d*step; b.y+=dy/d*step; setFace(b,dx,dy); return;
    }
    b.timer-=dt;
    if(b.st==='eat'){
      if(G.feeder.grain<=0.002||b.hunger<8||b.timer<=0){ b.st='idle'; b.timer=0.4; }
      else { var amt=Math.min(b.hunger,C.EAT_SPEED*dt); b.hunger-=amt; G.feeder.grain=Math.max(0,G.feeder.grain-amt*C.GRAIN_PER_UNIT); face2(b,L.feeder); }
      return;
    }
    if(b.st==='drink'){
      if(G.water.amt<=0.2||b.thirst<8||b.timer<=0){ b.st='idle'; b.timer=0.4; }
      else { var a2=Math.min(b.thirst,C.DRINK_SPEED*dt); b.thirst-=a2; G.water.amt=Math.max(0,G.water.amt-a2*C.WATER_PER_UNIT); face2(b,L.water); }
      return;
    }
    if(b.timer<=0){ think(b); }
  }
  function face2(b,t){ setFace(b,t.x-b.x,t.y-b.y); }
  function update(realDt){
    if(realDt>0.5) realDt=0.5;
    var hours=realDt*G.speed/C.REAL_SEC_PER_HOUR;
    var left=hours; while(left>0){ var s=Math.min(left,0.25); stepLife(s,false,false); left-=s; }
    for(var i=0;i<G.birds.length;i++) updateBird(G.birds[i],realDt*(G.speed>1?Math.min(G.speed,2):1));
  }
  function skip(hours){ var h=0; while(h<hours){ stepLife(1,true,true); h+=1; }
    // rest birds
    G.birds.forEach(function(b){ if(stageOf(b)!=='squab'){ b.st='idle'; b.timer=0.5; if(b.z>0.05&&b.nest<0){ var s=L.randSpot(); b.x=s.x;b.y=s.y;b.z=0; } } }); }
  // ---------- player actions
  function sellPrice(b){
    var q=(b.g.size+b.g.vit+b.g.fert)/3, col=Gen.phenoColor(b.g);
    var p=40+q*1.1+(col==='W'?25:col==='R'?10:0); var s=stageOf(b); p*= s==='squab'?0.4:(s==='juvenile'?0.7:1);
    return Math.round(p);
  }
  function sell(b){ var p=sellPrice(b); G.coins+=p; G.stats.sold++; addXp(10); unpair(b); var i=G.birds.indexOf(b); if(i>=0) G.birds.splice(i,1); releaseNests(); emit('toast',T('sold_ok',b.name,p)); emit('sfx','coin'); }
  function buyFeed(){ if(G.coins<C.PRICE.feed5) return emit('toast',T('need_coins')); G.coins-=C.PRICE.feed5; G.feed+=5; G.stats.boughtFeed++; emit('toast','🌾 +5 kg'); }
  function placeNew(sex,g,age){ var s=L.randSpot(); return newBird({sex:sex,g:g,age:age,x:s.x,y:s.y,hunger:25,thirst:25}); }
  function buyBird(){
    if(G.birds.length>=C.MAX_BIRDS) return emit('toast',T('full')); if(G.coins<C.PRICE.bird) return emit('toast',T('need_coins'));
    G.coins-=C.PRICE.bird; G.stats.bought++; var b=placeNew(Math.random()<0.5?'M':'F',Gen.randomGenes(),200+Math.random()*80); emit('toast','🕊️ '+T('bought_ok')+': '+b.name);
  }
  function buyPair(){
    if(G.birds.length+2>C.MAX_BIRDS) return emit('toast',T('full')); if(G.coins<C.PRICE.pair) return emit('toast',T('need_coins'));
    G.coins-=C.PRICE.pair; G.stats.bought+=2; var a=placeNew('M',Gen.randomGenes(),C.JUVENILE_H+10+Math.random()*30), b=placeNew('F',Gen.randomGenes(),C.JUVENILE_H+10+Math.random()*30);
    emit('toast','🕊️🕊️ '+T('bought_ok')+': '+a.name+' + '+b.name);
  }
  function refillFeeder(){
    var room=C.FEEDER_CAP-G.feeder.grain; if(room<0.05) return emit('toast',T('feeder_filled'));
    if(G.feed<=0) return emit('toast',T('need_feed'));
    var kg=Math.min(room,G.feed); G.feed-=kg; G.feeder.grain+=kg; emit('toast','🌾 '+T('feeder_filled')+' (+'+kg.toFixed(1)+' kg)');
  }
  function refillWater(){ G.water.amt=C.WATER_CAP; emit('toast','💧 '+T('water_filled')); }
  function feedBird(b){ if(G.feed<0.05) return emit('toast',T('need_feed')); G.feed-=0.05; b.hunger=Math.max(0,b.hunger-45); G.stats.hand++; emit('toast',T('fed',b.name)); }
  function waterBird(b){ b.thirst=0; emit('toast',T('watered',b.name)); }
  function healBird(b){ if(G.coins<C.PRICE.heal) return emit('toast',T('need_coins')); G.coins-=C.PRICE.heal; b.health=Math.min(100,b.health+50); emit('toast',T('healed',b.name)); }
  function weightOf(b){ var s=stageOf(b); var base=300+b.g.size*2.6; var f=s==='squab'?Math.min(1,0.08+b.age/C.SQUAB_H*0.5):(s==='juvenile'?0.6+0.4*(b.age-C.SQUAB_H)/(C.JUVENILE_H-C.SQUAB_H):1); return Math.round(base*f); }
  function buyNest(){ if(G.nestsOpen>=C.NEST_COUNT) return; var cost=250+(G.nestsOpen-4)*100; if(G.coins<cost) return emit('toast',T('need_coins')); G.coins-=cost; G.nestsOpen++; emit('sfx','build'); emit('toast','🪺 '+T('built')); }
  function nestCost(){ return 250+(G.nestsOpen-4)*100; }
  function buyPerch(){ if(G.perches.length>=L.perchSpots.length) return; if(G.coins<150) return emit('toast',T('need_coins')); G.coins-=150; for(var i=0;i<L.perchSpots.length;i++) if(G.perches.indexOf(i)<0){ G.perches.push(i); break; } emit('sfx','build'); emit('toast','🪵 '+T('built')); }
  function childrenOf(id){ var out=[]; for(var k in G.archive){ var a=G.archive[k]; if(a.parents&&(a.parents[0]===id||a.parents[1]===id)) out.push(+k); } return out; }
  // ---------- tasks
  var TASKS=[
    {id:'hatch',k:'t_hatch',r:150,ok:function(){return G.stats.hatched>=1;}},
    {id:'buyfeed',k:'t_buyfeed',r:100,ok:function(){return G.stats.boughtFeed>=1;}},
    {id:'hand',k:'t_hand',r:60,ok:function(){return G.stats.hand>=1;}},
    {id:'six',k:'t_six',r:200,ok:function(){return G.birds.length>=6;}},
    {id:'sell',k:'t_sell',r:100,ok:function(){return G.stats.sold>=1;}},
    {id:'lvl3',k:'t_lvl3',r:300,ok:function(){return G.level>=3;}}];
  function claimable(){ return TASKS.filter(function(t){return !G.tasks[t.id]&&t.ok();}).length; }
  function claim(id){ TASKS.forEach(function(t){ if(t.id===id&&!G.tasks[id]&&t.ok()){ G.tasks[id]=1; G.coins+=t.r; addXp(20); emit('toast','🪙 +'+t.r); } }); }
  // ---------- save / load
  function save(){
    if(!G) return; G.savedAt=Date.now();
    try{ localStorage.setItem(C.SAVE_KEY,JSON.stringify(G)); }catch(e){}
  }
  function load(){
    var raw=null; try{ raw=localStorage.getItem(C.SAVE_KEY); }catch(e){}
    if(!raw) return false;
    try{ G=JSON.parse(raw); }catch(e){ return false; }
    if(!G||!G.birds) return false;
    if(G.nestsOpen===undefined){ G.nestsOpen=8; G.perches=[]; }
    var away=(Date.now()-(G.savedAt||Date.now()))/1000/C.REAL_SEC_PER_HOUR; away=Math.min(away,C.OFFLINE_MAX_H);
    G.birds.forEach(function(b){ if(b.st==='fly'||b.st==='walk'||b.st==='eat'||b.st==='drink'||b.st==='sit'||b.st==='perch'||b.st==='peck'||b.st==='preen'||b.st==='coo') { b.st='idle'; b.timer=0.5; if(b.z>0.05&&stageOf(b)!=='squab'){ var s=L.randSpot(); b.x=s.x;b.y=s.y;b.z=0; } } });
    if(away>=1){ var s0={eggs:G.stats.eggs||0,hat:G.stats.hatched,died:G.stats.died,grain:G.feeder.grain,water:G.water.amt,birds:G.birds.length}; skip(Math.floor(away)); G.savedAt=Date.now(); G.welcome={h:Math.floor(away),eggs:(G.stats.eggs||0)-s0.eggs,hatched:G.stats.hatched-s0.hat,died:G.stats.died-s0.died,grain:Math.max(0,s0.grain-G.feeder.grain),water:Math.max(0,s0.water-G.water.amt),birds:G.birds.length-s0.birds}; }
    return true;
  }
  return { get G(){return G;}, newGame:newGame, load:load, save:save, update:update, on:on, emit:emit, stageOf:stageOf, hourOfDay:hourOfDay, dayNum:dayNum,
    bird:bird, related:related, canPair:canPair, pairUp:pairUp, unpair:unpair, nestContents:nestContents, sell:sell, sellPrice:sellPrice,
    buyFeed:buyFeed, buyBird:buyBird, buyPair:buyPair, refillFeeder:refillFeeder, refillWater:refillWater, feedBird:feedBird, waterBird:waterBird, healBird:healBird,
    weightOf:weightOf, TASKS:TASKS, buyNest:buyNest, nestCost:nestCost, buyPerch:buyPerch, childrenOf:childrenOf, claimable:claimable, claim:claim, skip:skip, freeNest:freeNest, covered:covered, isNight:isNight, addXp:addXp };
})();
