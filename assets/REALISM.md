# REALISM.md  (v0.44)  - every number: SOURCED or ESTIMATE

## The clock rule
Every rate is the natural (real-world) value per natural day/hour, applied per GAME day/hour. Only the clock is sped up:
1 game day = 96 real minutes at x1 (15 game days per real day, REAL_SEC_PER_HOUR 240). METAB = SLOW = 1 (no other compression).
Consequence: pigeon lifespan 10 y = 3650 game days = about 243 real days of play.

## Sourced
- Feed ~38 g/day for a 450 g adult (30 g avg, 20-100 g, ~10% body weight): racingpigeons.info/physiological-constants-of-the-pigeon, ccac.ca pigeons_doves.pdf.
- Water 45 ml/day (30-60), double in summer: racingpigeons.info.
- Incubation 17-19 d (18 used), squab in nest ~4 weeks (28 d), fly/self-feed 4-6 weeks: pigeonpedia.com/pigeon-life-cycle, aepma.com.au/PestDetail/18/Pigeon.
- Breeding from 6-7 months (180 d used): CCAC pigeons_doves.pdf; npausa.com says 5-7 months.
- Next round laid ~21 days after hatching (504 h): kastleloft.com Pigeon-Breeding-Calendar.pdf. 2 eggs, laid ~2 days apart: creatures.com/species/pigeon/pigeon-breeding.
- Squab early mortality 13% (White Carneaux loft study, PubMed 875365; 10-15% other sources). Hatchability ~77%, fertility 92.5% (repository.ipb.ac.id/handle/123456789/55310).
- Young-pigeon coccidiosis mortality 5-70% (PubMed 19530399): the 8% juvenile figure is inside this range (pick = ESTIMATE).
- Lifespan: domestic up to 15 y typical, feral ~3 y (RSPCA, WDFW, allaboutbirds.org). 10 y used for a loft bird = ESTIMATE inside the range.
- Medicated-water course 5 days; cost per treatment about 40p per Harkers 4 in 1 (harkersonline.co.uk): game uses 25 EGP per bird, exchange rate guessed = ESTIMATE.

## Per-breed intake (v0.42)
Intake = (body weight / 450 g)^0.75 x (38 g feed, 45 ml water): metabolic scaling (ESTIMATE of the exponent; real intake is ~6-10% of body weight). Body weight = (300 + 2.6 x size gene) x breed scale (breeds.js sc). The breed scales are the game's old drawing proportions, NOT measured weights: ESTIMATE, still to be replaced with real breed weights (e.g. homer 400-550 g per zajelerp.com, feral 250-350 g per aepma.com.au).

## Feeder / drinker ladder (sizes follow the user's 0.5 kg dish; prices EGP = ESTIMATES, no shop price lookup yet)
Feeder: 0.5 kg dish (free, lv1) > 1 kg (80, lv3) > 2.5 kg (180, lv5) > 5 kg (380, lv8) > 10 kg barrel (750, lv11).
Drinker: 1.5 L (free) > 3 L (70, lv3) > 5 L (150, lv6) > 10 L (300, lv9).
At 38 g a 0.5 kg dish feeds 13 bird-days.

## Starvation, thirst, disease (ESTIMATES from lay sources)
No food: death ~6 days; no water: ~2.6 days (lay sites say 10-14 d and 48-72 h). Squabs x2 / x1.5 faster.
Disease cases per bird per year: 0.12 clean loft, +0.8 dirty, +0.5 stressed, +0.4 crowded, +0.25 hungry, +0.25 bad weather = ESTIMATES (no annual incidence found). Course: stage every 2 days, untreated recovery from day 7, medicated water cures from day 1 = ESTIMATES.

## Gear (v0.41/42): life in real days / run EGP per game day = ALL ESTIMATES
guard 2800 d / 4, isolation 1820 / 0, heater 210 (bulb ~5000 h) / 3, vent 1092 / 2, nursery 1820 / 0.5, vet kit 364 / 1, flight net 1820 / 0, camera 1400 / 0.2. Repair 30-40% of price (+25% per repair), scrap 10%.

