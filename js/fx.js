// Visual feedback only: particles in the world, flying coins and the level-up card. Never changes the simulation.
BLS.FX = (function(){
  var parts=[], MAX=220;
  function add(p){ if(parts.length<MAX){ p.t=0; parts.push(p); } }
  function rnd(a,b){ return a+Math.random()*(b-a); }
  // x,y are world pixels
  function burst(kind,x,y){
    var i;
    if(kind==='heart') for(i=0;i<3;i++) add({k:'heart',x:x+rnd(-14,14),y:y,vx:rnd(-6,6),vy:rnd(-34,-22),g:0,life:rnd(1.2,1.8),s:rnd(5,8)});
    else if(kind==='hatch') for(i=0;i<26;i++) add({k:i%2?'star':'shell',x:x,y:y,vx:rnd(-70,70),vy:rnd(-110,-20),g:190,life:rnd(0.8,1.5),s:rnd(3,6)});
    else if(kind==='feather') for(i=0;i<5;i++) add({k:'feather',x:x+rnd(-10,10),y:y-rnd(0,14),vx:rnd(-28,28),vy:rnd(-30,8),g:24,life:rnd(1,2),s:rnd(5,8)});
    else if(kind==='spark') for(i=0;i<60;i++) add({k:'star',x:x+rnd(-330,330),y:y+rnd(-70,110),vx:0,vy:rnd(-30,-8),g:0,life:rnd(0.7,1.6),s:rnd(3,7)});
    else if(kind==='seed') for(i=0;i<22;i++) add({k:'seed',x:x+rnd(-4,4),y:y-46,vx:rnd(-34,34),vy:rnd(-50,0),g:220,floor:y+rnd(-7,7),life:rnd(3.5,5.5),s:rnd(1.6,2.8)});
  }
  function star(c,s){ c.beginPath(); for(var i=0;i<8;i++){ var r=i%2?s*0.35:s, a=i*Math.PI/4; c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); c.fill(); }
  function draw(c,dt){
    for(var i=parts.length-1;i>=0;i--){ var p=parts[i]; p.t+=dt; if(p.t>=p.life){ parts.splice(i,1); continue; }
      p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.floor!==undefined&&p.y>p.floor){ p.y=p.floor; p.vx=p.vy=p.g=0; }
      c.save(); c.translate(p.x,p.y); c.globalAlpha=Math.min(1,(p.life-p.t)*2);
      if(p.k==='heart'){ var s=p.s; c.fillStyle='#ff5277'; c.beginPath(); c.moveTo(0,s*0.7); c.bezierCurveTo(-s*1.4,-s*0.3,-s*0.5,-s*1.2,0,-s*0.35); c.bezierCurveTo(s*0.5,-s*1.2,s*1.4,-s*0.3,0,s*0.7); c.fill(); }
      else if(p.k==='star'){ c.fillStyle='#ffe566'; c.rotate(p.t*3); star(c,p.s); }
      else if(p.k==='shell'){ c.fillStyle='#fdf6e2'; c.rotate(p.t*7); c.beginPath(); c.moveTo(-p.s,0); c.lineTo(0,-p.s); c.lineTo(p.s,p.s*0.4); c.fill(); }
      else if(p.k==='feather'){ c.fillStyle='#e6e9ef'; c.rotate(Math.sin(p.t*5+i)*0.9); c.beginPath(); c.ellipse(0,0,p.s,p.s*0.25,0,0,6.3); c.fill(); }
      else { c.fillStyle='#f2c33c'; c.beginPath(); c.ellipse(0,0,p.s,p.s*0.65,0,0,6.3); c.fill(); }
      c.restore(); }
    c.globalAlpha=1;
  }
  // ---- DOM effects
  var last={x:window.innerWidth/2,y:window.innerHeight/2};
  window.addEventListener('pointerdown',function(e){ last={x:e.clientX,y:e.clientY}; },true);
  function coins(gain){
    var pill=document.getElementById('h-coins'); if(!pill) return; var r=pill.parentNode.getBoundingClientRect(), n=Math.min(10,3+(gain/60|0));
    for(var i=0;i<n;i++)(function(i){ var d=document.createElement('div'); d.className='fcoin'; d.style.left=(last.x+rnd(-26,26))+'px'; d.style.top=(last.y+rnd(-20,20))+'px'; document.body.appendChild(d);
      setTimeout(function(){ d.style.left=(r.left+14)+'px'; d.style.top=(r.top+9)+'px'; d.style.transform='scale(.7)'; },30+i*55); setTimeout(function(){ d.remove(); pill.parentNode.classList.add('bump'); setTimeout(function(){ pill.parentNode.classList.remove('bump'); },160); },720+i*55); })(i);
    var t=document.createElement('div'); t.className='fgain'; t.textContent='+'+gain; t.style.left=r.left+'px'; t.style.top=(r.bottom+2)+'px'; document.body.appendChild(t); setTimeout(function(){ t.remove(); },1300);
  }
  function levelCard(title,lines){
    var old=document.getElementById('lvlup'); if(old) old.remove();
    var d=document.createElement('div'); d.id='lvlup'; var h='<div class="card2"><div class="rays"></div><div class="big">★</div><h3></h3><div class="un"></div></div>'; d.innerHTML=h;
    d.querySelector('h3').textContent=title; lines.forEach(function(l){ var p=document.createElement('p'); p.textContent=l; d.querySelector('.un').appendChild(p); });
    for(var i=0;i<40;i++){ var f=document.createElement('i'); f.style.left=rnd(0,100)+'%'; f.style.background=['#ffd23f','#ff5277','#6fd13f','#4aa8e0'][i%4]; f.style.animationDelay=rnd(0,0.9)+'s'; d.appendChild(f); }
    d.onclick=function(){ d.remove(); }; document.body.appendChild(d); setTimeout(function(){ d.remove(); },5000);
  }
  return {burst:burst,draw:draw,coins:coins,levelCard:levelCard,count:function(){return parts.length;}};
})();
