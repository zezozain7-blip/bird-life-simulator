#!/usr/bin/env python3
"""Bundle the project into one self-contained HTML file (dist/bird-life-simulator.html)."""
import re, os
root=os.path.dirname(os.path.abspath(__file__))
h=open(os.path.join(root,'index.html'),encoding='utf8').read()
css=open(os.path.join(root,'css/style.css'),encoding='utf8').read()
h=re.sub(r'<link rel="stylesheet" href="css/style.css">','<style>\n'+css.replace('\\','\\\\')+'\n</style>',h)
def js(m): return '<script>\n'+open(os.path.join(root,m.group(1)),encoding='utf8').read().replace('</script>','<\\/script>')+'\n</script>'
h=re.sub(r'<script src="(js/[^"]+)"></script>',js,h)
os.makedirs(os.path.join(root,'dist'),exist_ok=True)
open(os.path.join(root,'dist/bird-life-simulator.html'),'w',encoding='utf8').write(h)
print('ok',len(h))
