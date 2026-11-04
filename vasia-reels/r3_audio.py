import sys
src=open('audio2.py').read().split('# ---------- arrangement')[0].replace('from tl import *','from tl3 import *')
exec(src)
from tl3 import *
# ---- extra voices
def ching(f,d=.9,vol=1.0):
    t=T(int(d*SR)); x=np.zeros(len(t),np.float32)
    for r,a,dc in ((1,1,.35),(2.41,.55,.22),(4.13,.3,.14)): x+=a*np.sin(2*np.pi*f*r*t)*np.exp(-t/dc)
    return (x*np.minimum(1,t/0.002)*vol*0.5).astype(np.float32)
def beep(f,d=.12,vol=.5,square=True):
    t=T(int(d*SR)); w=np.sign(np.sin(2*np.pi*f*t)) if square else np.sin(2*np.pi*f*t)
    w=fft_bp(w.astype(np.float32),150,4500,2)
    return (w*np.minimum(1,t/0.003)*np.clip((d-t)/0.01,0,1)*vol).astype(np.float32)
def pop(f,d=.09,vol=.5):
    t=T(int(d*SR)); fr=f*(0.7+0.5*t/d); ph=2*np.pi*np.cumsum(fr)/SR
    return (np.sin(ph)*np.exp(-t/0.04)*np.minimum(1,t/0.002)*vol).astype(np.float32)
def tick(vol=.18):
    t=T(int(.012*SR)); return (np.sin(2*np.pi*2600*t)*np.exp(-t/0.003)*vol).astype(np.float32)
def drone(a,b,f=55.0,vol=.16):
    n=int((b-a)*SR); t=T(n); x=np.zeros(n,np.float32)
    for fr,g in ((f,1),(f*1.0595,.7),(f*2,.35),(f*2.97,.25)): x+=g*np.sin(2*np.pi*fr*t)
    env=np.minimum(1,t/1.0)*np.clip(((b-a)-t)/0.15,0,1)
    return (x*env*vol).astype(np.float32)
def stutter(t0,f=220,n=4):
    for i in range(n): stereo(t0+i*0.045,beep(f,0.03,0.4),0.6)
def notify(t0,vol=1.0):
    for k,f in enumerate((1047,1568)):
        t=T(int(.18*SR)); x=np.sin(2*np.pi*f*t)*np.exp(-t/0.05)*np.minimum(1,t/0.003)
        stereo(t0+k*0.085,(x*0.5*vol).astype(np.float32),0.8,rev=.3)
CHm=[(60,64,67),(55,59,62),(57,60,64),(53,57,60)]   # C G Am F
RTm=[36,31,33,29]
# ---------- SCENE 1: hopeful
for bar in range(2):
    ch=CHm[bar%4]; stereo(bar*2.0,pad(ch,2.2),0.8,rev=.4)
