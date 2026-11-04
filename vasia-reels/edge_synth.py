import ssl, edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
import asyncio, edge_tts, librosa
from faster_whisper import WhisperModel
W="edge/"
L={"1a":"העסק שלך מעולה.","1b":"אבל הלקוחות לא רואים אותו.","2":"הם בוחרים במתחרים.","3":"הגיע הזמן שיראו אותך.","4":"חבילות החל משלוש מאות ארבעים ותשע שקלים לחודש.","5":"צילום, עריכה ופרסום. הכל במקום אחד.","6":"מוכן שיראו אותך?","7":"דברו איתי בוואטסאפ."}
async def gen(voice):
    for k,t in L.items():
        await edge_tts.Communicate(t,voice,rate="+8%").save(W+f"{k}_{voice.split('-')[2][:4]}.mp3")
for v in ("he-IL-AvriNeural","he-IL-HilaNeural"): asyncio.run(gen(v))
m=WhisperModel("small",device="cpu",compute_type="int8")
for voice in ("Avri","Hila"):
    for k,t in L.items():
        a,_=librosa.load(W+f"{k}_{voice}.mp3",sr=16000,mono=True); d=len(a)/16000
        s,_i=m.transcribe(a,language="he",beam_size=5)
        print(voice,k,f"{d:.2f}s |",t,"=>"," ".join(x.text.strip() for x in s),flush=True)
