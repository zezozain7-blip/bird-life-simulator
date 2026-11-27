// Pigeon breeds + aviary species. Pure data, portable like config.js.
// Pigeon fields: sc = body scale, mul = value multiplier, lv = level needed to buy, f = visual features.
BLS.BREEDS = {
  baladi:  {w:415, ar:'بلدي',    en:'Baladi',          sc:1.00, mul:1.00, lv:1, f:[]},
  homer:   {w:475, ar:'زاجل',    en:'Racing homer',    sc:1.00, mul:1.25, lv:1, f:['band','wattle']},
  roller:  {w:275, ar:'قلاب',    en:'Roller',          sc:0.95, mul:1.20, lv:1, f:['crest']},
  swallow: {w:380, ar:'سنونو',   en:'Swallow',         sc:1.00, mul:1.35, lv:2, f:['mk_swallow','muff']},
  nun:     {w:370, ar:'الراهبة', en:'Nun',             sc:1.00, mul:1.40, lv:2, f:['mk_nun','crest'], base:'W'},
  helmet:  {w:350, ar:'أبو طاقية',en:'Helmet',         sc:1.00, mul:1.40, lv:2, f:['mk_helmet'], base:'W'},
  king:    {w:850, ar:'كينج',    en:'King',            sc:1.00, mul:1.50, lv:3, f:[]},
  fantail: {w:400, ar:'هزاز',    en:'Fantail',         sc:1.00, mul:1.60, lv:3, f:[]},
  magpie:  {w:430, ar:'العقعق',  en:'Magpie',          sc:0.96, mul:1.60, lv:3, f:['mk_magpie'], base:'W'},
  maltese: {w:300, ar:'مالطي',   en:'Maltese',         sc:1.00, mul:1.70, lv:4, f:[]},
  pouter:  {w:600, ar:'نفاخ',    en:'Pouter',          sc:1.00, mul:1.80, lv:4, f:[]},
  trumpet: {w:370, ar:'بخاري',   en:'Bokhara trumpeter',sc:1.00,mul:2.00, lv:5, f:['crest','rose','muff']},
  jacobin: {w:350, ar:'يعقوبي',  en:'Jacobin',         sc:1.00, mul:2.20, lv:5, f:['ruff']},
  roman:   {w:1250, ar:'روماني',  en:'Roman runt',      sc:1.08, mul:2.40, lv:6, f:['wattle']}
};
BLS.BREED_PRICE = 300;   // unused since v0.37 (each breed has pp)
// real Egyptian market price of a PAIR in EGP (June-Nov 2026): baladi, king, roman, fantail, homer squabs come from published lists; the others are estimates
(function(){ var PP={baladi:190,homer:630,roller:300,swallow:320,nun:350,helmet:350,king:520,fantail:260,magpie:320,maltese:400,pouter:450,trumpet:900,jacobin:1000,roman:525};
  Object.keys(PP).forEach(function(k){ if(BLS.BREEDS[k]) BLS.BREEDS[k].pp=PP[k]; });
  BLS.rarityOf=function(k){ var p=(BLS.BREEDS[k]||{}).pp||0; return p<=200?0:p<=350?1:p<=650?2:3; }; })();
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
BLS.AVIARY_CAP = 24; BLS.AVIARY_UPKEEP = 0.75; BLS.AVIARY_BREED_P = 0.25; BLS.AVIARY_SELL = 0.35;
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

BLS.TXT=BLS.TXT||{en:{},ar:{}}; (function(){ var e=BLS.TXT.en, a=BLS.TXT.ar; e.rar0='Common';e.rar1='Uncommon';e.rar2='Rare';e.rar3='Very rare';e.pair_mkt='Market price of a pair'; a.rar0='شائع';a.rar1='غير شائع';a.rar2='نادر';a.rar3='نادر جداً';a.pair_mkt='سعر الزوج في السوق'; })();

