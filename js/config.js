// Bird Life Simulator - config & text. Pure data, portable to Unity (ScriptableObjects).
var BLS = window.BLS = {};
BLS.CFG = {
  SAVE_KEY: 'bls_save_v1',
  GRID: 12,
  REAL_SEC_PER_HOUR: 2.5,      // at x1: 1 game hour = 2.5 real seconds (1 day = 60 s)
  HUNGER_RATE: 1.6,            // per game hour (0 fed .. 100 starving)
  THIRST_RATE: 2.4,
  EAT_SPEED: 30,               // hunger units removed per real second while eating
  DRINK_SPEED: 40,
  GRAIN_PER_UNIT: 0.005,       // kg per hunger unit
  WATER_PER_UNIT: 0.06,
  FEEDER_CAP: 3, WATER_CAP: 100,
  EGG_INCUBATION_H: 96, SQUAB_H: 96, JUVENILE_H: 240,   // hatch at 3 d, leave nest 3 d later, adult at 7 d
  EGG_COLD_LIMIT_H: 18,
  NEST_COUNT: 8, MAX_BIRDS: 40, CAP_BASE: 6, CAP_PER_NEST: 3, CLUTCH_COOL_H: 72, SECOND_EGG_P: 0.5,
  START_COINS: 1200, START_FEED: 8, UPKEEP_PER_BIRD: 5, GUARD_COST: 400, ISO_COST: 250, UP_COST:{heat:350,vent:300}, PRED_P: 0.10, DISEASE_P: 0.05,
  OFFLINE_MAX_H: 48,
  PRICE: { feed5: 90, bird: 220, pair: 420, heal: 60 }
};
BLS.NAMES = {
  en: ['Zaki','Hamama','Nour','Mazen','Salma','Yara','Omar','Laila','Karim','Dina','Adel','Rania','Tarek','Hana','Sami','Mona','Fouad','Nada','Ramy','Aya'],
  ar: ['زكي','حمامة','نور','مازن','سلمى','يارا','عمر','ليلى','كريم','دينا','عادل','رانيا','طارق','هنا','سامي','منى','فؤاد','ندى','رامي','آية']
};
BLS.TXT = {
 en:{nav_farm:'FARM',nav_birds:'BIRDS',nav_breeding:'BREEDING',nav_market:'MARKET',nav_manage:'MANAGEMENT',
  male:'Male',female:'Female',egg:'Egg',squab:'Squab',juvenile:'Juvenile',adult:'Adult',
  fullness:'Fullness',hydration:'Hydration',health:'Health',age:'Age',days:'days',weight:'Weight',color:'Colour',pattern:'Pattern',genes:'Genes',
  parents:'Parents',mate:'Mate',none:'None',unknown:'Unknown',size:'Size',vitality:'Vitality',fertility:'Fertility',
  grey:'Blue-grey',red:'Ash-red',white:'White',bar:'Bar',check:'Checker',
  feed:'Feed',water:'Water',heal:'Heal',rename:'Rename',sell:'Sell',pair:'Pair',unpair:'Unpair',close:'Close',follow:'Follow',
  my_birds:'My birds',nests:'Nests',nest:'Nest',empty:'Empty',free:'Free',new_pair:'New pair',pick_partner:'Choose a partner',
  no_partner:'No eligible partner (needs an adult of the other sex, not related, not paired).',related:'Related',
  incubating:'Incubating',cold:'Cooling',infertile:'Infertile',fertile:'Fertile',hatch_in:'Hatches in {0}h',
  market:'Market',buy_feed:'Buy 5 kg feed',buy_bird:'Buy a pigeon',buy_pair:'Buy a young pair',buy_heal:'Medicine',
  manage:'Management',stats:'Statistics',speed:'Game speed',skip:'Skip time',skip6:'+6 hours',skip24:'+1 day',
  reset:'Start a new farm',reset_q:'Delete all progress and start over?',language:'Language',
  tasks:'Tasks',claim:'Claim',claimed:'Done',reward:'Reward',level:'Level',coins:'Coins',feedstock:'Feed stock',
  hatched:'Hatched',sold:'Sold',bought:'Bought',died:'Died',time:'Time',day:'Day',
  t_hatch:'Hatch your first squab',t_six:'Own 6 birds',t_sell:'Sell a bird',t_buyfeed:'Buy feed',t_lvl3:'Reach level 3',t_hand:'Hand-feed a bird',
  ev_egg:'New egg in nest {0}',ev_hatch:'Squab hatched in nest {0}!',ev_cold:'An egg went cold in nest {0}',ev_bad:'Infertile egg removed (nest {0})',
  ev_die:'{0} died',ev_sick:'{0} is sick',ev_adult:'{0} is now an adult',ev_hungry:'Feeder is empty',ev_dry:'Water bowl is empty',ev_grow:'{0} left the nest',
  ev_offline:'While you were away: {0} h passed',
  need_coins:'Not enough coins',need_feed:'No feed in stock',feeder_filled:'Feeder filled',water_filled:'Water refilled',
  fed:'{0} was fed',watered:'{0} drank',healed:'{0} feels better',sold_ok:'Sold {0} for {1}',paired:'{0} and {1} are a pair now',
  bought_ok:'Bought',full:'Loft is full',nonest:'No free nest',nothing:'Nothing happening yet. Tap a bird to open its card.',
  feeder:'Feeder',waterbowl:'Water bowl',sacks:'Feed sacks',grain:'Grain',tap_hint:'Tap a bird or a nest. Drag to move, pinch to zoom.',
  reference:'Sold price',sure:'Sure?',welcome:'Welcome back',w_clear:'Clear',w_rain:'Rain',w_wind:'Wind',w_heat:'Heat wave',w_cold:'Cold snap',se_0:'Spring',se_1:'Summer',se_2:'Autumn',se_3:'Winter',ev_w_rain:'Rain today: the loft gets dirtier',ev_w_wind:'Windy day',ev_w_heat:'Heat wave: birds drink much more, a ventilation fan helps',ev_w_cold:'Cold snap: birds eat more, a heater helps',up_heat:'Heater',up_vent:'Ventilation fan',up_done:'Upgrade built',up_owned:'built',season:'Season',d_cold:'cold',d_gut:'stomach bug',d_pox:'pigeon pox',ev_ill:'{0} looks unwell ({1})',ev_recover:'{0} recovered by itself',why_contact:'caught from a sick bird, isolate it',why_dirty:'dirty loft, clean it',why_stress:'stress, give room and food',why_crowd:'too crowded',why_hunger:'hunger',why_chance:'bad luck',s_sneeze:'sneezing',s_loose:'loose droppings',s_lumps:'lumps on skin',s_lethargic:'lethargic',s_iso:'isolated',iso_done:'Isolation cage built',iso_full:'Isolation cage is full',iso_need:'Build an isolation cage first',iso_on:'{0} moved to isolation',iso_buy:'Isolation cage (2 birds)',iso_btn:'Isolate',iso_off:'Release',farm_lv:'Challenge level',lv_relaxed:'Relaxed (easing off)',lv_normal:'Normal',lv_demanding:'Demanding',cleanliness:'Cleanliness',mood:'Mood',stress:'Calm',personality:'Personality',signs:'Signs',p_calm:'Calm',p_bold:'Bold',p_shy:'Shy',p_greedy:'Greedy',p_social:'Social',s_weak:'weak',s_ruffled:'ruffled feathers',s_hungry:'hungry',s_thirsty:'thirsty',s_dirty:'dirty feathers',s_stressed:'stressed',q_hatch:'Hatch squabs',q_sell:'Sell birds',q_hand:'Hand-feed birds',q_clean:'Clean the loft',q_orders:'Fill neighbour orders',q_feed:'Buy feed',daily:'Daily quests',weekly:'Weekly quests',login:'Daily reward',login_claim:'Claim day {0} reward: {1}',login_done:'Come back tomorrow',goals:'Goals',ev_upkeep:'Daily upkeep paid: {0} coins',ev_disease:'Disease hit {0}! Heal it and clean the loft.',ev_pred:'A cat raided the loft and {0} was lost! Buy the night guard.',ev_pred_ok:'The night guard scared off a predator.',ev_dirty:'The loft is dirty, disease risk is high.',clean:'Clean loft',clean_done:'Loft cleaned',dirt:'Dirt',guard:'Night guard (stops raids)',guard_done:'Night guard installed',t_ten:'Own 10 birds',t_hatch10:'Hatch 10 squabs',t_win:'Win a pigeon show',t_white:'Own a white pigeon',t_rich:'Hold 3000 coins',t_nests:'Open 6 nests',t_orders3:'Fill 3 neighbour orders',comp:'Competition',comp_next:'Next show in',comp_h:'{0} h',comp_enter:'Enter',comp_entered:'Entered',comp_score:'Score',comp_rank:'Leaderboard',comp_you:'You',comp_last:'Last show',comp_place:'Place {0}',comp_prize:'Prize',comp_none:'You need an adult bird to enter.',comp_info:'A show every 7 days. The best bird wins coins. Rivals get stronger every week, so breed better birds (size, vitality, fertility, rare colours, good health).',comp_pick:'Pick a bird to enter',comp_withdraw:'Withdraw',comp_week:'Show',comp_pts:'pts',comp_result:'Show result: place {0}, prize {1}',comp_missed:'You missed the show (no bird entered)',comp_soon:'Pigeon show tomorrow! Enter a bird.',comp_ent:'Entered bird',orders:'Neighbour orders',o_want:'wants an adult {0} bird',o_pat:'{0}',o_pay:'Pays',o_fill:'Fill with',o_none:'No bird of yours matches yet. Breed one!',away:'Time away',w_eggs:'Eggs laid',w_hatch:'Hatched',w_died:'Lost',w_grain:'Grain eaten',w_water:'Water used',w_note:'The birds were looked after while you were away (up to 48 game hours, no deaths).',ok:'OK',tree:'Family tree',gone:'gone',children:'Children',grandp:'Grandparents',build:'Build',built:'Built!',nests_open:'Nests',perch_stands:'Perch stands',buy_nest:'Open a nest',buy_perch:'Add a perch stand',locked:'Locked nest',maxed:'Maximum',sound:'Sound',no_kids:'No offspring yet',
  hatch_tip:'Eggs hatch after 3 days. Keep the feeder and water full so parents can sit.'},
 ar:{nav_farm:'المزرعة',nav_birds:'الطيور',nav_breeding:'التزاوج',nav_market:'السوق',nav_manage:'الإدارة',
  male:'ذكر',female:'أنثى',egg:'بيضة',squab:'زغلول',juvenile:'يافع',adult:'بالغ',
  fullness:'الشبع',hydration:'الري',health:'الصحة',age:'العمر',days:'يوم',weight:'الوزن',color:'اللون',pattern:'النقشة',genes:'الجينات',
  parents:'الأبوين',mate:'الشريك',none:'لا يوجد',unknown:'غير معروف',size:'الحجم',vitality:'القوة',fertility:'الخصوبة',
  grey:'رمادي مزرق',red:'أحمر رمادي',white:'أبيض',bar:'خطوط',check:'مربعات',
  feed:'أطعم',water:'اسقي',heal:'علاج',rename:'تغيير الاسم',sell:'بيع',pair:'تزويج',unpair:'فك الزواج',close:'إغلاق',follow:'تتبع',
  my_birds:'طيوري',nests:'الأعشاش',nest:'عش',empty:'فاضي',free:'متاح',new_pair:'زوج جديد',pick_partner:'اختار الشريك',
  no_partner:'مفيش شريك مناسب (لازم بالغ من الجنس التاني، مش قريب، وغير متزوج).',related:'قرابة',
  incubating:'بتفقس',cold:'بتبرد',infertile:'غير مخصبة',fertile:'مخصبة',hatch_in:'تفقس بعد {0} ساعة',
  market:'السوق',buy_feed:'اشتري 5 كجم علف',buy_bird:'اشتري حمامة',buy_pair:'اشتري زوج صغير',buy_heal:'دواء',
  manage:'الإدارة',stats:'الإحصائيات',speed:'سرعة اللعبة',skip:'تخطي الوقت',skip6:'+6 ساعات',skip24:'+يوم',
  reset:'ابدأ مزرعة جديدة',reset_q:'تمسح كل التقدم وتبدأ من الأول؟',language:'اللغة',
  tasks:'المهام',claim:'استلم',claimed:'تم',reward:'الجائزة',level:'المستوى',coins:'العملات',feedstock:'مخزون العلف',
  hatched:'فقس',sold:'مباع',bought:'مشترى',died:'نفق',time:'الوقت',day:'اليوم',
  t_hatch:'افقس أول زغلول',t_six:'املك 6 طيور',t_sell:'بيع طائر',t_buyfeed:'اشتري علف',t_lvl3:'وصل للمستوى 3',t_hand:'أطعم طائر بإيدك',
  ev_egg:'بيضة جديدة في العش {0}',ev_hatch:'زغلول فقس في العش {0}!',ev_cold:'بيضة بردت في العش {0}',ev_bad:'اتشالت بيضة غير مخصبة (عش {0})',
  ev_die:'{0} نفق',ev_sick:'{0} تعبان',ev_adult:'{0} بقى بالغ',ev_hungry:'المعلف فاضي',ev_dry:'حوض الميه فاضي',ev_grow:'{0} طلع من العش',
  ev_offline:'وانت غايب عدّى {0} ساعة',
  need_coins:'العملات مش كفاية',need_feed:'مفيش علف في المخزن',feeder_filled:'المعلف اتملا',water_filled:'الميه اتملت',
  fed:'{0} اتغذى',watered:'{0} شرب',healed:'{0} بقى أحسن',sold_ok:'بعت {0} بـ {1}',paired:'{0} و {1} بقوا زوج',
  bought_ok:'تم الشراء',full:'البرج مليان',nonest:'مفيش عش فاضي',nothing:'لسه مفيش حاجة. دوس على طائر تفتح بطاقته.',
  feeder:'المعلف',waterbowl:'حوض الميه',sacks:'شكاير العلف',grain:'حبوب',tap_hint:'دوس على طائر أو عش. اسحب للتحريك، وكبّر بإصبعين.',
  reference:'سعر البيع',sure:'متأكد؟',welcome:'عودة حميدة',w_clear:'صافي',w_rain:'مطر',w_wind:'رياح',w_heat:'موجة حر',w_cold:'برد شديد',se_0:'الربيع',se_1:'الصيف',se_2:'الخريف',se_3:'الشتاء',ev_w_rain:'مطر النهارده: الحمّام هيتوسخ أكتر',ev_w_wind:'يوم رياح',ev_w_heat:'موجة حر: الحمام بيشرب أكتر، مروحة التهوية بتساعد',ev_w_cold:'برد شديد: الحمام بياكل أكتر، الدفاية بتساعد',up_heat:'دفاية',up_vent:'مروحة تهوية',up_done:'اتبنت',up_owned:'متركّبة',season:'الفصل',d_cold:'برد',d_gut:'مغص',d_pox:'جدري الحمام',ev_ill:'{0} شكلها تعبان ({1})',ev_recover:'{0} اتعافت لوحدها',why_contact:'عدوى من طير مريض، اعزلها',why_dirty:'الحمّام وسخ، نضّفه',why_stress:'توتر، وسّع وأكّلها',why_crowd:'زحمة',why_hunger:'جوع',why_chance:'حظ وحش',s_sneeze:'بتعطس',s_loose:'براز سائل',s_lumps:'تورمات في الجلد',s_lethargic:'خاملة',s_iso:'معزولة',iso_done:'اتبنى قفص العزل',iso_full:'قفص العزل مليان',iso_need:'ابني قفص عزل الأول',iso_on:'{0} اتعزلت',iso_buy:'قفص عزل (طيرين)',iso_btn:'اعزل',iso_off:'فك العزل',farm_lv:'مستوى التحدي',lv_relaxed:'مريح (بنخفف عليك)',lv_normal:'عادي',lv_demanding:'صعب',cleanliness:'النظافة',mood:'المزاج',stress:'الهدوء',personality:'الشخصية',signs:'العلامات',p_calm:'هادية',p_bold:'جريئة',p_shy:'خجولة',p_greedy:'شرهة',p_social:'اجتماعية',s_weak:'ضعيفة',s_ruffled:'ريش منفوش',s_hungry:'جعانة',s_thirsty:'عطشانة',s_dirty:'ريش وسخ',s_stressed:'متوترة',q_hatch:'افقس أزغال',q_sell:'بيع طيور',q_hand:'أكّل طيور بإيدك',q_clean:'نضّف الحمّام',q_orders:'نفّذ طلبات جيران',q_feed:'اشتري علف',daily:'مهام اليوم',weekly:'مهام الأسبوع',login:'مكافأة الدخول',login_claim:'استلم مكافأة يوم {0}: {1}',login_done:'تعالى بكرة',goals:'الأهداف',ev_upkeep:'اتدفع مصاريف اليوم: {0} عملة',ev_disease:'مرض أصاب {0}! عالجه ونضّف العش.',ev_pred:'قطة هاجمت الحمّام وضاع {0}! اشتري حارس الليل.',ev_pred_ok:'حارس الليل خوّف المفترس.',ev_dirty:'الحمّام وسخ، خطر المرض عالي.',clean:'نضّف الحمّام',clean_done:'الحمّام اتنضف',dirt:'الوساخة',guard:'حارس الليل (يمنع الهجمات)',guard_done:'حارس الليل اتركّب',t_ten:'املك 10 طيور',t_hatch10:'افقس 10 أزغال',t_win:'اكسب معرض حمام',t_white:'املك حمامة بيضاء',t_rich:'اجمع 3000 عملة',t_nests:'افتح 6 أعشاش',t_orders3:'نفّذ 3 طلبات جيران',comp:'المسابقة',comp_next:'المعرض الجاي بعد',comp_h:'{0} ساعة',comp_enter:'شارك',comp_entered:'اتسجّل',comp_score:'التقييم',comp_rank:'الترتيب',comp_you:'إنت',comp_last:'آخر معرض',comp_place:'المركز {0}',comp_prize:'الجايزة',comp_none:'لازم يكون عندك طير كبير عشان تشارك.',comp_info:'معرض كل ٧ أيام. أحسن طير بيكسب فلوس. المنافسين بيقووا كل أسبوع، فرَبّي طيور أحسن (حجم وحيوية وخصوبة وألوان نادرة وصحة كويسة).',comp_pick:'اختار طير تشارك بيه',comp_withdraw:'انسحاب',comp_week:'المعرض',comp_pts:'نقطة',comp_result:'نتيجة المعرض: المركز {0}، الجايزة {1}',comp_missed:'فاتك المعرض (مفيش طير مسجّل)',comp_soon:'معرض الحمام بكرة! سجّل طير.',comp_ent:'الطير المسجّل',orders:'طلبات الجيران',o_want:'عايز طير {0} كبير',o_pat:'{0}',o_pay:'بيدفع',o_fill:'سلّم',o_none:'مفيش طير عندك مطابق لسه. اعمل تزاوج!',away:'مدة الغياب',w_eggs:'بيض اتبيّض',w_hatch:'فقس',w_died:'نفق',w_grain:'علف اتاكل',w_water:'ميه اتشربت',w_note:'الطيور اتراعت وانت غايب (لحد 48 ساعة لعبة، من غير نفوق).',ok:'تمام',tree:'شجرة النسب',gone:'غير موجود',children:'الأبناء',grandp:'الأجداد',build:'بناء',built:'تم البناء!',nests_open:'الأعشاش',perch_stands:'أعمدة وقوف',buy_nest:'افتح عش',buy_perch:'أضف عمود وقوف',locked:'عش مقفول',maxed:'الحد الأقصى',sound:'الصوت',no_kids:'لسه مفيش ذرية',
  hatch_tip:'البيض بيفقس بعد 3 أيام. خلي المعلف والميه مليانين عشان الأبوين يقعدوا على البيض.'}
};
