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
  GRAIN_PER_UNIT: 0.003,       // kg per hunger unit
  WATER_PER_UNIT: 0.06,
  FEEDER_CAP: 3, WATER_CAP: 100,
  EGG_INCUBATION_H: 72, SQUAB_H: 72, JUVENILE_H: 168,   // hatch at 3 d, leave nest 3 d later, adult at 7 d
  EGG_COLD_LIMIT_H: 18,
  NEST_COUNT: 8, MAX_BIRDS: 40,
  START_COINS: 2500, START_FEED: 15,
  OFFLINE_MAX_H: 48,
  PRICE: { feed5: 60, bird: 180, pair: 330, heal: 40 }
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
  reference:'Sold price',sure:'Sure?',tree:'Family tree',gone:'gone',children:'Children',grandp:'Grandparents',build:'Build',built:'Built!',nests_open:'Nests',perch_stands:'Perch stands',buy_nest:'Open a nest',buy_perch:'Add a perch stand',locked:'Locked nest',maxed:'Maximum',sound:'Sound',no_kids:'No offspring yet',
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
  reference:'سعر البيع',sure:'متأكد؟',tree:'شجرة النسب',gone:'غير موجود',children:'الأبناء',grandp:'الأجداد',build:'بناء',built:'تم البناء!',nests_open:'الأعشاش',perch_stands:'أعمدة وقوف',buy_nest:'افتح عش',buy_perch:'أضف عمود وقوف',locked:'عش مقفول',maxed:'الحد الأقصى',sound:'الصوت',no_kids:'لسه مفيش ذرية',
  hatch_tip:'البيض بيفقس بعد 3 أيام. خلي المعلف والميه مليانين عشان الأبوين يقعدوا على البيض.'}
};
