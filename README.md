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
