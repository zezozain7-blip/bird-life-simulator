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
  return {draw:draw,PAL:PAL};
})();
