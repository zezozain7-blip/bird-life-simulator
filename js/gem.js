// v0.56: Gemini photo-style bird images (supplied by the user). Used ONLY when the bird's real colour matches the picture; otherwise the vector/old sprites draw.
// Colour rule (game colour G/R/W + pattern B/C -> picture):
//   homer = grey + chequer (blue-chequer) | roller = grey + bar (blue-bar) | roman = grey + chequer | king, fantail, trumpet = white
//   maltese = red | swallow = white body (black-and-white; game marks are dark on W/G, red on R) | nun, helmet, magpie = white base with BLACK marks (any colour except red)
// Adult birds only. Squabs and juveniles, baladi, pouter and jacobin have no picture and use the vector sprites.
BLS.Gem = (function(){
  var BR=['homer','roller','king','fantail','roman','swallow','nun','helmet','magpie','maltese','trumpet'], PO=['stand','fly','brood','peck'];
  BLS.GEM_NAMES=[]; BR.forEach(function(b){ PO.forEach(function(p){ BLS.GEM_NAMES.push(b+'_'+p); }); });
  var U=46/200; // units per image pixel (stand height 200 px = 46 units, same as the vector pigeon)
  function ok(br,col,pat,stage){
    if(stage&&stage!=='adult') return false;
    switch(br){
      case 'homer': case 'roman': return col==='G'&&pat==='C';
      case 'roller': return col==='G'&&pat==='B';
      case 'king': case 'fantail': case 'trumpet': return col==='W';
      case 'maltese': return col==='R';
      case 'swallow': return col==='W';
      case 'nun': case 'helmet': case 'magpie': return col!=='R';
    } return false; }
  function has(br,col,pat,stage){ return ok(br,col,pat,stage)&&!!(BLS.Art&&BLS.Art.gem(br+'_stand')); }
  // c is at the feet, already scaled and mirrored for facing (picture faces right)
  function draw(c,o,x){
    var pose=x.pose||'stand', k=(pose==='fly')?'fly':(pose==='peck'||pose==='eat'||pose==='drink')?'peck':'stand';
    var im=BLS.Art.gem(o.br+'_'+k); if(!im) return false;
    var sit=pose==='sit'||pose==='perch', walk=pose==='walk', ph=x.ph||0, w=im.width*U, h=im.height*U*(sit?0.93:1);
    c.save(); var bob=walk?-Math.abs(Math.sin(ph*9))*1.8:0; if(walk){ c.translate(0,bob); c.rotate(Math.sin(ph*9)*0.035); }
    var y=-h+(sit?3:0); if(k==='fly'){ y=-h-6+Math.sin(ph*16)*2; }
    c.drawImage(im,-w*0.5,y,w,h); c.restore(); return true; }
  function brood(c,nr,face,o){ var im=BLS.Art.gem(o.br+'_brood'); if(!im) return false;
    var w=nr.w*1.08, h=w*im.height/im.width, cx=nr.x+nr.w*0.5, by=nr.y+nr.h+2;
    c.save(); c.translate(cx,by); if(face<0) c.scale(-1,1); c.drawImage(im,-w/2,-h,w,h); c.restore(); return true; }
  return {has:has,ok:ok,draw:draw,brood:brood,BR:BR};
})();
