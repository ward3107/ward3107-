import ssl, edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
import asyncio, edge_tts, librosa, json
from faster_whisper import WhisperModel
W="r2/"
V="he-IL-AvriNeural"
L=[("v1b","בנית אתר עם בינה מלאכותית. הכל נראה מושלם.",0),("v1c","בנית אתר עם AI. הכל נראה מושלם.",0),
   ("v4b","התשלום לא עבר.",10),("v4c","התשלום נדחה.",10),("v5b","האתר לא נפתח.",10),("v5c","האתר לא עולה.",10),
   ("v6b","שעות של פרומפטים. ושום דבר לא עובד.",15),("v2b","ואז מגיעה ההשקה. והכל קורס.",5),("v7b","ואסיה נכנסת לתמונה. והכל מתוקן.",5)]
async def gen():
    for k,t,r in L: await edge_tts.Communicate(t,V,rate=f"+{r}%").save(W+f"{k}.mp3")
asyncio.run(gen())
m=WhisperModel("small",device="cpu",compute_type="int8"); info={}
for k,t,r in L:
    a,_=librosa.load(W+f"{k}.mp3",sr=16000,mono=True); iv=librosa.effects.trim(a,top_db=35)[1]
    s,_i=m.transcribe(a,language="he",beam_size=5); txt=" ".join(x.text.strip() for x in s)
    info[k]=dict(lead=round(iv[0]/16000,3),speech=round((iv[1]-iv[0])/16000,3)); print(k,f"{info[k]['speech']:.2f}s |",t,"=>",txt,flush=True)
json.dump(info,open(W+"info2.json","w"))
