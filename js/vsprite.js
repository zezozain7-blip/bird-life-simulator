// Procedural vector pigeons (v0.48): drawn per breed from real shape references (NPA / club standards).
// Origin = feet on the ground, bird faces right, standing height about 46 px. Called from sprites.js.
BLS.VS = (function(){
  var PAL = {
    G:{head:'#555e6b',neck:'#4d5866',i1:'#2f9a82',i2:'#92509f',breast:'#7b8591',belly:'#929ca8',back:'#a8b3c2',wing:'#aebac9',bar:'#1b2027',tail:'#3d4653',band:'#171b21',rump:'#d3d9e1',beak:'#2d2a27',cere:'#ebe8e1',eye:'#e8821e',leg:'#c0505a'},
    R:{head:'#7a3a2c',neck:'#6c3022',i1:'#d08a3e',i2:'#b04a5a',breast:'#a85640',belly:'#b86a52',back:'#c07a5a',wing:'#c98462',bar:'#612a1f',tail:'#7a3b2c',band:'#46201a',rump:'#c98462',beak:'#4a3a30',cere:'#e9e1d8',eye:'#e8821e',leg:'#c0505a'},
    W:{head:'#f3f1eb',neck:'#ebe8e0',i1:null,i2:null,breast:'#f8f6f1',belly:'#fcfbf7',back:'#f6f4ee',wing:'#fbfaf6',bar:'#d4d0c4',tail:'#ebe8e0',band:'#d4d0c4',rump:'#fbfaf6',beak:'#e6c6b2',cere:'#fcfbf8',eye:'#d9771f',leg:'#d6707a'}
  };
  // rx/ry = body half length/depth, tilt = body axis angle (rad), hx/hy = head centre above feet (stand), hr = head radius,
  // nw = neck width, leg = leg length, tail = tail length, wing = wing tip factor, bk = beak length, cw = cere/wattle size
  var K = {
    baladi:{rx:15,ry:10.5,tilt:0.42,hx:13,hy:31,hr:5.0,nw:7.5,leg:9,tail:17,wing:1.35,bk:4.6,cw:1.4},
    homer: {rx:16.5,ry:9.2,tilt:0.34,hx:14,hy:33,hr:4.6,nw:6.6,leg:9.5,tail:20,wing:1.5,bk:5,cw:1.3},
    roller:{rx:13,ry:9.6,tilt:0.4,hx:11.5,hy:28.5,hr:4.7,nw:6.6,leg:8.5,tail:13,wing:1.3,bk:3.6,cw:1.1},
    king:  {rx:16,ry:13.5,tilt:0.62,hx:11.5,hy:38.5,hr:5.8,nw:9.5,leg:10.5,tail:12.5,wing:1.2,bk:4.6,cw:1.6},
    roman: {rx:21,ry:12.5,tilt:0.3,hx:19,hy:34,hr:6.2,nw:9,leg:11,tail:18,wing:1.35,bk:6.2,cw:3.4},
    fantail:{rx:13,ry:10.5,tilt:0.72,hx:9.5,hy:34,hr:4.3,nw:6.4,leg:7.5,tail:0,wing:1.1,bk:3.6,cw:1.0,fan:1}
  };
  function ell(c,x,y,rx,ry,rot){ c.beginPath(); c.ellipse(x,y,rx,ry,rot||0,0,6.2832); }
  function has(b){ return !!K[b]; }
  function grad(c,x0,y0,x1,y1,a,b){ var g=c.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,a); g.addColorStop(1,b); return g; }
  function shade(hex,k){ var n=parseInt(hex.slice(1),16), r=(n>>16)&255, g=(n>>8)&255, b=n&255; function f(v){ return Math.max(0,Math.min(255,Math.round(v*k))); } return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
  var OUT='rgba(25,22,20,0.45)';

  function fan(c,P,bx,by,K_,ph){ // upright fan of tail feathers (indian fantail): about 3/4 of a circle, above the head line
    var cx=bx-K_.rx*0.55, cy=by-K_.ry*0.95, R=19, n=21, i;
    for(var layer=0;layer<2;layer++){
      for(i=0;i<n;i++){
        var a=(-1.05+2.1*i/(n-1))*1.35-1.5708+3.14159/2*0; // spread around the upward-back direction
        var ang=-2.0+ (i/(n-1))*2.9;                         // from back-down to forward-up
        c.save(); c.translate(cx,cy); c.rotate(ang);
        var L=R*(layer?0.82:1);
        c.fillStyle=layer?shade(P.tail,0.93):P.tail; c.strokeStyle=OUT; c.lineWidth=0.5;
        c.beginPath(); c.moveTo(0,-1.4); c.quadraticCurveTo(L*0.6,-3.2,L,-1.6); c.quadraticCurveTo(L+1.5,0,L,1.6); c.quadraticCurveTo(L*0.6,3.2,0,1.4); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle=shade(P.tail,0.8); c.lineWidth=0.5; c.beginPath(); c.moveTo(1,0); c.lineTo(L-1,0); c.stroke();
        c.restore();
      }
    }
  }
  function wingShape(c,rx,ry,wing){ // folded wing in body frame, tip pointing backwards
    c.beginPath(); c.moveTo(rx*0.52,-ry*0.5);
    c.quadraticCurveTo(rx*0.8,ry*0.05,rx*0.28,ry*0.52);
    c.lineTo(-rx*wing,ry*0.62);
    c.quadraticCurveTo(-rx*0.25,-ry*0.78,rx*0.52,-ry*0.5); c.closePath();
  }
  function drawWing(c,P,K_,o,col){
    var rx=K_.rx, ry=K_.ry;
    c.save(); wingShape(c,rx,ry,K_.wing); c.fillStyle=grad(c,0,-ry*0.7,0,ry*0.6,shade(P.wing,1.06),shade(P.wing,0.9)); c.fill(); c.clip();
    if(col==='W'){ c.strokeStyle='rgba(190,185,170,0.6)'; c.lineWidth=0.7; for(var q=0;q<4;q++){ c.beginPath(); c.moveTo(rx*(0.3-q*0.3),-ry*0.4); c.lineTo(rx*(0.1-q*0.3),ry*0.55); c.stroke(); } }
    else if(o.pat==='C'){ c.fillStyle=P.bar; var gx,gy; for(gx=-rx*1.3;gx<rx*0.55;gx+=3.6) for(gy=-ry*0.7;gy<ry*0.5;gy+=3.4){ var sx=gx+((gy/3.4)&1?1.8:0); c.fillRect(sx,gy,2.3,2.2); } c.fillStyle=P.back; }
    else { c.fillStyle=P.bar; c.beginPath(); c.moveTo(rx*0.32,-ry*0.7); c.lineTo(rx*0.4,-ry*0.7); c.lineTo(rx*0.12,ry*0.7); c.lineTo(rx*0.02,ry*0.7); c.fill(); c.beginPath(); c.moveTo(-rx*0.1,-ry*0.7); c.lineTo(-rx*0.02,-ry*0.7); c.lineTo(-rx*0.3,ry*0.7); c.lineTo(-rx*0.4,ry*0.7); c.fill(); }
    // primaries (darker tips)
    c.fillStyle=col==='W'?'rgba(200,196,184,0.7)':shade(P.bar,1.0); c.globalAlpha=col==='W'?1:0.55; c.beginPath(); c.moveTo(-rx*0.55,ry*0.05); c.lineTo(-rx*K_.wing,ry*0.62); c.lineTo(-rx*0.6,ry*0.62); c.closePath(); c.fill(); c.globalAlpha=1;
    c.restore();
    wingShape(c,rx,ry,K_.wing); c.strokeStyle=OUT; c.lineWidth=0.7; c.stroke();
  }
  function tailShape(c,P,K_,col,fanned){
    if(!K_.tail) return;
    var rx=K_.rx, ry=K_.ry, L=K_.tail*0.85;
    c.beginPath(); c.moveTo(-rx*0.7,-ry*0.4); c.lineTo(-rx-L,-ry*0.05); c.lineTo(-rx-L*0.98,ry*0.45); c.lineTo(-rx*0.7,ry*0.55); c.closePath();
    c.fillStyle=P.tail; c.fill(); c.strokeStyle=OUT; c.lineWidth=0.7; c.stroke();
    c.save(); c.beginPath(); c.moveTo(-rx*0.7,-ry*0.4); c.lineTo(-rx-L,-ry*0.05); c.lineTo(-rx-L*0.98,ry*0.45); c.lineTo(-rx*0.7,ry*0.55); c.closePath(); c.clip();
    c.fillStyle=P.band; c.fillRect(-rx-L,-ry,L*0.28,ry*2); c.restore();
  }

  function draw(c,o,st){
    var br=o.br, K_=K[br], col=PAL[o.col]?o.col:'G', P=PAL[col], pose=st.pose, ph=st.ph||0;
    var fly=pose==='fly', walk=pose==='walk', peck=pose==='peck'||pose==='eat'||pose==='drink', brood=pose==='brood', sit=pose==='sit'||pose==='perch'||brood;
    var bob=walk?-Math.abs(Math.sin(ph*9))*1.5:0;
    var rx=K_.rx, ry=K_.ry, tilt=K_.tilt, leg=K_.leg;
    var bx=-1, by=-(leg+ry*0.78)+bob;
    var hx=K_.hx, hy=K_.hy-bob*0.5;
    if(walk){ hx+=Math.sin(ph*9)*1.4; }
    if(peck){ var k=0.5+0.5*Math.sin(ph*11); tilt-=0.35; hx=K_.hx+4+k*4; hy=K_.hy*0.45-k*(K_.hy*0.28); by+=1.5; }
    if(pose==='preen'){ hx=K_.hx*0.1; hy=K_.hy*0.78; }
    if(pose==='coo'){ hy+= -Math.abs(Math.sin(ph*8))*1.2; }
    if(sit&&!brood){ by+=leg*0.55; tilt*=0.75; hy-=leg*0.35; }
    if(brood){ tilt=0.1; by=-ry*0.82; hx=rx*0.74; hy=ry*1.6+ry*0.55; }
    if(fly){ tilt=0.1; by=-20; hx=rx*0.95; hy=36; }
    var cs=Math.cos(-tilt), sn=Math.sin(-tilt);
    function W(x,y){ return [bx+x*cs-y*sn, by+x*sn+y*cs]; }
    // ---- legs (behind body)
    if(!fly&&!brood){
      var sw=walk?Math.sin(ph*9)*3.5:0, top=W(rx*0.05,ry*0.7);
      c.strokeStyle=P.leg; c.lineCap='round'; c.lineJoin='round';
      [[-2.5,sw*-1,0.7],[2.2,sw,1]].forEach(function(l){
        var tx=top[0]+l[0], ty=top[1]; c.globalAlpha=l[2]; c.lineWidth=2.3; c.beginPath(); c.moveTo(tx,ty); c.lineTo(tx+l[1]*0.5,-1.5); c.stroke();
        c.lineWidth=1.5; c.beginPath(); c.moveTo(tx+l[1]*0.5-1,-0.6); c.lineTo(tx+l[1]*0.5+5.5,-0.2); c.moveTo(tx+l[1]*0.5,-1); c.lineTo(tx+l[1]*0.5-3,-0.2); c.stroke(); c.globalAlpha=1;
      });
      // thigh feathers
      ell(c,top[0],top[1]-0.5,rx*0.28,ry*0.34,0); c.fillStyle=P.belly; c.fill();
    }
    // ---- fantail fan sits behind the body
    var bodyBase=[bx,by];
    if(K_.fan&&!fly){ fan(c,P,bx,by,K_,ph); }
    // ---- body frame
    c.save(); c.translate(bx,by); c.rotate(-tilt);
    if(fly){ // far wing
      var wf=Math.sin(ph*16); c.fillStyle=shade(P.wing,0.78); c.beginPath(); c.moveTo(rx*0.3,-ry*0.4); c.quadraticCurveTo(-rx*0.1,-ry*2.4-wf*12,-rx*1.6,-ry*2.2-wf*14); c.quadraticCurveTo(-rx*0.8,-ry*0.8,-rx*0.6,ry*0.2); c.closePath(); c.fill(); c.strokeStyle=OUT; c.lineWidth=0.6; c.stroke();
    }
    if(!K_.fan) tailShape(c,P,K_,col);
    // body + breast
    c.beginPath(); c.ellipse(0,0,rx,ry,0,0,6.2832);
    c.fillStyle=grad(c,0,-ry,0,ry,shade(P.back,1.0),shade(P.belly,1.02)); c.fill(); c.strokeStyle=OUT; c.lineWidth=0.8; c.stroke();
    // breast / chest (bulges forward and down; king, fantail and pouter-like types more)
    var bw=K_.fan?1.25:(br==='king'?1.2:(br==='roman'?1.0:1.05));
    ell(c,rx*0.5,ry*0.12,rx*0.5*bw,ry*0.88*(K_.fan?1.12:1),0); c.fillStyle=grad(c,0,-ry,0,ry,shade(P.breast,1.08),shade(P.breast,0.95)); c.fill();
    // iridescent chest patch (neck/upper breast)
    if(P.i1){ c.save(); ell(c,rx*0.62,-ry*0.3,rx*0.3,ry*0.45,-0.3); c.clip(); c.fillStyle=grad(c,rx*0.35,-ry*0.7,rx*0.9,ry*0.1,P.i1,P.i2); c.globalAlpha=0.55; c.fillRect(rx*0.2,-ry,rx*0.9,ry*1.4); c.globalAlpha=1; c.restore(); }
    // rump patch
    if(col==='G'){ ell(c,-rx*0.78,-ry*0.55,rx*0.3,ry*0.14,-0.15); c.fillStyle=P.rump; c.fill(); }
    if(brood){ // fluffed breast feathers spill over the nest rim
      c.strokeStyle='rgba(255,255,255,0.28)'; c.lineWidth=0.8; for(var f=0;f<6;f++){ c.beginPath(); c.moveTo(rx*(0.1+f*0.12),ry*0.1); c.quadraticCurveTo(rx*(0.2+f*0.12),ry*0.5,rx*(0.1+f*0.12),ry*0.95); c.stroke(); }
    }
    if(fly){ // near wing: big downstroke shape
      var wn=Math.sin(ph*16+0.4); c.fillStyle=grad(c,0,-ry*2,0,ry,P.wing,shade(P.wing,0.85)); c.beginPath(); c.moveTo(rx*0.5,-ry*0.5); c.quadraticCurveTo(rx*0.2,-ry*2.6-wn*12,-rx*1.5,-ry*2.4-wn*14); c.quadraticCurveTo(-rx*0.9,-ry*0.6,-rx*0.7,ry*0.3); c.quadraticCurveTo(rx*0.1,ry*0.2,rx*0.5,-ry*0.5); c.closePath(); c.fill(); c.strokeStyle=OUT; c.lineWidth=0.7; c.stroke();
      if(col!=='W'){ c.fillStyle=P.bar; c.globalAlpha=0.5; c.beginPath(); c.moveTo(-rx*0.5,-ry*0.9-wn*4); c.lineTo(-rx*1.5,-ry*2.4-wn*14); c.lineTo(-rx*0.8,-ry*0.6); c.closePath(); c.fill(); c.globalAlpha=1; }
    } else drawWing(c,P,K_,o,col);
    c.restore();
    // ---- neck
    var nb=W(rx*0.62,-ry*0.5), hc=[bx+hx, by-hy+(-by)*0+0];
    hc=[bx+hx, -hy];
    if(brood){ hc=[bx+hx,by-ry*0.4-hy*0.0-ry*1.0]; }
    var mx=(nb[0]+hc[0])/2+(K_.fan?-2.5:0.8), my=(nb[1]+hc[1])/2+(peck?0:0);
    c.lineCap='round';
    c.strokeStyle=OUT; c.lineWidth=K_.nw+1.4; c.beginPath(); c.moveTo(nb[0]-1,nb[1]+2); c.quadraticCurveTo(mx,my,hc[0]-1,hc[1]+2); c.stroke();
    c.strokeStyle=P.neck; c.lineWidth=K_.nw; c.beginPath(); c.moveTo(nb[0]-1,nb[1]+2); c.quadraticCurveTo(mx,my,hc[0]-1,hc[1]+2); c.stroke();
    if(P.i1){ c.strokeStyle=P.i1; c.globalAlpha=0.6; c.lineWidth=K_.nw*0.55; c.beginPath(); c.moveTo(nb[0]-0.5,nb[1]+2.5); c.quadraticCurveTo(mx-0.3,my+0.5,hc[0]-2,hc[1]+3.5); c.stroke(); c.strokeStyle=P.i2; c.globalAlpha=0.5; c.lineWidth=K_.nw*0.28; c.beginPath(); c.moveTo(nb[0]+0.3,nb[1]+4); c.quadraticCurveTo(mx+0.3,my+1.5,hc[0]-1,hc[1]+4.5); c.stroke(); c.globalAlpha=1; }
    // ---- head
    var hr=K_.hr;
    if(br==='roman'||br==='king'){ ell(c,hc[0]+0.5,hc[1],hr*1.12,hr*0.98,-0.1); } else ell(c,hc[0],hc[1],hr*(br==='homer'?1.05:1),hr*0.95,0);
    c.fillStyle=grad(c,0,hc[1]-hr,0,hc[1]+hr,shade(P.head,1.1),shade(P.head,0.92)); c.fill(); c.strokeStyle=OUT; c.lineWidth=0.8; c.stroke();
    // beak (upper dark, lower paler), cere on top
    var bkL=K_.bk, bxs=hc[0]+hr*0.82, bys=hc[1]+hr*0.1;
    c.fillStyle=P.beak; c.beginPath(); c.moveTo(bxs-1,bys-1.7); c.quadraticCurveTo(bxs+bkL*0.6,bys-1.6,bxs+bkL,bys+0.3); c.quadraticCurveTo(bxs+bkL*0.6,bys+1.7,bxs-1,bys+1.5); c.closePath(); c.fill();
    c.strokeStyle='rgba(30,20,15,0.5)'; c.lineWidth=0.5; c.beginPath(); c.moveTo(bxs+0.5,bys+0.3); c.lineTo(bxs+bkL-0.6,bys+0.4); c.stroke();
    // cere (white wattle above the beak base); roman gets a thick one
    var cw=K_.cw; ell(c,bxs+0.6,bys-1.8,cw+0.4,cw*0.65+0.2,-0.15); c.fillStyle=P.cere; c.fill(); c.strokeStyle='rgba(60,50,40,0.35)'; c.lineWidth=0.4; c.stroke();
    // eye
    var ex=hc[0]+hr*0.32, ey=hc[1]-hr*0.18;
    ell(c,ex,ey,2.1,2.1); c.fillStyle='#f4efe4'; c.fill();
    ell(c,ex,ey,1.55,1.55); c.fillStyle=P.eye; c.fill(); ell(c,ex+0.1,ey,0.85,0.85); c.fillStyle='#14100c'; c.fill(); ell(c,ex-0.35,ey-0.45,0.3,0.3); c.fillStyle='#fff'; c.fill();
  }
  return {draw:draw,has:has,K:K};
})();