(function(){ var e=BLS.TXT.en, a=BLS.TXT.ar;
 e.ev_die2='{0} died: {1}'; e.deaths='Deaths log'; e.no_deaths='No deaths yet'; e.d_cause='Cause'; e.d_age_d='Age {0} days, day {1}'; e.d_also='Also'; e.d_tip='How to prevent it';
 e.c_old='old age'; e.c_pred='predator'; e.c_hunger='starvation'; e.c_thirst='dehydration'; e.c_disease='disease'; e.c_stress='stress'; e.c_injury='injury'; e.c_unknown='unknown';
 e.why_weather='bad weather'; e.why_hunger='hunger'; e.why_crowd='crowding'; e.why_dirty='dirty loft'; e.why_stress='stress'; e.why_contact='contact with a sick bird'; e.why_chance='bad luck';
 e.h_c_old='A natural end of life. Keep breeding so the line continues.'; e.h_c_pred='Buy the guard in Gear to keep predators away.'; e.h_c_hunger='Keep the feeder filled (add a second feeder) and watch the feed stock.'; e.h_c_thirst='Keep the water full (add a second water dispenser), more in hot weather.';
 e.h_c_disease='Clean the loft often, isolate sick birds early and treat them; a vet kit helps.'; e.h_c_stress='Avoid crowding, keep food and water full and the loft clean; perches and a flight area lower stress.'; e.h_c_injury='Treat injured birds quickly and keep them rested.'; e.h_c_unknown='Check food, water and cleanliness regularly.';
 a.ev_die2='{0} نفق: {1}'; a.deaths='سجل النفوق'; a.no_deaths='لسه مفيش نفوق'; a.d_cause='السبب'; a.d_age_d='العمر {0} يوم، اليوم {1}'; a.d_also='وكمان'; a.d_tip='إزاي تتجنبه';
 a.c_old='كبر السن'; a.c_pred='حيوان مفترس'; a.c_hunger='جوع'; a.c_thirst='عطش'; a.c_disease='مرض'; a.c_stress='توتر'; a.c_injury='إصابة'; a.c_unknown='غير معروف';
 a.why_weather='جو سيء'; a.why_hunger='الجوع'; a.why_crowd='زحمة'; a.why_dirty='البرج وسخ'; a.why_stress='توتر'; a.why_contact='عدوى من طير مريض'; a.why_chance='حظ';
 a.h_c_old='نهاية طبيعية للعمر. كمّل تربية عشان السلالة تكمل.'; a.h_c_pred='اشتري الحارس من التجهيزات عشان يبعد المفترسات.'; a.h_c_hunger='خلّي المعلف مليان (زوّد معلف تاني) وراقب مخزون العلف.'; a.h_c_thirst='خلّي المية مليانة (زوّد مشرب تاني) وخصوصاً في الحر.';
 a.h_c_disease='نضّف البرج كتير، اعزل الطير المريض بدري وعالجه، وعدّة البيطري بتفرق.'; a.h_c_stress='ماتزحمش البرج، خلّي الأكل والمية مليانين والبرج نضيف، والأعواد ومكان الطيران بيقللوا التوتر.'; a.h_c_injury='عالج الطير المصاب بسرعة وسيبه يرتاح.'; a.h_c_unknown='راجع الأكل والمية والنضافة بانتظام.'; })();
(function(){ var e=BLS.TXT.en, a=BLS.TXT.ar;
 e.al_sick='Sick: tap to treat'; e.al_hurt='Weak: tap'; e.al_hun='Hungry: fill feeder'; e.al_thi='Thirsty: fill water'; e.al_dirt='Dirty: clean'; e.al_crowd='Crowded'; e.al_str='Stressed: tap';
 a.al_sick='مريض: اضغط للعلاج'; a.al_hurt='ضعيف: اضغط'; a.al_hun='جعان: املا المعلف'; a.al_thi='عطشان: املا المية'; a.al_dirt='وسخ: نضّف'; a.al_crowd='زحمة'; a.al_str='متوتر: اضغط'; })();
