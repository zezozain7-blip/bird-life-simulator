// Flat 2D scene (front-on farm, Hay Day style): projection, drawing, camera, picking.
// World: lateral axis = sim y, depth = sim x (squashed), height = sim z. No isometry.
BLS.Scene = (function(){
  var C=BLS.CFG, L=BLS.LAYOUT, Sim=BLS.Sim, Spr=BLS.Sprites;
  var U=64, ZU=64, D=22, WW=1030;
  var vigC=null, cv, ctx, W=800, H=600, dpr=1, cam={x:400,y:30,z:0.7,tx:null,ty:null,tz:null}, sel=-1, follow=false, home=null, hReady=false, pats={}, bgFall=null;
  var ambient=[]; for(var i=0;i<7;i++) ambient.push({x:-200+Math.random()*1400,y:-290-Math.random()*110,sp:30+Math.random()*30,ph:Math.random()*9,col:['W','G','G','R','G','W','G'][i]});
  var lastNow=0;
  // depth on screen: things behind the yard (loft roof area) are flattened onto the loft line
  function depY(x){ if(x<=2.6) return 2.2*D; if(x>=3.2) return x*D; var u=(x-2.6)/0.6; return (1-u)*2.2*D+u*x*D; }
  function P(x,y,z){ return [y*U, depY(x)-(z||0)*ZU]; }
  function rng(seed){ var s=seed; return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
  function shade(hex,f){ var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; r=Math.max(0,Math.min(255,r*f))|0; g=Math.max(0,Math.min(255,g*f))|0; b=Math.max(0,Math.min(255,b*f))|0; return 'rgb('+r+','+g+','+b+')'; }
  function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function blob(c,x,y,r,col){ var g=c.createRadialGradient(x-r*0.3,y-r*0.35,r*0.1,x,y,r); g.addColorStop(0,shade(col,1.35)); g.addColorStop(1,shade(col,0.72)); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,6.3); c.fill(); }
  function bush(c,x,y,r,col,seed){ var R=rng(seed||7); for(var i=0;i<9;i++){ blob(c,x+(R()-0.5)*r*1.6,y-R()*r*0.8,r*(0.42+R()*0.32),col); } }
  function shadow(c,x,y,rx,ry,a){ var h=Sim.hourOfDay(), dx=Math.max(-1,Math.min(1,(h-12.5)/5.5)), day=h>6&&h<19; if(day){ x+=dx*rx*0.35; rx*=1+Math.abs(dx)*0.25; } c.fillStyle='rgba(30,20,10,'+(day?a:a*0.5)+')'; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,6.3); c.fill(); }
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
        var lx=r.x+r.w/2, ly=r.y+r.h/2; c.fillStyle='#b89452'; rrect(c,lx-8,ly-3,16,12,2); c.fill(); c.strokeStyle='#b89452'; c.lineWidth=3; c.beginPath(); c.arc(lx,ly-3,5,Math.PI,0); c.stroke(); }
    }
    // roof
    var ry=bt, rt=LOFT.roofTop;
    c.save(); c.beginPath(); c.moveTo(x0-34,ry+4); c.lineTo(x1+34,ry+4); c.lineTo(x1+10,rt); c.lineTo(x0-10,rt); c.closePath(); c.clip();
    fillTex(c,'roof','#8a9096',x0-40,rt,w+80,ry-rt+8,0.5,0.5); c.restore();
    c.strokeStyle='rgba(30,20,10,0.55)'; c.lineWidth=3; c.beginPath(); c.moveTo(x0-34,ry+4); c.lineTo(x1+34,ry+4); c.stroke();
    c.fillStyle='rgba(0,0,0,0.22)'; c.fillRect(x0-30,ry+6,w+60,8);
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
  function drawAviaryBirds(c,G,t){ var x0=12.3*U, x1=15.7*U, yb=3.9*D+10, yt=yb-150, w=x1-x0, a=G.av||{}, n=0;
    for(var k in a){ var s=BLS.SPECIES[k]; if(!s) continue; for(var i=0;i<a[k]&&n<24;i++,n++){ var col=n%6, row=(n/6)|0; // 3 rows on perches and floor
          var px=x0+22+col*(w-44)/5+((row%2)?9:-5), py=[yt+(yb-yt)*0.4,yt+(yb-yt)*0.7,yb-4,yt+(yb-yt)*0.18][row]; Spr.small(c,px,py+Math.sin(t*2+n*1.7)*1.2,s,0.9,Math.sin(t*0.35+n*2.3)>0?1:-1); } }
    c.font='bold 13px system-ui,sans-serif'; c.textAlign='center'; var label=BLS.T('aviary')+' '+n+'/'+BLS.AVIARY_CAP; var tw=c.measureText(label).width+18; c.fillStyle='rgba(35,22,10,0.88)'; rrect(c,(x0+x1)/2-tw/2,yt-34,tw,22,8); c.fill(); c.fillStyle='#ffe3a0'; c.fillText(label,(x0+x1)/2,yt-19); }
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
  function drawFeeder(c,G,u,pos){ u=u||G.feeder; pos=pos||L.feeder; var p=P(pos.x,pos.y,0), rx=26; shadow(c,p[0],p[1]+3,rx+6,12,0.22);
    c.fillStyle='#8a6a3f'; c.beginPath(); c.ellipse(p[0],p[1],rx,12,0,0,6.3); c.fill(); c.fillStyle='#5e4528'; c.beginPath(); c.ellipse(p[0],p[1]-3,rx-6,9,0,0,6.3); c.fill();
    var f=Math.min(1,u.grain/Sim.feederCap()); if(f>0.02){ c.fillStyle='#e0b53a'; c.beginPath(); c.ellipse(p[0],p[1]-3-f*6,(rx-8)*Math.max(0.4,f),8*Math.max(0.5,f),0,0,6.3); c.fill(); c.fillStyle='rgba(255,230,140,0.6)'; for(var i=0;i<8;i++) c.fillRect(p[0]-14+((i*13)%28),p[1]-8-f*5+((i*7)%6),2,1.5); } }
  function drawWater(c,G,u,pos){ u=u||G.water; pos=pos||L.water; var p=P(pos.x,pos.y,0); shadow(c,p[0],p[1]+3,26,8,0.22);
    c.fillStyle='#b32424'; c.beginPath(); c.ellipse(p[0],p[1],22,8,0,0,6.3); c.fill(); c.fillStyle='#8c1a1a'; c.beginPath(); c.ellipse(p[0],p[1]-3,17,6,0,0,6.3); c.fill();
    var w=Math.max(0,Math.min(1,u.amt/Sim.waterCap())), x0=p[0], yb=p[1]-6, yt=p[1]-52;
    function bottle(){ c.beginPath(); c.moveTo(x0-11,yb); c.quadraticCurveTo(x0-14,yb-38,x0,yt); c.quadraticCurveTo(x0+14,yb-38,x0+11,yb); c.closePath(); }
    c.fillStyle='rgba(235,245,250,0.88)'; bottle(); c.fill();
    if(w>0.01){ c.save(); bottle(); c.clip(); var ly=yb-(yb-yt)*w; c.fillStyle=(G.med&&G.med.left>0)?'rgba(90,205,185,0.88)':'rgba(90,170,230,0.85)'; c.fillRect(x0-16,ly,32,yb-ly+1); c.fillStyle='rgba(200,230,250,0.9)'; c.fillRect(x0-16,ly,32,1.6); c.fillStyle='rgba(255,255,255,0.35)'; c.fillRect(x0-8,Math.min(ly+3,yb-4),2.5,Math.max(0,yb-ly-8)); c.restore(); }
    c.strokeStyle='rgba(120,140,150,0.75)'; c.lineWidth=1.2; bottle(); c.stroke(); }
  // ---- bought gear props (v0.40): everything in the shop shows in the loft
  function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function cross(c,x,y,s,col){ c.fillStyle=col; c.fillRect(x-s/2,y-s/6,s,s/3); c.fillRect(x-s/6,y-s/2,s/3,s); }
  function drawProp(c,k,t){
    var p,x,y;
    if(k==='guard'){ p=P(10.6,2.2,0); x=p[0]; y=p[1]; shadow(c,x,y+2,34,9,0.25);
      c.fillStyle='#8a5a33'; rr(c,x-26,y-38,52,38,6); c.fill(); c.fillStyle='#6b3f1d'; c.beginPath(); c.moveTo(x-30,y-36); c.lineTo(x,y-58); c.lineTo(x+30,y-36); c.closePath(); c.fill(); c.fillStyle='#2a1a10'; c.beginPath(); c.arc(x,y-14,13,Math.PI,0); c.lineTo(x+13,y); c.lineTo(x-13,y); c.fill();
      var h=Math.sin(t*2)*1.2; c.fillStyle='#c9894a'; c.beginPath(); c.ellipse(x+1,y-15+h,9,10,0,0,6.3); c.fill(); c.fillStyle='#3b2412'; c.beginPath(); c.ellipse(x-5,y-23+h,3,6,0.3,0,6.3); c.ellipse(x+7,y-23+h,3,6,-0.3,0,6.3); c.fill(); c.fillStyle='#111'; c.fillRect(x-4,y-17+h,2,2); c.fillRect(x+3,y-17+h,2,2); c.fillRect(x-1,y-12+h,3,2); }
    else if(k==='iso'){ p=P(10.4,9.4,0); x=p[0]; y=p[1]; shadow(c,x,y+2,34,9,0.25);
      c.fillStyle='rgba(205,230,240,0.55)'; rr(c,x-30,y-46,60,46,5); c.fill(); c.strokeStyle='#6c7b86'; c.lineWidth=2; rr(c,x-30,y-46,60,46,5); c.stroke(); c.lineWidth=1.2; for(var i=1;i<6;i++){ c.beginPath(); c.moveTo(x-30+i*10,y-46); c.lineTo(x-30+i*10,y); c.stroke(); } c.fillStyle='#e5e9ec'; c.fillRect(x-30,y-6,60,6); cross(c,x,y-24,14,'#d13a2a'); }
    else if(k==='heat'){ p=P(2.2,8.7,1.15); x=p[0]; y=p[1]; c.strokeStyle='#444'; c.lineWidth=3; c.beginPath(); c.moveTo(x,y-20); c.lineTo(x,y-8); c.stroke(); c.fillStyle='#555'; c.beginPath(); c.moveTo(x-12,y-6); c.lineTo(x+12,y-6); c.lineTo(x+7,y-14); c.lineTo(x-7,y-14); c.fill(); var g=0.55+0.25*Math.sin(t*3); c.fillStyle='rgba(255,140,40,'+g+')'; c.beginPath(); c.ellipse(x,y-5,8,4,0,0,6.3); c.fill(); c.fillStyle='rgba(255,170,60,'+(g*0.25)+')'; c.beginPath(); c.moveTo(x-9,y-3); c.lineTo(x+9,y-3); c.lineTo(x+26,y+34); c.lineTo(x-26,y+34); c.fill(); }
    else if(k==='vent'){ p=P(2.2,7.5,1.5); x=p[0]; y=p[1]; c.fillStyle='#d9dde0'; rr(c,x-15,y-15,30,30,4); c.fill(); c.strokeStyle='#8a949a'; c.lineWidth=2; rr(c,x-15,y-15,30,30,4); c.stroke(); c.save(); c.translate(x,y); c.rotate(t*6); c.fillStyle='#6f7b82'; for(var b=0;b<3;b++){ c.rotate(2.094); c.beginPath(); c.ellipse(0,-7,3.5,7,0,0,6.3); c.fill(); } c.restore(); c.fillStyle='#444'; c.beginPath(); c.arc(x,y,2.5,0,6.3); c.fill(); }
    else if(k==='cam'){ p=P(2.2,11.0,1.7); x=p[0]; y=p[1]; c.fillStyle='#2f3438'; rr(c,x-12,y-8,26,12,3); c.fill(); c.fillStyle='#1b1e20'; c.beginPath(); c.arc(x+13,y-2,5,0,6.3); c.fill(); c.fillStyle=(Math.sin(t*4)>0)?'#ff3b30':'#6a1a15'; c.beginPath(); c.arc(x-6,y-3,2,0,6.3); c.fill(); c.strokeStyle='#2f3438'; c.lineWidth=3; c.beginPath(); c.moveTo(x-8,y+4); c.lineTo(x-8,y+10); c.stroke(); }
    else if(k==='vet'){ p=P(2.2,10.0,1.2); x=p[0]; y=p[1]; c.fillStyle='#f3f5f6'; rr(c,x-14,y-16,28,32,3); c.fill(); c.strokeStyle='#9aa4aa'; c.lineWidth=2; rr(c,x-14,y-16,28,32,3); c.stroke(); cross(c,x,y,16,'#d13a2a'); }
    else if(k==='nursery'){ p=P(3.3,10.6,0); x=p[0]; y=p[1]; shadow(c,x,y+2,30,8,0.25); c.fillStyle='#d9b98a'; rr(c,x-24,y-30,48,30,4); c.fill(); c.fillStyle='rgba(255,210,120,0.55)'; rr(c,x-20,y-26,40,18,3); c.fill(); c.fillStyle='#f4f0e8'; for(var e=0;e<3;e++){ c.beginPath(); c.ellipse(x-11+e*11,y-14,4,5.5,0,0,6.3); c.fill(); } c.fillStyle='rgba(255,150,40,'+(0.6+0.3*Math.sin(t*2))+')'; c.fillRect(x-4,y-5,8,3); }
    else if(k==='flight'){ p=P(11.2,6.0,0); x=p[0]; y=p[1]; shadow(c,x,y+2,14,5,0.25); c.strokeStyle='#7a5a38'; c.lineWidth=4; c.beginPath(); c.moveTo(x,y); c.lineTo(x,y-82); c.stroke(); var w=Math.sin(t*2.2)*5; c.fillStyle='#e8553a'; c.beginPath(); c.moveTo(x,y-82); c.lineTo(x+40,y-78+w); c.lineTo(x+40,y-64+w); c.lineTo(x,y-58); c.fill(); c.fillStyle='#fff'; c.fillRect(x+14,y-77+w*0.6,7,16); }
  }
  function drawPerch(c,sp){ var a=P(sp[0],sp[1],0), top=P(sp[0],sp[1],0.95); shadow(c,a[0],a[1]+1,24,7,0.22); c.strokeStyle='#6b4526'; c.lineWidth=6; c.lineCap='round'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(top[0],top[1]); c.stroke(); c.lineWidth=5; c.beginPath(); c.moveTo(top[0]-24,top[1]); c.lineTo(top[0]+24,top[1]); c.stroke(); }
  function poseOf(b){ var st=b.st; if(st==='eat'||st==='drink'||st==='peck') return 'peck'; if(st==='walk') return 'walk'; if(st==='fly'||st==='flock') return 'fly'; if(st==='sit'||st==='perch') return 'sit'; if(st==='squabnest') return 'squab'; if(st==='preen') return 'preen'; if(st==='coo') return 'coo'; return 'stand'; }
  function szOf(b){ if(b.st==='flock') return 1.15; if(b.st==='fly') return 0.95; if(b.st==='sit') return 0.78; if(b.st==='squabnest') return 0.95; return 0.85; }
  function drawBirdW(c,b){
    var sz=szOf(b), p=P(b.x,b.y,b.z), stg=Sim.stageOf(b), gp=P(b.x,b.y,0);
    var sc=(stg==='adult'?1:stg==='juvenile'?0.78:0.5);
    if(b.st!=='sit'&&b.st!=='squabnest') shadow(c,gp[0],gp[1]+1,16*sz*sc/1.2*Math.max(0.5,1-b.z*0.25),5*sz*sc/1.2,Math.max(0.1,0.3-b.z*0.06));
    if(b.id===sel){ c.strokeStyle='#ffe27a'; c.lineWidth=3; c.beginPath(); c.ellipse(gp[0],gp[1]+1,26*sz*sc/1.3+4,8*sz*sc/1.3+2,0,0,6.3); c.stroke(); }
    var brood=b.st==='sit'&&b.nest>=0&&stg==='adult'&&Sim.G.eggs.some(function(e){return e.nest===b.nest&&!e.dead;});
    if(brood){ // brooding: body sunk into the nest, legs and belly hidden behind the straw rim, sitting on the eggs
      var nr=nestRect(b.nest), nx=nr.x+nr.w*0.5, fy=nr.y+nr.h-3, bh=50*sz;
      c.save(); c.beginPath(); c.rect(nr.x-6,fy-bh-30,nr.w+12,bh+30-1); c.clip();
      Spr.draw(c,nx,fy+bh*0.05,sz*1.2,b.face,{br:BLS.Gen.breedOf(b.g),col:BLS.Gen.phenoColor(b.g),pat:BLS.Gen.phenoPattern(b.g),pose:(BLS.VS&&BLS.VS.has(BLS.Gen.breedOf(b.g))?'brood':'sit'),ph:b.ph,stage:stg});
      c.restore();
      c.fillStyle='#d4a84b'; c.strokeStyle='#a97c2a'; c.lineWidth=1;
      for(var hi=0;hi<9;hi++){ var hx=nr.x+12+hi*(nr.w-24)/8; c.beginPath(); c.ellipse(hx,fy,6.5,2.4,(hi%2?0.25:-0.2),0,6.3); c.fill(); c.stroke(); }
      return; }
    Spr.draw(c,p[0],p[1],sz,b.face,{br:BLS.Gen.breedOf(b.g),col:BLS.Gen.phenoColor(b.g),pat:BLS.Gen.phenoPattern(b.g),pose:poseOf(b),ph:b.ph,stage:stg});
    var hgt=50*sz*sc;
    if(b.hunger>75||b.thirst>75){ var bx=p[0], by=p[1]-hgt-14; c.fillStyle='rgba(20,15,5,0.85)'; c.beginPath(); c.arc(bx,by,11,0,6.3); c.fill(); c.strokeStyle='#ffcf33'; c.lineWidth=1.8; c.stroke(); c.fillStyle=b.thirst>b.hunger?'#6ec6ff':'#ffcf33'; c.beginPath();
      if(b.thirst>b.hunger){ c.moveTo(bx,by-6); c.quadraticCurveTo(bx+6,by+1,bx,by+5); c.quadraticCurveTo(bx-6,by+1,bx,by-6); } else { c.ellipse(bx,by,3.2,6,0,0,6.3); } c.fill(); }
    if(b.id===sel){ c.font='bold 14px system-ui,sans-serif'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,0.75)'; c.strokeText(b.name,p[0],p[1]-hgt-(b.hunger>75||b.thirst>75?32:12)); c.fillStyle='#fff'; c.fillText(b.name,p[0],p[1]-hgt-(b.hunger>75||b.thirst>75?32:12)); }
  }
  function drawEgg(c,e,idx){ var np=L.nestPos(e.nest), r=nestRect(e.nest), x=r.x+r.w*(idx%2?0.66:0.34), y=r.y+r.h-6; c.save(); c.translate(x,y);
    var g=c.createRadialGradient(-1,-3.5,0.5,0,-2.4,5.5); g.addColorStop(0,e.dead?'#b7b2a4':'#fffdf4'); g.addColorStop(1,e.dead?'#7f7a6c':'#d9d0b6'); c.fillStyle=g; c.beginPath(); c.ellipse(0,-2.4,3.4,4.5,0,0,6.3); c.fill(); c.restore(); }
  // --- background
  function drawBackdrop(c){
    var tb=BLS.Art&&(BLS.Art.tex('town'+Sim.season())||BLS.Art.tex('town'));
    if(tb){ var k=Math.max(W/tb.width,H/tb.height*0.75)*1.06, dw=tb.width*k, dh=tb.height*k, sh=(cam.x-WW/2)*0.04, wt=(2.0*D-96-cam.y)*cam.z+H/2; c.fillStyle='#6fa4d4'; c.fillRect(0,0,W,H); c.drawImage(tb,Math.max(W-dw,Math.min(0,(W-dw)-sh*0.5)),wt+8-tb.height*0.62*k,dw,dh); return; }
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
    var fy=12.4*D; fillTex(c,'floor','#b79f78',-700,fy+8,2500,700,0.62,0.4); c.fillStyle='rgba(60,35,10,0.30)'; c.fillRect(-700,fy+8,2500,700); c.fillStyle='#d9b98c'; c.fillRect(-700,fy+2,2500,8); c.fillStyle='rgba(0,0,0,0.25)'; c.fillRect(-700,fy+10,2500,5);
  }
  // --- loft and yard details (baked once into the static layer)
  function plank(c,x,y,w,h,col){ c.fillStyle=col; c.fillRect(x,y,w,h); c.fillStyle='rgba(255,225,170,0.22)'; c.fillRect(x,y,w,2); c.fillStyle='rgba(20,8,0,0.35)'; c.fillRect(x,y+h-2,w,2); }
  function drawLoftDetails(c,G){
    var x0=LOFT.x0, x1=LOFT.x1, bt=LOFT.bodyTop, bb=LOFT.base, R=rng(31), i,n;
    for(i=x0+8;i<x1;i+=23){ c.strokeStyle='rgba(25,10,0,0.28)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(i,bb-22); c.lineTo(i,bb); c.stroke(); }
    var sh=c.createLinearGradient(0,bt,0,bt+30); sh.addColorStop(0,'rgba(15,5,0,0.55)'); sh.addColorStop(1,'rgba(15,5,0,0)'); c.fillStyle=sh; c.fillRect(x0,bt+6,x1-x0,30);
    for(n=0;n<C.NEST_COUNT;n++){ var r=nestRect(n); plank(c,r.x-7,r.y+r.h,r.w+14,7,'#a8743f');
      c.fillStyle='#e8d29a'; rrect(c,r.x+r.w/2-8,r.y+r.h+1,16,10,2); c.fill(); c.fillStyle='#3a2410'; c.font='bold 8px system-ui,sans-serif'; c.textAlign='center'; c.fillText(n+1,r.x+r.w/2,r.y+r.h+9);
      if(n<G.nestsOpen){ var ig=c.createLinearGradient(r.x,0,r.x+r.w,0); ig.addColorStop(0,'rgba(0,0,0,0.45)'); ig.addColorStop(0.2,'rgba(0,0,0,0)'); ig.addColorStop(0.85,'rgba(0,0,0,0)'); ig.addColorStop(1,'rgba(0,0,0,0.3)'); c.fillStyle=ig; c.fillRect(r.x,r.y,r.w,r.h-12); } }
    // vine hanging over the left end of the roof
    for(i=0;i<70;i++){ var u=R(), vx=x0-36+u*120, vy=LOFT.roofTop+8+R()*26+(u<0.2?R()*70:0); c.fillStyle=['#3f7f2c','#5c9c35','#77b146'][i%3]; c.beginPath(); c.ellipse(vx,vy,6+R()*4,3.5+R()*2,R()*3,0,6.3); c.fill(); }
    // lantern
    var lx=x1+2, ly=bt+22; c.strokeStyle='#2a1c10'; c.lineWidth=2.5; c.beginPath(); c.moveTo(lx-4,ly-14); c.lineTo(lx+14,ly-14); c.lineTo(lx+14,ly-6); c.stroke(); c.fillStyle='#2a1c10'; c.fillRect(lx+6,ly-7,16,4); c.fillStyle='#ffd77a'; c.fillRect(lx+8,ly-3,12,16); c.fillStyle='#2a1c10'; c.fillRect(lx+13,ly-3,2,16); c.fillRect(lx+6,ly+13,16,4);
  }
  function drawYardProps(c){
    var R=rng(77), i;
    // worn patches, grain and fallen feathers on the paving
    for(i=0;i<14;i++){ var px=R()*1050, py=75+R()*180, g=c.createRadialGradient(px,py,2,px,py,60); g.addColorStop(0,i%2?'rgba(90,60,30,0.16)':'rgba(255,240,205,0.14)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(px-60,py-60,120,120); }
    c.fillStyle='#d9a93a'; for(i=0;i<90;i++){ var a=R()*6.28, d=30+R()*70; c.fillRect(L.feeder.y*U+Math.cos(a)*d,L.feeder.x*D+Math.sin(a)*d*0.35,2.4,1.6); }
    for(i=0;i<16;i++){ c.save(); c.translate(120+R()*650,80+R()*170); c.rotate(R()*3.1); c.fillStyle=i%3?'rgba(235,236,240,0.85)':'rgba(125,135,150,0.85)'; c.beginPath(); c.ellipse(0,0,7,1.8,0,0,6.3); c.fill(); c.restore(); }
    // blue water barrel beside the sacks
    var bx=-6, by=4.4*D+8; shadow(c,bx,by+1,26,7,0.28); var bg=c.createLinearGradient(bx-22,0,bx+22,0); bg.addColorStop(0,'#1d4f86'); bg.addColorStop(0.4,'#4f93d0'); bg.addColorStop(1,'#1a4474'); c.fillStyle=bg; rrect(c,bx-22,by-58,44,58,7); c.fill(); c.fillStyle='rgba(10,30,60,0.35)'; c.fillRect(bx-22,by-42,44,3); c.fillRect(bx-22,by-18,44,3); c.fillStyle='#6aa8dd'; c.beginPath(); c.ellipse(bx,by-58,20,5,0,0,6.3); c.fill();
    // front parapet with iron railing, open in the middle
    var fy=12.4*D+4; [[-300,170],[560,1330]].forEach(function(q){ fillTex(c,'brick','#b0522f',q[0],fy-22,q[1]-q[0],24,0.4,0.4); c.fillStyle='#e2c696'; c.fillRect(q[0],fy-28,q[1]-q[0],8); c.strokeStyle='#33291f'; c.lineWidth=2.5; for(var x=q[0]+8;x<q[1];x+=18){ c.beginPath(); c.moveTo(x,fy-28); c.lineTo(x,fy-52); c.stroke(); } c.lineWidth=3.5; c.beginPath(); c.moveTo(q[0]+4,fy-50); c.lineTo(q[1]-4,fy-50); c.stroke(); });
    [[170,5],[560,9],[40,11]].forEach(function(p){ drawPot(c,p[0],fy+14,19,p[1]); });
  }
  // --- weather (screen space) and lamp glow
  var drops=[]; for(var q=0;q<90;q++) drops.push([Math.random(),Math.random(),0.6+Math.random()*0.8]);
  function drawWeather(c,G,t){
    var w=G.weather, i, d;
    if(w==='rain'){ c.strokeStyle='rgba(190,215,240,0.55)'; c.lineWidth=1.2; c.beginPath(); for(i=0;i<drops.length;i++){ d=drops[i]; var x=((d[0]+t*0.06)%1)*W, y=((d[1]+t*0.9*d[2])%1)*H; c.moveTo(x,y); c.lineTo(x-3,y+13*d[2]); } c.stroke(); }
    else if(w==='cold'){ c.fillStyle='rgba(255,255,255,0.75)'; for(i=0;i<60;i++){ d=drops[i]; c.beginPath(); c.arc(((d[0]+Math.sin(t+i)*0.02+1)%1)*W,((d[1]+t*0.07*d[2])%1)*H,1.8*d[2],0,6.3); c.fill(); } }
    else if(w==='wind'){ c.fillStyle='rgba(150,150,60,0.8)'; for(i=0;i<18;i++){ d=drops[i]; c.beginPath(); c.ellipse(((d[0]+t*0.28*d[2])%1)*W,d[1]*H+Math.sin(t*3+i)*18,5,2.2,t*4+i,0,6.3); c.fill(); } }
    else if(w==='heat'){ c.fillStyle='rgba(255,150,40,'+(0.08+0.025*Math.sin(t*1.7))+')'; c.fillRect(0,0,W,H); }
  }
  // pooled feather/dust particles, hard cap 60 (no allocation per frame)
  var PCAP=60, POOL=[]; for(var pk=0;pk<PCAP;pk++) POOL.push({a:0,k:0,x:0,y:0,z:0,l:0,m:1,r:0,s:0});
  function pSpawn(kind,x,y,z){ if(BLS.REDUCED) return; for(var i=0;i<PCAP;i++){ var q=POOL[i]; if(!q.a){ q.a=1; q.k=kind; q.x=x+(Math.random()-0.5)*0.4; q.y=y+(Math.random()-0.5)*0.4; q.z=z; q.l=q.m=kind===1?1.6:0.7; q.r=Math.random()*6.3; q.s=Math.random()*6.3; return; } } }
  function pLive(){ var n=0; for(var i=0;i<PCAP;i++) if(POOL[i].a) n++; return n; }
  function pStep(G,dt){ if(!BLS.REDUCED&&dt>0){ var bs=G.birds; for(var i=0;i<bs.length;i++){ var b=bs[i], fl=(b.st==='fly'||b.st==='flock'); if(b._ls!==undefined&&b._ls!==b.st){ var wasFl=(b._ls==='fly'||b._ls==='flock'); if(fl&&!wasFl){ pSpawn(1,b.x,b.y,b.z+0.4); pSpawn(1,b.x,b.y,b.z+0.5); } else if(!fl&&wasFl){ pSpawn(0,b.x,b.y,0); pSpawn(0,b.x,b.y,0); } } b._ls=b.st; if(fl&&Math.random()<dt*0.5) pSpawn(1,b.x,b.y,b.z); } }
    for(var j=0;j<PCAP;j++){ var p=POOL[j]; if(!p.a) continue; p.l-=dt; if(p.l<=0){ p.a=0; continue; } if(p.k===1){ p.z=Math.max(0,p.z-0.32*dt); p.y+=Math.sin(p.s+p.l*3)*0.25*dt; } }
  }
  function pDraw(c){ for(var i=0;i<PCAP;i++){ var p=POOL[i]; if(!p.a) continue; var q=P(p.x,p.y,p.z), al=Math.min(1,p.l/p.m*1.5); c.save(); if(p.k===1){ c.fillStyle='rgba(240,238,230,'+(al*0.9)+')'; c.translate(q[0],q[1]); c.rotate(p.r+Math.sin(p.s+p.l*4)*0.8); c.beginPath(); c.ellipse(0,0,4,1.5,0,0,6.3); c.fill(); } else { var rr=3+(1-p.l/p.m)*8; c.fillStyle='rgba(190,165,120,'+(al*0.45)+')'; c.beginPath(); c.arc(q[0],q[1],rr,0,6.3); c.fill(); } c.restore(); } }
  var MOTES=[]; for(var mi=0;mi<26;mi++) MOTES.push({x:Math.random(),y:Math.random(),s:0.4+Math.random(),p:Math.random()*6});
  function drawLight(c,h,t){ if(h<6||h>=19) return; var k=h<9?(h-6)/3:h>16?(19-h)/3:1, warm=(h<9||h>16)?'255,214,150':'255,244,214', a=0.07+0.06*(1-Math.abs(h-12.5)/6.5); a*=Math.min(1,k);
    var sx=W*(1-(h-6)/13)*1.0+W*0.1; // sun moves right to left across the sky with the clock
    c.save(); c.globalCompositeOperation='lighter';
    for(var i=0;i<3;i++){ var x0=sx+i*W*0.22-W*0.15, g=c.createLinearGradient(x0,0,x0+W*0.35,H*0.7); g.addColorStop(0,'rgba('+warm+','+a+')'); g.addColorStop(1,'rgba('+warm+',0)'); c.fillStyle=g; c.beginPath(); c.moveTo(x0,0); c.lineTo(x0+W*0.16,0); c.lineTo(x0+W*0.5,H*0.75); c.lineTo(x0+W*0.28,H*0.75); c.closePath(); c.fill(); }
    c.fillStyle='rgba('+warm+','+Math.min(0.5,a*5)+')'; MOTES.forEach(function(m){ var tm=BLS.REDUCED?0:t, x=((m.x+Math.sin(tm*0.2*m.s+m.p)*0.03+tm*0.004*m.s)%1)*W, y=((m.y+Math.cos(tm*0.15*m.s+m.p)*0.03)%1)*H*0.8; c.beginPath(); c.arc(x,y,0.8+m.s,0,6.3); c.fill(); });
    c.restore(); }
  function drawGlow(c,h){ var night=(h>=19||h<5.5); if(!night) return; var x=(LOFT.x1+16-cam.x)*cam.z+W/2, y=(LOFT.bodyTop+27-cam.y)*cam.z+H/2, r=130*cam.z; var g=c.createRadialGradient(x,y,2,x,y,r); g.addColorStop(0,'rgba(255,190,80,0.6)'); g.addColorStop(1,'rgba(255,150,40,0)'); c.globalCompositeOperation='lighter'; c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); c.globalCompositeOperation='source-over'; }
  // --- cached static layers (the expensive scenery is painted once, not every frame)
  var BK={x:-300,y:-340,w:1630,h:1240}, S=1.25, layer0=null, layerBed=null, bakedNests=-1;
  function bake(w,h,ox,oy,fn){ var cn=document.createElement('canvas'); cn.width=Math.ceil(w*S); cn.height=Math.ceil(h*S); var c=cn.getContext('2d'); c.setTransform(S,0,0,S,-ox*S,-oy*S); fn(c); return cn; }
  var SKINS={none:{},sand:{col:'#e3c27d',a:0.38},white:{col:'#ffffff',a:0.5},blue:{col:'#3f78c4',a:0.42},green:{col:'#4f9a5a',a:0.42},terra:{col:'#c4623a',a:0.4}};
  function buildLayers(G){
    layer0=bake(BK.w,BK.h,BK.x,BK.y,function(c){ drawGround(c); drawPot(c,0.3*U,3.0*D+10,22,3); drawPot(c,7.2*U,3.1*D+10,20,4); drawYardProps(c); (function(){ var sk=SKINS[G.skin||'none'], t=bake(BK.w,BK.h,BK.x,BK.y,function(t){ drawLoft(t,G); drawLoftDetails(t,G); if(sk&&sk.col){ t.globalCompositeOperation='source-atop'; t.fillStyle=sk.col; t.globalAlpha=sk.a; t.fillRect(BK.x,BK.y,BK.w,BK.h); t.globalAlpha=1; t.globalCompositeOperation='source-over'; } }); c.drawImage(t,BK.x,BK.y,BK.w,BK.h); })(); drawTank(c); drawAviary(c,0); drawSacks(c); });
    layerBed=bake(520,200,7.9*U,9.6*D-120,function(c){ drawBed(c); });
    bakedNests=G.nestsOpen; }
  // --- camera
  function resize(){ var oldH=H; dpr=Math.min(2,window.devicePixelRatio||1); W=window.innerWidth; H=window.innerHeight; cv.width=W*dpr; cv.height=H*dpr; if(hReady&&oldH!==H){ var d=(H-oldH)/2/(cam.z||1); cam.y+=d; if(cam.ty!==null) cam.ty+=d; if(home) home.y+=d; } hReady=true; }
  function fitZoom(){ return Math.max(0.6,Math.min(1.6,W/410)); }
  function toScreen(wx,wy,wz){ var p=P(wx,wy,wz); return [(p[0]-cam.x)*cam.z+W/2,(p[1]-cam.y)*cam.z+H/2]; }
  function clampCam(){
    cam.z=Math.max(fitZoom()*0.7,Math.min(2.0,cam.z)); var hw=W/2/cam.z;
    cam.x=(WW<=2*hw)?WW/2:Math.max(hw,Math.min(WW-hw,cam.x)); cam.y=Math.max(-160,Math.min(200,cam.y));
  }
  function focus(wx,wy,wz,z){ if(!home) home={x:cam.x,y:cam.y,z:cam.z}; var p=P(wx,wy,wz); cam.tx=p[0]; cam.ty=cam.y; if(z) cam.tz=Math.min(z,1.6); }
  function restore(){ if(home){ cam.tx=home.x; cam.ty=home.y; cam.tz=home.z; home=null; } follow=false; }
  function center(){ home=null; cam.tx=4.2*U; cam.ty=20; cam.tz=fitZoom(); follow=false; }
  function sheetOpen(){ return !document.getElementById('sheet').classList.contains('hidden'); }
  function tint(h){ var n=[100,115,175],w=[255,255,255],d=[255,196,150];
    function mix(a,b,u){ return [a[0]+(b[0]-a[0])*u|0,a[1]+(b[1]-a[1])*u|0,a[2]+(b[2]-a[2])*u|0]; }
    var c; if(h<5) c=n; else if(h<7) c=mix(n,d,(h-5)/2); else if(h<9) c=mix(d,w,(h-7)/2); else if(h<16.5) c=w; else if(h<19) c=mix(w,d,(h-16.5)/2.5); else if(h<21) c=mix(d,n,(h-19)/2); else c=n;
    return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; }
  function frame(now){
    var G=Sim.G; if(!G) return;
    var c=ctx; c.setTransform(dpr,0,0,dpr,0,0);
    if(cam.tx!==null){ cam.x+=(cam.tx-cam.x)*0.15; cam.y+=(cam.ty-cam.y)*0.15; if(cam.tz) cam.z+=(cam.tz-cam.z)*0.15; if(Math.abs(cam.tx-cam.x)<0.5&&Math.abs(cam.ty-cam.y)<0.5){ cam.tx=null; cam.tz=null; } }
    if(follow&&sel>=0){ var fb=Sim.bird(sel); if(fb){ var fp=P(fb.x,fb.y,fb.z); cam.x+=(fp[0]-cam.x)*0.1;  } }
    clampCam();
    drawBackdrop(c);
    c.setTransform(cam.z*dpr,0,0,cam.z*dpr,(W/2-cam.x*cam.z)*dpr,(H/2-cam.y*cam.z)*dpr);
    var t=now/1000, fdt=Math.min(0.05,Math.max(0,t-lastNow)); lastNow=t;
    if(!layer0||bakedNests!==G.nestsOpen) buildLayers(G);
    c.drawImage(layer0,BK.x,BK.y,BK.w,BK.h); drawAviaryBirds(c,G,t);
    var R=rng(99), nd=Math.min(70,((G.dirt||0)*0.7)|0); for(var q=0;q<nd;q++){ var dx=90+R()*620, dy=76+R()*100; c.fillStyle='rgba(72,66,44,0.7)'; c.beginPath(); c.ellipse(dx,dy,3.5+R()*3,2+R()*1.5,R()*3,0,6.3); c.fill(); c.fillStyle='rgba(238,238,225,0.85)'; c.beginPath(); c.arc(dx+1,dy-0.5,1.6,0,6.3); c.fill(); }
    var cnt={}; G.eggs.forEach(function(e){ cnt[e.nest]=(cnt[e.nest]||0)+1; drawEgg(c,e,cnt[e.nest]-1); });
    var items=[];
    var lf=function(id,fn){ return function(){ var E=window.BLS_EDIT, d=E&&E.on&&E.drag&&E.drag.id===id; if(d){ c.save(); c.translate(0,-12); fn(); c.restore(); } else fn(); }; };
    items.push({k:L.feeder.x,f:lf('f0',function(){ drawFeeder(c,G); })}); items.push({k:L.water.x,f:lf('w0',function(){ drawWater(c,G); })}); (G.xf||[]).forEach(function(u,i){ items.push({k:u.x,f:lf('f'+(i+1),function(){ drawFeeder(c,G,u,u); })}); }); (G.xw||[]).forEach(function(u,i){ items.push({k:u.x,f:lf('w'+(i+1),function(){ drawWater(c,G,u,u); })}); }); items.push({k:9.4,f:function(){ c.drawImage(layerBed,7.9*U,9.6*D-120,520,200); }});
    (function(){ var gs=[], X={guard:10.6,iso:10.4,heat:2.2,vent:2.2,cam:2.2,vet:2.2,nursery:3.3,flight:11.2}; for(var gk in X) if(G.gear&&G.gear[gk]) gs.push([gk,X[gk]]); gs.forEach(function(g){ items.push({k:g[1]-0.2,f:function(){ var gg=G.gear&&G.gear[g[0]]; if(gg&&(gg.broken||gg.c<35)){ c.save(); c.globalAlpha=gg.broken?0.4:0.8; drawProp(c,g[0],gg.broken?0:t); c.restore(); } else drawProp(c,g[0],t); }}); }); })();
    (function(){ var n=Math.min(45,Math.round((G.dirt||0)*0.45)); if(n<1) return; items.push({k:0.05,f:function(){ for(var i=0;i<n;i++){ var u=Math.abs(Math.sin(i*12.9898)*43758.5453)%1, v=Math.abs(Math.sin(i*78.233+1.7)*12345.678)%1, p=P(3+u*8.4,3.6+v*7.8,0); if(i%3===0){ c.fillStyle='rgba(245,240,225,0.5)'; c.beginPath(); c.ellipse(p[0],p[1],4.5,1.4,(u*3)-1.5,0,6.3); c.fill(); } else { c.fillStyle='rgba(235,232,220,0.55)'; c.beginPath(); c.ellipse(p[0],p[1],2.2,1,0,0,6.3); c.fill(); c.fillStyle='rgba(80,70,55,0.4)'; c.beginPath(); c.ellipse(p[0],p[1],0.9,0.45,0,0,6.3); c.fill(); } } }}); })();
    if(window.BLS_EDIT&&BLS_EDIT.on){ items.push({k:0.02,f:function(){ BLS_EDIT.draw(c,P,'grid'); }}); items.push({k:99,f:function(){ BLS_EDIT.draw(c,P,'rings'); }}); }
    G.perches.forEach(function(pi){ var sp=L.perchSpots[pi]; items.push({k:sp[0]-0.1,f:lf('p'+pi,function(){ drawPerch(c,sp); })}); });
    G.birds.forEach(function(b){ if(b.st!=='fly'&&b.st!=='flock') items.push({k:(b.st==='sit'||b.st==='squabnest')?2.3:(b.x<3.2&&b.z>0.3?2.4:b.x),f:function(){ drawBirdW(c,b); }}); });
    items.sort(function(a,b){return a.k-b.k;}); items.forEach(function(i){ i.f(); });
    G.birds.forEach(function(b){ if(b.st==='fly'||b.st==='flock') drawBirdW(c,b); });
    pStep(G,fdt); pDraw(c);
    // cooing couples show hearts now and then
    G.birds.forEach(function(b){ if(b.st==='coo'&&Math.random()<fdt*1.2){ var hp=P(b.x,b.y,b.z); BLS.FX.burst('heart',hp[0],hp[1]-48); } });
    BLS.FX.draw(c,fdt);
    ambient.forEach(function(a){ a.x+=a.sp*fdt; if(a.x>1300){ a.x=-250; a.y=-290-Math.random()*110; } Spr.draw(c,a.x,a.y+Math.sin(t+a.ph)*14,0.9,1,{col:a.col,pat:'B',pose:'fly',ph:t+a.ph}); });
    c.setTransform(dpr,0,0,dpr,0,0);
    if(!vigC||vigC.width!==cv.width||vigC.height!==cv.height){ vigC=document.createElement('canvas'); vigC.width=cv.width; vigC.height=cv.height; var vc=vigC.getContext('2d'); vc.scale(dpr,dpr); var vg=vc.createRadialGradient(W/2,H*0.5,Math.min(W,H)*0.5,W/2,H*0.5,Math.max(W,H)*0.8); vg.addColorStop(0,'rgba(20,12,0,0)'); vg.addColorStop(1,'rgba(20,12,0,0.3)'); vc.fillStyle=vg; vc.fillRect(0,0,W,H); }
    c.drawImage(vigC,0,0,W,H);
    var h=Sim.hourOfDay(), tc=tint(h); if(tc!=='rgb(255,255,255)'){ c.globalCompositeOperation='multiply'; c.fillStyle=tc; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; }
    (function(){ var sn=Sim.season(), P4=['rgb(246,255,240)','rgb(255,248,232)','rgb(255,232,200)','rgb(228,238,255)'][sn]; if(sn!==0||true){ c.globalCompositeOperation='multiply'; c.fillStyle=P4; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; } })();
    drawLight(c,h,t); drawGlow(c,h); drawWeather(c,G,t);
  }
  // --- picking
  function pick(sx,sy){
    var G=Sim.G, best=null, bd=1e9;
    G.birds.forEach(function(b){ var stg=Sim.stageOf(b), p=toScreen(b.x,b.y,b.z), sc=(stg==='adult'?1:stg==='juvenile'?0.78:0.5), hgt=50*szOf(b)*sc; var r=Math.max(hgt*0.55,16)*cam.z+10, cy=p[1]-hgt*0.5*cam.z; var d=Math.hypot(p[0]-sx,cy-sy); if(d<r&&d<bd){ bd=d; best={type:'bird',id:b.id}; } });
    if(best) return best;
    for(var n=0;n<C.NEST_COUNT;n++){ var r2=nestRect(n); var x0=(r2.x-cam.x)*cam.z+W/2, y0=(r2.y-cam.y)*cam.z+H/2, x1=x0+r2.w*cam.z, y1=y0+r2.h*cam.z; if(sx>=x0-4&&sx<=x1+4&&sy>=y0-4&&sy<=y1+4) return {type:'nest',n:n}; }
    var fl=[L.feeder].concat(G.xf||[]); for(var fi=0;fi<fl.length;fi++){ var f=toScreen(fl[fi].x,fl[fi].y,0); if(Math.abs(sx-f[0])<42*cam.z&&Math.abs(sy-f[1])<22*cam.z) return {type:'feeder'}; }
    var wl=[L.water].concat(G.xw||[]); for(var wi=0;wi<wl.length;wi++){ var w=toScreen(wl[wi].x,wl[wi].y,0); if(Math.abs(sx-w[0])<26*cam.z&&sy<w[1]+10*cam.z&&sy>w[1]-56*cam.z) return {type:'water'}; }
    var sk=[(0.55*U+20-cam.x)*cam.z+W/2,(3.25*D+6-30-cam.y)*cam.z+H/2]; if(Math.hypot(sx-sk[0],sy-sk[1])<62*cam.z) return {type:'sacks'};
    var ax0=(12.3*U-cam.x)*cam.z+W/2, ax1=(15.7*U-cam.x)*cam.z+W/2, ay1=(3.9*D+10-cam.y)*cam.z+H/2, ay0=ay1-185*cam.z; if(sx>=ax0&&sx<=ax1&&sy>=ay0&&sy<=ay1) return {type:'aviary'};
    var gx=((sy-H/2)/cam.z+cam.y)/D, gy=((sx-W/2)/cam.z+cam.x)/U; if(L.walkable(gx,gy)) return {type:'ground',x:gx,y:gy};
    return null;
  }
  function fx(kind,b){ if(kind==='spark'){ BLS.FX.burst(kind,6*U,120); return; } if(!b) return; var p=P(b.x,b.y,b.z||0); BLS.FX.burst(kind,p[0],p[1]-(kind==='heart'?46:kind==='seed'?0:8)); }
  function watchSky(){ home=null; follow=false; cam.tx=6.2*U; cam.ty=-140; cam.tz=fitZoom()*0.72; }
  function init(canvas){
    cv=canvas; ctx=cv.getContext('2d',{alpha:false}); resize(); window.addEventListener('resize',function(){ resize(); });
    cam.z=fitZoom(); cam.x=4.2*U; cam.y=20;
    var ptrs={}, moved=false, startPos=null, lastPinch=0;
    function pts(){ return Object.keys(ptrs).map(function(k){return ptrs[k];}); }
    cv.addEventListener('pointerdown',function(e){ cv.setPointerCapture(e.pointerId); ptrs[e.pointerId]={x:e.clientX,y:e.clientY}; if(pts().length===1){ moved=false; startPos={x:e.clientX,y:e.clientY}; } else { moved=true; lastPinch=0; } cam.tx=null; });
    cv.addEventListener('pointermove',function(e){ var p=ptrs[e.pointerId]; if(!p) return; var ps=pts();
      if(ps.length===1){ var dx=e.clientX-p.x, dy=e.clientY-p.y; if(!moved&&Math.hypot(e.clientX-startPos.x,e.clientY-startPos.y)>8) moved=true; if(moved){ cam.x-=dx/cam.z; follow=false; } p.x=e.clientX; p.y=e.clientY; }
      else if(ps.length>=2){ p.x=e.clientX; p.y=e.clientY; var d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y); if(lastPinch) cam.z*=d/lastPinch; lastPinch=d; } });
    function up(e){ var was=ptrs[e.pointerId]; delete ptrs[e.pointerId]; lastPinch=0; if(was&&!moved&&Object.keys(ptrs).length===0){ var hit=pick(e.clientX,e.clientY); if(BLS.UI) BLS.UI.onPick(hit); } }
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',function(e){ delete ptrs[e.pointerId]; });
    cv.addEventListener('wheel',function(e){ e.preventDefault(); cam.z*=e.deltaY<0?1.1:0.9; },{passive:false});
    var running=true; function loop(now){ if(document.hidden){ running=false; return; } frame(now); requestAnimationFrame(loop); }
    document.addEventListener('visibilitychange',function(){ if(!document.hidden&&!running){ running=true; requestAnimationFrame(loop); } });
    requestAnimationFrame(loop);
  }
  return { rebuild:function(){ layer0=null; }, restore:restore, fx:fx, watchSky:watchSky, init:init, focus:focus, center:center, cam:cam, fitZoom:fitZoom, select:function(id){ sel=id; if(id<0) follow=false; }, setFollow:function(v){ follow=v; }, isFollow:function(){return follow;}, get sel(){return sel;}, toScreen:toScreen, pick:pick, particles:function(){ return {live:pLive(),cap:PCAP,spawn:pSpawn}; }, gridAt:function(sx,sy){ return {x:((sy-H/2)/cam.z+cam.y)/D, y:((sx-W/2)/cam.z+cam.x)/U}; }, rebuild:function(){ pats={}; layer0=null; } };
})();
