// Simple Mendelian model. Two loci + 3 quantitative traits.
// Colour locus: G (blue-grey) > R (ash-red) > W (white). Pattern locus: B (bar) > C (checker).
BLS.Gen = (function(){
  var COL_RANK = {G:3,R:2,W:1};
  function rnd(a){ return a[Math.floor(Math.random()*a.length)]; }
  function phenoColor(g){ var a=g.c[0], b=g.c[1]; return COL_RANK[a]>=COL_RANK[b]?a:b; }
  function phenoPattern(g){ return (g.p[0]==='B'||g.p[1]==='B')?'B':'C'; }
  function colorName(g){ return {G:'grey',R:'red',W:'white'}[phenoColor(g)]; }
  function patternName(g){ return phenoPattern(g)==='B'?'bar':'check'; }
  function randomGenes(){
    return { c:[rnd(['G','G','G','R','W']), rnd(['G','G','R','R','W'])], p:[rnd(['B','B','C']), rnd(['B','C'])],
             size:40+Math.random()*40|0, vit:40+Math.random()*40|0, fert:40+Math.random()*40|0 };
  }
  function mutateAllele(a, pool){ return Math.random()<0.03 ? rnd(pool) : a; }
  function cross(m, f){
    var t = function(v1,v2){ var v=(v1+v2)/2 + (Math.random()*16-8); return Math.max(20,Math.min(100,Math.round(v))); };
    return {
      c:[ mutateAllele(rnd(m.c),['G','R','W']), mutateAllele(rnd(f.c),['G','R','W']) ],
      p:[ mutateAllele(rnd(m.p),['B','C']), mutateAllele(rnd(f.p),['B','C']) ],
      size:t(m.size,f.size), vit:t(m.vit,f.vit), fert:t(m.fert,f.fert)
    };
  }
  function geneString(g){ return g.c.join('/')+'  '+g.p.join('/'); }
  return {phenoColor:phenoColor,phenoPattern:phenoPattern,colorName:colorName,patternName:patternName,randomGenes:randomGenes,cross:cross,geneString:geneString,rnd:rnd};
})();
