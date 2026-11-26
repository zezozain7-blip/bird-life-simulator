#!/usr/bin/env python3
"""Bundle the project into one self-contained HTML file (dist/bird-life-simulator.html)."""
import re, os
root=os.path.dirname(os.path.abspath(__file__))
h=open(os.path.join(root,'index.html'),encoding='utf8').read()
css=open(os.path.join(root,'css/style.css'),encoding='utf8').read()
h=re.sub(r'<link rel="stylesheet" href="css/style.css">','<style>\n'+css.replace('\\','\\\\')+'\n</style>',h)
import base64,glob,json
data={}
for f in sorted(glob.glob(os.path.join(root,'assets/sprites/*.png'))): data['sprites/'+os.path.basename(f)[:-4]]='data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
for f in sorted(glob.glob(os.path.join(root,'assets/textures/*.jpg'))): data['textures/'+os.path.basename(f)[:-4]]='data:image/jpeg;base64,'+base64.b64encode(open(f,'rb').read()).decode()
DATA_JS='BLS.ASSET_DATA='+json.dumps(data)+';\n'
def js(m):
    if m.group(1)=='js/assets.js': return '<script>\n'+DATA_JS+open(os.path.join(root,m.group(1)),encoding='utf8').read()+'\n</script>'
    return js0(m)
def js0(m): return '<script>\n'+open(os.path.join(root,m.group(1)),encoding='utf8').read().replace('</script>','<\\/script>')+'\n</script>'
h=re.sub(r'<script src="(js/[^"]+)"></script>',js,h)
os.makedirs(os.path.join(root,'dist'),exist_ok=True)
open(os.path.join(root,'dist/bird-life-simulator.html'),'w',encoding='utf8').write(h)
print('ok',len(h))