(function(){ var e=BLS.TXT.en, a=BLS.TXT.ar;
 e.bird_days='bird-days of feed'; e.days_left='days for your flock'; e.c_young='weak young bird'; e.h_c_young='Young birds are fragile (about 13% die in the first days in real lofts). Keep the loft clean, food and water full, and parents well fed.';
 a.bird_days='يوم-طائر علف'; a.days_left='يوم لطيورك'; a.c_young='طائر صغير ضعيف'; a.h_c_young='الصغار هشّة (حوالي 13% بيموتوا في الأيام الأولى في الأبراج الحقيقية). خلّي البرج نضيف والأكل والمية مليانين والأهل مشبعين.'; })();
(function(){ var e=BLS.TXT.en, a=BLS.TXT.ar;
 e.gear_maint='Maintenance'; e.gear_broken='Broken: not working'; e.gear_worn='Worn out'; e.gear_ok='Working'; e.gear_run='cost/day'; e.gear_eol='End of life: retire and replace'; e.gear_fixed='{0} repaired'; e.gear_retired='{0} retired, scrap +{1}';
 e.ev_gear_broke='{0} broke down. Repair or replace it'; e.ev_gear_worn='{0} is worn out, repair soon'; e.al_gear='Gear needs repair';
 e.gn_guard='Guard'; e.gn_iso='Isolation unit'; e.gn_heat='Heater'; e.gn_vent='Ventilation'; e.gn_nursery='Nursery'; e.gn_vet='Vet kit'; e.gn_flight='Flight area'; e.gn_cam='Camera';
 a.gear_maint='الصيانة'; a.gear_broken='عطلان: مش شغال'; a.gear_worn='مهترئ'; a.gear_ok='شغال'; a.gear_run='تكلفة/يوم'; a.gear_eol='انتهى عمره: كهّنه واشتري بدله'; a.gear_fixed='تم إصلاح {0}'; a.gear_retired='تم تكهين {0}، خردة +{1}';
 a.ev_gear_broke='{0} باظ. صلّحه أو بدّله'; a.ev_gear_worn='{0} اتهرّى، صلّحه قريب'; a.al_gear='تجهيزات محتاجة صيانة';
 a.gn_guard='الحارس'; a.gn_iso='وحدة العزل'; a.gn_heat='التدفئة'; a.gn_vent='التهوية'; a.gn_nursery='الحضانة'; a.gn_vet='عدة البيطري'; a.gn_flight='منطقة الطيران'; a.gn_cam='الكاميرا'; })();
(function(){ var e=BLS.TXT.en, a=BLS.TXT.ar;
 e.al_med='Medicine in water'; e.al_medgo='Treat all via water'; e.med_on='Medicated water is already running'; e.med_none='No sick birds'; e.med_nowater='Fill the drinker first'; e.med_started='Medicated water for 5 days, cost {0}. Sick birds improve gradually'; e.ev_med_end='Water course finished';
 a.al_med='علاج في المية'; a.al_medgo='علاج الكل بالمية'; a.med_on='المية المعالَجة شغالة بالفعل'; a.med_none='مفيش طيور مريضة'; a.med_nowater='املا المشرب الأول'; a.med_started='مية معالَجة لمدة 5 أيام، التكلفة {0}. المريض هيتحسن تدريجياً'; a.ev_med_end='خلص كورس العلاج في المية'; })();
(function(){ var e=BLS.TXT.en, a=BLS.TXT.ar;
 e.cap_sec='Bigger feeder and drinker'; e.cap_feeder='Feeder size (each dish)'; e.cap_water='Drinker size (each)'; e.cap_now='Now';
 a.cap_sec='معلف ومشرب أكبر'; a.cap_feeder='حجم المعلف (كل واحد)'; a.cap_water='حجم المشرب (كل واحد)'; a.cap_now='دلوقتي'; })();
