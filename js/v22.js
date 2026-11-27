/* v0.22 addon: save backup (export/import), share card, service worker registration */
(function(){
var ar=function(){return BLS.T('tasks')==='المهام';};
function dl(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},4000);}
function exp(){
  var S=BLS.Sim;S.save();
  dl(new Blob([JSON.stringify(S.G)],{type:'application/json'}),'bird-life-save-day'+S.dayNum()+'.json');
  S.emit('toast',ar()?'💾 اتحفظت نسخة احتياطية':'💾 Backup saved');
}
function imp(){
  var S=BLS.Sim,inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;var r=new FileReader();
    r.onload=function(){
      try{
        var d=JSON.parse(r.result);
        if(!d||!Array.isArray(d.birds)||typeof d.coins!=='number'||!Array.isArray(d.eggs)||(d.saveVersion||0)>4)throw 0;
        if(!confirm(ar()?'هيتم استبدال تقدمك الحالي بالنسخة دي. متأكد؟':'This replaces your current progress. Continue?'))return;
        try{localStorage.setItem('bls_before_import',JSON.stringify(S.G));}catch(e){}var G=S.G;Object.keys(G).forEach(function(k){delete G[k];});Object.assign(G,d);S.save();location.reload();
      }catch(e){S.emit('toast',ar()?'⚠️ الملف مش نسخة صالحة':'⚠️ Not a valid save file');}
    };
    r.readAsText(f);
  };
  inp.click();
}
function share(){
  var S=BLS.Sim,G=S.G,best=null,bq=-1;
  G.birds.forEach(function(b){var q=(b.g.size+b.g.vit+b.g.fert)/3;if(q>bq){bq=q;best=b;}});
  if(!best){S.emit('toast',ar()?'مفيش طير للمشاركة':'No bird to share');return;}
  var a=ar(),col=BLS.Gen.phenoColor(best.g),C={G:['#8c93a0',a?'رمادي':'Grey'],R:['#b8452f',a?'أحمر':'Red'],W:['#f2efe8',a?'أبيض':'White']}[col]||['#ccc',''];
  var cv=document.createElement('canvas');cv.width=600;cv.height=800;var x=cv.getContext('2d');
  var g=x.createLinearGradient(0,0,0,800);g.addColorStop(0,'#2a2418');g.addColorStop(1,'#14110b');x.fillStyle=g;x.fillRect(0,0,600,800);
  x.strokeStyle='#d8b04a';x.lineWidth=6;x.strokeRect(18,18,564,764);
  x.textAlign='center';x.direction=a?'rtl':'ltr';
  x.fillStyle='#ffe9a8';x.font='800 38px system-ui,sans-serif';x.fillText('Bird Life Simulator',300,90);
  x.fillStyle=C[0];x.beginPath();x.arc(300,270,110,0,7);x.fill();x.strokeStyle='#d8b04a';x.lineWidth=5;x.stroke();
  x.font='110px serif';x.fillStyle='#000';x.fillText('🕊️',300,305);
  x.fillStyle='#f5ead2';x.font='800 54px system-ui,sans-serif';x.fillText(best.name,300,470);
  x.font='600 28px system-ui,sans-serif';x.fillStyle='#d8c9a0';x.fillText(C[1]+' · '+(a?'مستوى ':'Level ')+G.level,300,515);
  [[a?'الحجم':'Size',best.g.size,'#e08a3c'],[a?'الحيوية':'Vitality',best.g.vit,'#7bc653'],[a?'الخصوبة':'Fertility',best.g.fert,'#4aa3df']].forEach(function(s,i){
    var y=580+i*54;x.textAlign='left';x.direction='ltr';x.fillStyle='#f5ead2';x.font='600 24px system-ui,sans-serif';x.fillText(s[0],60,y+8);
    x.fillStyle='#0008';x.fillRect(220,y-10,320,20);x.fillStyle=s[2];x.fillRect(220,y-10,320*Math.min(100,s[1])/100,20);
  });
  x.textAlign='center';x.fillStyle='#8a7a55';x.font='600 20px system-ui,sans-serif';x.fillText(a?'تعالى ربّي حمامك معايا':'Come raise pigeons with me',300,765);
  cv.toBlob(function(b){
    var file=new File([b],'my-bird.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]}))navigator.share({files:[file],title:best.name}).catch(function(){});
    else dl(b,'my-bird.png');
  },'image/png');
}
window.BLS_BK={exp:exp,imp:imp,share:share};

})();
