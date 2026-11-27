# Bird Life Simulator (web prototype v0.2)

Interactive isometric pigeon-farm simulation. Plain HTML + CSS + JavaScript, no build step, no libraries, works offline.

## Run it
- Quick: open `dist/bird-life-simulator.html` (single file) in Chrome. On Android: save the file, open it from the Files app with Chrome. Progress is saved in the browser (localStorage) and survives closing the game.
- Project: open `index.html`, or serve the folder: `python3 -m http.server 8000` then browse to `http://<pc-ip>:8000` from the phone on the same Wi-Fi.
- Rebuild the single file after edits: `python3 build.py`.
- Chrome menu > "Add to Home screen" makes it launch full screen like an app.

## Controls
Drag = move camera, pinch / +/- = zoom, tap a bird = data card, tap a nest = eggs/squabs, tap feeder/drinker (or the side buttons) = refill, bottom bar = Birds / Breeding / Market / Management.

## Structure
| File | Role |
|---|---|
| `js/config.js` | constants, prices, texts (Arabic + English) |
| `js/genetics.js` | colour/pattern alleles, traits, crossing |
| `js/audio.js` | procedural sound (coos, wing flaps, chimes), mute button |
| `js/sim.js` | the simulation: time, needs, aging, pairing, eggs, hatching, growth, economy, save/offline (no drawing) |
| `js/sprites.js` | procedural pigeon drawing |
| `js/scene.js` | isometric scene, camera, picking |
| `js/ui.js` | HUD and panels, reads/writes only through `BLS.Sim` |
| `assets/reference-image.jpg` | the visual reference |
| `docs/` | notes |

`sim.js` is kept free of rendering so it can be ported to C# (`Sim` -> a plain class, `BLS.CFG` -> ScriptableObject) for Unity later.

## v0.2 additions
Sound, family tree (bird card > Family tree), build mode (hammer button: open nests 4->8, add perch stands), start pair now sits in the loft and on the roof, polish (vignette, moss, crates, shadows). Old v0.1 saves still load.

## v0.7 (flat 2D rebuild)
The isometric scene was replaced by a flat 2D front-on farm (js/scene.js). The old isometric scene is not shipped. sim.js is unchanged except: unpaired adults now pair up automatically, egg fertility odds are higher, birds face left/right by lateral movement.

## v0.8 (challenge, rivals, performance)
- Slower breeding: incubation 96 h, squab 96 h, adult at 240 h, 72 h cool-down between clutches, second egg 50%, population cap = 6 + 3 per open nest.
- Tougher economy: start 1200 coins and 8 kg feed, feed 90 per 5 kg and 0.005 kg per hunger unit, daily upkeep 5 coins per bird, dearer birds/pairs/heal, sell price x0.85.
- Hazards: disease (rises with dirt, spreads), cat raids (stopped by the 400-coin night guard), clean-loft chore.
- Competition: weekly show vs 3 AI rivals that get stronger each week, leaderboard, prizes.
- Goals: 7 long goals added to tasks.
- Performance: static scenery baked to cached layers (about 4x less drawing time), opaque canvas, vignette cached, simulation stepped in 0.06 h chunks, saves every 15 s.
- v0.8.1: daily (3) and weekly (2) quests, 7-day login streak reward.
- v0.9: per-bird cleanliness/mood/stress/personality, visible signs, save v3 migration.
- v0.10: gradual disease (cold/stomach/pox, causes shown), isolation cage, adaptive challenge level.
- v0.11: seasons (15 days each), daily weather, heater and ventilation fan.