for i in range(1,16):
    t=i*0.25
    if t<4.0-0.05:
        ch=CHm[int(t//2)%4]; stereo(t,pluck(ch[[0,1,2,1][i%4]]+12),0.45,pan=(-.5 if i%2 else .5),rev=.3)
for t in beats(2.0,3.9): stereo(t,kick(0.5),0.6)
t=0.5
while t<1.65: stereo(t,tick(),0.8,pan=np.random.uniform(-.5,.5)); t+=0.07
for k,tp in enumerate(POP): stereo(tp,pop(mtof(72+[0,2,4,7,9][k])*1.0,0.1,.5),0.7,rev=.3)
stereo(LIVE,ching(mtof(88),1.2,1.0),0.8,rev=.5); stereo(LIVE,ching(mtof(95),1.2,.6),0.6,rev=.5)
stereo(3.98-0.0,whoosh(.0001,True,0),0.0)
# ---------- SCENE 2: it breaks
stereo(PUBLISH,tick(.4),0.7)
stereo(PUBLISH-0.3,whoosh(.3,False,.5),0.4)
put(L,PUBLISH,drone(PUBLISH,CUT3+2.7),0.9); put(R,PUBLISH,drone(PUBLISH,CUT3+2.7),0.9)
stereo(CLICK,tick(.6),0.7); stereo(CLICK,sub_boom(.6),0.5); stutter(CLICK+0.05,200,3)
stereo(BROKEN_IMG,beep(330,.1,.4),0.6); stutter(BROKEN_IMG,180,3)
stereo(ERR500,sub_boom(1.0),0.9); stereo(ERR500,beep(880,.14,.5),0.7); stereo(ERR500+0.17,beep(660,.2,.5),0.7); stutter(ERR500+0.3,160,4)
stereo(CONSOLE,beep(740,.08,.35),0.6)
for i in range(6): stereo(CONSOLE+0.1+i*0.12,beep(500+i*40,.05,.25),0.5,pan=np.random.uniform(-.6,.6))
stereo(COLLAPSE,sub_boom(.9),0.7); stutter(COLLAPSE,150,5)
for tt,f in ((FORM,740),(PAY,622),(WHITE,520)):
    stereo(tt,sub_boom(.8),0.7); stereo(tt,beep(f,.14,.5),0.7); stereo(tt+0.17,beep(f*0.75,.22,.5),0.7)
t=WHITE+0.3
while t<STACK-0.1: stereo(t,tick(.25),0.6); t+=0.12
for K in HEART: stereo(K,kick(.7),0.8)
for i in range(8):
    tt=STACK+i*0.1; stereo(tt,beep(900+i*60,.08,.35),0.6,pan=(-.6 if i%2 else .6))
stereo(STACK,sub_boom(1.4),1.0); stereo(STACK,crash(1.0),0.3,rev=.2)
# alarm siren 9.8-10.3
tt=STACK
while tt<CUT3+0.2:
    stereo(tt,beep(700,.1,.3,False),0.6); stereo(tt+0.1,beep(920,.1,.3,False),0.6); tt+=0.2
# ---------- SCENE 3: frustration loop
for i,lt in enumerate(LOOPS):
    stereo(lt,sub_boom(.8),0.6); stereo(lt,beep(620-40*i,.14,.5),0.7); stereo(lt+0.17,beep(465-30*i,.25,.5),0.7)
    stutter(lt+0.3,150,3)
stereo(LOOPS[3],sub_boom(1.6),1.0); stereo(LOOPS[3]+0.05,crash(.8),0.25)
# ---------- SCENE 4: relief
stereo(BLACK-0.3,riser(0.3,.6),0.5)
stereo(DROP,sub_boom(2.0),1.0); stereo(DROP,kick(1.0),1.0); stereo(DROP,crash(2.0),0.4,rev=.4)
stereo(DROP,ching(mtof(84),2.0,.8),0.8,rev=.6); stereo(DROP,ching(mtof(91),2.0,.5),0.6,rev=.6)
for bar in range(int((DUR-DROP)//2)+1):
    t0=DROP+bar*2.0
    if t0>=DUR-0.3: break
    ch=CHm[bar%4]; rt=RTm[bar%4]; d=min(2.0,DUR-0.3-t0)
    stereo(t0,pad(ch,d+0.2),1.0,rev=.35)
    for off in (0,0.75,1.0,1.75):
        if off<d: stereo(t0+off,bass(mtof(rt),.28),0.9)
    for i in range(int(d/0.25)):
        stereo(t0+i*0.25,pluck(ch[[0,1,2,1,0,2,1,2][i%8]]+12),0.5,pan=(-.6 if i%2 else .6),rev=.3)
for i,K in enumerate(KICKS_GOOD):
    stereo(K,kick(1.0),0.95)
    if i%2==1: stereo(K,clap(),0.75,rev=.2)
    stereo(K+0.25,hat(),0.45,pan=.3)
for k,ts in enumerate(SWEEP): stereo(ts,ching(mtof(79+[0,2,4,7][k]),0.9,1.0),0.8,rev=.3); stereo(ts-0.15,whoosh(.15,True,.5),0.4)
for k,ts in enumerate(CHECK): stereo(ts,ching(mtof(84+[0,2,4,7][k]),1.0,1.0),0.9,rev=.4); stereo(ts,pop(mtof(72+[0,2,4,7][k]),.1,.4),0.6)
stereo(DONE,ching(mtof(96),1.8,1.0),0.9,rev=.6)
for i,n in enumerate((84,88,91,96)): stereo(DONE+0.04*i,ching(mtof(n),1.4,.6),0.7,pan=(-1)**i*.5,rev=.5)
stereo(BTN,pop(1000,.1,.5),0.7); notify(BTN+0.1)
stereo(PHONE-0.2,whoosh(.2,True,.6),0.5); stereo(PHONE,sub_boom(1.2),0.7); stereo(PHONE,ching(mtof(84),2.0,1.0),0.9,rev=.6)
for i,n in enumerate((84,88,91,96,100)): stereo(PHONE+0.05+i*0.055,ching(mtof(n),1.2,.45),0.7,pan=(-1)**i*.5,rev=.5)
stereo(URL,ching(mtof(96),1.0,.5),0.5,rev=.5)
# ---------- master
ir_n=int(1.6*SR); tt=T(ir_n)
irL=fft_bp((rng.standard_normal(ir_n)*np.exp(-tt/0.4)).astype(np.float32),120,4500,2); irR=fft_bp((rng.standard_normal(ir_n)*np.exp(-tt/0.4)).astype(np.float32),120,4500,2)
def fftconv(x,h):
    n=1<<int(np.ceil(np.log2(len(x)+len(h)))); return np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(h,n),n)[:len(x)].astype(np.float32)
wetL=fftconv(RL,irL); wetR=fftconv(RR,irR); k=0.20*np.sqrt((L**2).mean())/(np.sqrt((wetL**2).mean())+1e-9); wetL*=k; wetR*=k
outL=L+wetL; outR=R+wetR
# blackout 12.7-13.0 (click-free)
i,j=int(BLACK*SR),int((DROP-0.005)*SR); r=int(.02*SR)
for o in (outL,outR):
    o[i-r:i]*=np.linspace(1,0,r); o[i:j]*=0.0; o[j:j+int(.004*SR)]*=np.linspace(0,1,int(.004*SR))
fo=int(.8*SR); outL[-fo:]*=np.linspace(1,0,fo)**1.5; outR[-fo:]*=np.linspace(1,0,fo)**1.5
peak=max(np.abs(outL).max(),np.abs(outR).max()); g=0.92/peak
outL=np.tanh(outL*g*0.9)/np.tanh(0.9)*0.97; outR=np.tanh(outR*g*0.9)/np.tanh(0.9)*0.97
pcm=(np.clip(np.stack([outL,outR],1),-1,1)*32767).astype('<i2')
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio2 ok peak',peak)
