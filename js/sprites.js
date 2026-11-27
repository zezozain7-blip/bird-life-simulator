// Vector pigeon sprite, drawn procedurally (no image files needed). Feet at (0,0), faces right.
BLS.Sprites = (function(){
  var PAL = {
    G:{body:'#8b95a4',belly:'#a3acb9',wing:'#aab4c1',bar:'#222730',dark:'#5f6875'},
    R:{body:'#a95740',belly:'#bd6d55',wing:'#cb8a6c',bar:'#5b2a20',dark:'#7a3a2b'},
    W:{body:'#f1f0ec',belly:'#fbfaf7',wing:'#fdfcf8',bar:'#d8d4ca',dark:'#cfcbc1'}
  };
  function ell(c,x,y,rx,ry,rot){ c.beginPath(); c.ellipse(x,y,rx,ry,rot||0,0,6.2832); }
  // opts: col('G'|'R'|'W'), pat('B'|'C'), pose, ph, stage, sel
  function draw(c,x,y,s,face,o){
    var P=PAL[o.col]||PAL.G, pose=o.pose||'stand', ph=o.ph||0, stage=o.stage||'adult';
    var scale=s*(stage==='squab'?0.5:stage==='juvenile'?0.78:1);
    c.save(); c.translate(x,y); c.scale(scale*face,scale);
    var fly=pose==='fly', walk=pose==='walk', peck=pose==='peck'||pose==='eat'||pose==='drink', sit=pose==='sit'||pose==='perch'||pose==='squab';
    var bob = walk?-Math.abs(Math.sin(ph*9))*1.8:0;
    var headX=14, headY=-27+bob, tilt=0;
    if(walk) headX+=Math.sin(ph*9)*1.6;
    if(peck){ var k=0.5+0.5*Math.sin(ph*11); headX=17+k*3; headY=-27+k*15; }
    if(pose==='preen'){ headX=2; headY=-23; }
    if(o.pose==='coo'){ headY=-28-Math.abs(Math.sin(ph*8))*1.5; }
    var by=-14+bob+(sit?5:0);
    if(fly){ by=-18; }
    var squab = stage==='squab';
    var B=(BLS.BREEDS&&BLS.BREEDS[o.br])||null;
    if(B) c.scale(B.sc,B.sc);
    if(!squab&&BLS.VS&&BLS.VS.has(o.br)){ BLS.VS.draw(c,o,{pose:o.pose||'stand',ph:ph}); c.restore(); return; }
    var SHP=(o.br&&BLS.BREED_SHAPE&&BLS.BREED_SHAPE[o.br])||null;
    var im=(stage!=='squab')&&BLS.Art&&BLS.Art.sprite((B&&B.base)||o.col,fly?'fly':(peck?'peck':'stand'),SHP);
    if(im&&SHP&&im===BLS.Art.sprite((B&&B.base)||o.col,fly?'fly':(peck?'peck':'stand'))) SHP=null;
    if(im){
      var key=fly?'fly':(peck?'peck':'stand'), cf=(BLS.ASSET_CFG&&BLS.ASSET_CFG[key])||{h:key==='fly'?54:46,ax:0.5,ay:1.0}; if(SHP&&BLS.SHAPE_H&&BLS.SHAPE_H[SHP+'_'+key]) cf={h:BLS.SHAPE_H[SHP+'_'+key],ax:0.5,ay:cf.ay};
      var hp=cf.h*(sit?0.93:1), wp=hp*im.width/im.height;
      c.translate(0,walk?bob:(sit?3:0)); if(walk) c.rotate(Math.sin(ph*9)*0.035); if(fly) c.translate(0,Math.sin(ph*16)*2-16);
      if(pose==='coo') c.translate(0,-Math.abs(Math.sin(ph*8))*1.5);
      var feats=(B&&B.f)||[], X=-wp*cf.ax, Y=-hp*cf.ay;
      var col=(B&&B.base)||o.col;
      AN_SHP=SHP&&BLS.SHAPE_AN?BLS.SHAPE_AN[SHP+'_'+key]:null;
      features(c,feats,key,X,Y,wp,hp,col,false);
      var art=marked(im,feats,key,o.col); c.drawImage(art,X,Y,wp*art.width/im.width,hp);
      features(c,feats,key,X,Y,wp,hp,col,true); AN_SHP=null; c.restore(); return;
    }
    // legs
    if(!fly&&!sit){
      c.strokeStyle='#c4707a'; c.lineWidth=2; c.lineCap='round';
      var sw=walk?Math.sin(ph*9)*4:0;
      c.beginPath(); c.moveTo(-1,by+7); c.lineTo(-1+sw,0); c.moveTo(3,by+7); c.lineTo(3-sw,0); c.stroke();
      c.lineWidth=1.6; c.beginPath(); c.moveTo(-1+sw,0); c.lineTo(3+sw,0); c.moveTo(3-sw,0); c.lineTo(7-sw,0); c.stroke();
    }
    var wy=fly?Math.sin(ph*16):0;
    if(fly){ // far wing
      c.fillStyle=P.dark; c.beginPath(); c.moveTo(-2,by-4); c.quadraticCurveTo(-8,by-24-wy*10,-22,by-26-wy*12); c.quadraticCurveTo(-12,by-12,-2,by+2); c.fill();
    }
    if(squab){
      ell(c,0,by,13,10); c.fillStyle='#e9cf7e'; c.fill();
      ell(c,10,by-9,6,6); c.fillStyle='#f0d98d'; c.fill();
      c.fillStyle='#d8a090'; c.beginPath(); c.moveTo(15,by-9); c.lineTo(21,by-7); c.lineTo(15,by-6); c.fill();
      c.fillStyle='#111'; c.beginPath(); c.arc(12,by-11,1.3,0,6.3); c.fill();
      c.restore(); return;
    }
    // tail
    c.fillStyle=P.dark; c.beginPath(); c.moveTo(-10,by-3); c.lineTo(-27,by+(fly?4:7)); c.lineTo(-24,by+(fly?9:11)); c.lineTo(-9,by+4); c.closePath(); c.fill();
    c.fillStyle=P.bar; if(o.col!=='W'){ c.beginPath(); c.moveTo(-24,by+(fly?7:9.5)); c.lineTo(-26.5,by+(fly?5:8)); c.lineTo(-27,by+(fly?4:7)); c.lineTo(-24,by+(fly?9:11)); c.fill(); }
    // body
    var g=c.createLinearGradient(0,by-10,0,by+10); g.addColorStop(0,P.belly); g.addColorStop(1,P.body);
    c.save(); c.translate(0,by); c.rotate(fly?-0.35:-0.12); ell(c,0,0,16,10); c.fillStyle=g; c.fill(); c.restore();
    // neck + head
    var ng=c.createLinearGradient(6,by-14,14,by-4); ng.addColorStop(0,o.col==='W'?'#f4f3ee':'#4f8f6f'); ng.addColorStop(0.5,o.col==='W'?'#ecebe6':'#7b5fa0'); ng.addColorStop(1,P.body);
    c.beginPath(); c.moveTo(4,by-8); c.quadraticCurveTo(10,by-12,headX-4,headY+1); c.lineTo(headX+3,headY+4); c.quadraticCurveTo(16,by-2,10,by+5); c.closePath(); c.fillStyle=ng; c.fill();
    ell(c,headX,headY,5.6,5.2); c.fillStyle=o.col==='W'?'#f7f6f2':P.body; c.fill();
    // beak + cere
    c.fillStyle='#4a4141'; c.beginPath(); c.moveTo(headX+4.5,headY-0.8); c.lineTo(headX+11,headY+1.2); c.lineTo(headX+4.5,headY+2.4); c.fill();
    ell(c,headX+5.2,headY-0.6,2,1.6); c.fillStyle='#f4efe8'; c.fill();
    c.fillStyle='#e48a1a'; c.beginPath(); c.arc(headX+1.5,headY-1.2,1.7,0,6.3); c.fill(); c.fillStyle='#000'; c.beginPath(); c.arc(headX+1.8,headY-1.2,0.8,0,6.3); c.fill();
    // wing (folded) or open
    if(fly){
      c.fillStyle=P.wing; c.beginPath(); c.moveTo(0,by-5); c.quadraticCurveTo(-4,by-26+wy*12,-24,by-24+wy*14); c.quadraticCurveTo(-12,by-6,2,by+3); c.fill();
      c.strokeStyle=P.bar; c.lineWidth=1.3; c.beginPath(); c.moveTo(-6,by-8); c.lineTo(-18,by-19+wy*10); c.moveTo(-8,by-5); c.lineTo(-21,by-14+wy*8); c.stroke();
    } else {
      c.save(); c.translate(-3,by-1); c.rotate(-0.12); ell(c,0,0,12.5,6.8); c.fillStyle=P.wing; c.fill(); c.clip();
      if(o.col!=='W'){
        c.strokeStyle=P.bar; c.fillStyle=P.bar;
        if(o.pat==='B'){ c.lineWidth=2.2; c.beginPath(); c.moveTo(-3,-8); c.lineTo(-1,8); c.moveTo(4,-8); c.lineTo(6,8); c.stroke(); }
        else { for(var i=-10;i<10;i+=4) for(var j=-6;j<6;j+=4){ c.globalAlpha=0.55; c.fillRect(i+((j/4)&1?2:0),j,2.6,2.6); } c.globalAlpha=1; }
      } else { c.strokeStyle=P.bar; c.lineWidth=1; c.beginPath(); c.moveTo(-8,2); c.lineTo(8,3); c.stroke(); }
      c.restore();
    }
    c.restore();
  }
  // anchor points on the painted sprites, as fractions of the image
  var AN={stand:{h:[0.86,0.10],n:[0.80,0.24],c:[0.80,0.42],t:[0.24,0.72],f:[0.66,0.95],tail:[0.08,0.84]},
          peck:{h:[0.89,0.73],n:[0.80,0.60],c:[0.74,0.60],t:[0.22,0.32],f:[0.55,0.93],tail:[0.08,0.18]},
          fly:{h:[0.86,0.54],n:[0.76,0.60],c:[0.70,0.66],t:[0.28,0.74],f:[0.40,0.80],tail:[0.10,0.82]}};
  var cache={}, AN_SHP=null;
  function swell(im,key,col,k){
    var id='sw'+k+key+col; if(cache[id]) return cache[id];
    var w=im.width,h=im.height,A=AN[key],cn=document.createElement('canvas'); cn.width=Math.ceil(w*1.3); cn.height=h; var c=cn.getContext('2d'); c.drawImage(im,0,0); // extra room in front for the chest
    var cx=(A.c[0]-0.04)*w, cy=(A.c[1]+0.02)*h, r=h*(key==='peck'?0.26:0.2);
    var t=document.createElement('canvas'); t.width=cn.width; t.height=h; var q=t.getContext('2d');
    q.translate(cx+r*(k-1)*0.55,cy); q.scale(k,1+(k-1)*0.5); q.drawImage(im,-cx,-cy); q.setTransform(1,0,0,1,0,0);
    q.globalCompositeOperation='destination-in'; var g=q.createRadialGradient(cx+r*0.45,cy,r*0.95,cx+r*0.45,cy,r*1.15); g.addColorStop(0,'#000'); g.addColorStop(1,'rgba(0,0,0,0)'); q.fillStyle=g; q.fillRect(0,0,t.width,h);
    c.drawImage(t,0,0); cache[id]=cn; return cn;
  }
  function marked(im,feats,key,col){
    var mk=null; for(var i=0;i<feats.length;i++) if(feats[i].indexOf('mk_')===0||feats[i]==='band') mk=feats[i];
    var big=feats.indexOf('crop')>=0?1.75:feats.indexOf('puff')>=0?1.22:0;
    if(big) return swell(im,key,col,big);
    if(!mk) return im; var id=mk+key+col+(AN_SHP?'s'+(AN_SHP.h[0]*1000|0):''); if(cache[id]) return cache[id];
    var w=im.width,h=im.height,cn=document.createElement('canvas'); cn.width=w; cn.height=h; var c=cn.getContext('2d'); c.drawImage(im,0,0);
    c.globalCompositeOperation='source-atop';
    var A=AN_SHP||AN[key], ink=col==='R'?'rgba(120,45,20,0.95)':'rgba(24,27,38,0.95)';
    function blot(p,rx,ry,rot){ c.save(); c.translate(p[0]*w,p[1]*h); c.rotate(rot||0); c.scale(rx*w,ry*h); var g=c.createRadialGradient(0,0,0.55,0,0,1); g.addColorStop(0,ink); g.addColorStop(0.72,ink); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(0,0,1,0,6.3); c.fill(); c.restore(); }
    // keep the markings translucent so the painted feathers show through
    c.globalCompositeOperation='source-atop';
    if(mk==='mk_nun'){ blot([A.h[0]-0.03,A.h[1]-0.01],0.2,0.15); blot([A.n[0]-0.02,A.n[1]+0.05],0.2,0.18); blot(A.tail,0.26,0.16); blot([0.2,A.t[1]-0.02],0.14,0.1); }
    else if(mk==='mk_helmet'){ blot([A.h[0]-0.03,A.h[1]-0.02],0.2,0.13); blot([A.h[0]-0.08,A.h[1]+0.03],0.14,0.09); blot(A.tail,0.26,0.15); }
    else if(mk==='mk_magpie'){ blot([A.h[0]-0.03,A.h[1]],0.18,0.15); blot(A.c,0.2,0.18); blot([0.45,A.t[1]-0.14],0.22,0.15); blot(A.tail,0.28,0.16); }
    else if(mk==='mk_swallow'){ blot([0.4,key==='fly'?0.36:key==='peck'?0.34:0.6],0.24,0.14,-0.5); blot(A.tail,0.16,0.1); blot([A.h[0],A.h[1]-0.05],0.1,0.06); }
    else if(mk==='band'){ c.fillStyle='rgba(235,190,40,0.95)'; c.fillRect((A.f[0]-0.09)*w,(A.f[1]-0.06)*h,0.2*w,0.025*h); }
    cache[id]=cn; return cn;
  }
  var FC={G:['#7d889c','#c3ccda','#333a49'],R:['#9c4a30','#e0b49a','#5b2a20'],W:['#d9d6cc','#ffffff','#b5b1a6']};
  function feather(c,x,y,ang,len,wid,fill,edge){ c.save(); c.translate(x,y); c.rotate(ang);
    var g=c.createLinearGradient(0,0,len,0); g.addColorStop(0,edge); g.addColorStop(0.35,fill); g.addColorStop(0.78,fill); g.addColorStop(0.92,edge); g.addColorStop(1,fill);
    c.beginPath(); c.moveTo(0,0); c.bezierCurveTo(len*0.35,-wid*0.7,len*1.02,-wid,len,0); c.bezierCurveTo(len*1.02,wid,len*0.35,wid*0.7,0,0); c.fillStyle=g; c.fill();
    c.globalAlpha=0.35; c.strokeStyle=edge; c.lineWidth=0.35; c.stroke(); c.beginPath(); c.moveTo(len*0.1,0); c.lineTo(len*0.9,0); c.stroke(); c.globalAlpha=1; c.restore(); }
  function features(c,feats,key,X,Y,W,H,col,front){
    var A=AN_SHP||AN[key], F=FC[col]||FC.G; function at(p){ return [X+p[0]*W,Y+p[1]*H]; }
    feats.forEach(function(f){ var p,i;
      if(f==='fan'&&!front){ p=at(A.t); for(i=0;i<15;i++){ feather(c,p[0],p[1],-3.45+i*0.155,H*(key==='peck'?0.8:0.62),H*0.075,i%2?F[1]:F[0],F[2]); } }
      if(f==='uptail'&&!front){ p=at(A.t); for(i=0;i<6;i++) feather(c,p[0],p[1],-2.35+i*0.11,H*0.52,H*0.05,i%2?F[1]:F[0],F[2]); }
      if(f==='crest'&&!front){ p=at([A.h[0]-0.06,A.h[1]]); for(i=0;i<6;i++) feather(c,p[0],p[1],-2.9+i*0.28,H*0.17,H*0.035,i%2?F[1]:F[0],F[2]); }
      if(f==='ruff'){ p=at([A.n[0]-0.04,A.n[1]-0.03]); if(!front){ for(i=0;i<16;i++) feather(c,p[0],p[1],-4.5+i*0.25,H*0.3,H*0.06,i%2?F[1]:F[0],F[2]); } else { for(i=0;i<7;i++) feather(c,p[0]-W*0.03,p[1]+H*0.04,0.9+i*0.24,H*0.19,H*0.04,i%2?F[1]:F[0],F[2]); } }
      if(f==='wattle'&&front){ p=at([A.h[0]+0.045,A.h[1]+0.01]); c.fillStyle='#f3ece4'; c.beginPath(); c.ellipse(p[0],p[1],H*0.04,H*0.032,0,0,6.3); c.fill(); c.strokeStyle='#c9bcae'; c.lineWidth=0.5; c.stroke(); }
      if(f==='rose'&&front){ p=at([A.h[0]+0.03,A.h[1]-0.04]); for(i=0;i<9;i++) feather(c,p[0],p[1],i*0.7,H*0.09,H*0.025,i%2?F[1]:F[0],F[2]); }
      if(f==='muff'&&front&&key!=='fly'){ p=at(A.f); for(i=0;i<9;i++) feather(c,p[0]+(i-4)*W*0.028,p[1]-H*0.09,1.2+(i-4)*0.18,H*0.13,H*0.03,i%2?F[1]:F[0],F[2]); }
    });
  }
  // small aviary bird: feet at (x,y)
  function small(c,x,y,s,k,face){
    c.save(); c.translate(x,y); c.scale((face||1)*k*(s.big||1),k*(s.big||1));
    function e(px,py,rx,ry,col,rot){ c.fillStyle=col; c.beginPath(); c.ellipse(px,py,rx,ry,rot||0,0,6.3); c.fill(); }
    c.strokeStyle='#8a5a50'; c.lineWidth=1; c.beginPath(); c.moveTo(-1,-4); c.lineTo(-1,0); c.moveTo(3,-4); c.lineTo(3,0); c.stroke();
    c.fillStyle=s.tail||s.wing; c.beginPath(); c.moveTo(-5,-9); c.lineTo(-6-s.len,-2); c.lineTo(-3-s.len,0); c.lineTo(-2,-5); c.fill();
    e(0,-9,8,6,s.body,-0.3); if(s.chest) e(4,-9,4,4.5,s.chest);
    e(6,-15,4.8,4.6,s.head);
    if(s.crest){ c.strokeStyle=s.head; c.lineWidth=1.4; for(var i=0;i<3;i++){ c.beginPath(); c.moveTo(5,-19); c.quadraticCurveTo(2-i*2,-24,-1-i*2,-25+i*2); c.stroke(); } }
    if(s.cheek) e(6.5,-13.5,2.2,2,s.cheek);
    c.fillStyle=s.beak; c.beginPath(); c.moveTo(9.5,-17); c.lineTo(14,-14.5); c.lineTo(9.5,-12.5); c.fill();
    e(7.5,-16.2,1.2,1.2,'#0c0c0c'); e(7.9,-16.6,0.4,0.4,'#fff');
    e(-2,-9,6,3.6,s.wing,-0.35);
    c.restore();
  }
  return {draw:draw,PAL:PAL,small:small};
})();
