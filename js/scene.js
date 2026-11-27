// Flat 2D scene (front-on farm, Hay Day style): projection, drawing, camera, picking.
// World: lateral axis = sim y, depth = sim x (squashed), height = sim z. No isometry.
BLS.Scene = (function(){
  var C=BLS.CFG, L=BLS.LAYOUT, Sim=BLS.Sim, Spr=BLS.Sprites;
  var U=64, ZU=64, D=22, WW=1030;
  var vigC=null, cv, ctx, W=800, H=600, dpr=1, cam={x:400,y:30,z:0.7,tx:null,ty:null,tz:null}, sel=-1, follow=false, pats={}, bgFall=null;
  var ambient=[]; for(var i=0;i<7;i++) ambient.push({x:-200+Math.random()*1400,y:-290-Math.random()*110,sp:30+Math.random()*30,ph:Math.random()*9,col:['W','G','G','R','G','W','G'][i]});
  var aviary=[]; for(var k=0;k<12;k++) aviary.push({u:Math.random(),v:Math.random(),c:['#f2d21e','#6cc04a','#e8892b','#4aa8e0','#f2d21e'][k%5],ph:Math.random()*9});
  // depth on screen: things behind the yard (loft roof area) are flattened onto the loft line
  function depY(x){ if(x<=2.6) return 2.2*D; if(x>=3.2) return x*D; var u=(x-2.6)/0.6; return (1-u)*2.2*D+u*x*D; }
  function P(x,y,z){ return [y*U, depY(x)-(z||0)*ZU]; }
  function rng(seed){ var s=seed; return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
  function shade(hex,f){ var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; r=Math.max(0,Math.min(255,r*f))|0; g=Math.max(0,Math.min(255,g*f))|0; b=Math.max(0,Math.min(255,b*f))|0; return 'rgb('+r+','+g+','+b+')'; }
  function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function blob(c,x,y,r,col){ var g=c.createRadialGradient(x-r*0.3,y-r*0.35,r*0.1,x,y,r); g.addColorStop(0,shade(col,1.35)); g.addColorStop(1,shade(col,0.72)); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,6.3); c.fill(); }
  function bush(c,x,y,r,col,seed){ var R=rng(seed||7); for(var i=0;i<9;i++){ blob(c,x+(R()-0.5)*r*1.6,y-R()*r*0.8,r*(0.42+R()*0.32),col); } }
  function shadow(c,x,y,rx,ry,a){ c.fillStyle='rgba(30,20,10,'+a+')'; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,6.3); c.fill(); }
  function pattern(name){ if(pats[name]) return pats[name]; var im=BLS.Art&&BLS.Art.tex(name); if(!im) return null; var p=ctx.createPattern(im,'repeat'); pats[name]=p; return p; }
  function fillTex(c,name,fallback,x,y,w,h,sx,sy){ var p=pattern(name); if(p&&p.setTransform){ p.setTransform(new DOMMatrix().translate(x,y).scale(sx,sy)); c.fillStyle=p; } else c.fillStyle=fallback; c.fillRect(x,y,w,h); }
  // --- loft geometry (world px)
  var LOFT={x0:1.0*U, x1:5.8*U, base:2.2*D+4, bodyTop:2.2*D+4-2.2*ZU, roofTop:2.2*D+4-2.72*ZU};
  function nestRect(n){ var np=L.nestPos(n), cx=np.y*U, hw=0.46*U, zb=np.z-0.04, p0=P(2.2,0,zb), p1=P(2.2,0,zb+0.7); return {x:cx-hw,y:p1[1]+4,w:hw*2,h:p0[1]-p1[1]-4}; }
  function drawLoft(c,G){
    var x0=LOFT.x0, x1=LOFT.x1, bt=LOFT.bodyTop, bb=LOFT.base, w=x1-x0;
    shadow(c,(x0+x1)/2+10,bb+4,w/2+30,11,0.28);
    // body
    fillTex(c,'wood','#9a6a3c',x0,bt,w,bb-bt,0.5,0.5); c.fillStyle='rgba(40,20,5,0.18)'; c.fillRect(x0,bt,w,bb-bt);
    // base crates strip
    c.fillStyle='rgba(30,15,5,0.35)'; c.fillRect(x0,bb-22,w,22); fillTex(c,'wood','#7a5230',x0,bb-20,w,20,0.4,0.4);
    // posts
    c.fillStyle='#5b3a1c'; c.fillRect(x0-6,bt-4,12,bb-bt+8); c.fillRect(x1-6,bt-4,12,bb-bt+8); c.fillRect(x0,bt+0,w,6);
    // cubbies
    for(var n=0;n<C.NEST_COUNT;n++){
      var r=nestRect(n), open=n<G.nestsOpen;
      c.fillStyle='#3a2410'; rrect(c,r.x-4,r.y-4,r.w+8,r.h+8,8); c.fill();
      if(open){ var g=c.createLinearGradient(0,r.y,0,r.y+r.h); g.addColorStop(0,'#241508'); g.addColorStop(1,'#3d2812'); c.fillStyle=g; rrect(c,r.x,r.y,r.w,r.h,6); c.fill();
        c.fillStyle='#d4b25a'; c.beginPath(); c.moveTo(r.x+6,r.y+r.h); c.quadraticCurveTo(r.x+r.w/2,r.y+r.h-14,r.x+r.w-6,r.y+r.h); c.closePath(); c.fill();
        c.strokeStyle='rgba(240,210,120,0.55)'; c.lineWidth=1.5; for(var s=0;s<6;s++){ c.beginPath(); c.moveTo(r.x+8+s*8,r.y+r.h-2); c.lineTo(r.x+14+s*7,r.y+r.h-10); c.stroke(); }
      } else { fillTex(c,'wood','#8a6236',r.x,r.y,r.w,r.h,0.45,0.45); c.fillStyle='rgba(0,0,0,0.25)'; c.fillRect(r.x,r.y,r.w,r.h); c.strokeStyle='rgba(30,15,5,0.7)'; c.lineWidth=2; for(var pl=r.y+r.h*0.25;pl<r.y+r.h;pl+=r.h*0.25){ c.beginPath(); c.moveTo(r.x,pl); c.lineTo(r.x+r.w,pl); c.stroke(); }
        var lx=r.x+r.w/2, ly=r.y+r.h/2; c.fillStyle='#ffd35a'; rrect(c,lx-8,ly-3,16,12,2); c.fill(); c.strokeStyle='#ffd35a'; c.lineWidth=3; c.beginPath(); c.arc(lx,ly-3,5,Math.PI,0); c.stroke(); }
    }
    // roof
    var ry=bt, rt=LOFT.roofTop;
    c.save(); c.beginPath(); c.moveTo(x0-34,ry+4); c.lineTo(x1+34,ry+4); c.lineTo(x1+10,rt); c.lineTo(x0-10,rt); c.closePath(); c.clip();
    fillTex(c,'roof','#8a9096',x0-40,rt,w+80,ry-rt+8,0.5,0.5); c.restore();
    c.strokeStyle='rgba(30,20,10,0.55)'; c.lineWidth=3; c.beginPath(); c.moveTo(x0-34,ry+4); c.lineTo(x1+34,ry+4); c.stroke();
    c.fillStyle='rgba(0,0,0,0.22)'; c.fillRect(x0-30,ry+6,w+60,8);
    // lantern
    c.fillStyle='#ffd77a'; c.beginPath(); c.arc(x0+w*0.5,ry+22,0,0,6.3); c.fill();
  }
  function drawTank(c){ var x=6.5*U, b=LOFT.base+2; c.fillStyle='#5a6065'; [-22,22].forEach(function(o){ c.fillRect(x+o-3,b-48,6,48); });
    var g=c.createLinearGradient(x-34,0,x+34,0); g.addColorStop(0,'#6f777d'); g.addColorStop(0.45,'#c3cbd1'); g.addColorStop(1,'#6a7278'); c.fillStyle=g; c.fillRect(x-34,b-130,68,84); c.beginPath(); c.ellipse(x,b-46,34,8,0,0,6.3); c.fill(); c.fillStyle='#d4dade'; c.beginPath(); c.ellipse(x,b-130,34,8,0,0,6.3); c.fill();
    c.strokeStyle='rgba(40,50,55,0.35)'; c.lineWidth=1.5; for(var q=-110;q<-50;q+=20){ c.beginPath(); c.ellipse(x,b+q,34,7,0,0,Math.PI); c.stroke(); } }
  function drawAviary(c,t){ var x0=12.3*U, x1=15.7*U, yb=3.9*D+10, yt=yb-150, w=x1-x0;
    shadow(c,(x0+x1)/2,yb+2,w/2+10,9,0.25);
    c.fillStyle='rgba(180,200,210,0.16)'; c.fillRect(x0,yt,w,yb-yt);
    c.strokeStyle='rgba(120,135,145,0.55)'; c.lineWidth=1; for(var gx=x0;gx<=x1;gx+=14){ c.beginPath(); c.moveTo(gx,yt); c.lineTo(gx,yb); c.stroke(); } for(var gy=yt;gy<=yb;gy+=14){ c.beginPath(); c.moveTo(x0,gy); c.lineTo(x1,gy); c.stroke(); }
    // perches + budgies inside
    c.strokeStyle='#7a5530'; c.lineWidth=4; [[0.7],[0.4]].forEach(function(p){ c.beginPath(); c.moveTo(x0+8,yt+(yb-yt)*p[0]); c.lineTo(x1-8,yt+(yb-yt)*p[0]); c.stroke(); });
    c.strokeStyle='#4d5560'; c.lineWidth=5; c.strokeRect(x0,yt,w,yb-yt); c.fillStyle='#4d5560'; c.fillRect(x0-4,yt-8,w+8,8);
    c.fillStyle='rgba(255,255,255,0.08)'; c.fillRect(x0,yt,w,yb-yt);
  }
  function drawBudgies(c,t){ var x0=12.3*U, x1=15.7*U, yb=3.9*D+10, yt=yb-150, w=x1-x0;
    aviary.forEach(function(a){ var px=x0+14+a.u*(w-28), py=yt+30+Math.floor(a.v*3)*38+Math.sin(t*2+a.ph)*2; c.fillStyle=a.c; c.beginPath(); c.ellipse(px,py,5,7,0.2,0,6.3); c.fill(); c.beginPath(); c.arc(px+3,py-8,3.4,0,6.3); c.fill(); c.fillStyle='#222'; c.fillRect(px+4,py-9,1.5,1.5); });
  }
  function drawSacks(c){ var b=3.25*D+6, base=0.55*U; [[base,0,1],[base+52,2,0.9],[base+24,-30,0.85]].forEach(function(s){ var x=s[0], y=b+s[1], k=s[2]; shadow(c,x,y+2,34*k,8*k,0.25);
      var g=c.createLinearGradient(x-30*k,0,x+30*k,0); g.addColorStop(0,'#c9a56a'); g.addColorStop(0.5,'#ead3a0'); g.addColorStop(1,'#b08a50'); c.fillStyle=g; c.beginPath(); c.moveTo(x-28*k,y); c.quadraticCurveTo(x-36*k,y-40*k,x-18*k,y-64*k); c.lineTo(x+18*k,y-64*k); c.quadraticCurveTo(x+36*k,y-40*k,x+28*k,y); c.closePath(); c.fill();
      c.fillStyle='#9a7640'; c.beginPath(); c.ellipse(x,y-64*k,19*k,6*k,0,0,6.3); c.fill(); c.fillStyle='#d7a63a'; c.beginPath(); c.arc(x,y-30*k,10*k,0,6.3); c.fill(); }); }
  function drawBed(c){ var x0=8.3*U, x1=11.9*U, yb=9.6*D+16, w=x1-x0, h=34;
    shadow(c,(x0+x1)/2,yb+2,w/2+8,9,0.25);
    var R=rng(5); for(var i=0;i<18;i++){ var px=x0+10+R()*(w-20); bush(c,px,yb-h-4-R()*14,16+R()*10,i%3?'#58a83c':'#78c04a',i+3); if(i%4===0){ c.fillStyle=['#ff6f91','#ffd23f','#fff'][i%3]; c.beginPath(); c.arc(px+6,yb-h-28-R()*10,3.5,0,6.3); c.fill(); } }
    fillTex(c,'brick','#b0522f',x0,yb-h,w,h,0.4,0.4); c.fillStyle='rgba(60,25,10,0.25)'; c.fillRect(x0,yb-h,w,h);
    c.fillStyle='#d9b98c'; c.fillRect(x0-4,yb-h-6,w+8,8); }
  function drawPot(c,x,y,r,seed){ shadow(c,x,y+1,18,5,0.22); c.fillStyle='#b4643b'; c.beginPath(); c.moveTo(x-14,y-26); c.lineTo(x+14,y-26); c.lineTo(x+10,y); c.lineTo(x-10,y); c.fill(); bush(c,x,y-34,r,'#4f9a3a',seed); }
  // --- pieces that are drawn per frame (depth sorted)
  function drawFeeder(c,G){ var p=P(L.feeder.x,L.feeder.y,0), rx=26; shadow(c,p[0],p[1]+3,rx+6,12,0.22);
    c.fillStyle='#8a6a3f'; c.beginPath(); c.ellipse(p[0],p[1],rx,12,0,0,6.3); c.fill(); c.fillStyle='#5e4528'; c.beginPath(); c.ellipse(p[0],p[1]-3,rx-6,9,0,0,6.3); c.fill();
    var f=Math.min(1,G.feeder.grain/C.FEEDER_CAP); if(f>0.02){ c.fillStyle='#e0b53a'; c.beginPath(); c.ellipse(p[0],p[1]-3-f*6,(rx-8)*Math.max(0.4,f),8*Math.max(0.5,f),0,0,6.3); c.fill(); c.fillStyle='rgba(255,230,140,0.6)'; for(var i=0;i<8;i++) c.fillRect(p[0]-14+((i*13)%28),p[1]-8-f*5+((i*7)%6),2,1.5); } }
  function drawWater(c,G){ var p=P(L.water.x,L.water.y,0); shadow(c,p[0],p[1]+3,26,8,0.22);
    c.fillStyle='#b32424'; c.beginPath(); c.ellipse(p[0],p[1],22,8,0,0,6.3); c.fill(); c.fillStyle='#8c1a1a'; c.beginPath(); c.ellipse(p[0],p[1]-3,17,6,0,0,6.3); c.fill();
    var w=Math.min(1,G.water.amt/C.WATER_CAP); c.fillStyle='rgba(235,245,250,0.88)'; c.beginPath(); c.moveTo(p[0]-11,p[1]-6); c.quadraticCurveTo(p[0]-14,p[1]-44,p[0],p[1]-52); c.quadraticCurveTo(p[0]+14,p[1]-44,p[0]+11,p[1]-6); c.closePath(); c.fill();
    c.fillStyle='rgba(90,170,230,0.78)'; var wh=40*w; c.fillRect(p[0]-11.5,p[1]-6-wh,23,wh*0.95); c.strokeStyle='rgba(120,140,150,0.6)'; c.lineWidth=1; c.stroke(); }
  function drawPerch(c,sp){ var a=P(sp[0],sp[1],0), top=P(sp[0],sp[1],0.95); shadow(c,a[0],a[1]+1,24,7,0.22); c.strokeStyle='#6b4526'; c.lineWidth=6; c.lineCap='round'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(top[0],top[1]); c.stroke(); c.lineWidth=5; c.beginPath(); c.moveTo(top[0]-24,top[1]); c.lineTo(top[0]+24,top[1]); c.stroke(); }
  function poseOf(b){ var st=b.st; if(st==='eat'||st==='drink'||st==='peck') return 'peck'; if(st==='walk') return 'walk'; if(st==='fly') return 'fly'; if(st==='sit'||st==='perch') return 'sit'; if(st==='squabnest') return 'squab'; if(st==='preen') return 'preen'; if(st==='coo') return 'coo'; return 'stand'; }
  function szOf(b){ if(b.st==='fly') return 0.95; if(b.st==='sit') return 0.78; if(b.st==='squabnest') return 0.95; return 0.85; }
  function drawBirdW(c,b){
    var sz=szOf(b), p=P(b.x,b.y,b.z), stg=Sim.stageOf(b), gp=P(b.x,b.y,0);
    var sc=(stg==='adult'?1:stg==='juvenile'?0.78:0.5);
    if(b.st!=='sit'&&b.st!=='squabnest') shadow(c,gp[0],gp[1]+1,16*sz*sc/1.2*Math.max(0.5,1-b.z*0.25),5*sz*sc/1.2,Math.max(0.1,0.3-b.z*0.06));
    if(b.id===sel){ c.strokeStyle='#ffe27a'; c.lineWidth=3; c.beginPath(); c.ellipse(gp[0],gp[1]+1,26*sz*sc/1.3+4,8*sz*sc/1.3+2,0,0,6.3); c.stroke(); }
    Spr.draw(c,p[0],p[1],sz,b.face,{col:BLS.Gen.phenoColor(b.g),pat:BLS.Gen.phenoPattern(b.g),pose:poseOf(b),ph:b.ph,stage:stg});
    var hgt=50*sz*sc;
    if(b.hunger>75||b.thirst>75){ var bx=p[0], by=p[1]-hgt-14; c.fillStyle='rgba(20,15,5,0.85)'; c.beginPath(); c.arc(bx,by,11,0,6.3); c.fill(); c.strokeStyle='#ffcf33'; c.lineWidth=1.8; c.stroke(); c.fillStyle=b.thirst>b.hunger?'#6ec6ff':'#ffcf33'; c.beginPath();
      if(b.thirst>b.hunger){ c.moveTo(bx,by-6); c.quadraticCurveTo(bx+6,by+1,bx,by+5); c.quadraticCurveTo(bx-6,by+1,bx,by-6); } else { c.ellipse(bx,by,3.2,6,0,0,6.3); } c.fill(); }
    if(b.id===sel){ c.font='bold 14px system-ui,sans-serif'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,0.75)'; c.strokeText(b.name,p[0],p[1]-hgt-(b.hunger>75||b.thirst>75?32:12)); c.fillStyle='#fff'; c.fillText(b.name,p[0],p[1]-hgt-(b.hunger>75||b.thirst>75?32:12)); }
  }
  function drawEgg(c,e,idx){ var np=L.nestPos(e.nest), r=nestRect(e.nest), x=r.x+r.w*(idx%2?0.66:0.34), y=r.y+r.h-9; c.save(); c.translate(x,y);
    var g=c.createRadialGradient(-2,-6,1,0,-4,10); g.addColorStop(0,e.dead?'#b7b2a4':'#fffdf4'); g.addColorStop(1,e.dead?'#7f7a6c':'#d9d0b6'); c.fillStyle=g; c.beginPath(); c.ellipse(0,-4,6.5,8.5,0,0,6.3); c.fill(); c.restore(); }
  // --- background
  function drawBackdrop(c){
    var tb=BLS.Art&&(BLS.Art.tex('town'+(BLS.Sim.G?BLS.Sim.season():0))||BLS.Art.tex('town'));
    if(tb){ var k=Math.max(W/tb.width,H/tb.height)*1.06, dw=tb.width*k, dh=tb.height*k, sh=(cam.x-WW/2)*0.04; c.drawImage(tb,(W-dw)/2-sh,Math.min(0,(H-dh)*0.18),dw,dh); return; }
    var g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#6fa4d4'); g.addColorStop(0.5,'#f6d9a4'); g.addColorStop(1,'#8fb35a'); c.fillStyle=g; c.fillRect(0,0,W,H);
  }
  function drawGround(c){
    var gy=2.0*D, R=rng(21);
    // back wall
    fillTex(c,'brick','#b0522f',-700,gy-86,2500,86,0.42,0.42); c.fillStyle='rgba(50,20,8,0.22)'; c.fillRect(-700,gy-86,2500,86);
    c.fillStyle='#e2c696'; c.fillRect(-700,gy-96,2500,12); c.fillStyle='rgba(0,0,0,0.18)'; c.fillRect(-700,gy-84,2500,6);
    // paving (squashed texture for a 2D top view)
    fillTex(c,'floor','#cdb68f',-700,gy,2500,1400,0.62,0.4);
    var sg=c.createLinearGradient(0,gy,0,gy+160); sg.addColorStop(0,'rgba(40,25,10,0.38)'); sg.addColorStop(1,'rgba(40,25,10,0)'); c.fillStyle=sg; c.fillRect(-700,gy,2500,160);
    // grass strip along the front, flowers
    var fy=12.4*D; var gg=c.createLinearGradient(0,fy,0,fy+300); gg.addColorStop(0,'#78c04a'); gg.addColorStop(1,'#4f9a3a'); c.fillStyle=gg; c.beginPath(); c.moveTo(-700,fy+8); for(var x=-700;x<=1800;x+=40) c.lineTo(x,fy+Math.sin(x*0.05)*6); c.lineTo(1800,fy+700); c.lineTo(-700,fy+700); c.closePath(); c.fill();
    for(var i=0;i<46;i++){ var px=-100+R()*1250, py=fy+14+R()*70; c.fillStyle=['#ff6f91','#ffd23f','#ffffff','#8fd4ff'][i%4]; c.beginPath(); c.arc(px,py,3.5,0,6.3); c.fill(); }
  }
  // --- cached static layers (the expensive scenery is painted once, not every frame)
  var BK={x:-300,y:-340,w:1630,h:1240}, S=1.25, layer0=null, layerBed=null, bakedNests=-1;
  function bake(w,h,ox,oy,fn){ var cn=document.createElement('canvas'); cn.width=Math.ceil(w*S); cn.height=Math.ceil(h*S); var c=cn.getContext('2d'); c.setTransform(S,0,0,S,-ox*S,-oy*S); fn(c); return cn; }
  function buildLayers(G){
    layer0=bake(BK.w,BK.h,BK.x,BK.y,function(c){ drawGround(c); drawPot(c,0.3*U,3.0*D+10,22,3); drawPot(c,7.2*U,3.1*D+10,20,4); drawLoft(c,G); drawTank(c); drawAviary(c,0); drawSacks(c); });
    layerBed=bake(520,200,7.9*U,9.6*D-120,function(c){ drawBed(c); });
    bakedNests=G.nestsOpen; }
  // --- camera
  function resize(){ dpr=Math.min(2,window.devicePixelRatio||1); W=window.innerWidth; H=window.innerHeight; cv.width=W*dpr; cv.height=H*dpr; }
  function fitZoom(){ return Math.max(0.6,Math.min(1.6,W/410)); }
  function toScreen(wx,wy,wz){ var p=P(wx,wy,wz); return [(p[0]-cam.x)*cam.z+W/2,(p[1]-cam.y)*cam.z+H/2]; }
  function clampCam(){
    cam.z=Math.max(fitZoom()*0.7,Math.min(2.0,cam.z)); var hw=W/2/cam.z;
    cam.x=(WW<=2*hw)?WW/2:Math.max(hw,Math.min(WW-hw,cam.x)); cam.y=Math.max(-160,Math.min(200,cam.y));
  }
  function focus(wx,wy,wz,z){ var p=P(wx,wy,wz); cam.tx=p[0]; cam.ty=p[1]+(sheetOpen()?H*0.28/cam.z:0); if(z) cam.tz=Math.min(z,1.6); }
  function center(){ cam.tx=4.2*U; cam.ty=20; cam.tz=fitZoom(); follow=false; }
  function sheetOpen(){ return !document.getElementById('sheet').classList.contains('hidden'); }
  function tint(h){ var n=[100,115,175],w=[255,255,255],d=[255,196,150];
    function mix(a,b,u){ return [a[0]+(b[0]-a[0])*u|0,a[1]+(b[1]-a[1])*u|0,a[2]+(b[2]-a[2])*u|0]; }
    var c; if(h<5) c=n; else if(h<7) c=mix(n,d,(h-5)/2); else if(h<9) c=mix(d,w,(h-7)/2); else if(h<16.5) c=w; else if(h<19) c=mix(w,d,(h-16.5)/2.5); else if(h<21) c=mix(d,n,(h-19)/2); else c=n;
    return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; }
  function frame(now){
    var G=Sim.G; if(!G) return;
    var c=ctx; c.setTransform(dpr,0,0,dpr,0,0);
    if(cam.tx!==null){ cam.x+=(cam.tx-cam.x)*0.15; cam.y+=(cam.ty-cam.y)*0.15; if(cam.tz) cam.z+=(cam.tz-cam.z)*0.15; if(Math.abs(cam.tx-cam.x)<0.5&&Math.abs(cam.ty-cam.y)<0.5){ cam.tx=null; cam.tz=null; } }
    if(follow&&sel>=0){ var fb=Sim.bird(sel); if(fb){ var fp=P(fb.x,fb.y,fb.z); cam.x+=(fp[0]-cam.x)*0.1; cam.y+=(fp[1]-cam.y+(sheetOpen()?H*0.28/cam.z:0))*0.1; } }
    clampCam();
    drawBackdrop(c);
    c.setTransform(cam.z*dpr,0,0,cam.z*dpr,(W/2-cam.x*cam.z)*dpr,(H/2-cam.y*cam.z)*dpr);
    var t=now/1000;
    if(!layer0||bakedNests!==G.nestsOpen) buildLayers(G);
    c.drawImage(layer0,BK.x,BK.y,BK.w,BK.h); drawBudgies(c,t);
    var cnt={}; G.eggs.forEach(function(e){ cnt[e.nest]=(cnt[e.nest]||0)+1; drawEgg(c,e,cnt[e.nest]-1); });
    var items=[];
    items.push({k:L.feeder.x,f:function(){ drawFeeder(c,G); }}); items.push({k:L.water.x,f:function(){ drawWater(c,G); }}); items.push({k:9.4,f:function(){ c.drawImage(layerBed,7.9*U,9.6*D-120,520,200); }});
    G.perches.forEach(function(pi){ var sp=L.perchSpots[pi]; items.push({k:sp[0]-0.1,f:function(){ drawPerch(c,sp); }}); });
    G.birds.forEach(function(b){ if(b.st!=='fly') items.push({k:(b.st==='sit'||b.st==='squabnest')?2.3:(b.x<3.2&&b.z>0.3?2.4:b.x),f:function(){ drawBirdW(c,b); }}); });
    items.sort(function(a,b){return a.k-b.k;}); items.forEach(function(i){ i.f(); });
    G.birds.forEach(function(b){ if(b.st==='fly') drawBirdW(c,b); });
    ambient.forEach(function(a){ a.x+=a.sp*0.016; if(a.x>1300){ a.x=-250; a.y=-290-Math.random()*110; } Spr.draw(c,a.x,a.y+Math.sin(t+a.ph)*14,0.9,1,{col:a.col,pat:'B',pose:'fly',ph:t+a.ph}); });
    c.setTransform(dpr,0,0,dpr,0,0);
    if(!vigC||vigC.width!==cv.width||vigC.height!==cv.height){ vigC=document.createElement('canvas'); vigC.width=cv.width; vigC.height=cv.height; var vc=vigC.getContext('2d'); vc.scale(dpr,dpr); var vg=vc.createRadialGradient(W/2,H*0.5,Math.min(W,H)*0.5,W/2,H*0.5,Math.max(W,H)*0.8); vg.addColorStop(0,'rgba(20,12,0,0)'); vg.addColorStop(1,'rgba(20,12,0,0.3)'); vc.fillStyle=vg; vc.fillRect(0,0,W,H); }
    c.drawImage(vigC,0,0,W,H);
    var sn=BLS.Sim.G?BLS.Sim.season():0, stint=['rgba(120,220,120,0.07)','rgba(255,210,90,0.08)','rgba(230,120,30,0.12)','rgba(170,200,255,0.18)'][sn]; c.fillStyle=stint; c.fillRect(0,0,W,H);
    if(sn===3||sn===2||(BLS.Sim.G&&BLS.Sim.G.weather==='rain')){ var n=sn===3?40:sn===2?16:60, tm=performance.now()/1000; c.fillStyle=sn===3?'rgba(255,255,255,0.85)':sn===2?'rgba(214,120,40,0.8)':'rgba(190,210,235,0.5)';
      for(var pi=0;pi<n;pi++){ var sp=sn===3?40:sn===2?55:420, px=((pi*97.3+tm*(sn===1?0:18)*(pi%3+1))%(W+40))-20, py=((pi*53.7+tm*sp*(0.6+(pi%5)*0.15))%(H+20)); if(sn===3||sn===2){ c.beginPath(); c.arc(px,py,sn===3?2.2:2.8,0,6.3); c.fill(); } else c.fillRect(px,py,1.2,9); } }
    var h=Sim.hourOfDay(), tc=tint(h); if(tc!=='rgb(255,255,255)'){ c.globalCompositeOperation='multiply'; c.fillStyle=tc; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; }
  }
  // --- picking
  function pick(sx,sy){
    var G=Sim.G, best=null, bd=1e9;
    G.birds.forEach(function(b){ var stg=Sim.stageOf(b), p=toScreen(b.x,b.y,b.z), sc=(stg==='adult'?1:stg==='juvenile'?0.78:0.5), hgt=50*szOf(b)*sc; var r=Math.max(hgt*0.55,16)*cam.z+10, cy=p[1]-hgt*0.5*cam.z; var d=Math.hypot(p[0]-sx,cy-sy); if(d<r&&d<bd){ bd=d; best={type:'bird',id:b.id}; } });
    if(best) return best;
    for(var n=0;n<C.NEST_COUNT;n++){ var r2=nestRect(n); var x0=(r2.x-cam.x)*cam.z+W/2, y0=(r2.y-cam.y)*cam.z+H/2, x1=x0+r2.w*cam.z, y1=y0+r2.h*cam.z; if(sx>=x0-4&&sx<=x1+4&&sy>=y0-4&&sy<=y1+4) return {type:'nest',n:n}; }
    var f=toScreen(L.feeder.x,L.feeder.y,0); if(Math.abs(sx-f[0])<42*cam.z&&Math.abs(sy-f[1])<22*cam.z) return {type:'feeder'};
    var w=toScreen(L.water.x,L.water.y,0); if(Math.abs(sx-w[0])<26*cam.z&&sy<w[1]+10*cam.z&&sy>w[1]-56*cam.z) return {type:'water'};
    var sk=[(0.55*U+20-cam.x)*cam.z+W/2,(3.25*D+6-30-cam.y)*cam.z+H/2]; if(Math.hypot(sx-sk[0],sy-sk[1])<62*cam.z) return {type:'sacks'};
    return null;
  }
  function init(canvas){
    cv=canvas; ctx=cv.getContext('2d',{alpha:false}); resize(); window.addEventListener('resize',function(){ resize(); });
    cam.z=fitZoom(); cam.x=4.2*U; cam.y=20;
    var ptrs={}, moved=false, startPos=null, lastPinch=0;
    function pts(){ return Object.keys(ptrs).map(function(k){return ptrs[k];}); }
    cv.addEventListener('pointerdown',function(e){ cv.setPointerCapture(e.pointerId); ptrs[e.pointerId]={x:e.clientX,y:e.clientY}; if(pts().length===1){ moved=false; startPos={x:e.clientX,y:e.clientY}; } else { moved=true; lastPinch=0; } cam.tx=null; });
    cv.addEventListener('pointermove',function(e){ var p=ptrs[e.pointerId]; if(!p) return; var ps=pts();
      if(ps.length===1){ var dx=e.clientX-p.x, dy=e.clientY-p.y; if(!moved&&Math.hypot(e.clientX-startPos.x,e.clientY-startPos.y)>8) moved=true; if(moved){ cam.x-=dx/cam.z; cam.y-=dy/cam.z; follow=false; } p.x=e.clientX; p.y=e.clientY; }
      else if(ps.length>=2){ p.x=e.clientX; p.y=e.clientY; var d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y); if(lastPinch) cam.z*=d/lastPinch; lastPinch=d; } });
    function up(e){ var was=ptrs[e.pointerId]; delete ptrs[e.pointerId]; lastPinch=0; if(was&&!moved&&Object.keys(ptrs).length===0){ var hit=pick(e.clientX,e.clientY); if(BLS.UI) BLS.UI.onPick(hit); } }
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',function(e){ delete ptrs[e.pointerId]; });
    cv.addEventListener('wheel',function(e){ e.preventDefault(); cam.z*=e.deltaY<0?1.1:0.9; },{passive:false});
    var running=true; function loop(now){ if(document.hidden){ running=false; return; } frame(now); requestAnimationFrame(loop); }
    document.addEventListener('visibilitychange',function(){ if(!document.hidden&&!running){ running=true; requestAnimationFrame(loop); } });
    requestAnimationFrame(loop);
  }
  return { init:init, focus:focus, center:center, cam:cam, fitZoom:fitZoom, select:function(id){ sel=id; if(id<0) follow=false; }, setFollow:function(v){ follow=v; }, isFollow:function(){return follow;}, get sel(){return sel;}, toScreen:toScreen, pick:pick, rebuild:function(){ pats={}; layer0=null; } };
})();
