import ssl, edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
import asyncio, edge_tts, librosa, numpy as np, json
from faster_whisper import WhisperModel
W="edge/"
V="he-IL-AvriNeural"
L=[("1a","העסק שלך מעולה.",10),("1b","אבל הלקוחות לא רואים אותו.",15),("2","הם בוחרים במתחרים.",35),("3","הגיע הזמן שיראו אותך.",10),
   ("4","חבילות החל משלוש מאות ארבעים ותשע שקלים לחודש.",25),("5","צילום, עריכה ופרסום. הכל במקום אחד.",30),("6","מוכן שיראו אותך?",25),
   ("7a","דברו איתי בוואטסאפ.",10),("7b","ועכשיו, דברו איתי בוואטסאפ.",10),("7c","אז דברו איתי בוואטסאפ.",10),("7d","דברו איתי, בוואטסאפ.",5)]
async def gen():
    for k,t,r in L: await edge_tts.Communicate(t,V,rate=f"+{r}%").save(W+f"b_{k}.mp3")
asyncio.run(gen())
m=WhisperModel("small",device="cpu",compute_type="int8"); info={}
for k,t,r in L:
    a,_=librosa.load(W+f"b_{k}.mp3",sr=16000,mono=True); iv=librosa.effects.trim(a,top_db=35)[1]
    sp=(iv[1]-iv[0])/16000; lead=iv[0]/16000
    s,_i=m.transcribe(a,language="he",beam_size=5); txt=" ".join(x.text.strip() for x in s)
    info[k]=dict(lead=round(lead,3),speech=round(sp,3),total=round(len(a)/16000,3)); print(k,f"speech {sp:.2f}s (lead {lead:.2f})","|",t,"=>",txt,flush=True)
json.dump(info,open(W+"b_info.json","w"))
