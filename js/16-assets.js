// Optional generated art. If files in assets/ exist they are used, otherwise the vector drawing stays.
// For the single-file build, build.py fills BLS.ASSET_DATA with data URIs.
BLS.Art = (function(){
  var NAMES = {
    spr:['grey_stand','grey_peck','grey_fly','red_stand','red_peck','red_fly','white_stand','white_peck','white_fly'],
    tex:['floor','wood','roof','brick']
  };
  var img={}, tex={}, pending=0, onReady=null, cfg=BLS.ASSET_CFG||{};
  function load(key,src,store){
    pending++; var im=new Image(); im.onload=function(){ store[key]=im; done(); }; im.onerror=function(){ done(); }; im.src=src;
  }
  function done(){ pending--; if(pending===0&&onReady) onReady(); }
  function init(cb){
    onReady=cb; var D=BLS.ASSET_DATA||{};
    NAMES.spr.forEach(function(n){ load(n,D['sprites/'+n]||('assets/sprites/'+n+'.png'),img); });
    NAMES.tex.forEach(function(n){ load(n,D['textures/'+n]||('assets/textures/'+n+'.jpg'),tex); });
    if(pending===0&&cb) cb();
  }
  function sprite(col,pose){ var k=(col==='G'?'grey':col==='R'?'red':'white')+'_'+pose; return img[k]||null; }
  return {init:init,sprite:sprite,tex:function(n){return tex[n]||null;},count:function(){return Object.keys(img).length+Object.keys(tex).length;},cfg:cfg};
})();
