#!/usr/bin/env python3
"""Static project validation; run from any working directory."""
from pathlib import Path
import re, subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
errors = []
js_files = sorted((ROOT / 'js').glob('*.js')) + [ROOT / 'sw.js']
for path in js_files:
    result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
    if result.returncode:
        errors.append(f'{path.relative_to(ROOT)}: {result.stderr.strip()}')
try:
    subprocess.run([sys.executable, str(ROOT / 'build.py')], cwd=ROOT, check=True, capture_output=True, text=True)
except subprocess.CalledProcessError as exc:
    errors.append('build.py: ' + (exc.stderr or exc.stdout).strip())
index = (ROOT / 'index.html').read_text(encoding='utf-8')
built_path = ROOT / 'dist' / 'bird-life-simulator.html'
if not built_path.exists():
    errors.append('single-file build was not created')
else:
    built = built_path.read_text(encoding='utf-8')
    if re.search(r'<script src="js/|<link rel="stylesheet" href="css/', built):
        errors.append('single-file build still references external JS/CSS')
    if 'BLS.ASSET_DATA=' not in built:
        errors.append('single-file build is missing embedded assets')

vsprite = (ROOT / 'js' / 'vsprite.js').read_text(encoding='utf-8')
if 'var blinkPhase=' not in vsprite or 'if(!fly&&!BLS.REDUCED)' not in vsprite or 'Calm, slow head scanning' not in vsprite:
    errors.append('deterministic low-cost blink animation is missing')

sim = (ROOT / 'js' / 'sim.js').read_text(encoding='utf-8')
if 'if(!protect&&ad_>os_' not in sim:
    errors.append('offline protection does not guard birds from old-age mortality')

sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
build_script = (ROOT / 'build.py').read_text(encoding='utf-8')
if "VER = '57'" not in build_script:
    errors.append('single-file build version is not v57')

if "var CACHE='bls-shell-v57'" not in sw:
    errors.append('service worker cache version is not v57')
if 'caches.match(r,{ignoreSearch:true})' not in sw:
    errors.append('service worker does not ignore cache-busting query strings')
if "k.indexOf('bls-shell-')===0" not in sw:
    errors.append('service worker may delete unrelated origin caches')
if "if(r.mode==='navigate') return caches.match('./index.html')" not in sw:
    errors.append('service worker offline fallback is not restricted to navigations')
match = re.search(r'var SHELL=(\[.*?\]);', sw, re.S)
if not match:
    errors.append('service worker shell list not found')
else:
    paths = re.findall(r"'([^']+)'", match.group(1))
    for item in paths:
        if item.startswith('./') and not (ROOT / item[2:]).exists():
            errors.append(f'service worker precache file missing: {item}')
if errors:
    print('\n'.join('FAIL: ' + e for e in errors))
    sys.exit(1)
print(f'OK: {len(js_files)-1} app JavaScript files + service worker passed syntax checks; single-file build and {len(paths)} precache entries verified.')
