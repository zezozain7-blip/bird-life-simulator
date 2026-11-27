// Simulation core: state, life cycle (aging, needs, eggs, hatching) and bird behaviour. No drawing here.
BLS.Sim = (function(){
  var C = BLS.CFG, Gen = BLS.Gen;
  var G = null, listeners = {};
  var L = BLS.LAYOUT = {
    nestPos: function(i){ var col=i%4,row=(i/4)|0; return {x:2.2,y:1.3+col*1.05+0.45,z:0.45+row*0.9+0.04}; },
    feeder:{x:6.2,y:6.0}, water:{x:4.3,y:7.2},
    feederSlots:[{x:8.4,y:4.6},{x:8.4,y:7.2},{x:10.4,y:5.8}], waterSlots:[{x:4.5,y:4.7},{x:5.4,y:9.6},{x:10.4,y:7.2}],
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
  function pickName(sex){
    var list=BLS.NAMES[G.lang||'ar'][sex==='F'?'F':'M'], used={}; G.birds.forEach(function(b){used[b.name]=1;});
    var free=list.filter(function(n){return !used[n];});
    if(free.length) return Gen.rnd(free);
    return Gen.rnd(list)+' '+(G.nextId);
  }
  // saves made before v0.35 could give a female a male name (or the reverse): rename those birds to a matching name
  function nameSex(n){ var base=String(n||'').replace(/\s+\d+$/,''), k, l; for(l in BLS.NAMES){ for(k in BLS.NAMES[l]){ if(BLS.NAMES[l][k].indexOf(base)>=0) return k; } } return (base==='نور'||base==='Nour')?'N':null; }
  function fixNames(){ var n=0; G.birds.forEach(function(b){ var ns=nameSex(b.name); if(ns&&ns!=='N'&&ns!==b.sex){ b.name=pickName(b.sex); n++; if(G.archive&&G.archive[b.id]) G.archive[b.id].name=b.name; } }); if(G.archive) Object.keys(G.archive).forEach(function(id){ var a=G.archive[id], ns=nameSex(a.name); if(ns&&ns!=='N'&&a.sex&&ns!==a.sex&&!bird(+id)) a.name=pickName(a.sex); }); return n; }
  var PERS=[{k:'p_calm',st:0.7},{k:'p_bold',st:1.0},{k:'p_shy',st:1.4},{k:'p_greedy',st:1.1},{k:'p_social',st:0.9}];
  function ensureBird(b){ if(b.pers===undefined) b.pers=b.id%5; if(b.clean===undefined) b.clean=85; if(b.stress===undefined) b.stress=10; if(b.mood===undefined) b.mood=70; }
  function symptoms(b){ var a=[]; if(b.dis){ a.push(b.dis.k==='d_cold'?'s_sneeze':b.dis.k==='d_gut'?'s_loose':'s_lumps'); if(b.dis.t>C.DIS.stage_h) a.push('s_lethargic'); } if(b.health<70) a.push('s_weak'); if(b.health<50) a.push('s_ruffled'); if(b.iso) a.push('s_iso'); if(b.hunger>70) a.push('s_hungry'); if(b.thirst>70) a.push('s_thirsty'); if(b.clean<35) a.push('s_dirty'); if(b.stress>65) a.push('s_stressed'); return a; }
  function newBird(o){
    var b={ id:G.nextId++, name:o.name||pickName(o.sex), sex:o.sex, g:o.g, age:o.age||0, hunger:o.hunger||10, thirst:o.thirst||10,
      health:100, pers:o.pers!==undefined?o.pers:Math.floor(Math.random()*5), clean:90, stress:10, mood:70, mate:-1, nest:-1, parents:o.parents||[-1,-1], cool:6, clutch:0, layT:0, sickFlag:false,
      x:o.x||5, y:o.y||5, z:o.z||0, face:1, st:'idle', timer:1+Math.random()*2, ph:Math.random()*10, tx:0,ty:0, slot:0 };
    G.birds.push(b); G.archive[b.id]={name:b.name,sex:b.sex,parents:b.parents,col:Gen.phenoColor(b.g),pat:Gen.phenoPattern(b.g),br:Gen.breedOf(b.g)}; return b;
  }
  function newGame(lang){
    G = { v:1, t:0, coins:C.START_COINS, feed:C.START_FEED, xp:0, level:1, birds:[], eggs:[], nests:[], nextId:1,
      feeder:{grain:0.6}, water:{amt:1200}, tasks:{}, stats:{hatched:0,sold:0,bought:0,died:0,hand:0,boughtFeed:0},
      lang:lang||'ar', speed:1, archive:{}, log:[], savedAt:Date.now(), nestsOpen:4, perches:[] };
    for(var i=0;i<C.NEST_COUNT;i++) G.nests.push(null);
    ensureUnits(); ensureComp();
    var gm={c:['G','R'],p:['B','C'],size:66,vit:70,fert:72}, gf={c:['G','G'],p:['B','B'],size:60,vit:68,fert:74};
    var np=L.nestPos(0), rp=L.roofPerch();
    var m=newBird({sex:'M',g:gm,age:C.JUVENILE_H+30,x:rp.x,y:rp.y,z:L.roofZ}), f=newBird({sex:'F',g:gf,age:C.JUVENILE_H+30,x:np.x,y:np.y,z:np.z});
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
  function canPair(a,b){ return a&&b&&a.sex!==b.sex&&stageOf(a)==='adult'&&stageOf(b)==='adult'&&a.mate<0&&b.mate<0&&!a.iso&&!b.iso&&!related(a,b); }
  function freeNest(){ for(var i=0;i<Math.min(G.nests.length,G.nestsOpen);i++) if(!G.nests[i]) return i; return -1; }
  function pairUp(a,b,silent){
    var n=freeNest(); if(n<0) return false;
    var m=a.sex==='M'?a:b, f=a.sex==='M'?b:a;
    m.mate=f.id; f.mate=m.id; m.nest=f.nest=n; G.nests[n]={m:m.id,f:f.id};
    if(!silent){ emit('toast',T('paired',m.name,f.name)); emit('fx','heart',m); emit('fx','heart',f); } return true;
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
  function addXp(v){ G.xp+=v; while(G.xp>=100*G.level){ G.xp-=100*G.level; G.level++; var gift=50*G.level; G.coins+=gift; emit('sfx','level'); emit('levelup',G.level,gift); } }
  function hatchOdds(m,f){ ensureBird(m); ensureBird(f); var u=G.up||{}; var o=0.70+((m.g.fert+f.g.fert)/2)/100*0.2-((m.stress+f.stress)/2)/100*0.15+(u.nursery?0.12:0)+0.05*(G.feeder.q||0); o*=ageFert(m)*ageFert(f); return Math.max(0.2,Math.min(0.97,o)); }
  function layEgg(f,m,n){
    var fert=Math.random()<hatchOdds(m,f);
    G.eggs.push({id:G.nextId++, nest:n, m:m.id, f:f.id, g:Gen.cross(m.g,f.g), prog:0, cold:0, fertile:fert, dead:false, deadT:0});
    emit('event',T('ev_egg',n+1),'breeding'); emit('sfx','egg'); G.stats.eggs=(G.stats.eggs||0)+1;
    [f,m].forEach(function(x){ if(x.st!=='fly'&&x.st!=='sit'){ x.timer=0; if(x.st==='walk'||x.st==='eat'||x.st==='drink'){} } });
  }
  function popCap(){ return C.CAP_BASE+C.CAP_PER_NEST*G.nestsOpen; }
  function popRoom(){ return G.birds.length+G.eggs.length<popCap(); }
  function hatch(e){
    var m=bird(e.m), f=bird(e.f); if(f) f.cool=Math.max(f.cool||0,C.CLUTCH_COOL_H);
    var b=newBird({sex:Math.random()<0.5?'M':'F',g:e.g,age:0,parents:[e.m,e.f],hunger:20,thirst:20});
    b.nest=e.nest; var pos=L.nestPos(e.nest); b.x=pos.x; b.y=pos.y; b.z=pos.z; b.st='squabnest';
    var slot=G.birds.filter(function(x){return x.nest===e.nest&&stageOf(x)==='squab'&&x.id!==b.id;}).length; b.slot=slot%2;
    G.stats.hatched++; emit('fx','hatch',b); emit('sfx','hatch'); addXp(30); emit('event',T('ev_hatch',e.nest+1),'breeding');
  }
  function stepLife(dt,auto,protect){
    G.t+=dt; if(G.lastDay===undefined) G.lastDay=Math.floor(G.t/24); while(Math.floor(G.t/24)>G.lastDay){ G.lastDay++; dailyEvents(protect); }
    if(G.med&&G.med.left>0){ G.med.left=Math.max(0,G.med.left-dt); if(G.med.left<=0&&!protect) emit('event',T('ev_med_end'),'birds'); }
    var i, b, wm=wMul(), hungerAdd=C.HUNGER_RATE*dt*wm.hu, thirstAdd=C.THIRST_RATE*dt*wm.th;
    for(i=G.birds.length-1;i>=0;i--){
      b=G.birds[i]; var st0=stageOf(b);
      b.age+=dt; var stg=stageOf(b);
      b.hunger+=hungerAdd*(stg==='squab'?0.8:1); b.thirst+=thirstAdd*(stg==='squab'?0.8:1);
      if(stg==='squab'){
        var par=[bird(b.parents[0]),bird(b.parents[1])].filter(function(p){return p&&p.hunger<78&&p.thirst<85;});
        if(par.length){ b.hunger=Math.max(0,b.hunger-6*dt); b.thirst=Math.max(0,b.thirst-6*dt); par.forEach(function(p){ p.hunger+=C.REAR_EXTRA*dt/par.length; }); }  // raising squabs costs the parents extra feed (a real pair eats about 35-40 kg a year)
      }
      if(auto){
        var fU=feeders().filter(function(u){return u.grain>0;}).sort(function(a,b2){return b2.grain-a.grain;})[0];
        if(b.hunger>35&&fU){ var gk=C.GRAIN_PER_UNIT*intakeK(b), need=b.hunger-10,kg=Math.min(fU.grain,need*gk); fU.grain-=kg; var fqq=fU.q||G.feeder.q||0; b.hunger-=kg/gk*(1+0.3*fqq); if(fqq>0&&!b.dis) b.health=Math.min(100,b.health+0.5*fqq*dt); }
        var wU=waters().filter(function(u){return u.amt>0;}).sort(function(a,b2){return b2.amt-a.amt;})[0];
        if(b.thirst>35&&wU){ var wk=C.WATER_PER_UNIT*intakeK(b), nw=b.thirst-10,w=Math.min(wU.amt,nw*wk); wU.amt-=w; b.thirst-=w/wk; }
      }
      ensureBird(b);
      var crowd=G.birds.length>popCap()*0.85?1:0, pm=PERS[b.pers];
      b.clean=Math.max(0,Math.min(100,b.clean+(G.dirt>60?-1.2:G.dirt>30?-0.4:0.6)*dt));
      b.stress=Math.max(0,Math.min(100,b.stress+((b.hunger>70||b.thirst>70?2.5:0)+(crowd?1.2:0)+(G.dirt>60?1:0)+(b.health<50?1.5:0)-1.4)*dt*pm.st*((G.up&&G.up.flight)?0.7:1)));
      b.mood=Math.max(0,Math.min(100,100-b.stress*0.6-Math.max(0,b.hunger-50)*0.4-Math.max(0,b.thirst-50)*0.3-(100-b.clean)*0.2));
      if(b.stress>80){ b.health-=0.5*dt; dmg(b,'stress',0.5*dt); }
      if(b.dis){ b.dis.t+=dt; var DI=C.DIS, sg=Math.min(2,Math.floor(b.dis.t/DI.stage_h)), md=(G.med&&G.med.left>0&&totalWater()>0)?1:0, dd=(DI.drain+DI.drain_step*sg)*dt*(b.iso?0.8:1)*(md?1-C.MED.drain_cut:1); if(md) b.dis.med=(b.dis.med||0)+dt; b.health-=dd; dmg(b,'disease',dd); b.stress=Math.min(100,b.stress+0.5*dt); if(((b.dis.t>DI.min_h&&b.health>45&&Math.random()<DI.recover*dt*((G.up&&G.up.vet)?3:1))||(md&&b.dis.med>C.MED.start_h&&b.health>20&&Math.random()<C.MED.recover*dt))){ b.dis=null; b.iso=false; emit('event',T('ev_recover',b.name),'birds',b.id); } }
      if(protect){ b.hunger=Math.min(b.hunger,80); b.thirst=Math.min(b.thirst,80); }
      b.hunger=Math.min(100,b.hunger); b.thirst=Math.min(100,b.thirst);
      if(b.hunger>90||b.thirst>90){ var hd=b.hunger>90?C.STARVE_H*(stg==='squab'?2:1)*dt:0, td=b.thirst>90?C.DEHYD_H*(stg==='squab'?1.5:1)*dt:0; b.health-=hd+td; dmg(b,'hunger',hd); dmg(b,'thirst',td); } else if(b.hunger<60&&b.thirst<60&&!b.dis) b.health=Math.min(100,b.health+0.6*dt);
      if(protect&&b.health<30) b.health=30;
      if(b.health<45&&!b.sickFlag){ b.sickFlag=true; emit('event',T('ev_sick',b.name),'birds',b.id); }
      if(b.health>=60) b.sickFlag=false;
      if(b.health<=0){ die(b); continue; }
      if(!protect&&(stg==='squab'||stg==='juvenile')){ var hz=(stg==='squab'?C.SQUAB_HZ:C.JUV_HZ)*(0.5+G.dirt/100+b.stress/100+(b.hunger>70?0.5:0)); if(Math.random()<hz*dt){ die(b,'c_young'); continue; } }
      { var ad_=b.age/24, os_=oldStart(b); if(ad_>os_&&Math.random()<Math.pow(Math.min(1,(ad_-os_)/Math.max(1,lifeD(b)-os_)),2)*0.02*dt){ b.oldAge=true; die(b); continue; } }
      if(st0==='squab'&&stg==='juvenile'){ // leaves nest
        var n=b.nest; b.nest=-1; b.st='idle'; b.timer=1; var gp=L.randSpot();
        b.fl={x0:b.x,y0:b.y,z0:b.z,x1:3.3+Math.random()*0.6,y1:L.nestPos(n).y,z1:0,t:0,dur:1.4,arc:0.8}; b.st='fly'; b.after='idle';
        emit('event',T('ev_grow',b.name),'birds',b.id);
        var pf=bird(b.parents[1]); if(pf&&pf.nest===n&&nestContents(n)===0){ pf.cool=Math.min(pf.cool,C.CLUTCH_COOL_H*0.66); }
      }
      if(st0==='juvenile'&&stg==='adult') emit('event',T('ev_adult',b.name),'birds',b.id);
    }
    // eggs
    for(i=G.eggs.length-1;i>=0;i--){
      var e=G.eggs[i];
      if(e.dead){ if(G.t-e.deadT>12){ G.eggs.splice(i,1); emit('event',T('ev_bad',e.nest+1),'breeding'); } continue; }
      var cov = auto || covered(e.nest);
      if(cov) { e.prog+=dt; e.cold=Math.max(0,e.cold-dt*0.5); } else { e.cold+=dt; if(e.cold>C.EGG_COLD_LIMIT_H*((G.up&&G.up.nursery)?1.6:1)){ e.dead=true; e.deadT=G.t; emit('event',T('ev_cold',e.nest+1),'breeding'); continue; } }
      if(e.prog>=C.EGG_INCUBATION_H){
        if(e.fertile){ hatch(e); G.eggs.splice(i,1); } else { e.dead=true; e.deadT=G.t; }
      }
    }
    // auto-pairing: unpaired adults of opposite sex pair up on their own when a nest is free
    if(freeNest()>=0){ var ms=G.birds.filter(function(x){return x.sex==='M'&&stageOf(x)==='adult'&&x.mate<0;}), fs_=G.birds.filter(function(x){return x.sex==='F'&&stageOf(x)==='adult'&&x.mate<0;}), done=false;
      for(var a=0;a<ms.length&&!done;a++) for(var b2=0;b2<fs_.length&&!done;b2++) if(canPair(ms[a],fs_[b2])&&pairUp(ms[a],fs_[b2],false)){ fs_[b2].cool=Math.min(fs_[b2].cool||0,12); done=true; } }
    // laying
    G.birds.forEach(function(f){
      if(f.sex!=='F'||f.mate<0||f.nest<0) return;
      var m=bird(f.mate); if(!m) return; var n=f.nest;
      if(stageOf(f)!=='adult') return;
      f.cool-=dt;
      var cont=nestContents(n);
      if(f.clutch>0&&cont===0&&(f.clutch===2||G.t>f.layT)){ f.clutch=0; }
      if(f.clutch===0&&f.cool<=0&&cont===0&&popRoom()&&f.hunger<65&&f.thirst<65&&f.health>60&&!f.dis&&!f.iso){ layEgg(f,m,n); f.clutch=1; f.layT=G.t+24; }
      else if(f.clutch===1&&G.t>=f.layT&&cont<2&&f.hunger<80){ if(Math.random()<C.SECOND_EGG_P&&popRoom()) layEgg(f,m,n); f.clutch=2; }
    });
    releaseNests();
    if(G.comp){ if(!G.comp.warned&&G.t>=G.comp.nextShow-24&&G.comp.entry<0){ G.comp.warned=true; emit('event',T('comp_soon'),'comp'); } if(G.t>=G.comp.nextShow) resolveShow(); }
    if(totalGrain()<=0.001&&!stepLife._fw){ stepLife._fw=1; emit('event',T('ev_hungry'),'farm'); } if(totalGrain()>0.04) stepLife._fw=0;
    if(totalWater()<=0.5&&!stepLife._ww){ stepLife._ww=1; emit('event',T('ev_dry'),'farm'); } if(totalWater()>10) stepLife._ww=0;
  }
  function lifeD(b){ ensureBird(b); return C.LIFE_D*(0.8+(b.g.vit||50)/250); }
  function oldStart(b){ return C.OLD_START_D*(0.8+(b.g.vit||50)/250); }
  function ageFert(b){ var a=b.age/24,s=oldStart(b); if(a<=s) return 1; return Math.max(0.35,1-0.65*(a-s)/Math.max(1,lifeD(b)-s)); }
  function migrate5(){ (G.xw||[]).concat([G.water]).forEach(function(u){ if(u&&u.amt<=100) u.amt*=15; }); }
  function migrate6(){ var cs=0;  // pace + natural timers (v0.42): old ages and egg progress were in compressed hours
    (G.birds||[]).forEach(function(b){ var a=b.age; if(a<96) b.age=a*7; else if(a<480) b.age=672+(a-96)*(C.JUVENILE_H-672)/384; else b.age=C.JUVENILE_H+(a-480)*14; });
    (G.eggs||[]).forEach(function(e){ e.prog=(e.prog||0)*4.5; }); G.saveVersion=6; }
  function migrate4(){
    G.feed=(G.feed||0)/5; if(G.feeder) G.feeder.grain=(G.feeder.grain||0)/5;
    (G.birds||[]).forEach(function(b){ if(b.age>=240) b.age+=240; else if(b.age>96) b.age=96+(b.age-96)*(384/144); });
    G.saveVersion=6;
  }
  function dmg(b,k,v){ if(v<=0) return; b.dmg=b.dmg||{}; b.dmg[k]=(b.dmg[k]||0)+v; }
  // cause of death: old age and predators are explicit; otherwise the source that took the most health from this bird
  function deathCause(b,forced){
    if(forced) return {c:forced,why:[]};
    if(b.oldAge) return {c:'c_old',why:[]};
    var d=b.dmg||{}, best=null, top=0, k; for(k in d) if(d[k]>top){ top=d[k]; best=k; }
    var why=[]; if(b.dis&&b.dis.why) why.push(b.dis.why); if(G.dirt>55&&why.indexOf('why_dirty')<0) why.push('why_dirty'); if(G.birds.length>popCap()*0.85) why.push('why_crowd'); if(G.weatherBad) why.push('why_weather');
    return {c:best?('c_'+best):'c_unknown',why:why,dis:(b.dis&&!b.oldAge&&best==='disease')?b.dis.k:null};
  }
  function die(b,forced){
    var i=G.birds.indexOf(b); if(i>=0) G.birds.splice(i,1);
    if(b.mate>=0){ var m=bird(b.mate); if(m) m.mate=-1; }
    var dc=deathCause(b,forced), rec={id:b.id,name:b.name,sex:b.sex,age:Math.floor(b.age/24),day:dayNum(),c:dc.c,why:dc.why,dis:dc.dis||null,stage:stageOf(b)};
    G.deaths=G.deaths||[]; G.deaths.unshift(rec); if(G.deaths.length>60) G.deaths.length=60; if(G.archive&&G.archive[b.id]) G.archive[b.id].death=rec;
    G.stats.died++; emit('sfx','sad'); emit('event',T('ev_die2',b.name,T(dc.c)+(dc.dis?' ('+T(dc.dis)+')':'')),'deaths'); releaseNests();
  }
  // ---------- behaviour (real time)
  function isNight(){ var h=hourOfDay(); return h>=21||h<5; }
  function needy(b){ return b.hunger>=30||b.thirst>=35; }
  function goto_(b,x,y,then){ b.tx=x; b.ty=y; b.st='walk'; b.after=then||'idle'; }
  function flyTo(b,x,y,z,then,dur){
    var d=Math.sqrt((x-b.x)*(x-b.x)+(y-b.y)*(y-b.y)+(z-b.z)*(z-b.z)); 
    b.fl={x0:b.x,y0:b.y,z0:b.z,x1:x,y1:y,z1:z,t:0,dur:dur||Math.max(1.2,d/1.8),arc:Math.min(1.2,0.35+d*0.08)};
    b.st='fly'; b.after=then||'idle'; if(b.z<0.05) emit('fx','feather',b); setFace(b,x-b.x,y-b.y); emit('sfx','flap');
  }
  function setFace(b,dx,dy){ var sx=dy; if(Math.abs(sx)>0.01) b.face=sx>=0?1:-1; }
  function feederCap(){ return C.FEEDER_TIERS[Math.min(G.fTier||0,C.FEEDER_TIERS.length-1)].kg; }
  function waterCap(){ return C.WATER_TIERS[Math.min(G.wTier||0,C.WATER_TIERS.length-1)].ml; }
  function nextCap(kind){ var T_=kind==='f'?C.FEEDER_TIERS:C.WATER_TIERS, i=(kind==='f'?G.fTier:G.wTier)||0; return T_[i+1]||null; }
  function buyCap(kind){ var n=nextCap(kind); if(!n) return; if((G.level||1)<n.lv) return emit('toast',T('lv_need',n.lv)); if(G.coins<n.p) return emit('toast',T('need_coins')); G.coins-=n.p; if(kind==='f') G.fTier=(G.fTier||0)+1; else G.wTier=(G.wTier||0)+1; emit('sfx','build'); emit('toast','📦 '+T('built')); }
  // per-breed intake: metabolic scaling, (body weight / 450 g)^0.75. 450 g bird = 38 g feed and 45 ml water per day
  function intakeK(b){ var w=weightOf(b); return Math.max(0.25,Math.pow(w/C.REF_WEIGHT_G,0.75)); }
  function ensureUnits(){ if(!G) return; G.xf=G.xf||[]; G.xw=G.xw||[]; [G.feeder].concat(G.xf).forEach(function(u){ if(u&&u.grain>feederCap()){ G.feed+=u.grain-feederCap(); u.grain=feederCap(); } }); G.feeder.x=L.feeder.x; G.feeder.y=L.feeder.y; G.water.x=L.water.x; G.water.y=L.water.y; }
  function feeders(){ ensureUnits(); return [G.feeder].concat(G.xf); }
  function waters(){ ensureUnits(); return [G.water].concat(G.xw); }
  function totalGrain(){ return feeders().reduce(function(a,u){return a+(u.grain||0);},0); }
  function totalWater(){ return waters().reduce(function(a,u){return a+(u.amt||0);},0); }
  function pickUnit(list,b,key,min){ var best=-1,bs=1e9; for(var i=0;i<list.length;i++){ var u=list[i]; if((u[key]||0)<=min) continue; var sc=Math.hypot(u.x-b.x,u.y-b.y)+Math.random()*2.2+((u.crowd||0)*0.6); if(sc<bs){ bs=sc; best=i; } } return best; }
  function aroundFeeder(i){ var u=feeders()[i||0]||G.feeder, a=Math.random()*6.28; return {x:u.x+Math.cos(a)*0.55,y:u.y+Math.sin(a)*0.55}; }
  function aroundWater(i){ var u=waters()[i||0]||G.water, a=Math.random()*6.28; return {x:u.x+Math.cos(a)*0.45,y:u.y+Math.sin(a)*0.45}; }
  function extraAllowed(){ var lv=G.level||1, n=0; C.EXTRA_UNIT_LV.forEach(function(l){ if(lv>=l) n++; }); return n; }
  function buyFeederUnit(){ var n=G.xf.length; if(n>=C.EXTRA_UNIT_LV.length) return emit('toast',T('unit_max')); if((G.level||1)<C.EXTRA_UNIT_LV[n]) return emit('toast',T('lv_need',C.EXTRA_UNIT_LV[n])); var p=C.EXTRA_FEEDER_COST[n]; if(G.coins<p) return emit('toast',T('need_coins')); G.coins-=p; var s=L.feederSlots[n]; G.xf.push({x:s.x,y:s.y,grain:0}); emit('sfx','build'); emit('toast','🌾 '+T('built')); return true; }
  function buyWaterUnit(){ var n=G.xw.length; if(n>=C.EXTRA_UNIT_LV.length) return emit('toast',T('unit_max')); if((G.level||1)<C.EXTRA_UNIT_LV[n]) return emit('toast',T('lv_need',C.EXTRA_UNIT_LV[n])); var p=C.EXTRA_WATER_COST[n]; if(G.coins<p) return emit('toast',T('need_coins')); G.coins-=p; var s=L.waterSlots[n]; G.xw.push({x:s.x,y:s.y,amt:0}); emit('sfx','build'); emit('toast','💧 '+T('built')); return true; }
  // ---------- pairs: shared nest, turns on the eggs, moving together
  function sitterOf(b,mate){ // who should be on the eggs now: male takes the day shift (about 9:30 to 16:30), female the rest
    var h=hourOfDay(), want=(h>=9.5&&h<16.5)?'M':'F'; var me=b, ot=mate;
    var first=(me.sex===want)?me:ot, second=(first===me)?ot:me;
    if(!needy(first)) return first; if(!needy(second)) return second; return null;
  }
  function nestSlot(b){ var np=L.nestPos(b.nest); return {x:np.x,y:np.y+(b.sex==='M'?-0.15:0.15),z:np.z}; }
  function nearMate(mate,spread){ for(var i=0;i<6;i++){ var x=mate.x+(Math.random()*2-1)*spread, y=mate.y+(Math.random()*2-1)*spread; if(L.walkable(x,y)) return {x:x,y:y}; } return L.randSpot(); }
  function think(b){
    var stg=stageOf(b); if(stg==='squab') return;
    var onGround=b.z<0.05;
    var mate=b.mate>=0?bird(b.mate):null;
    var hasEggs=b.nest>=0&&G.eggs.some(function(e){return e.nest===b.nest&&!e.dead;});
    // 1) needs first
    var fed=b.hunger<=42, wat=b.thirst<=42;
    var fi=!fed?pickUnit(feeders(),b,'grain',0.01):-1;
    if(!fed&&fi>=0){
      if(!onGround){ var s=L.randSpot(); return flyTo(b,s.x,s.y,0,'idle'); }
      b.fi=fi; var p=aroundFeeder(fi); return goto_(b,p.x,p.y,'eat');
    }
    var wi=!wat?pickUnit(waters(),b,'amt',1):-1;
    if(!wat&&wi>=0){
      if(!onGround){ var s2=L.randSpot(); return flyTo(b,s2.x,s2.y,0,'idle'); }
      b.wi=wi; var q=aroundWater(wi); return goto_(b,q.x,q.y,'drink');
    }
    // 2) egg duty: a pair shares the nest and takes turns
    if(hasEggs&&mate){
      var st=sitterOf(b,mate);
      if(st===b&&!needy(b)){
        if(b.st==='sit'){ b.timer=1.5; return; }
        var ns=nestSlot(b); return flyTo(b,ns.x,ns.y,ns.z,'sit');
      }
      if(!isNight()&&!needy(b)){ // off shift: wait beside the nest, then relieve the partner
        var fx=3.0+Math.random()*0.35, fy=L.nestPos(b.nest).y+(Math.random()*0.7-0.35);
        if(b.st==='sit'){ var s7=L.randSpot(); return flyTo(b,fx,fy,0,'idle'); }
        if(onGround&&Math.hypot(b.x-fx,b.y-fy)>0.9) return goto_(b,fx,fy,'idle');
        var rr=Math.random(); if(rr<0.3){ b.st='preen'; b.timer=2+Math.random()*2; return; } if(rr<0.5){ b.st='peck'; b.timer=1.5+Math.random()*2; return; } b.st='idle'; b.timer=2+Math.random()*3; return;
      }
    } else if(hasEggs&&!needy(b)){
      if(b.st==='sit'){ b.timer=1.5; return; }
      var np=L.nestPos(b.nest); return flyTo(b,np.x,np.y,np.z,'sit');
    }
    if(b.st==='sit'&&(!hasEggs)&&isNight()&&b.nest>=0){ b.timer=3; return; }
    // 3) night rest: the pair sleeps in its nest together
    if(isNight()){
      if(b.nest>=0&&mate){ if(b.st==='sit') {b.timer=3;return;} var n2=nestSlot(b); return flyTo(b,n2.x,n2.y,n2.z,'sit'); }
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
    if(mate&&mate.st!=='fly'&&mate.st!=='sit'&&mate.st!=='flock'){
      var dm=Math.hypot(mate.x-b.x,mate.y-b.y);
      if(mate.st==='perch'&&mate.z>0.3&&r<0.6){ var rq=L.roofPerch(); return flyTo(b,rq.x,rq.y,rq.z,'perch'); }
      if(dm>1.7&&r<0.75&&mate.z<0.05){ var nm=nearMate(mate,0.7); return goto_(b,nm.x,nm.y,'idle'); }
      if(dm<=1.7&&r<0.35){ b.st=Math.random()<0.5?'preen':'idle'; b.timer=2+Math.random()*3; return; }
    }
    if(mate&&mate.st!=='fly'&&r<0.22&&mate.z<0.05){ return goto_(b,mate.x+(Math.random()*0.8-0.4),mate.y+(Math.random()*0.8-0.4),'coo'); }
    if(r<0.5){ var s5=(mate&&mate.st!=='sit'&&mate.z<0.05&&Math.random()<0.6)?nearMate(mate,1.2):L.randSpot(); return goto_(b,s5.x,s5.y,'idle'); }
    if(r<0.68){ b.st='peck'; b.timer=1.5+Math.random()*2; return; }
    if(r<0.78){ b.st='preen'; b.timer=2+Math.random()*2; return; }
    if(r<0.9){ var rp2=L.roofPerch(); return flyTo(b,rp2.x,rp2.y,rp2.z,'perch'); }
    if(r<0.96){ var s6=L.randSpot(); return flyTo(b,s6.x,s6.y,0,'idle'); }
    b.st='idle'; b.timer=1+Math.random()*2.5;
  }
  // ---------- fun: throw grain by hand
  var SEED_KG=0.01;
  function toss(x,y){
    if(!L.walkable(x,y)) return false; if(G.feed<SEED_KG) return emit('toast',T('need_feed'));
    var near=G.birds.filter(function(b){ return stageOf(b)!=='squab'&&!b.iso&&b.st!=='flock'&&b.st!=='sit'&&b.st!=='fly'; })
      .sort(function(a,b){ return Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y); }).slice(0,8);
    G.feed-=SEED_KG; emit('fx','seed',{x:x,y:y,z:0});
    var share=near.length?Math.min(12,48/near.length):0;
    near.forEach(function(b,i){ var a=i*2.4, r=0.18+0.09*(i%3), tx=x+Math.cos(a)*r, ty=y+Math.sin(a)*r*1.6; b.seed=share;
      if(b.z>0.05) flyTo(b,tx,ty,0,'peckseed',1.1); else goto_(b,tx,ty,'peckseed'); });
    return true;
  }
  function eatSeed(b){ b.hunger=Math.max(0,b.hunger-(b.seed||0)); b.stress=Math.max(0,b.stress-3); b.seed=0; b.st='peck'; b.timer=2.5+Math.random(); }
  // ---------- fun: let the flock fly, once a game day
  function flockReady(){ return G.birds.filter(function(b){ return stageOf(b)!=='squab'&&b.health>60&&b.hunger<70&&!b.iso&&!b.dis&&!(b.st==='sit'&&b.nest>=0&&G.eggs.some(function(e){return e.nest===b.nest&&!e.dead;})); }); }
  function flying(){ return G.birds.some(function(b){ return b.st==='flock'; }); }
  function flyFlock(){
    if(flying()) return false; if(isNight()) { emit('toast',T('fly_night')); return false; } if(G.flyDay===dayNum()){ emit('toast',T('fly_done')); return false; }
    var list=flockReady().slice(0,24); if(list.length<2){ emit('toast',T('fly_none')); return false; }
    G.flyDay=dayNum(); G.flock={n:list.length,up:0};
    list.forEach(function(b,i){ b.seed=0; b.fk={t:-i*0.12,dur:13,i:i,x0:b.x,y0:b.y,z0:b.z}; b.st='flock'; emit('fx','feather',b); });
    emit('sfx','flap'); emit('toast','🕊️ '+T('fly_go')); return list.length;
  }
  function flockStep(b,dt){
    var f=b.fk; f.t+=dt; if(f.t<0) return;
    if(!f.end){ var s=L.randSpot(); f.end={x:s.x,y:s.y}; }
    var up=Math.min(1,f.t/3), down=Math.max(0,Math.min(1,(f.t-(f.dur-3))/3)); up=up*up*(3-2*up); down=down*down*(3-2*down);
    var a=f.t*1.15+(f.i%8)*0.34, ring=(f.i/8)|0;
    var ox=3.6, oy=6.2+(3.3-ring*0.5)*Math.cos(a), oz=4.3+ring*0.45+0.9*Math.sin(a)+((f.i*7)%5)*0.12;
    var px=f.x0+(ox-f.x0)*up, py=f.y0+(oy-f.y0)*up, pz=f.z0+(oz-f.z0)*up;
    px+=(f.end.x-px)*down; py+=(f.end.y-py)*down; pz*=1-down;
    if(Math.abs(py-b.y)>0.004) b.face=py>b.y?1:-1; b.x=px; b.y=py; b.z=pz;
    if(f.t>=f.dur){ b.x=f.end.x; b.y=f.end.y; b.z=0; b.st='idle'; b.timer=0.5+Math.random(); delete b.fk; emit('fx','feather',b); land(b); }
  }
  // exercise pays off: calmer bird, a little XP, sometimes +1 vitality (homers twice as often)
  function land(b){
    ensureBird(b); b.stress=Math.max(0,b.stress-25); b.hunger=Math.min(100,b.hunger+6); var F=G.flock||(G.flock={n:1,up:0});
    if(Math.random()<(Gen.breedOf(b.g)==='homer'?0.4:0.2)&&b.g.vit<100){ b.g.vit=Math.round(b.g.vit)+1; F.up++; }
    addXp(3); if(!flying()) emit('toast',T('fly_back',F.n,F.up));
  }
  function updateBird(b,dt){
    b.ph+=dt;
    var stg=stageOf(b);
    if(stg==='squab'&&b.nest>=0){ b.st='squabnest'; var p=L.nestPos(b.nest); b.x=p.x; b.y=p.y+(b.slot?0.22:-0.22); b.z=p.z; return; }
    if(b.st==='squabnest'){ b.st='idle'; }
    var spd=(stg==='juvenile'?0.45:0.55);
    if(b.st==='flock'){ if(b.fk) flockStep(b,dt); else { b.st='idle'; b.z=0; } return; }
    if(b.st==='peckseed'){ eatSeed(b); return; }
    if(b.seed&&b.st==='walk') spd*=2.4;
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
      var fu=feeders()[b.fi||0]||G.feeder;
      if(fu.grain<=0.002||b.hunger<12||b.timer<=0){ b.st='idle'; b.timer=0.4; }
      else { var amt=Math.min(b.hunger,C.EAT_SPEED*dt); b.hunger-=amt; fu.grain=Math.max(0,fu.grain-amt*C.GRAIN_PER_UNIT*intakeK(b)); face2(b,fu); }
      return;
    }
    if(b.st==='drink'){
      var wu=waters()[b.wi||0]||G.water;
      if(wu.amt<=0.2||b.thirst<8||b.timer<=0){ b.st='idle'; b.timer=0.4; }
      else { var a2=Math.min(b.thirst,C.DRINK_SPEED*dt); b.thirst-=a2; wu.amt=Math.max(0,wu.amt-a2*C.WATER_PER_UNIT*intakeK(b)); face2(b,wu); }
      return;
    }
    if(b.timer<=0){ think(b); }
  }
  function face2(b,t){ setFace(b,t.x-b.x,t.y-b.y); }
  function update(realDt){
    if(realDt>0.5) realDt=0.5;
    var hours=realDt*G.speed/C.REAL_SEC_PER_HOUR;
    G._acc=(G._acc||0)+hours; while(G._acc>=0.06){ var s=Math.min(G._acc,0.25); stepLife(s,false,false); G._acc-=s; }
    for(var i=0;i<G.birds.length;i++){ var bb=G.birds[i]; updateBird(bb,realDt*(G.speed>1&&bb.st!=='flock'?Math.min(G.speed,2):1)); }
  }
  function skip(hours){ var h=0; while(h<hours){ stepLife(1,true,true); h+=1; }
    // rest birds
    G.birds.forEach(function(b){ if(b.st==='flock'){ b.st='idle'; b.z=0; delete b.fk; } if(stageOf(b)!=='squab'){ b.st='idle'; b.timer=0.5; if(b.z>0.05&&b.nest<0){ var s=L.randSpot(); b.x=s.x;b.y=s.y;b.z=0; } } }); }
  // ---------- player actions
  function mk(){ if(!G.mkt) G.mkt={feed:1,G:1,R:1,W:1}; return G.mkt; }
  function feedPrice(){ return Math.round(C.PRICE.feed5*mk().feed*((G.shortage||0)>0?1.5:1)); }
  // v0.50: deterministic per game day (same day = same prices), range 0.75-1.35 (ESTIMATE band; real feed moves a few % a month), 14-day history for the sparkline
  function hash01(n){ var x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
  function dailyMarket(){ var m=mk(), d=dayNum(), ks=['feed','G','R','W']; m.h=m.h||{}; ks.forEach(function(k,i){ var u=(hash01(d*7+i*131)+hash01((d-1)*7+i*131))/2; m[k]=Math.max(0.75,Math.min(1.35,0.75+u*0.6*1.0+(u-0.5)*0.0)); m.h[k]=(m.h[k]||[]).concat([Math.round(m[k]*100)/100]).slice(-14); }); if(G.shortage>0) G.shortage--; }
  function trend(k){ var v=mk()[k]; return v>1.12?'up':v<0.9?'down':'flat'; }
  function sellPrice(b){
    var q=(b.g.size+b.g.vit+b.g.fert)/3, col=Gen.phenoColor(b.g);
    var s=stageOf(b), p=BLS.BREEDS[Gen.breedOf(b.g)].pp/2*(0.8+q/250)*(col==='W'?1.12:col==='R'?1.05:1)*mk()[col]; p*= s==='squab'?0.9:(s==='juvenile'?0.95:1);
    return Math.round(p);
  }
  function sell(b){ var p=sellPrice(b); G.coins+=p; G.stats.sold++; addXp(10); unpair(b); var i=G.birds.indexOf(b); if(i>=0) G.birds.splice(i,1); releaseNests(); emit('toast',T('sold_ok',b.name,p)); emit('sfx','coin'); }
  function mixPrice(){ return Math.round(feedPrice()*1.7); }
  function buyMix(){ var p=mixPrice(); if(G.coins<p) return emit('toast',T('need_coins')); G.coins-=p; G.feedQ=((G.feedQ||0)*G.feed+C.FEED_BAG)/(G.feed+C.FEED_BAG); G.feed+=C.FEED_BAG; G.stats.boughtFeed++; emit('toast','🌾 +'+C.FEED_BAG+' kg '+T('mix')); }
  // an egg's value follows its breed; the price must not reveal fertility before candling (24 h)
  function eggPrice(e){ var known=e.dead||e.prog>C.EGG_CANDLE_H; if(e.dead||(known&&!e.fertile)) return C.PRICE.eggBad; return Math.round(C.PRICE.egg*BLS.BREEDS[Gen.breedOf(e.g)].mul); }
  function sellEgg(id){ var e=null,i; for(i=0;i<G.eggs.length;i++) if(G.eggs[i].id===id) e=G.eggs[i]; if(!e) return false; var p=eggPrice(e); G.coins+=p; G.eggs.splice(G.eggs.indexOf(e),1); emit('toast','🪙 +'+p); emit('sfx','coin'); return true; }
  function buyFeed(){ var fp=feedPrice(); if(G.coins<fp) return emit('toast',T('need_coins')); G.coins-=fp; G.feed+=C.FEED_BAG; G.stats.boughtFeed++; emit('toast','🌾 +'+C.FEED_BAG+' kg'); }
  function placeNew(sex,g,age){ var s=L.randSpot(); return newBird({sex:sex,g:g,age:age,x:s.x,y:s.y,hunger:25,thirst:25}); }
  function buyBird(){
    if(G.birds.length>=Math.min(C.MAX_BIRDS,popCap())) return emit('toast',T('full')); if(G.coins<C.PRICE.bird) return emit('toast',T('need_coins'));
    G.coins-=C.PRICE.bird; G.stats.bought++; var b=placeNew(Math.random()<0.5?'M':'F',Gen.randomGenes(),C.JUVENILE_H+10+Math.random()*30); emit('toast','🕊️ '+T('bought_ok')+': '+b.name);
  }
  function buyPair(){
    if(G.birds.length+2>Math.min(C.MAX_BIRDS,popCap())) return emit('toast',T('full')); if(G.coins<C.PRICE.pair) return emit('toast',T('need_coins'));
    G.coins-=C.PRICE.pair; G.stats.bought+=2; var a=placeNew('M',Gen.randomGenes(),C.JUVENILE_H+10+Math.random()*30), b=placeNew('F',Gen.randomGenes(),C.JUVENILE_H+10+Math.random()*30);
    emit('toast','🕊️🕊️ '+T('bought_ok')+': '+a.name+' + '+b.name);
  }
  function breedPrice(k){ return Math.round(BLS.BREEDS[k].pp/2*1.1); }
  function buyBreed(k,sex){ var B=BLS.BREEDS[k]; if(!B||G.level<B.lv) return false; if(G.birds.length>=Math.min(C.MAX_BIRDS,popCap())) return emit('toast',T('full')); var p=breedPrice(k); if(G.coins<p) return emit('toast',T('need_coins'));
    G.coins-=p; G.stats.bought++; var g=Gen.randomGenes(); g.br=k; if(B.base) g.c=[B.base,B.base]; var b=placeNew(sex,g,C.JUVENILE_H+20); emit('sfx','coin'); emit('toast','🕊️ '+T('bought_ok')+': '+b.name+' ('+T('br_'+k)+')'); return b; }
  function aviary(){ return G.av||(G.av={}); }
  function avCount(){ var a=aviary(), n=0; for(var k in a) n+=a[k]; return n; }
  function avSellPrice(k){ return Math.round(BLS.SPECIES[k].price*BLS.AVIARY_SELL); }
  function avBuy(k){ var s=BLS.SPECIES[k]; if(!s||G.level<s.lv) return false; if(avCount()+2>BLS.AVIARY_CAP) return emit('toast',T('av_full')); if(G.coins<s.price) return emit('toast',T('need_coins')); G.coins-=s.price; var a=aviary(); a[k]=(a[k]||0)+2; emit('sfx','coin'); emit('toast',T('bought_ok')+': '+T('sp_'+k)); return true; }
  function avSell(k){ var a=aviary(); if(!a[k]) return false; a[k]--; if(!a[k]) delete a[k]; var p=avSellPrice(k); G.coins+=p; addXp(4); emit('sfx','coin'); emit('toast','🪙 +'+p); return true; }
  function avDaily(protect){ var a=aviary(), n=avCount(); if(!n) return; if(!protect) G.coins-=Math.min(G.coins,n*BLS.AVIARY_UPKEEP);
    for(var k in a){ for(var i=(a[k]/2)|0;i>0;i--){ if(avCount()<BLS.AVIARY_CAP&&Math.random()<BLS.AVIARY_BREED_P){ a[k]++; addXp(8); emit('event',T('av_chick',T('sp_'+k)),'aviary'); } } } }
  function refillFeeder(){
    var us=feeders(), room=us.reduce(function(a,u){return a+Math.max(0,feederCap()-u.grain);},0); if(room<0.01) return emit('toast',T('feeder_filled'));
    if(G.feed<=0) return emit('toast',T('need_feed'));
    var added=0, fq=G.feedQ||0; us.slice().sort(function(a,b){return a.grain-b.grain;}).forEach(function(u){ var r=Math.min(feederCap()-u.grain,G.feed); if(r<=0.0005) return; var tot=u.grain+r; u.q=((u.q||0)*u.grain+fq*r)/tot; G.feed-=r; u.grain+=r; added+=r; }); if(G.feed<=0.002){ G.feedQ=0; G.feed=Math.max(0,G.feed); } emit('toast','🌾 '+T('feeder_filled')+' (+'+added.toFixed(2)+' kg)');
  }
  function refillWater(){ waters().forEach(function(u){ u.amt=waterCap(); }); emit('toast','💧 '+T('water_filled')); }
  function feedBird(b){ if(G.feed<0.01) return emit('toast',T('need_feed')); G.feed-=0.01; b.hunger=Math.max(0,b.hunger-45); G.stats.hand++; emit('toast',T('fed',b.name)); }
  function waterBird(b){ b.thirst=0; emit('toast',T('watered',b.name)); }
  function healCost(){ return (G.up&&G.up.vet)?30:C.PRICE.heal; }
  function medCost(){ return Math.round(G.birds.length*C.MED.cost_bird); }
  function startMed(){ if(G.med&&G.med.left>0) return emit('toast',T('med_on')); if(!G.birds.some(function(b){return b.dis;})) return emit('toast',T('med_none')); var p=medCost(); if(G.coins<p) return emit('toast',T('need_coins')); if(totalWater()<=0) return emit('toast',T('med_nowater')); G.coins-=p; G.med={left:C.MED.days*24}; emit('sfx','build'); emit('toast','💊 '+T('med_started',p)); }
  function healBird(b){ var hp=healCost(); if(G.coins<hp) return emit('toast',T('need_coins')); G.coins-=hp; b.health=Math.min(100,b.health+50); b.dis=null; b.iso=false; emit('toast',T('healed',b.name)); }
  function weightOf(b){ var s=stageOf(b); var base=BLS.BREEDS[Gen.breedOf(b.g)].w*(0.8+b.g.size*0.004); var f=s==='squab'?Math.min(1,0.08+b.age/C.SQUAB_H*0.5):(s==='juvenile'?0.6+0.4*(b.age-C.SQUAB_H)/(C.JUVENILE_H-C.SQUAB_H):1); return Math.round(base*f); }
  function buyNest(){ if(G.nestsOpen>=C.NEST_COUNT) return; var cost=nestCost(); if(G.coins<cost) return emit('toast',T('need_coins')); G.coins-=cost; G.nestsOpen++; emit('sfx','build'); emit('toast','🪺 '+T('built')); }
  function nestCost(){ return 120+(G.nestsOpen-4)*40; }
  function buyPerch(){ if(G.perches.length>=L.perchSpots.length) return; if(G.coins<40) return emit('toast',T('need_coins')); G.coins-=40; for(var i=0;i<L.perchSpots.length;i++) if(G.perches.indexOf(i)<0){ G.perches.push(i); break; } emit('sfx','build'); emit('toast','🪵 '+T('built')); }
  function childrenOf(id){ var out=[]; for(var k in G.archive){ var a=G.archive[k]; if(a.parents&&(a.parents[0]===id||a.parents[1]===id)) out.push(+k); } return out; }
  // ---------- competition: weekly pigeon show against AI rival breeders (gets harder every week)
  var RIVAL_NAMES=['الحاج فتحي','أبو علي','عم رمضان','أستاذ سمير','Mr. Samir','Haji Fathy'];
  function ensureComp(){
    if(G.comp) return;
    var names=RIVAL_NAMES.slice(0,4); G.comp={pts:0,wins:0,week:0,nextShow:G.t+168,entry:-1,warned:false,last:null,
      rivals:[{n:names[0],skill:6,pts:0},{n:names[1],skill:4,pts:0},{n:names[2],skill:2,pts:0}]};
  }
  function birdScore(b){
    var q=(b.g.size+b.g.vit+b.g.fert)/3, col=Gen.phenoColor(b.g), cb=col==='W'?12:col==='R'?6:0, pb=Gen.phenoPattern(b.g)==='C'?3:0;
    var bb=(BLS.BREEDS[Gen.breedOf(b.g)].mul-1)*8; return Math.round((q*0.85+cb+pb+bb+Math.min(10,b.tr||0)*0.5)*(0.7+0.3*Math.max(0,Math.min(100,b.health))/100));
  }
  function enterShow(id){ ensureComp(); var b=bird(id); if(!b||stageOf(b)!=='adult') return false; G.comp.entry=id; emit('toast',T('comp_entered')+' '+b.name+' ('+birdScore(b)+')'); return true; }
  function withdrawShow(){ ensureComp(); G.comp.entry=-1; }
  function resolveShow(){
    var K=G.comp; K.week++; var w=K.week, res=[], me=bird(K.entry);
    K.rivals.forEach(function(r){ var sc=Math.round(Math.min(98,44+3.2*w+r.skill+(Math.random()*18-9))); res.push({n:r.n,score:sc,rival:r}); });
    var mine=(me&&stageOf(me)==='adult')?birdScore(me):0; res.push({n:null,score:mine,you:true});
    res.sort(function(a,b){return b.score-a.score;});
    var place=0; res.forEach(function(r,i){ if(r.you) place=i+1; var pts=[3,2,1,0][i]||0; if(r.you) K.pts+=pts; else r.rival.pts+=pts; });
    var prize=0; if(mine>0){ prize=Math.round([400,200,100,0][place-1]*(1+0.1*w)); }
    if(prize){ G.coins+=prize; addXp([60,30,15,0][place-1]); } if(place===1&&mine>0) K.wins++;
    K.last={week:w,place:mine>0?place:0,score:mine,bird:me?me.name:'',prize:prize,res:res.map(function(r){return {n:r.n,score:r.score,you:!!r.you};})};
    K.entry=-1; K.warned=false; K.nextShow+=168; if(K.nextShow<=G.t) K.nextShow=G.t+168;
    emit('event',mine>0?T('comp_result',place,prize):T('comp_missed'),'comp'); emit('sfx',place===1&&mine>0?'level':'click');
  }
  // ---------- hazards and upkeep (once per game day, never during offline catch-up)
  var WTAB=[[['clear',.5],['rain',.3],['wind',.2]],[['clear',.6],['heat',.3],['wind',.1]],[['clear',.4],['rain',.35],['wind',.25]],[['clear',.4],['cold',.4],['rain',.2]]];
  function season(){ return Math.floor((dayNum()-1)/15)%4; }
  function rollWeather(){ var tb=WTAB[season()], r=Math.random(), acc=0, w='clear'; for(var i=0;i<tb.length;i++){ acc+=tb[i][1]; if(r<acc){ w=tb[i][0]; break; } }
    var prev=G.weather; G.weather=w; var bad=(w==='heat'&&!(G.up&&G.up.vent))||(w==='cold'&&!(G.up&&G.up.heat)); G.weatherBad=bad; if(w!==prev&&w!=='clear') emit('event',T('ev_w_'+w),'farm'); }
  function wMul(){ var w=G.weather, up=G.up||{}; return { th:w==='heat'?(up.vent?1.4:2):1, hu:w==='cold'?(up.heat?1.1:1.3):1 }; }
  // ---------- gear wear, running costs, repair and retirement (v0.41)
  var GK=['guard','iso','heat','vent','nursery','vet','flight','cam'];
  function gearFlag(k,v){ if(k==='guard') G.guard=v; else if(k==='iso') G.isoUnit=v; else { G.up=G.up||{}; G.up[k]=v; } }
  function gearPrice(k){ return k==='guard'?C.GUARD_COST:k==='iso'?C.ISO_COST:C.UP_COST[k]; }
  function addGear(k){ G.gear=G.gear||{}; G.gear[k]={c:100,max:100,rep:0,age:0,broken:0}; gearFlag(k,1); }
  function ensureGear(){ G.gear=G.gear||{}; GK.forEach(function(k){ var on=k==='guard'?G.guard:k==='iso'?G.isoUnit:(G.up&&G.up[k]); if(on&&!G.gear[k]) addGear(k); }); }
  function repairCost(k){ var g=G.gear&&G.gear[k]; return g?Math.round(gearPrice(k)*C.GEAR[k].rep*(1+0.25*g.rep)):0; }
  function canRepair(k){ var g=G.gear&&G.gear[k]; return !!g&&g.max-15>=40&&g.c<g.max; }
  function scrapValue(k){ return Math.round(gearPrice(k)*0.1); }
  function tickGear(){ ensureGear(); var tot=0;
    GK.forEach(function(k){ var g=G.gear[k]; if(!g) return; var D=C.GEAR[k], cost=D.run, paid=Math.min(G.coins,cost); G.coins-=paid; tot+=paid;
      var f=(paid<cost?1.5:1)*((k==='vent'&&G.weather==='heat')||(k==='heat'&&G.weather==='cold')?1.6:1); g.age++; g.c=Math.max(0,g.c-100/D.life*f);
      if(g.c<=0&&!g.broken){ g.broken=1; gearFlag(k,0); emit('event',T('ev_gear_broke',T('gn_'+k)),'gear'); }
      else if(g.c<35&&!g.warned){ g.warned=1; emit('event',T('ev_gear_worn',T('gn_'+k)),'gear'); } if(g.c>=35) g.warned=0; });
    G.gearRun=tot; }
  function repairGear(k){ var g=G.gear&&G.gear[k]; if(!g) return; if(!canRepair(k)) return emit('toast',T('gear_eol')); var p=repairCost(k); if(G.coins<p) return emit('toast',T('need_coins')); G.coins-=p; g.rep++; g.max=100-15*g.rep; g.c=g.max; g.broken=0; g.warned=0; gearFlag(k,1); emit('sfx','build'); emit('toast','🔧 '+T('gear_fixed',T('gn_'+k))); }
  function retireGear(k){ var g=G.gear&&G.gear[k]; if(!g) return; G.coins+=scrapValue(k); delete G.gear[k]; gearFlag(k,0); if(k==='iso') G.birds.forEach(function(b){ b.iso=false; }); emit('sfx','build'); emit('toast','♻ '+T('gear_retired',T('gn_'+k),scrapValue(k))); }
  function gearBroken(){ return GK.filter(function(k){ return G.gear&&G.gear[k]&&(G.gear[k].broken||G.gear[k].c<35); }); }
  function buyUp(k){ var cost=C.UP_COST[k]; G.up=G.up||{}; ensureGear(); if(G.gear[k]) return; if(G.coins<cost) return emit('toast',T('need_coins')); G.coins-=cost; addGear(k); emit('sfx','build'); emit('toast',T('up_done')); }
  function newEvent(){
    var d=dayNum(), kinds=['stray','rare','trader','injured','shortage'], k=Gen.rnd(kinds), id=(G.evSeq=(G.evSeq||0)+1), ev={id:id,k:k,exp:d+6};
    if(k==='trader'){ var ad=G.birds.filter(function(b){return stageOf(b)==='adult'&&!b.iso;}); if(!ad.length) return null; var b=Gen.rnd(ad); ev.bid=b.id; ev.pay=Math.round(sellPrice(b)*(1.35+Math.random()*0.35)); ev.name=b.name; }
    if(k==='injured'){ if(!G.birds.length) return null; var v=Gen.rnd(G.birds); ev.bid=v.id; ev.name=v.name; ev.cost=45; var h0=v.health; v.health=Math.max(10,v.health-35); dmg(v,'injury',h0-v.health); }
    if(k==='rare'){ ev.cost=380; }
    if(k==='shortage'){ G.shortage=6; emit('event',T('ev_shortage'),'market'); return null; }
    if(k==='stray'&&G.birds.length>=popCap()) return null;
    return ev;
  }
  function rollEvent(){ G.pend=(G.pend||[]).filter(function(e){return e.exp>=dayNum();}); if(G.pend.length>=3||Math.random()>0.3) return; var e=newEvent(); if(!e) return; G.pend.push(e); emit('event',T('evp_'+e.k,e.name||''),'manage'); }
  function resolveEvent(id,opt){
    var e=null,i; for(i=0;i<G.pend.length;i++) if(G.pend[i].id===id) e=G.pend[i]; if(!e) return false; var b=e.bid?bird(e.bid):null;
    if(e.k==='stray'&&opt===1){ if(G.birds.length>=popCap()) return emit('toast',T('full')); var s=placeNew(Math.random()<0.5?'M':'F',Gen.randomGenes(),C.JUVENILE_H+20); emit('toast','🕊️ '+s.name); }
    else if(e.k==='rare'&&opt===1){ if(G.coins<e.cost) return emit('toast',T('need_coins')); if(G.birds.length>=popCap()) return emit('toast',T('full')); G.coins-=e.cost; var g={c:['W','W'],p:[Gen.rnd(['B','C']),Gen.rnd(['B','C'])],size:75+Math.random()*20|0,vit:75+Math.random()*20|0,fert:70+Math.random()*20|0}; var r=placeNew(Math.random()<0.5?'M':'F',g,C.JUVENILE_H+30); r.rare=true; emit('toast','🕊️ '+r.name); }
    else if(e.k==='trader'&&opt===1){ if(!b){ G.pend.splice(G.pend.indexOf(e),1); return false; } G.coins+=e.pay; G.stats.sold++; unpair(b); G.birds.splice(G.birds.indexOf(b),1); releaseNests(); emit('toast','🪙 +'+e.pay); emit('sfx','coin'); }
    else if(e.k==='injured'&&opt===1){ if(G.coins<e.cost) return emit('toast',T('need_coins')); G.coins-=e.cost; if(b){ b.health=Math.min(100,b.health+40); } emit('toast',T('healed',e.name)); }
    G.pend.splice(G.pend.indexOf(e),1); return true;
  }
  var CKEYS=['G-B','G-C','R-B','R-C','W-B','W-C'], CREW={'G-B':80,'G-C':80,'R-B':150,'R-C':150,'W-B':300,'W-C':300};
  var CTRAIT=[{k:'t_size',f:function(g){return g.size>=90;},r:200},{k:'t_vit',f:function(g){return g.vit>=90;},r:200},{k:'t_fert',f:function(g){return g.fert>=90;},r:200},{k:'t_champ',f:function(g){return (g.size+g.vit+g.fert)/3>=85;},r:500}];
  function breedRew(k){ return Math.round(BLS.BREEDS[k].mul*10)*10; }
  function scanColl(){ var C0=G.coll=G.coll||{}; G.birds.forEach(function(b){ var k=Gen.phenoColor(b.g)+'-'+Gen.phenoPattern(b.g); if(!C0[k]) C0[k]={got:0}; var bk=Gen.breedOf(b.g); if(bk!=='baladi'&&!C0['br_'+bk]) C0['br_'+bk]={got:0}; CTRAIT.forEach(function(t){ if(t.f(b.g)&&!C0[t.k]) C0[t.k]={got:0}; }); }); }
  function claimColl(k){ scanColl(); var e=G.coll[k]; if(!e||e.got) return false; var r=CREW[k]||(k.indexOf('br_')===0&&BLS.BREEDS[k.slice(3)]?breedRew(k.slice(3)):0)||(CTRAIT.filter(function(t){return t.k===k;})[0]||{}).r; if(!r) return false; e.got=1; G.coins+=r; addXp(60); emit('toast','🪙 +'+r); emit('sfx','coin'); return true; }
  function collList(){ scanColl(); var o=[]; CKEYS.forEach(function(k){ o.push({k:k,type:'breed',have:!!G.coll[k],got:G.coll[k]&&G.coll[k].got,r:CREW[k]}); }); Object.keys(BLS.BREEDS).forEach(function(b){ if(b==='baladi') return; var k='br_'+b; o.push({k:k,type:'trait',have:!!G.coll[k],got:G.coll[k]&&G.coll[k].got,r:breedRew(b)}); }); CTRAIT.forEach(function(t){ o.push({k:t.k,type:'trait',have:!!G.coll[t.k],got:G.coll[t.k]&&G.coll[t.k].got,r:t.r}); }); return o; }
  function collBadge(){ return collList().filter(function(x){return x.have&&!x.got;}).length; }
  function dailyEvents(protect){
    scanColl(); avDaily(protect); dailyOrder();
    dailyMarket(); if(!protect) rollEvent();
    rollWeather(); if(G.weather==='rain') G.dirt=Math.min(100,(G.dirt||0)+4);
    var n=G.birds.length; G.dirt=Math.min(100,(G.dirt||0)+3+n*1.4);
    if(n&&!protect&&C.UPKEEP_PER_BIRD>0){ var up=Math.min(G.coins,Math.round(n*C.UPKEEP_PER_BIRD)); G.coins-=up; emit('event',T('ev_upkeep',up),'farm'); }
    if(!protect) tickGear();
    if(protect||!n) return;
    if(G.dirt>=70) emit('event',T('ev_dirty'),'manage');
    updateSkill();
    if(G.up&&G.up.cam){ var al=G.birds.filter(function(x){return x.dis||x.hunger>80||x.thirst>80||x.health<40;}); if(al.length) emit('event',T('ev_cam',al.map(function(x){return x.name;}).join('، ')),'birds'); }
    var crowd=n>popCap()*0.85?1:0, sickN=G.birds.filter(function(x){return x.dis&&!x.iso;}).length, relief=G.skill<0.3?0.7:1;
    G.birds.forEach(function(x){
      if(x.dis||x.iso) return; ensureBird(x);
      var DI=C.DIS, p=(DI.base+G.dirt/100*DI.dirt+x.stress/100*DI.stress+crowd*DI.crowd+(x.hunger>70?DI.hunger:0)+(G.weatherBad?DI.weather:0))*relief+(sickN?DI.contact*((G.med&&G.med.left>0)?1-C.MED.contact_cut:1):0);
      if(Math.random()<p){ x.dis={k:DIS[(Math.random()*DIS.length)|0],t:0,why:whyIll(x,crowd,sickN)}; emit('event',T('ev_ill',x.name,T(whyIll(x,crowd,sickN))),'birds',x.id); }
    });
    if(n>2&&G.t>=72&&Math.random()<(G.guard?C.PRED_P*0.15:C.PRED_P)*pressure()*((G.up&&G.up.cam)?0.6:1)){
      if(G.guard){ emit('event',T('ev_pred_ok'),'farm'); }
      else { var tg=G.birds.filter(function(b){return stageOf(b)!=='squab'&&b.nest<0;}); if(!tg.length) tg=G.birds.filter(function(b){return stageOf(b)!=='squab';}); if(tg.length){ var t0=tg[(Math.random()*tg.length)|0], nm=t0.name; die(t0,'c_pred'); emit('event',T('ev_pred',nm),'farm'); } }
    }
  }
  var DIS=['d_cold','d_gut','d_pox'];
  function whyIll(x,crowd,sickN){ if(sickN) return 'why_contact'; if(G.dirt>55) return 'why_dirty'; if(x.stress>55) return 'why_stress'; if(crowd) return 'why_crowd'; if(x.hunger>70) return 'why_hunger'; return 'why_chance'; }
  function updateSkill(){
    var n=G.birds.length||1, fed=G.birds.filter(function(x){return x.hunger<70&&x.thirst<70;}).length/n, clean=G.dirt<50?1:G.dirt<75?0.5:0, money=G.coins>150?1:G.coins>50?0.5:0;
    var died=G.stats.died||0, dd=died-(G.lastDied||0); G.lastDied=died; var surv=dd>1?0:dd>0?0.5:1;
    var cur=(fed+clean+money+surv)/4; G.skill=(G.skill===undefined?0.5:G.skill)*0.8+cur*0.2;
  }
  function pressure(){ var k=G.skill===undefined?0.5:G.skill; return k<0.3?0.4:k<0.6?1:1.25; }
  function skillLabel(){ var k=G.skill===undefined?0.5:G.skill; return k<0.3?'lv_relaxed':k<0.6?'lv_normal':'lv_demanding'; }
  function isoCount(){ return G.birds.filter(function(x){return x.iso;}).length; }
  function isoCap(){ return G.isoUnit?2:0; }
  function buyIso(){ ensureGear(); if(G.gear.iso) return; if(G.coins<C.ISO_COST) return emit('toast',T('need_coins')); G.coins-=C.ISO_COST; addGear('iso'); emit('sfx','build'); emit('toast',T('iso_done')); }
  function isolate(b,on){ if(on){ if(isoCount()>=isoCap()) return emit('toast',T(G.isoUnit?'iso_full':'iso_need')); unpair(b); b.iso=true; emit('toast',T('iso_on',b.name)); } else { b.iso=false; } }
  function cleanLoft(){ emit('fx','spark'); G.stats.cleaned=(G.stats.cleaned||0)+1; G.dirt=0; emit('toast',T('clean_done')); emit('sfx','build'); G.birds.forEach(function(b){ b.health=Math.min(100,b.health+3); }); }
  function buyGuard(){ ensureGear(); if(G.gear.guard) return; if(G.coins<C.GUARD_COST) return emit('toast',T('need_coins')); G.coins-=C.GUARD_COST; addGear('guard'); emit('sfx','build'); emit('toast',T('guard_done')); }
  // ---------- neighbour orders
  var NEIGHBOURS=['أبو أحمد','الحاج سيد','عم محمود','أستاذ هاني','مدحت','أبو يوسف','Mr. Karim','Haji Sayed'];
  function newOrder(){
    var col=Gen.rnd(['G','G','R','R','W']), pat=Math.random()<0.5?Gen.rnd(['B','C']):null;
    var base=95+(col==='W'?25:col==='R'?10:0);
    var mult=1.4+Math.random()*1.0; if(pat) mult+=0.3;
    G.orderSeq=(G.orderSeq||0)+1;
    return {id:G.orderSeq,who:Gen.rnd(NEIGHBOURS),col:col,pat:pat,pay:Math.round(base*mult/5)*5,minQ:pat?55:0};
  }
  function ensureOrders(){ if(!G.orders){ G.orders=[]; while(G.orders.length<3) G.orders.push(newOrder()); } }
  function dailyOrder(){ ensureOrders(); if(G.orders.length<3) G.orders.push(newOrder()); }
  function orderMatch(b,o){ var q=(b.g.size+b.g.vit+b.g.fert)/3; return stageOf(b)==='adult'&&Gen.phenoColor(b.g)===o.col&&(!o.pat||Gen.phenoPattern(b.g)===o.pat)&&q>=o.minQ; }
  function fillOrder(oid,bid){
    var o=null,i; for(i=0;i<G.orders.length;i++) if(G.orders[i].id===oid) o=G.orders[i];
    var b=bird(bid); if(!o||!b||!orderMatch(b,o)) return false;
    G.coins+=o.pay; G.stats.sold++; G.stats.orders=(G.stats.orders||0)+1; addXp(40); unpair(b);
    G.birds.splice(G.birds.indexOf(b),1); releaseNests(); G.orders.splice(G.orders.indexOf(o),1);
    emit('toast',T('sold_ok',b.name,o.pay)); emit('sfx','coin'); return true;
  }
  // ---------- daily / weekly quests and login reward (real calendar days, so they work offline)
  var QDEF=[{k:'q_hatch',st:'hatched',d:1,w:5,rd:120,rw:600},{k:'q_sell',st:'sold',d:1,w:3,rd:100,rw:450},{k:'q_hand',st:'hand',d:3,w:12,rd:80,rw:400},{k:'q_clean',st:'cleaned',d:1,w:3,rd:80,rw:350},{k:'q_orders',st:'orders',d:1,w:3,rd:200,rw:800},{k:'q_feed',st:'boughtFeed',d:1,w:3,rd:60,rw:300}];
  var LOGIN=[50,80,120,160,220,300,500];
  function dkey(off){ var d=new Date(Date.now()+(off||0)*864e5); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function wkey(){ var d=new Date(); var j=new Date(d.getFullYear(),0,1); return d.getFullYear()+'w'+Math.floor(((d-j)/864e5+j.getDay())/7); }
  function snap(){ var o={}; QDEF.forEach(function(q){ o[q.st]=G.stats[q.st]||0; }); return o; }
  function pickQ(n,kind){ var a=QDEF.slice().sort(function(){return Math.random()-0.5;}).slice(0,n); return a.map(function(q){ return {k:q.k,st:q.st,t:kind==='d'?q.d:q.w,r:kind==='d'?q.rd:q.rw,got:0}; }); }
  function ensureQuests(){
    var Q=G.quests; if(!Q) Q=G.quests={streak:0,lastLogin:'',day:'',week:''};
    if(Q.day!==dkey()){ Q.day=dkey(); Q.dq=pickQ(3,'d'); Q.dbase=snap(); }
    if(Q.week!==wkey()){ Q.week=wkey(); Q.wq=pickQ(2,'w'); Q.wbase=snap(); }
  }
  function qProg(q,base){ return Math.min(q.t,(G.stats[q.st]||0)-(base[q.st]||0)); }
  function claimQuest(kind,i){ ensureQuests(); var Q=G.quests, q=(kind==='d'?Q.dq:Q.wq)[i], b=kind==='d'?Q.dbase:Q.wbase; if(!q||q.got||qProg(q,b)<q.t) return false; q.got=1; G.coins+=q.r; addXp(kind==='d'?25:80); emit('toast','🪙 +'+q.r); emit('sfx','coin'); return true; }
  function loginReady(){ ensureQuests(); return G.quests.lastLogin!==dkey(); }
  function claimLogin(){ ensureQuests(); var Q=G.quests; if(Q.lastLogin===dkey()) return false; var r=LOGIN[Q.streak%LOGIN.length]; Q.streak++; Q.lastLogin=dkey(); G.coins+=r; emit('toast','🪙 +'+r); emit('sfx','coin'); return r; }
  function questBadge(){ ensureQuests(); var Q=G.quests, n=loginReady()?1:0; Q.dq.forEach(function(q){ if(!q.got&&qProg(q,Q.dbase)>=q.t) n++; }); Q.wq.forEach(function(q){ if(!q.got&&qProg(q,Q.wbase)>=q.t) n++; }); return n; }
  // ---------- tasks
  var TASKS=[
    {id:'hatch',k:'t_hatch',r:150,ok:function(){return G.stats.hatched>=1;}},
    {id:'buyfeed',k:'t_buyfeed',r:100,ok:function(){return G.stats.boughtFeed>=1;}},
    {id:'hand',k:'t_hand',r:60,ok:function(){return G.stats.hand>=1;}},
    {id:'six',k:'t_six',r:200,ok:function(){return G.birds.length>=6;}},
    {id:'sell',k:'t_sell',r:100,ok:function(){return G.stats.sold>=1;}},
    {id:'lvl3',k:'t_lvl3',r:300,ok:function(){return G.level>=3;}},
    {id:'ten',k:'t_ten',r:400,ok:function(){return G.birds.length>=10;}},
    {id:'hatch10',k:'t_hatch10',r:500,ok:function(){return G.stats.hatched>=10;}},
    {id:'orders3',k:'t_orders3',r:600,ok:function(){return (G.stats.orders||0)>=3;}},
    {id:'white',k:'t_white',r:500,ok:function(){return G.birds.some(function(b){return Gen.phenoColor(b.g)==='W';});}},
    {id:'nests6',k:'t_nests',r:700,ok:function(){return G.nestsOpen>=6;}},
    {id:'win',k:'t_win',r:1000,ok:function(){return G.comp&&G.comp.wins>=1;}},
    {id:'rich',k:'t_rich',r:800,ok:function(){return G.coins>=3000;}}];
  function claimable(){ return TASKS.filter(function(t){return !G.tasks[t.id]&&t.ok();}).length+questBadge()+((G.pend||[]).length)+collBadge(); }
  function claim(id){ TASKS.forEach(function(t){ if(t.id===id&&!G.tasks[id]&&t.ok()){ G.tasks[id]=1; G.coins+=t.r; addXp(20); emit('toast','🪙 +'+t.r); } }); }
  // ---------- save / load
  // apply the time that passed since the last save (app closed or in the background)
  function catchUp(reportFrom){
    var away=Math.max(0,(Date.now()-(G.savedAt||Date.now()))/1000/C.REAL_SEC_PER_HOUR); away=Math.min(away,C.OFFLINE_MAX_H); if(away<1) return false;
    G.birds.forEach(function(b){ if(b.st==='fly'||b.st==='walk'||b.st==='eat'||b.st==='drink'||b.st==='sit'||b.st==='perch'||b.st==='peck'||b.st==='preen'||b.st==='coo') { b.st='idle'; b.timer=0.5; if(b.z>0.05&&stageOf(b)!=='squab'){ var s=L.randSpot(); b.x=s.x;b.y=s.y;b.z=0; } } });
    var s0={eggs:G.stats.eggs||0,hat:G.stats.hatched,died:G.stats.died,grain:totalGrain(),water:totalWater(),birds:G.birds.length}; skip(Math.floor(away)); G.savedAt=Date.now();
    if(away>=(reportFrom||1)) G.welcome={h:Math.floor(away),eggs:(G.stats.eggs||0)-s0.eggs,hatched:G.stats.hatched-s0.hat,died:G.stats.died-s0.died,grain:Math.max(0,s0.grain-G.feeder.grain),water:Math.max(0,s0.water-G.water.amt),birds:G.birds.length-s0.birds};
    return true;
  }
  function save(){
    if(!G) return; G.savedAt=Date.now();
    try{ G.saveVersion=6; var old=localStorage.getItem(C.SAVE_KEY); if(old&&old.length>20) localStorage.setItem(C.SAVE_KEY+'_bak',old); localStorage.setItem(C.SAVE_KEY,JSON.stringify(G)); }catch(e){}
  }
  function load(){
    var raw=null; try{ raw=localStorage.getItem(C.SAVE_KEY); }catch(e){}
    if(!raw) return false;
    try{ G=JSON.parse(raw); }catch(e){ try{ G=JSON.parse(localStorage.getItem(C.SAVE_KEY+'_bak')); }catch(e2){ return false; } }
    if(!G||!G.birds) return false;
    if((G.saveVersion||0)<4){ migrate4(); } if((G.saveVersion||0)<5){ migrate5(); } if((G.saveVersion||0)<6){ migrate6(); }
    ensureUnits(); ensureGear(); ensureOrders(); ensureComp(); ensureQuests(); G.birds.forEach(ensureBird); fixNames(); G.saveVersion=6;
    if(!G.weather){ G.weather='clear'; G.up={}; }
    mk(); if(!G.pend) G.pend=[];
    if(G.nestsOpen===undefined){ G.nestsOpen=8; G.perches=[]; }
    catchUp(1);
    return true;
  }
  return { feederCap:feederCap, waterCap:waterCap, nextCap:nextCap, buyCap:buyCap, intakeK:intakeK, medCost:medCost, startMed:startMed, gearBroken:gearBroken, repairGear:repairGear, retireGear:retireGear, repairCost:repairCost, canRepair:canRepair, scrapValue:scrapValue, gearPrice:gearPrice, deathCause:deathCause, fixNames:fixNames, nameSex:nameSex, toss:toss, flyFlock:flyFlock, flying:flying, flockReady:flockReady, eggPrice:eggPrice, catchUp:catchUp, breedPrice:breedPrice, buyBreed:buyBreed, aviary:aviary, avCount:avCount, avBuy:avBuy, avSell:avSell, avSellPrice:avSellPrice, mixPrice:mixPrice, buyMix:buyMix, sellEgg:sellEgg, healCost:healCost, hatchOdds:hatchOdds, collList:collList, claimColl:claimColl, rollEvent:rollEvent, feedPrice:feedPrice, trend:trend, resolveEvent:resolveEvent, season:season, buyUp:buyUp, buyIso:buyIso, isolate:isolate, isoCap:isoCap, isoCount:isoCount, skillLabel:skillLabel, PERS:PERS, symptoms:symptoms, get G(){return G;}, newGame:newGame, load:load, save:save, update:update, on:on, emit:emit, stageOf:stageOf, hourOfDay:hourOfDay, dayNum:dayNum,
    bird:bird, related:related, canPair:canPair, pairUp:pairUp, unpair:unpair, nestContents:nestContents, popCap:popCap, ensureQuests:ensureQuests, qProg:qProg, claimQuest:claimQuest, claimLogin:claimLogin, loginReady:loginReady, LOGIN:LOGIN, sell:sell, ensureComp:ensureComp, birdScore:birdScore, enterShow:enterShow, withdrawShow:withdrawShow, ensureOrders:ensureOrders, orderMatch:orderMatch, fillOrder:fillOrder, sellPrice:sellPrice,
    cleanLoft:cleanLoft, buyGuard:buyGuard, buyFeed:buyFeed, buyBird:buyBird, buyPair:buyPair, refillFeeder:refillFeeder, refillWater:refillWater, feedBird:feedBird, waterBird:waterBird, healBird:healBird,
    weightOf:weightOf, TASKS:TASKS, buyNest:buyNest, nestCost:nestCost, buyPerch:buyPerch, buyFeederUnit:buyFeederUnit, buyWaterUnit:buyWaterUnit, feeders:feeders, waters:waters, extraAllowed:extraAllowed, childrenOf:childrenOf, claimable:claimable, claim:claim, skip:skip, freeNest:freeNest, covered:covered, isNight:isNight, addXp:addXp };
})();