## Adult body weight per breed, grams (v0.43; drives food, water and price weight)
Weight = breed weight x (0.8 + size gene x 0.004) (size 50 = the figure).
SOURCED: baladi 415 (Springer, link.springer.com/article/10.1186/s12917-026-05854-5), homer 475 (400-550, zajelerp.com/en/pigeons/breeds), roller 275 (Birmingham 250-300, same), nun 370 (320-420, elwes.org German nun), helmet 350 (pigeonpedia.com/helmet-pigeon), king 850 (700-1000, zajelerp), fantail 400 (13-18 oz, strombergschickens.com; 350-450 zajelerp), magpie 430 (400-460, pigeonpedia.com/english-magpie-pigeon), maltese 300 (250-350, rarepetsbreeds.com), jacobin 350 (en.wikipedia.org/wiki/Jacobin_pigeon), roman 1250 (1000-1500, zajelerp), swallow 380 (Saxon fairy swallow 13-14 oz, Wikipedia; other swallows differ), trumpet 370 (English trumpeter, roysfarm.com; Bokhara not found).
ESTIMATE: pouter 600 (no reliable weight found; tall but slim).

## Economy changes (v0.43) after the 96-min day
- Bird upkeep 0.4 EGP/day REMOVED (it was invented; feed is already the real running cost). Aviary upkeep 0.75 EGP per bird per day = 38 g x 20 EGP/kg (derived from the feed price).
- Predator attack chance 0.10 -> 0.01 per game day (about 3-4 attempts a year, ESTIMATE; no sourced rate). Guard still cuts it by 85%.
- Random event (stray, trader...) lifetime 2 -> 6 game days (about 9.6 real hours; ESTIMATE, so you can answer once a day).
- Quest, level gift, login and order rewards were NOT changed: they are per real calendar day or per action, so a 15x time speed does not shrink them. Real pigeon sale prices unchanged.

## v0.44 fixes and economy check
- BUG fixed (introduced in v0.42): the starter pair and shop single birds were created at age 400 h / 200-280 h, which became SQUABS after the 28-day squab stage, so they died of thirst on day 3. Starters and shop birds are now adults (age 180 d + 10-40 h), matching the 105 EGP adult price.
- Pair market price check: baladi pair 170-200 EGP in Egypt, Nov 2026 (meatmasr.com/items/49, dwajnplus.com/asaar/pigeons, jarayid.com/en/egypt/1994912/egypt-poultry-rates-today). Game pair 200, single 105: consistent.
- Squab sale value 0.5 -> 0.9 of an adult (juvenile 0.95): squabs are sold at the same pair price; the old 0.5 was invented. Still ESTIMATE for the exact ratio.
- Clutch cycle: the 21-day rest now starts at hatching (kastleloft Pigeon-Breeding-Calendar), not after the squabs leave the nest. Cycle = 18 d incubation + 28 d squab stage = 46 d, matching the sourced 12 squabs per pair per year (svuijas.2023.226150.1305).
- Predator attack chance 0.004 per game day (about 1.5 per year, ESTIMATE).
- Feed price 20 EGP/kg is an ESTIMATE; poultry feed is 22,300-26,000 EGP per tonne in Nov 2026 (almalnews.com, 27-11-2026), so pigeon grain at 20 is in the same range.

## Balance simulation (headless bot, 1 game year = 15 real days at x1)
Bot visits every 6 game h (24 real min): refills feeder and water, buys feed, cleans at dirt 35, gives medicine, sells surplus.
- 1 pair, no growth: coins +100 EGP/year, net worth +100. About 6 hatched per year (sourced real figure 12; the bot loses breeders to predators and sells early).
- 2 pairs: net worth +240 EGP/year, 13 hatched.
- Income per real hour: about 0.2-0.5 EGP per pair. It is tiny because REAL pigeon margins are thin (a pair earns ~1000 EGP/yr real, feed ~550).
- Consequence: farm income alone is slow by design. Quests (60-200 EGP per day), level gifts and login rewards are NOT time-scaled and are the main early income. Offline (max 7 real days = 105 game days) gives a pair about 30-60 EGP.
- Sim limits: simplified bot, headless, bird movement runs at x8 not x1.

## STILL not audited (v0.45+)
Shop gear prices, quest/XP/gift amounts, competition prizes, market volatility, aviary prices and times.
