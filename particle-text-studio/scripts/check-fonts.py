# Checks the script table in src/app.js (FONTLIST) against what Google Fonts actually serves.
import re, urllib.request, urllib.parse, json, concurrent.futures
import os, sys
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
src=open(os.path.join(root,'src','app.js'),encoding='utf-8').read()
a=src.index('var FONTLIST = ['); b=src.index('];',a)
fonts=re.findall(r"\['([^']+)', (\d+), '([lhac]+)'\]",src[a:b])
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def get(name,w):
    for q in (f"family={urllib.parse.quote(name)}:wght@{w}", f"family={urllib.parse.quote(name)}"):
        try:
            r=urllib.request.Request('https://fonts.googleapis.com/css2?'+q+'&display=swap',headers={'User-Agent':UA})
            return urllib.request.urlopen(r,timeout=20).read().decode()
        except Exception as e: err=str(e)
    return 'ERR '+err
def check(f):
    name,w,tab=f; css=get(name,w)
    if css.startswith('ERR'): return name,tab,None,css
    subs=set(re.findall(r'/\* ([a-z\-]+) \*/',css))
    have=''
    if 'latin' in subs: have+='l'
    if 'hebrew' in subs: have+='h'
    if 'arabic' in subs: have+='a'
    if 'cyrillic' in subs: have+='c'
    return name,tab,have,''
with concurrent.futures.ThreadPoolExecutor(8) as ex: res=list(ex.map(check,fonts))
bad=0
for name,tab,have,err in res:
    if have is None: print('ERR',name,err); bad+=1; continue
    if set(have)!=set(tab): print('MISMATCH',name,'table',tab,'actual',have); bad+=1
print(len(res),'fonts checked,',bad,'problems')
sys.exit(1 if bad else 0)
