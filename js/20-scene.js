// Isometric scene: projection, cached static layers, dynamic drawing, camera, picking.
BLS.Scene = (function(){
  var C=BLS.CFG, L=BLS.LAYOUT, Sim=BLS.Sim, Spr=BLS.Sprites;
  var HW=48, HH=24, ZH=44, OX=720, OY=470, LW=1440, LH=1260, S=1.15;
  var cv, ctx, W=800, H=600, dpr=1, bg, layers=[], cam={x:60,y:215,z:0.7,tx:null,ty:null}, sel=-1, follow=false, t0=0;
  var ambient=[]; for(var i=0;i<8;i++) ambient.push({x:-700+Math.random()*1400,y:-120-Math.random()*240,sp:35+Math.random()*35,ph:Math.random()*9,col:['W','G','G','R','G','W','G','R'][i]});
  var aviary=[]; for(var k=0;k<14;k++) aviary.push({x:5.5+Math.random()*5,y:0.8+Math.random()*1.8,z:[1.0,1.6,0.05][k%3],c:['#f2d21e','#6cc04a','#e8892b','#4aa8e0','#f2d21e'][k%5],ph:Math.random()*9});
  function P(x,y,z){ return [(x-y)*HW,(x+y)*HH-(z||0)*ZH]; }
  function shade(hex,f){ var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; r=Math.max(0,Math.min(255,r*f))|0; g=Math.max(0,Math.min(255,g*f))|0; b=Math.max(0,Math.min(255,b*f))|0; return 'rgb('+r+','+g+','+b+')'; }
  function rng(seed){ var s=seed; return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
  function poly(c,pts,fill,stroke,lw){ c.beginPath(); pts.forEach(function(p,i){ var q=P(p[0],p[1],p[2]); if(i)c.lineTo(q[0],q[1]); else c.moveTo(q[0],q[1]); }); c.closePath(); if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||1;c.stroke();} }
  function line(c,a,b,col,lw){ var p=P(a[0],a[1],a[2]),q=P(b[0],b[1],b[2]); c.strokeStyle=col; c.lineWidth=lw||1; c.beginPath(); c.moveTo(p[0],p[1]); c.lineTo(q[0],q[1]); c.stroke(); }
  function box(c,x0,y0,z0,x1,y1,z1,col,o){ o=o||{};
    poly(c,[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],shade(col,o.fx||1));
    poly(c,[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],shade(col,o.fy||0.72));
    poly(c,[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],shade(col,o.ft||1.12)); }
  function cyl(c,x,y,z0,z1,r,col){ var a=P(x,y,z0), b=P(x,y,z1), rx=r*HW*1.414, ry=r*HH*1.414;
    var g=c.createLinearGradient(a[0]-rx,0,a[0]+rx,0); g.addColorStop(0,shade(col,0.7)); g.addColorStop(0.45,shade(col,1.15)); g.addColorStop(1,shade(col,0.6));
    c.fillStyle=g; c.beginPath(); c.ellipse(a[0],a[1],rx,ry,0,0,Math.PI); c.lineTo(b[0]-rx,b[1]); c.ellipse(b[0],b[1],rx,ry,0,Math.PI,0,true); c.closePath(); c.fill();
    c.fillStyle=shade(col,1.2); c.beginPath(); c.ellipse(b[0],b[1],rx,ry,0,0,6.3); c.fill(); }
  function blob(c,x,y,r,col){ var g=c.createRadialGradient(x-r*0.3,y-r*0.35,r*0.1,x,y,r); g.addColorStop(0,shade(col,1.35)); g.addColorStop(1,shade(col,0.7)); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,6.3); c.fill(); }
  function bush(c,x,y,z,r,col,seed){ var q=P(x,y,z), R=rng(seed||7); for(var i=0;i<9;i++){ blob(c,q[0]+(R()-0.5)*r*1.5,q[1]-R()*r*0.9,r*(0.45+R()*0.35),col); } }
  function palm(c,x,y,h,seed){ var R=rng(seed), b=P(x,y,0), top=[b[0]+22,b[1]-h]; 
    c.strokeStyle='#6b4f32'; c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.moveTo(b[0],b[1]); c.quadraticCurveTo(b[0]-14,b[1]-h*0.55,top[0],top[1]); c.stroke();
    c.strokeStyle='#8a6a45'; c.lineWidth=3; for(var i=1;i<8;i++){ var u=i/8; c.beginPath(); c.moveTo(b[0]-12*u*(1-u)*2-6,b[1]-h*u); c.lineTo(b[0]+6+22*u*u,b[1]-h*u); c.stroke(); }
    for(var f=0;f<9;f++){ var a=f/9*6.28+R(), len=70+R()*30; var ex=top[0]+Math.cos(a)*len, ey=top[1]+Math.sin(a)*len*0.45+len*0.35; c.strokeStyle=f%2?'#3f7f2e':'#4f9a3a'; c.lineWidth=7; c.beginPath(); c.moveTo(top[0],top[1]); c.quadraticCurveTo((top[0]+ex)/2,top[1]-24,ex,ey); c.stroke(); c.lineWidth=2.5; c.strokeStyle='#2d5f20'; c.stroke(); } }
  function pot(c,x,y,r,col,seed){ var q=P(x,y,0); c.fillStyle='#b4643b'; c.beginPath(); c.moveTo(q[0]-9,q[1]-14); c.lineTo(q[0]+9,q[1]-14); c.lineTo(q[0]+6,q[1]); c.lineTo(q[0]-6,q[1]); c.fill(); bush(c,x,y,0.34,r,col,seed); }

  function newLayer(){ var cn=document.createElement('canvas'); cn.width=LW*S; cn.height=LH*S; var c=cn.getContext('2d'); c.setTransform(S,0,0,S,OX*S,OY*S); return {cn:cn,c:c}; }
  function buildLayers(){
    var l0=newLayer(), l1=newLayer(), l2=newLayer(), c=l0.c, R=rng(42), N=C.GRID;
    // ---- L0: trees, slab, floor, back walls, coop, tank, aviary back, sacks
    palm(c,-2.2,3.5,230,3); palm(c,-1.8,9,260,5); palm(c,4.5,-2.4,210,8); palm(c,10.5,-2.0,250,9); palm(c,13.5,3,200,11);
    bush(c,-2,0.5,0,60,'#4f8a3a',3); bush(c,-1.6,6,0,55,'#3f7a30',4); bush(c,7,-1.8,0,55,'#4f8a3a',5); bush(c,13.2,-0.5,0,55,'#3f7a30',6); bush(c,13.5,8,0,45,'#4f8a3a',7);
    // slab sides
    poly(c,[[N,0,0],[N,N,0],[N,N,-1.5],[N,0,-1.5]],'#a96e4c'); poly(c,[[0,N,0],[N,N,0],[N,N,-1.5],[0,N,-1.5]],'#80503a');
    c.strokeStyle='rgba(60,30,20,0.35)'; c.lineWidth=1;
    for(var z=-0.25;z>-1.5;z-=0.25){ line(c,[N,0,z],[N,N,z],'rgba(60,30,20,0.35)'); line(c,[0,N,z],[N,N,z],'rgba(60,30,20,0.35)'); }
    for(var i=0;i<N;i++) for(var j=0;j<N;j++){
      var v=0.9+R()*0.2, col=shade('#b9a68a',v*(((i+j)&1)?1:0.97)); poly(c,[[i,j,0],[i+1,j,0],[i+1,j+1,0],[i,j+1,0]],col,'rgba(70,55,40,0.35)',1);
      if(R()<0.25){ var a=P(i+R(),j+R(),0); c.strokeStyle='rgba(60,45,30,0.25)'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(a[0]+(R()-0.5)*26,a[1]+(R()-0.5)*12); c.stroke(); }
    }
    // soft shadows of coop
    poly(c,[[2.4,1,0],[3.7,1,0],[3.7,5.6,0],[2.4,5.6,0]],'rgba(40,30,20,0.18)');
    // back parapets
    box(c,-0.25,0,0,0.15,N,1.0,'#b98a64'); box(c,0,-0.25,0,N,0.15,1.0,'#b98a64',{fx:1,fy:0.85});
    for(var k=0.1;k<1.0;k+=0.2){ line(c,[0.15,0,k],[0.15,N,k],'rgba(70,40,25,0.3)'); line(c,[0,0.15,k],[N,0.15,k],'rgba(70,40,25,0.3)'); }
    for(var m=0;m<N;m+=1){ line(c,[0.15,m,0],[0.15,m,1.0],'rgba(70,40,25,0.18)'); line(c,[m,0.15,0],[m,0.15,1.0],'rgba(70,40,25,0.18)'); }
    poly(c,[[0.15,0.15,0],[1.2,0.15,0],[1.2,N,0],[0.15,N,0]],'rgba(30,20,10,0.15)'); poly(c,[[0.15,0.15,0],[N,0.15,0],[N,1.2,0],[0.15,1.2,0]],'rgba(30,20,10,0.15)');
    var M=rng(11); for(var mi=0;mi<70;mi++){ var mx=Math.floor(M()*N), my=Math.floor(M()*N), mq=P(mx+(M()<0.5?0:1),my+M(),0); c.strokeStyle='rgba(86,120,50,0.5)'; c.lineWidth=2; c.beginPath(); c.moveTo(mq[0],mq[1]); c.lineTo(mq[0]+(M()-0.5)*8,mq[1]-3-M()*3); c.stroke(); }
    box(c,0.5,6.5,0,1.1,7.1,0.5,'#a9794a'); box(c,0.55,6.55,0.5,1.05,7.05,0.95,'#b98a58'); for(var cz=0.12;cz<0.9;cz+=0.2){ line(c,[1.1,6.5,cz],[1.1,7.1,cz],'rgba(50,30,10,0.35)'); }
    // water tank
    [[4.2,0.9],[4.8,0.9],[4.2,1.5],[4.8,1.5]].forEach(function(p){ line(c,[p[0],p[1],0],[p[0],p[1],0.7],'#555b60',3); });
    cyl(c,4.5,1.2,0.7,1.9,0.62,'#8f979d'); for(var q=0.9;q<1.9;q+=0.3){ var a2=P(4.5,1.2,q); c.strokeStyle='rgba(40,50,55,0.35)'; c.beginPath(); c.ellipse(a2[0],a2[1],0.62*HW*1.414,0.62*HH*1.414,0,0,Math.PI); c.stroke(); }
    // aviary back (x=5 plane, y=0.4 plane), floor
    poly(c,[[5,0.4,0],[11,0.4,0],[11,3,0],[5,3,0]],'#8e8268');
    box(c,4.95,0.4,0,5.05,3,0.12,'#7b705a'); 
    [[5,0.4],[11,0.4]].forEach(function(p){});
    for(var yy=0.4;yy<=3.01;yy+=0.2) line(c,[5,yy,0],[5,yy,2.2],'rgba(210,225,230,0.28)'); for(var zz=0;zz<=2.21;zz+=0.2) line(c,[5,0.4,zz],[5,3,zz],'rgba(210,225,230,0.28)');
    for(var xx=5;xx<=11.01;xx+=0.2) line(c,[xx,0.4,0],[xx,0.4,2.2],'rgba(210,225,230,0.28)'); for(zz=0;zz<=2.21;zz+=0.2) line(c,[5,0.4,zz],[11,0.4,zz],'rgba(210,225,230,0.28)');
    // plants inside aviary
    bush(c,5.6,0.9,0,26,'#3f8a3a',21); bush(c,10.5,0.9,0,26,'#3f8a3a',22); bush(c,10.4,2.7,0,22,'#4f9a40',23);
    // perches
    [1.0,1.6].forEach(function(z){ line(c,[5.3,1.2,z],[10.8,1.2,z],'#7a5a3a',3); line(c,[5.3,2.2,z],[10.8,2.2,z],'#7a5a3a',3); });
    // ---- coop
    box(c,0.4,1.0,0,2.4,5.6,2.45,'#a47642',{fx:1,fy:0.7,ft:1.0});
    // planks on front face
    for(var py=1.0;py<5.6;py+=0.23){ line(c,[2.4,py,0],[2.4,py,2.45],'rgba(50,30,10,0.28)'); }
    for(var pz=0.2;pz<2.45;pz+=0.4){ var rr=0; }
    for(var n=0;n<C.NEST_COUNT;n++){
      var col=n%4,row=(n/4)|0, y0=1.3+col*1.05, z0=0.45+row*0.9;
      poly(c,[[2.4,y0-0.07,z0-0.07],[2.4,y0+0.97,z0-0.07],[2.4,y0+0.97,z0+0.77],[2.4,y0-0.07,z0+0.77]],'#6e4a26');
      poly(c,[[2.4,y0,z0],[2.4,y0+0.9,z0],[2.4,y0+0.9,z0+0.7],[2.4,y0,z0+0.7]],'#251709');
      poly(c,[[2.4,y0,z0+0.7],[2.4,y0+0.9,z0+0.7],[2.25,y0+0.9,z0+0.7],[2.25,y0,z0+0.7]],'#150d05');
      poly(c,[[2.4,y0+0.02,z0],[2.4,y0+0.88,z0],[2.3,y0+0.84,z0+0.12],[2.3,y0+0.06,z0+0.12]],'#c9a45a');
      poly(c,[[2.4,y0,z0],[2.4,y0+0.9,z0],[2.4,y0+0.9,z0+0.03],[2.4,y0,z0+0.03]],'#8a5d2c');
    }
    // lower storage doors
    poly(c,[[2.4,1.2,0.05],[2.4,2.4,0.05],[2.4,2.4,0.4],[2.4,1.2,0.4]],'#7e552c','#3a2410',1.5);
    // lantern + ac unit
    var ln=P(2.45,1.05,2.0); c.fillStyle='#ffd37a'; c.fillRect(ln[0]-4,ln[1]-6,8,12); c.strokeStyle='#222'; c.strokeRect(ln[0]-4,ln[1]-6,8,12);
    box(c,0.4,5.6,0.7,1.2,6.2,1.5,'#d9dde0'); var fan=P(0.8,6.2,1.1); c.strokeStyle='#8a9096'; c.lineWidth=1.5; c.beginPath(); c.ellipse(fan[0],fan[1]-6,12,8,0,0,6.3); c.stroke();
    // roof
    poly(c,[[0.2,0.7,3.0],[2.9,0.7,2.55],[2.9,6.0,2.55],[0.2,6.0,3.0]],'#8b8478');
    for(var ry=0.7;ry<6.0;ry+=0.16){ line(c,[0.2,ry,3.0],[2.9,ry,2.55],ry*6%2<1?'rgba(255,255,255,0.18)':'rgba(40,35,30,0.22)',1.5); }
    poly(c,[[2.9,0.7,2.55],[2.9,6.0,2.55],[2.9,6.0,2.43],[2.9,0.7,2.43]],'#5d574d'); poly(c,[[0.2,6,3.0],[2.9,6,2.55],[2.9,6,2.43],[0.2,6,2.88]],'#4a443b');
    // steps
    for(var s=0;s<4;s++) box(c,2.4+s*0.0,5.0,0,2.4+0.7-s*0.18,5.5,0.12+s*0.1,'#9a6c3c');
    // blue barrel
    cyl(c,2.7,6.3,0,0.9,0.38,'#3e78b8'); 
    // sacks
    [[1.2,7.2],[1.9,7.1],[1.55,7.9],[2.2,7.9]].forEach(function(p,i){ var q=P(p[0],p[1],0); var g=c.createLinearGradient(q[0]-22,0,q[0]+22,0); g.addColorStop(0,'#b79a66'); g.addColorStop(0.5,'#e2c88f'); g.addColorStop(1,'#a38455');
      c.fillStyle=g; c.beginPath(); c.moveTo(q[0]-22,q[1]); c.quadraticCurveTo(q[0]-28,q[1]-36,q[0]-14,q[1]-48); c.lineTo(q[0]+14,q[1]-48); c.quadraticCurveTo(q[0]+28,q[1]-36,q[0]+22,q[1]); c.closePath(); c.fill();
      c.strokeStyle='#6b5530'; c.lineWidth=1; c.stroke(); c.fillStyle='#b8782a'; c.beginPath(); c.ellipse(q[0],q[1]-24,6,9,0,0,6.3); c.fill(); });
    pot(c,3.2,3.1,26,'#3f8a3a',31); pot(c,4.2,3.0,24,'#5aa044',32); pot(c,3.6,11.0,26,'#4f9a40',33);
    // ---- L1: aviary front mesh + roof
    c=l1.c;
    for(var y2=0.4;y2<=3.01;y2+=0) { break; }
    for(var xx2=5;xx2<=11.01;xx2+=0.2) line(c,[xx2,3,0],[xx2,3,2.2],'rgba(220,232,238,0.42)'); for(zz=0;zz<=2.21;zz+=0.2) line(c,[5,3,zz],[11,3,zz],'rgba(220,232,238,0.42)');
    for(var yy2=0.4;yy2<=3.01;yy2+=0.2) line(c,[11,yy2,0],[11,yy2,2.2],'rgba(220,232,238,0.42)'); for(zz=0;zz<=2.21;zz+=0.2) line(c,[11,0.4,zz],[11,3,zz],'rgba(220,232,238,0.42)');
    for(var pxx=5;pxx<=11.01;pxx+=1.5) line(c,[pxx,3,0],[pxx,3,2.2],'#6b747a',3); for(var pyy=0.4;pyy<=3.01;pyy+=1.3) line(c,[11,pyy,0],[11,pyy,2.2],'#6b747a',3);
    line(c,[5,3,2.2],[11,3,2.2],'#6b747a',3); line(c,[11,3,2.2],[11,0.4,2.2],'#6b747a',3); line(c,[5,3,0],[11,3,0],'#6b747a',3); line(c,[11,3,0],[11,0.4,0],'#6b747a',3);
    poly(c,[[5,0.4,2.2],[11,0.4,2.2],[11,3,2.2],[5,3,2.2]],'rgba(170,200,215,0.28)','rgba(120,135,145,0.6)',2);
    for(var rx=5;rx<=11.01;rx+=0.25) line(c,[rx,0.4,2.2],[rx,3,2.2],'rgba(230,240,245,0.35)'); 
    poly(c,[[7.6,3,0],[8.5,3,0],[8.5,3,1.7],[7.6,3,1.7]],'rgba(120,100,70,0.15)','#4e4a40',3);
    // ---- L2: front layer
    c=l2.c;
    // garden bed
    box(c,7.2,8.4,0,11.2,11.2,0.4,'#b4573b',{fx:1.0,fy:0.78,ft:0.9});
    poly(c,[[7.35,8.55,0.4],[11.05,8.55,0.4],[11.05,11.05,0.4],[7.35,11.05,0.4]],'#4a3320');
    var G2=rng(9); for(var gi=0;gi<34;gi++){ var gx=7.5+G2()*3.5, gy=8.7+G2()*2.3, q2=P(gx,gy,0.42); blob(c,q2[0],q2[1]-8,12+G2()*7,G2()<0.3?'#6aae3d':'#3f8f3a'); }
    for(gi=0;gi<7;gi++){ var q3=P(7.6+G2()*3.4,8.8+G2()*2.2,0.7); c.fillStyle=['#e86a8f','#f4d03a','#fff'][gi%3]; c.beginPath(); c.arc(q3[0],q3[1]-8,3,0,6.3); c.fill(); }
    // pergola
    var pp=[[0.45,9.0],[0.45,11.6],[2.6,9.0],[2.6,11.6]];
    pp.forEach(function(p){ line(c,[p[0],p[1],0],[p[0],p[1],2.1],'#7a5230',6); });
    for(var bx=0.45;bx<=2.61;bx+=0.43) line(c,[bx,9.0,2.1],[bx,11.6,2.1],'#8a5f38',4);
    line(c,[0.45,9,2.1],[2.6,9,2.1],'#6b4526',6); line(c,[0.45,11.6,2.1],[2.6,11.6,2.1],'#6b4526',6);
    var G3=rng(5); for(var vi=0;vi<26;vi++){ var q4=P(0.5+G3()*2.1,9.1+G3()*2.4,2.15); blob(c,q4[0],q4[1],11+G3()*8,'#3f8f3a'); }
    // front rails (x=N and y=N edges)
    for(var e=0;e<=N;e+=1){ line(c,[N,e,0],[N,e,0.5],'#6f7378',3); line(c,[e,N,0],[e,N,0.5],'#6f7378',3); }
    line(c,[N,0,0.5],[N,N,0.5],'#8d9399',3); line(c,[0,N,0.5],[N,N,0.5],'#8d9399',3); line(c,[N,0,0.25],[N,N,0.25],'#7c8288',2); line(c,[0,N,0.25],[N,N,0.25],'#7c8288',2);
    pot(c,11.6,4.2,24,'#5aa044',41); pot(c,11.6,6.2,22,'#3f8a3a',42); pot(c,5.5,11.6,26,'#4f9a40',43); pot(c,4.1,11.5,22,'#e86a8f',44);
    bush(c,0.6,12.4,0,50,'#3f8a3a',45); bush(c,12.7,12,0,40,'#4f9a40',46);
    layers=[l0,l1,l2];
  }
  function buildBg(){
    bg=document.createElement('canvas'); bg.width=W*dpr; bg.height=H*dpr; var c=bg.getContext('2d'); c.scale(dpr,dpr);
    var g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#6fa4d4'); g.addColorStop(0.35,'#bcd5e6'); g.addColorStop(0.5,'#f6d9a4'); g.addColorStop(0.62,'#d4b57a'); g.addColorStop(1,'#6e8a42'); c.fillStyle=g; c.fillRect(0,0,W,H);
    var sg=c.createRadialGradient(W*0.2,H*0.42,5,W*0.2,H*0.42,W*0.6); sg.addColorStop(0,'rgba(255,240,190,0.9)'); sg.addColorStop(1,'rgba(255,240,190,0)'); c.fillStyle=sg; c.fillRect(0,0,W,H);
    var R=rng(77), hy=H*0.47;
    for(var i=0;i<30;i++){ var x=R()*W, w=18+R()*34, h=14+R()*30; c.fillStyle='rgb('+(190+R()*30|0)+','+(150+R()*30|0)+','+(120+R()*20|0)+')'; c.fillRect(x,hy-h,w,h); c.fillStyle='rgba(120,70,40,0.5)'; c.fillRect(x,hy-h,w,3); }
    c.fillStyle='#e8dcc4'; c.fillRect(W*0.78,hy-92,9,92); c.beginPath(); c.moveTo(W*0.78-3,hy-92); c.lineTo(W*0.78+4.5,hy-112); c.lineTo(W*0.78+12,hy-92); c.fill(); c.fillStyle='#d9ccb0'; c.beginPath(); c.arc(W*0.86,hy-18,22,Math.PI,0); c.fill(); c.fillRect(W*0.86-22,hy-18,44,18);
    c.fillStyle='rgba(120,100,60,0.35)'; c.fillRect(0,hy,W,H*0.12);
    for(i=0;i<14;i++){ var px=R()*W; c.strokeStyle='#4a3a22'; c.lineWidth=3; c.beginPath(); c.moveTo(px,hy+6); c.lineTo(px+4,hy-40-R()*30); c.stroke(); c.fillStyle='#3f7a2c'; c.beginPath(); c.arc(px+4,hy-48,14,0,6.3); c.fill(); }
    var hz=c.createLinearGradient(0,hy-60,0,hy+40); hz.addColorStop(0,'rgba(255,230,190,0)'); hz.addColorStop(0.6,'rgba(255,230,190,0.45)'); hz.addColorStop(1,'rgba(255,230,190,0)'); c.fillStyle=hz; c.fillRect(0,hy-60,W,100);
  }
  function resize(){ dpr=Math.min(2,window.devicePixelRatio||1); W=window.innerWidth; H=window.innerHeight; cv.width=W*dpr; cv.height=H*dpr; buildBg(); }
  function fitZoom(){ return Math.max(0.55,Math.min(1.25,Math.min(W/560,H/640))); }
  function toScreen(wx,wy,wz){ var p=P(wx,wy,wz); return [(p[0]-cam.x)*cam.z+W/2,(p[1]-cam.y)*cam.z+H/2]; }
  function clampCam(){ cam.x=Math.max(-620,Math.min(620,cam.x)); cam.y=Math.max(-60,Math.min(520,cam.y)); cam.z=Math.max(0.35,Math.min(2.0,cam.z)); }
  function focus(wx,wy,wz,z){ var p=P(wx,wy,wz); cam.tx=p[0]; cam.ty=p[1]+H*0.3/cam.z; if(z) cam.tz=z; }
  function sheetOpen(){ return !document.getElementById('sheet').classList.contains('hidden'); }
  // --- tint
  function tint(h){ var n=[100,115,175],w=[255,255,255],d=[255,196,150];
    function mix(a,b,u){ return [a[0]+(b[0]-a[0])*u|0,a[1]+(b[1]-a[1])*u|0,a[2]+(b[2]-a[2])*u|0]; }
    var c; if(h<5) c=n; else if(h<7) c=mix(n,d,(h-5)/2); else if(h<9) c=mix(d,w,(h-7)/2); else if(h<16.5) c=w; else if(h<19) c=mix(w,d,(h-16.5)/2.5); else if(h<21) c=mix(d,n,(h-19)/2); else c=n;
    return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; }
  function shadow(c,x,y,rx,ry,a){ c.fillStyle='rgba(30,20,10,'+a+')'; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,6.3); c.fill(); }
  function poseOf(b){ var st=b.st; if(st==='eat'||st==='drink'||st==='peck') return 'peck'; if(st==='walk') return 'walk'; if(st==='fly') return 'fly'; if(st==='sit'||st==='perch') return 'sit'; if(st==='squabnest') return 'squab'; if(st==='preen') return 'preen'; if(st==='coo') return 'coo'; return 'stand'; }
  function drawBirdW(c,b,sz){
    sz=sz||1.55; var k=sz/1.05;
    var G=Sim.G, p=P(b.x,b.y,b.z), stg=Sim.stageOf(b);
    var gp=P(b.x,b.y,0);
    if(b.z>0.05) shadow(c,gp[0],gp[1],11*k*(stg==='adult'?1:0.7),4.5*k,Math.max(0.08,0.28-b.z*0.08));
    else if(stg!=='squab') shadow(c,p[0],p[1],12*k*(stg==='adult'?1:0.7),4.5*k,0.28);
    if(b.id===sel){ c.strokeStyle='#ffe27a'; c.lineWidth=2.5; c.beginPath(); c.ellipse(gp[0],gp[1],20*k,8*k,0,0,6.3); c.stroke(); }
    Spr.draw(c,p[0],p[1],sz,b.face,{col:BLS.Gen.phenoColor(b.g),pat:BLS.Gen.phenoPattern(b.g),pose:poseOf(b),ph:b.ph,stage:stg});
    if(b.hunger>75||b.thirst>75){ var q=P(b.x,b.y,b.z); c.font='bold 15px sans-serif'; c.textAlign='center'; c.fillStyle='#ffcf33'; c.fillText(b.thirst>b.hunger?'💧':'🌾',q[0],q[1]-62*k/1.4); }
    if(b.id===sel){ var q2=P(b.x,b.y,b.z); c.font='bold 13px system-ui,sans-serif'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,0.75)'; c.strokeText(b.name,q2[0],q2[1]-(stg==='squab'?30:68)); c.fillStyle='#fff'; c.fillText(b.name,q2[0],q2[1]-(stg==='squab'?30:68)); }
  }
  function drawEgg(c,e,idx){
    var np=L.nestPos(e.nest), off=(idx%2?0.2:-0.2), p=P(np.x+0.05,np.y+off,np.z+0.03);
    c.save(); c.translate(p[0],p[1]); var g=c.createRadialGradient(-2,-6,1,0,-4,9); g.addColorStop(0,e.dead?'#b7b2a4':'#fffdf4'); g.addColorStop(1,e.dead?'#7f7a6c':'#d9d0b6'); c.fillStyle=g; c.beginPath(); c.ellipse(0,-4,5.5,7,0,0,6.3); c.fill(); c.restore();
  }
  function frame(now){
    var G=Sim.G; if(!G) return;
    var c=ctx; c.setTransform(dpr,0,0,dpr,0,0);
    if(cam.tx!==null){ cam.x+=(cam.tx-cam.x)*0.15; cam.y+=(cam.ty-cam.y)*0.15; if(cam.tz) cam.z+=(cam.tz-cam.z)*0.15; if(Math.abs(cam.tx-cam.x)<0.5&&Math.abs(cam.ty-cam.y)<0.5){ cam.tx=null; cam.tz=null; } }
    if(follow&&sel>=0){ var fb=Sim.bird(sel); if(fb){ var fp=P(fb.x,fb.y,fb.z); cam.x+=(fp[0]-cam.x)*0.1; cam.y+=(fp[1]-cam.y+(sheetOpen()?H*0.3/cam.z:0))*0.1; } }
    clampCam();
    c.drawImage(bg,0,0,W,H);
    c.setTransform(cam.z*dpr,0,0,cam.z*dpr,(W/2-cam.x*cam.z)*dpr,(H/2-cam.y*cam.z)*dpr);
    var t=now/1000;
    c.drawImage(layers[0].cn,-OX,-OY,LW,LH);
    // aviary birds
    aviary.forEach(function(a){ var p=P(a.x,a.y,a.z); var bobv=Math.sin(t*2+a.ph)*1.2; c.fillStyle=a.c; c.beginPath(); c.ellipse(p[0],p[1]-9+bobv,5,7,0.2,0,6.3); c.fill(); c.beginPath(); c.arc(p[0]+3,p[1]-17+bobv,3.4,0,6.3); c.fill(); c.fillStyle='#222'; c.fillRect(p[0]+4,p[1]-18+bobv,1.5,1.5); c.fillStyle='#f6a02a'; c.beginPath(); c.moveTo(p[0]+6,p[1]-17+bobv); c.lineTo(p[0]+9,p[1]-15.5+bobv); c.lineTo(p[0]+6,p[1]-15+bobv); c.fill(); });
    c.drawImage(layers[1].cn,-OX,-OY,LW,LH);
    // nest eggs and elevated birds
    for(var ln=G.nestsOpen;ln<C.NEST_COUNT;ln++){ var lcol=ln%4,lrow=(ln/4)|0, ly=1.3+lcol*1.05, lz=0.45+lrow*0.9; poly(c,[[2.43,ly-0.04,lz-0.04],[2.43,ly+0.94,lz-0.04],[2.43,ly+0.94,lz+0.74],[2.43,ly-0.04,lz+0.74]],'#8a6236','#3a2410',1.5);
      for(var pl=0.15;pl<0.74;pl+=0.2) line(c,[2.43,ly-0.04,lz+pl],[2.43,ly+0.94,lz+pl],'rgba(40,22,8,0.5)',1.2); var lp=P(2.43,ly+0.45,lz+0.35); c.font='bold 16px sans-serif'; c.textAlign='center'; c.fillStyle='#ffe3a0'; c.fillText('🔒',lp[0],lp[1]+6); }
    var cnt={}; G.eggs.forEach(function(e){ cnt[e.nest]=(cnt[e.nest]||0)+1; drawEgg(c,e,cnt[e.nest]-1); });
    var elev=G.birds.filter(function(b){ return b.st==='sit'||(b.st==='perch'&&b.z>2)||b.st==='squabnest'; }).sort(function(a,b){return (a.x+a.y)-(b.x+b.y);});
    elev.forEach(function(b){ drawBirdW(c,b,b.st==='perch'?1.45:(b.st==='squabnest'?1.6:0.95)); });
    // ground items + birds
    var items=[]; 
    items.push({k:L.feeder.x+L.feeder.y,f:function(){ drawFeeder(c,G); }}); items.push({k:L.water.x+L.water.y,f:function(){ drawWater(c,G); }});
    G.perches.forEach(function(pi){ var sp=L.perchSpots[pi]; items.push({k:sp[0]+sp[1]-0.2,f:function(){ var a=P(sp[0],sp[1],0), b2=P(sp[0],sp[1],0.9); shadow(c,a[0],a[1],18,7,0.2); c.strokeStyle='#6b4526'; c.lineWidth=5; c.lineCap='round'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b2[0],b2[1]); c.stroke(); line(c,[sp[0],sp[1]-0.55,0.92],[sp[0],sp[1]+0.55,0.92],'#8a5f38',5); line(c,[sp[0]-0.3,sp[1],0],[sp[0]+0.3,sp[1],0],'#6b4526',5); }}); });
    G.birds.forEach(function(b){ if((b.st!=='sit'||false)&&b.st!=='sit'&&b.st!=='squabnest'&&b.st!=='fly'&&!(b.st==='perch'&&b.z>2)) items.push({k:b.x+b.y+0.001,f:function(){ drawBirdW(c,b); }}); });
    items.sort(function(a,b){return a.k-b.k;}); items.forEach(function(i){ i.f(); });
    c.drawImage(layers[2].cn,-OX,-OY,LW,LH);
    G.birds.forEach(function(b){ if(b.st==='fly') drawBirdW(c,b,1.5); });
    ambient.forEach(function(a){ a.x+=a.sp*0.016; if(a.x>800){ a.x=-800; a.y=-120-Math.random()*220; } Spr.draw(c,a.x,a.y+Math.sin(t+a.ph)*14,0.9,1,{col:a.col,pat:'B',pose:'fly',ph:t+a.ph}); });
    // tint
    c.setTransform(dpr,0,0,dpr,0,0);
    var vg=c.createRadialGradient(W/2,H*0.5,Math.min(W,H)*0.45,W/2,H*0.5,Math.max(W,H)*0.78); vg.addColorStop(0,'rgba(20,12,0,0)'); vg.addColorStop(1,'rgba(20,12,0,0.38)'); c.fillStyle=vg; c.fillRect(0,0,W,H);
    var h=Sim.hourOfDay(), tc=tint(h); if(tc!=='rgb(255,255,255)'){ c.globalCompositeOperation='multiply'; c.fillStyle=tc; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; }
  }
  function drawFeeder(c,G){ var p=P(L.feeder.x,L.feeder.y,0), r=0.55; shadow(c,p[0],p[1]+2,r*HW*1.5,r*HH*1.5,0.2);
    c.fillStyle='#8a6a3f'; c.beginPath(); c.ellipse(p[0],p[1],r*HW*1.414,r*HH*1.414,0,0,6.3); c.fill();
    c.fillStyle='#5e4528'; c.beginPath(); c.ellipse(p[0],p[1]-3,r*HW*1.25,r*HH*1.25,0,0,6.3); c.fill();
    var f=Math.min(1,G.feeder.grain/C.FEEDER_CAP); if(f>0.02){ c.fillStyle='#e0b53a'; c.beginPath(); c.ellipse(p[0],p[1]-3-f*3,r*HW*1.15*Math.max(0.35,f),r*HH*1.15*Math.max(0.35,f),0,0,6.3); c.fill(); c.fillStyle='rgba(255,230,140,0.5)'; for(var i=0;i<8;i++){ c.fillRect(p[0]-14+((i*13)%28),p[1]-7-f*3+((i*7)%8),2,1.5); } } }
  function drawWater(c,G){ var p=P(L.water.x,L.water.y,0); shadow(c,p[0],p[1]+2,22,9,0.2);
    c.fillStyle='#b32424'; c.beginPath(); c.ellipse(p[0],p[1],18,8,0,0,6.3); c.fill(); c.fillStyle='#8c1a1a'; c.beginPath(); c.ellipse(p[0],p[1]-3,14,6,0,0,6.3); c.fill();
    var w=Math.min(1,G.water.amt/C.WATER_CAP); c.fillStyle='rgba(235,245,250,0.85)'; c.beginPath(); c.moveTo(p[0]-9,p[1]-6); c.quadraticCurveTo(p[0]-12,p[1]-38,p[0],p[1]-44); c.quadraticCurveTo(p[0]+12,p[1]-38,p[0]+9,p[1]-6); c.closePath(); c.fill();
    c.fillStyle='rgba(90,170,230,0.75)'; var wh=34*w; c.fillRect(p[0]-9.5+ (1-w)*0,p[1]-6-wh,19,wh*0.95); c.strokeStyle='rgba(120,140,150,0.6)'; c.lineWidth=1; c.stroke(); }
  // --- picking
  function pick(sx,sy){
    var G=Sim.G, best=null, bd=1e9;
    G.birds.forEach(function(b){ var stg=Sim.stageOf(b), p=toScreen(b.x,b.y,b.z), big=(b.st==='sit'||b.st==='squabnest')?0.7:1.45, r=(stg==='squab'?16:stg==='juvenile'?22:28)*cam.z*big+10; var cy=p[1]-(stg==='squab'?9:18)*cam.z*(stg==='juvenile'?0.8:1)*big; var d=Math.hypot(p[0]-sx,cy-sy); if(d<r&&d<bd){ bd=d; best={type:'bird',id:b.id}; } });
    if(best) return best;
    for(var n=0;n<C.NEST_COUNT;n++){ var np=L.nestPos(n), a=toScreen(2.4,np.y-0.45,np.z-0.04), b2=toScreen(2.4,np.y+0.45,np.z+0.66); var x0=Math.min(a[0],b2[0]),x1=Math.max(a[0],b2[0]),y0=Math.min(a[1],b2[1]),y1=Math.max(a[1],b2[1]); if(sx>=x0-4&&sx<=x1+4&&sy>=y0-4&&sy<=y1+4) return {type:'nest',n:n}; }
    var f=toScreen(L.feeder.x,L.feeder.y,0); if(Math.abs(sx-f[0])<0.55*HW*1.4*cam.z+8&&Math.abs(sy-f[1])<28*cam.z) return {type:'feeder'};
    var w=toScreen(L.water.x,L.water.y,0); if(Math.abs(sx-w[0])<22*cam.z&&sy<w[1]+10*cam.z&&sy>w[1]-48*cam.z) return {type:'water'};
    var sk=toScreen(1.7,7.5,0); if(Math.hypot(sx-sk[0],sy-sk[1]+24*cam.z)<58*cam.z) return {type:'sacks'};
    return null;
  }
  // --- input
  function init(canvas){
    cv=canvas; ctx=cv.getContext('2d'); resize(); window.addEventListener('resize',function(){ resize(); });
    buildLayers(); cam.z=fitZoom();
    var ptrs={}, moved=false, startPos=null, lastPinch=0;
    function pts(){ return Object.keys(ptrs).map(function(k){return ptrs[k];}); }
    cv.addEventListener('pointerdown',function(e){ cv.setPointerCapture(e.pointerId); ptrs[e.pointerId]={x:e.clientX,y:e.clientY}; if(pts().length===1){ moved=false; startPos={x:e.clientX,y:e.clientY}; } else { moved=true; lastPinch=0; } cam.tx=null; });
    cv.addEventListener('pointermove',function(e){ var p=ptrs[e.pointerId]; if(!p) return; var ps=pts();
      if(ps.length===1){ var dx=e.clientX-p.x, dy=e.clientY-p.y; if(!moved&&Math.hypot(e.clientX-startPos.x,e.clientY-startPos.y)>8) moved=true; if(moved){ cam.x-=dx/cam.z; cam.y-=dy/cam.z; follow=false; } p.x=e.clientX; p.y=e.clientY; }
      else if(ps.length>=2){ p.x=e.clientX; p.y=e.clientY; var d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y); if(lastPinch) cam.z*=d/lastPinch; lastPinch=d; } });
    function up(e){ var was=ptrs[e.pointerId]; delete ptrs[e.pointerId]; lastPinch=0; if(was&&!moved&&Object.keys(ptrs).length===0){ var hit=pick(e.clientX,e.clientY); if(BLS.UI) BLS.UI.onPick(hit); } }
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',function(e){ delete ptrs[e.pointerId]; });
    cv.addEventListener('wheel',function(e){ e.preventDefault(); cam.z*=e.deltaY<0?1.1:0.9; },{passive:false});
    function loop(now){ frame(now); requestAnimationFrame(loop); } requestAnimationFrame(loop);
  }
  return { init:init, focus:focus, cam:cam, fitZoom:fitZoom, select:function(id){ sel=id; if(id<0) follow=false; }, setFollow:function(v){ follow=v; }, isFollow:function(){return follow;}, get sel(){return sel;}, toScreen:toScreen, pick:pick, rebuild:function(){ buildLayers(); } };
})();
