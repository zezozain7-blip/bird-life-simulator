// Pigeon breeds + aviary species. Pure data, portable like config.js.
// Pigeon fields: sc = body scale, mul = value multiplier, lv = level needed to buy, f = visual features.
BLS.BREEDS = {
  baladi:  {ar:'بلدي',    en:'Baladi',          sc:1.00, mul:1.00, lv:1, f:[]},
  homer:   {ar:'زاجل',    en:'Racing homer',    sc:1.04, mul:1.25, lv:1, f:['band']},
  roller:  {ar:'قلاب',    en:'Roller',          sc:0.86, mul:1.20, lv:1, f:['crest']},
  swallow: {ar:'سنونو',   en:'Swallow',         sc:0.95, mul:1.35, lv:2, f:['mk_swallow','muff']},
  nun:     {ar:'الراهبة', en:'Nun',             sc:0.92, mul:1.40, lv:2, f:['mk_nun','crest'], base:'W'},
  helmet:  {ar:'أبو طاقية',en:'Helmet',         sc:0.92, mul:1.40, lv:2, f:['mk_helmet'], base:'W'},
  king:    {ar:'كينج',    en:'King',            sc:1.20, mul:1.50, lv:3, f:['puff']},
  fantail: {ar:'هزاز',    en:'Fantail',         sc:0.94, mul:1.60, lv:3, f:['fan']},
  magpie:  {ar:'العقعق',  en:'Magpie',          sc:0.96, mul:1.60, lv:3, f:['mk_magpie'], base:'W'},
  maltese: {ar:'مالطي',   en:'Maltese',         sc:1.14, mul:1.70, lv:4, f:['uptail']},
  pouter:  {ar:'نفاخ',    en:'Pouter',          sc:1.08, mul:1.80, lv:4, f:['crop']},
  trumpet: {ar:'بخاري',   en:'Bokhara trumpeter',sc:1.05,mul:2.00, lv:5, f:['crest','rose','muff']},
  jacobin: {ar:'يعقوبي',  en:'Jacobin',         sc:0.98, mul:2.20, lv:5, f:['ruff']},
  roman:   {ar:'روماني',  en:'Roman runt',      sc:1.34, mul:2.40, lv:6, f:[]}
};
BLS.BREED_PRICE = 300;   // x mul
// Aviary birds. body / head / wing colours, len = tail length, crest flag. price = one pair.
BLS.SPECIES = {
  zebra:    {ar:'فنش زيبرا',   en:'Zebra finch',    price:120, lv:1, body:'#d8d5cf', head:'#8d9097', wing:'#8a7a6a', beak:'#f0602a', len:7},
  bengal:   {ar:'فنش بنغالي',  en:'Bengalese finch',price:130, lv:1, body:'#ecdcc4', head:'#8a5a38', wing:'#a8744a', beak:'#c9a590', len:7},
  canary:   {ar:'كناري',       en:'Canary',         price:220, lv:1, body:'#f7da22', head:'#ffe545', wing:'#d9b50e', beak:'#f0b080', len:9},
  budgie:   {ar:'بادجي', en:'Budgie', price:180, lv:1, body:'#5fc24a', head:'#f2de3a', wing:'#6d7a2c', beak:'#c9a040', len:15},
  java:     {ar:'عصفور جاوة',  en:'Java sparrow',   price:240, lv:2, body:'#8c93a0', head:'#1d1d22', wing:'#6d7480', beak:'#e8485a', len:8, cheek:'#f4f2ee'},
  gold:     {ar:'حسون',        en:'Goldfinch',      price:280, lv:2, body:'#c9a374', head:'#d12e24', wing:'#222222', beak:'#e8cdb0', len:8, cheek:'#f4f2ee'},
  gouldian: {ar:'فنش جولديان', en:'Gouldian finch', price:450, lv:3, body:'#f5cf2a', head:'#d63a2c', wing:'#2f9a50', beak:'#eee0d0', len:10, chest:'#7a3ab0'},
  waxbill:  {ar:'فنش أحمر المنقار', en:'Waxbill',   price:200, lv:2, body:'#a98a72', head:'#b49880', wing:'#80634e', beak:'#e0332a', len:10},
  bullfinch:{ar:'دغناش',       en:'Bullfinch',      price:340, lv:3, body:'#e0705a', head:'#18181c', wing:'#5a6270', beak:'#333333', len:9},
  lovebird: {ar:'طيور الحب',   en:'Lovebird',       price:400, lv:3, body:'#52b848', head:'#f0734a', wing:'#2f8c3a', beak:'#f4e0c0', len:8},
  cockatiel:{ar:'كوكتيل',      en:'Cockatiel',      price:600, lv:4, body:'#9a9ca2', head:'#f4df55', wing:'#74767d', beak:'#8a8078', len:18, crest:1, cheek:'#f08a30'},
  ringneck: {ar:'الدرة',       en:'Ringneck parakeet',price:900,lv:5, body:'#6cc455', head:'#84d268', wing:'#3f9a45', beak:'#d8362c', len:24},
  grey:     {ar:'كاسكو',       en:'African grey',   price:2200,lv:6, body:'#9ba0a6', head:'#b8bcc2', wing:'#70767e', beak:'#222222', len:11, big:1.35, tail:'#c8202a'}
};
BLS.AVIARY_CAP = 24; BLS.AVIARY_UPKEEP = 1; BLS.AVIARY_BREED_P = 0.25; BLS.AVIARY_SELL = 0.35;
(function(){
  var en={breed:'Breed',breeds_shop:'Pigeon breeds',buy_m:'Male',buy_f:'Female',lv_need:'Level {0}',aviary:'Aviary',aviary_info:'Two birds of the same species may raise a chick each day. Each bird costs 1 coin a day.',buy_apair:'Buy a pair',av_full:'Aviary is full',av_chick:'New chick in the aviary: {0}',av_sell:'Sell one',av_own:'Owned',p_ok:'OK'};
  var ar={breed:'السلالة',breeds_shop:'سلالات الحمام',buy_m:'ذكر',buy_f:'أنثى',lv_need:'مستوى {0}',aviary:'قفص العصافير',aviary_info:'كل طيرين من نفس النوع ممكن يطلعوا فرخ جديد كل يوم. كل طير مصاريفه عملة في اليوم.',buy_apair:'اشتري زوج',av_full:'القفص مليان',av_chick:'فرخ جديد في القفص: {0}',av_sell:'بيع واحد',av_own:'عندك'};
  var sen={tab_feed:'Feed',tab_pigeons:'Pigeons',tab_aviary:'Birds',tab_gear:'Gear',tab_sell:'Sell',tab_orders:'Orders',feed_sack:'Grain sack',feed_sack_d:'Everyday feed',mix_sack:'Premium mix',mix_sack_d:'+30% filling, better health and hatching',quick_buy:'Quick buy',rand_d:'Random colour',pair_d:'Young male and female',loft_room:'Loft places',value_x:'Value',rare:'Rare',pair_w:'Pair',paired_w:'paired',sell_pigeons:'Pigeons',sell_eggs:'Eggs',sell_birds:'Aviary birds',nothing_sell:'Nothing to sell',orders_note:'A filled order is replaced the next day.',orders_empty:'No orders today. Come back tomorrow.',iso_name:'Isolation cage',guard_name:'Night guard',gd_iso:'Holds 2 sick birds',gd_guard:'Protects against cats',gd_heat:'Eases cold days',gd_vent:'Eases heat waves'};
  var sar={tab_feed:'العلف',tab_pigeons:'الحمام',tab_aviary:'العصافير',tab_gear:'التجهيزات',tab_sell:'البيع',tab_orders:'الطلبات',feed_sack:'شيكارة حبوب',feed_sack_d:'علف يومي',mix_sack:'خلطة فاخرة',mix_sack_d:'تشبّع أكتر 30% وصحة وفقس أحسن',quick_buy:'شراء سريع',rand_d:'لون عشوائي',pair_d:'ذكر وأنثى صغيرين',loft_room:'أماكن البرج',value_x:'القيمة',rare:'نادر',pair_w:'زوج',paired_w:'متجوز',sell_pigeons:'الحمام',sell_eggs:'البيض',sell_birds:'العصافير',nothing_sell:'مفيش حاجة للبيع',orders_note:'الطلب اللي تنفذه بييجي غيره تاني يوم.',orders_empty:'مفيش طلبات النهارده. تعالى بكرة.',iso_name:'قفص العزل',guard_name:'حارس الليل',gd_iso:'يشيل طيرين عيانين',gd_guard:'يحمي من القطط',gd_heat:'تخفف أيام البرد',gd_vent:'تخفف موجات الحر'};
  for(var x in sen){ BLS.TXT.en[x]=sen[x]; } for(var z in sar){ BLS.TXT.ar[z]=sar[z]; }
  var fen={fly_night:'Birds do not fly at night',fly_done:'The flock already flew today',fly_none:'You need at least 2 healthy, fed birds',fly_go:'The flock is up!',fly_back:'{0} birds landed. Stronger: {1}',unlock:'Unlocked',tap_hint:'Tap the ground to throw grain. Tap a bird or nest. Drag to move, pinch to zoom.'};
  var far={fly_night:'الحمام ما بيطيرش بالليل',fly_done:'السرب طار النهارده خلاص',fly_none:'محتاج طيرين على الأقل بصحة كويسة وشبعانين',fly_go:'السرب طار!',fly_back:'رجع {0} طير. اللي قوتهم زادت: {1}',unlock:'اتفتح',tap_hint:'دوس على الأرض ترمي حبوب. دوس على طير أو عش. اسحب للتحريك وكبّر بإصبعين.'};
  for(var m in fen){ BLS.TXT.en[m]=fen[m]; } for(var w in far){ BLS.TXT.ar[w]=far[w]; }
  for(var k in en){ BLS.TXT.en[k]=en[k]; } for(var j in ar){ BLS.TXT.ar[j]=ar[j]; }
  for(var b in BLS.BREEDS){ BLS.TXT.en['br_'+b]=BLS.BREEDS[b].en; BLS.TXT.ar['br_'+b]=BLS.BREEDS[b].ar; }
  for(var s in BLS.SPECIES){ BLS.TXT.en['sp_'+s]=BLS.SPECIES[s].en; BLS.TXT.ar['sp_'+s]=BLS.SPECIES[s].ar; }
})();
