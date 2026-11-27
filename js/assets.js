// Optional generated art. If files in assets/ exist they are used, otherwise the vector drawing stays.
// For the single-file build, build.py fills BLS.ASSET_DATA with data URIs.
BLS.ASSET_CFG = BLS.ASSET_CFG || {stand:{h:50,ax:0.5,ay:1.0},peck:{h:34,ax:0.5,ay:1.0},fly:{h:64,ax:0.5,ay:0.8}};
BLS.Art = (function(){
  var NAMES = {
    spr:['grey_stand','grey_peck','grey_fly','red_stand','red_peck','red_fly','white_stand','white_peck','white_fly'],
    tex:['floor','wood','roof','brick'], shp:[]
  };
  var img={}, tex={}, pending=0, onReady=null, cfg=BLS.ASSET_CFG||{};
  function load(key,src,store){
    pending++; var im=new Image(); im.onload=function(){ store[key]=im; done(); }; im.onerror=function(){ done(); }; im.src=src;
  }
  function done(){ pending--; if(pending===0&&onReady) onReady(); }
  function init(cb){
    onReady=cb; var D=BLS.ASSET_DATA||{};
    NAMES.spr.forEach(function(n){ load(n,D['sprites/'+n]||('assets/sprites/'+n+'.png'),img); });
    (BLS.SHAPE_NAMES||[]).forEach(function(sn){ ['grey','red','white'].forEach(function(c){ ['stand','peck','fly'].forEach(function(p){ var n=sn+'_'+c+'_'+p; load(n,D['sprites/'+n]||('assets/sprites/'+n+'.png'),img); }); }); });
    ['town','town0','town1','town2','town3'].forEach(function(n){ load(n,D['bg/'+n]||('assets/bg/'+n+'.jpg'),tex); });
    NAMES.tex.forEach(function(n){ load(n,D['textures/'+n]||('assets/textures/'+n+'.jpg'),tex); });
    if(pending===0&&cb) cb();
  }
  function sprite(col,pose,shape){ if(shape){ var sk=shape+'_'+(col==='G'?'grey':col==='R'?'red':'white')+'_'+pose; if(img[sk]) return img[sk]; } var k=(col==='G'?'grey':col==='R'?'red':'white')+'_'+pose; return img[k]||null; }
  return {init:init,sprite:sprite,tex:function(n){return tex[n]||null;},count:function(){return Object.keys(img).length+Object.keys(tex).length;},cfg:cfg};
})();
