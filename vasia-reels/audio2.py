import numpy as np, wave, sys
from tl import *
SR=44100; N=int(DUR*SR)
L=np.zeros(N,np.float32); R=np.zeros(N,np.float32)     # dry
RL=np.zeros(N,np.float32); RR=np.zeros(N,np.float32)   # reverb send
DUCK=np.ones(N,np.float32)
rng=np.random.default_rng(7)
def T(n): return np.arange(n)/SR
def put(buf,t,sig,g=1.0):
    i=int(t*SR); 
    if i>=len(buf): return
    sig=sig[:len(buf)-i] if i>=0 else sig[-i:]
    i=max(i,0); buf[i:i+len(sig)]+=sig*g
def stereo(t,sig,g=1.0,pan=0.0,rev=0.0):
    gl=g*np.cos((pan+1)*np.pi/4); gr=g*np.sin((pan+1)*np.pi/4)
    put(L,t,sig,gl); put(R,t,sig,gr)
    if rev: put(RL,t,sig,gl*rev); put(RR,t,sig,gr*rev)
def lp_var(x,fc):
    a=1-np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); s=0.0
    for i in range(len(x)):
        s+=a[i]*(x[i]-s); y[i]=s
    return y
def hp(x,fc=3000):
    a=1-np.exp(-2*np.pi*fc/SR); return x-lp_var(x,np.full(len(x),fc,np.float32))
def mtof(n): return 440*2**((n-69)/12)
# ---------- instruments
def kick(vol=1.0):
    t=T(int(.45*SR)); f=42+120*np.exp(-t/0.03); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t/0.17)+0.10*rng.standard_normal(len(t))*np.exp(-t/0.004)
    return (np.tanh(s*1.4)*np.minimum(1,t/0.0015)*vol).astype(np.float32)
def clap():
    t=T(int(.35*SR)); n=hp(rng.standard_normal(len(t)).astype(np.float32),1200)
    env=np.zeros_like(t)
    for o in (0,.011,.022): env+=np.where(t>=o,np.exp(-(t-o)/0.012),0)
    env+=np.exp(-t/0.11)*0.5
    return (n*env*0.5).astype(np.float32)
def hat(open_=False):
    t=T(int((.25 if open_ else .06)*SR)); n=hp(rng.standard_normal(len(t)).astype(np.float32),6500)
    return (n*np.exp(-t/(0.07 if open_ else 0.014))*0.35).astype(np.float32)
def sub_boom(d=1.6):
    t=T(int(d*SR)); f=32+60*np.exp(-t/0.25); ph=2*np.pi*np.cumsum(f)/SR
    return (np.sin(ph)*np.exp(-t/0.7)*1.2).astype(np.float32)
def crash(d=1.8):
    t=T(int(d*SR)); n=hp(rng.standard_normal(len(t)).astype(np.float32),4000)
    return (n*np.exp(-t/0.55)*0.5).astype(np.float32)
def whoosh(d=.45,up=True,vol=1.0):
    n=int(d*SR); t=np.linspace(0,1,n); x=rng.standard_normal(n).astype(np.float32)
    fc=(300+6500*t**2) if up else (6800-6200*t**0.7)
    y=lp_var(x,fc.astype(np.float32)); 
    env=(t**1.5) if up else ((1-t)**1.2)
    env=env*np.sin(np.pi*np.clip(t,0,1))**0.3 if False else env
    return (y*env*vol*2.2).astype(np.float32)
def riser(d,vol=1.0):
    n=int(d*SR); t=np.linspace(0,1,n); x=rng.standard_normal(n).astype(np.float32)
    y=lp_var(x,(250+9000*t**2.2).astype(np.float32))*(t**2)*1.8
    f=180*2**(t*3.2); ph=2*np.pi*np.cumsum(f)/SR
    y+=0.35*np.sin(ph)*t**2
    return (y*vol).astype(np.float32)
def bass(f,d=.28):
    t=T(int(d*SR)); ph=2*np.pi*f*t
    s=np.sin(ph)+0.45*np.sin(2*ph)+0.2*np.sin(3*ph)
    env=np.minimum(1,t/0.008)*np.exp(-t/(d*0.8))
    return (np.tanh(s*1.3)*env*0.55).astype(np.float32)
def pad(notes,d=2.2):
    t=T(int(d*SR)); s=np.zeros(len(t),np.float32)
    for n in notes:
        for det in (-0.07,0.0,0.07):
            f=mtof(n+det)
            for k,a in ((1,1),(2,.5),(3,.28),(4,.14)): s+=a*np.sin(2*np.pi*f*k*t)
    env=np.minimum(1,t/0.35)*np.clip((d-t)/0.5,0,1)
    return (s*env*0.035).astype(np.float32)
def pluck(n,d=.35):
    t=T(int(d*SR)); f=mtof(n); ph=2*np.pi*f*t
    s=np.sin(ph)+0.5*np.sin(2*ph)*np.exp(-t/0.05)+0.25*np.sin(3*ph)*np.exp(-t/0.03)
    return (s*np.exp(-t/0.11)*0.28).astype(np.float32)
def bell(f,d=2.2,vol=1.0):
    t=T(int(d*SR)); s=np.zeros(len(t),np.float32)
    for r,a,dc in ((1,1,.9),(2.76,.5,.5),(5.4,.28,.3),(8.93,.15,.18)): s+=a*np.sin(2*np.pi*f*r*t)*np.exp(-t/dc)
    return (s*vol*0.45).astype(np.float32)
def sparkle(t0,notes=(84,88,91,96,100),gap=.055):
    for i,n in enumerate(notes):
        s=bell(mtof(n),1.2,0.35); stereo(t0+i*gap,s,0.8,pan=(-1)**i*.5,rev=.5)
def heart(vol=1.0):
    return kick(vol)

# ================= SOFT instruments (replace the harsh noise-based ones) =================
def fft_bp(x,lo,hi,order=4):
    n=len(x); X=np.fft.rfft(x); f=np.fft.rfftfreq(n,1/SR); f[0]=1e-3
    H=1/np.sqrt(1+(lo/f)**(2*order))*1/np.sqrt(1+(f/hi)**(2*order))
    return np.fft.irfft(X*H,n).astype(np.float32)
def nz(n,lo,hi,rms=0.25):
    x=fft_bp(rng.standard_normal(n).astype(np.float32),lo,hi); return x/(np.std(x)+1e-9)*rms
def sub_boom(d=1.6):
    t=T(int(d*SR)); f=34+50*np.exp(-t/0.22); ph=2*np.pi*np.cumsum(f)/SR
    return (np.sin(ph)*np.exp(-t/0.6)*np.minimum(1,t/0.006)*0.85).astype(np.float32)
def crash(d=1.8):
    n=int(d*SR); t=T(n); x=nz(n,500,3200,0.12)*np.exp(-t/0.35)*np.minimum(1,t/0.01)
    return x.astype(np.float32)*0.5
def clap():
    n=int(.3*SR); t=T(n); env=np.zeros(n,np.float32)
    for o in (0,.012): env+=np.where(t>=o,np.exp(-(t-o)/0.014),0)
    env+=np.exp(-t/0.09)*0.35
    return (nz(n,900,3600,0.25)*env*0.45*np.minimum(1,t/0.002)).astype(np.float32)
def hat(open_=False):
    n=int((.18 if open_ else .05)*SR); t=T(n)
    return (nz(n,5000,9500,0.2)*np.exp(-t/(0.06 if open_ else 0.012))*np.minimum(1,t/0.002)*0.5).astype(np.float32)
def whoosh(d=.45,up=True,vol=1.0):
    n=int(d*SR); u=np.linspace(0,1,n)
    body=nz(n,220,2400,0.25)
    env=(u**2.0)*np.clip((1-u)/0.06,0,1) if up else ((1-u)**1.6)*np.minimum(1,u/0.04)
    f=(280*2**(u*1.6)) if up else (700*2**(-u*1.3))
    tone=np.sin(2*np.pi*np.cumsum(f)/SR)*0.10
    return ((body+tone)*env*vol*0.55).astype(np.float32)
def riser(d,vol=1.0):
    n=int(d*SR); u=np.linspace(0,1,n)
    f=200*2**(u*2.6); ph=2*np.pi*np.cumsum(f)/SR
    tone=(np.sin(ph)+0.4*np.sin(2*ph))*0.22*u**2
    return ((tone+nz(n,300,2600,0.16)*u**2.2)*vol*0.8).astype(np.float32)

# ---------- arrangement
K=kick()
for t in KICKS:
    v=1.0 if t>=4.0 or t in (0.05,) else 0.8
    stereo(t,K,v*0.95)
    i=int(t*SR); DUCK[i:i+int(.22*SR)]*=np.linspace(0.35,1,int(.22*SR))[:len(DUCK[i:i+int(.22*SR)])] if t>=4.0 else 1
# hook: dark drone + hits
dr=np.zeros(int(4.0*SR),np.float32); tt=T(len(dr))
for f in (55,110.0*1.005,164.8):
    dr+=np.sin(2*np.pi*f*tt)*0.12
dr*=np.clip(tt/2.0,0,1)**1.5*np.clip((3.85-tt)/0.05,0,1)
put(L,0,dr,0.9); put(R,0,dr,0.9)
for t in HOOK_HITS:
    stereo(t,sub_boom(1.2),0.55); stereo(t,crash(1.2),0.18,rev=.3)
    stereo(t-0.0,whoosh(.2,False,0.5),0.5)
# riser into drop
stereo(RISER[0],riser(RISER[1]-RISER[0]),0.9,rev=.2)
# DROP
stereo(DROP,sub_boom(2.0),1.0); stereo(DROP,crash(2.2),0.55,rev=.4); stereo(DROP,K,1.0)
stereo(DROP-0.02,whoosh(.35,True,1.0),0.0)
# whooshes + thuds for slide-ins (peak at landing)
for k in ('c1','c2','c3','c4','c5'):
    t=LAND[k]; stereo(t-0.4,whoosh(.4,True,0.8),0.7,pan=0.0); stereo(t,clap(),0.7,rev=.15)
stereo(LAND['c5']-0.4,whoosh(.4,True,0.5),0.5); stereo(LAND['c5'],sub_boom(1.0),0.5); stereo(LAND['c5'],crash(1.2),0.25,rev=.3)
# claps/snare on 2 & 4, hats
def groove(a,b):
    t=a
    while t<b-1e-6:
        beat=int(round((t-a)/B))
        if beat%2==1: stereo(t,clap(),0.8,rev=.2)
        t+=B
    t=a
    while t<b-1e-6:
        stereo(t+0.25,hat(),0.45,pan=.3)
        if int(round((t-a)/B))%4==3: stereo(t+0.25,hat(True),0.5,pan=-.2)
        t+=B
groove(4.0,EXIT); groove(EXIT+1.0,END)
# chords / arp / bass
CH=[(57,60,64),(53,57,60),(60,64,67),(55,59,62)]
ROOT=[33,29,36,31]
def music(a,b,only_pad=False):
    bar=0;t=a
    while t<b-1e-6:
        ch=CH[int(round((t-4.0)/2.0))%4]; rt=ROOT[int(round((t-4.0)/2.0))%4]
        d=min(2.0,b-t)
        p=pad(ch,d+0.2); stereo(t,p,1.0,rev=.35)
        for off in (0,0.75,1.0,1.75):
            if off<d and not only_pad: stereo(t+off,bass(mtof(rt),.28),0.9)
        for i in range(0 if only_pad else int(d/0.25)):
            n=ch[[0,1,2,1,0,2,1,2][i%8]]+12
            stereo(t+i*0.25,pluck(n),0.55,pan=(-.6 if i%2 else .6),rev=.3)
        t+=2.0
music(4.0,EXIT); music(EXIT,EXIT+1.0,True); music(EXIT+2.0,END)
# NOTE: bass/arp inside 10-11 breakdown removed below via mask
# breakdown (10-11): kill drums/bass/arp already not scheduled except music(10,11): remove by muting range with fade
# exit whooshes
for i in range(5):
    t=EXIT+i*EXIT_STAGGER; stereo(t,whoosh(.5,False,0.8),0.9,pan=(-0.6 if i%2 else 0.6))
stereo(EXIT,sub_boom(1.0),0.4); stereo(EXIT+0.5,riser(0.5,0.9),0.9,rev=.3)
# CTA
stereo(CTA['text']-0.05,whoosh(.15,True,.8),0.6); stereo(CTA['text'],sub_boom(1.6),0.8); stereo(CTA['text'],crash(1.8),0.4,rev=.4)
stereo(CTA['sub'],bell(mtof(88),.8,.5),0.5,pan=.3,rev=.5)
stereo(CTA['btn']-0.2,whoosh(.2,True,.7),0.6); stereo(CTA['btn'],bell(mtof(79),1.0,.7),0.6,rev=.5)
stereo(CTA['phone']-0.3,whoosh(.3,True,.8),0.7); stereo(CTA['phone'],sub_boom(1.6),0.8)
stereo(CTA['phone'],bell(mtof(84),2.8,1.0),0.9,rev=.6); stereo(CTA['phone'],bell(mtof(91),2.4,.7),0.7,rev=.6)
sparkle(CTA['phone']+0.05)
sparkle(CTA['url'],(96,100,103),.07)

# ---------- purchase-trigger layer
def ching(f,d=.9,vol=1.0):
    t=T(int(d*SR)); x=np.zeros(len(t),np.float32)
    for r,a,dc in ((1,1,.35),(2.41,.55,.22),(4.13,.3,.14),(6.2,.15,.08)): x+=a*np.sin(2*np.pi*f*r*t)*np.exp(-t/dc)
    x*=np.minimum(1,t/0.002)
    return (x*vol*0.5).astype(np.float32)
def coin_shower(t0,n=14,span=.7,vol=.6):
    n=max(4,n//3); vol=vol*0.45
    for i in range(n):
        f=rng.uniform(1700,3000); tt=t0+rng.uniform(0,span)*(i/n)**0.8
        stereo(tt,ching(f,.25,vol*rng.uniform(.4,1)),0.5,pan=rng.uniform(-.8,.8),rev=.35)
def cash_register(t0):
    # mechanical ka + bell ring + coin shower
    n=T(int(.09*SR)); ka=lp_var(rng.standard_normal(len(n)).astype(np.float32),np.full(len(n),1800,np.float32))*np.exp(-n/0.025)*1.6
    stereo(t0-0.05,ka.astype(np.float32),0.9)
    for f,g,dl in ((2093,1.0,0),(3136,.6,0.0)):
        stereo(t0+dl,bell(f,1.6,g),0.8,rev=.5)
    stereo(t0,ching(4186,1.0,.8),0.7,rev=.4)
    coin_shower(t0+0.08,18,.8,.7)
def notify(t0,vol=1.0):
    for k,f in enumerate((1047,1568)):
        t=T(int(.18*SR)); x=np.sin(2*np.pi*f*t)*np.exp(-t/0.05)*np.minimum(1,t/0.003)
        stereo(t0+k*0.085,(x*0.5*vol).astype(np.float32),0.8,rev=.3)
# rising reward note per package: C6 D6 E6 (..register..) A6
for k,m in (('c1',84),('c2',86),('c3',88),('c5',93)):
    stereo(LAND[k],ching(mtof(m),.9,1.0),0.9,rev=.3)
cash_register(LAND['c4'])
coin_shower(LAND['c5']+0.02,10,.5,.5)
# message-received cue on the CTA (twice: button + loop re-trigger)
notify(CTA['btn']+0.12); notify(END-0.5,0.8)
coin_shower(CTA['phone']+0.05,16,.9,.6)

# ---------- master
# mute 10.0-11.0 music bass/arp (keep pad): handled by lowpass duck on the whole mix for non-pad is complex -> simple dip
def seg_gain(a,b,g0,g1):
    i,j=int(a*SR),int(b*SR); r=np.linspace(g0,g1,j-i)
    for buf in (L,R): buf[i:j]*=r
# reverb
ir_n=int(1.8*SR); tt=T(ir_n)
irL=(rng.standard_normal(ir_n)*np.exp(-tt/0.45)).astype(np.float32); irR=(rng.standard_normal(ir_n)*np.exp(-tt/0.45)).astype(np.float32)
for ir in (irL,irR): ir[:int(.01*SR)]*=np.linspace(0,1,int(.01*SR))
def fftconv(x,h):
    n=1<<int(np.ceil(np.log2(len(x)+len(h)))); return np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(h,n),n)[:len(x)].astype(np.float32)
irL=fft_bp(irL,120,4500,2); irR=fft_bp(irR,120,4500,2)
wetL=fftconv(RL,irL); wetR=fftconv(RR,irR)
_k=0.20*np.sqrt((L**2).mean())/(np.sqrt((wetL**2).mean())+1e-9)
wetL*=_k; wetR*=_k
print("rms dry",float(np.sqrt((L**2).mean())),"rms wet",float(np.sqrt((wetL**2).mean())),"peak dry",float(np.abs(L).max()),"peak wet",float(np.abs(wetL).max()))
outL=L*1.0+wetL; outR=R*1.0+wetR
# sidechain only on tonal stuff approximated by global light duck
outL*=(0.75+0.25*DUCK); outR*=(0.75+0.25*DUCK)
# breakdown dip 10.2-10.95 (drums are not scheduled there; thin out remaining low end)
# fades
f_in=int(.01*SR); outL[:f_in]*=np.linspace(0,1,f_in); outR[:f_in]*=np.linspace(0,1,f_in)
fo=int(.6*SR); outL[-fo:]*=np.linspace(1,0,fo)**1.5; outR[-fo:]*=np.linspace(1,0,fo)**1.5
# silence gap pre-drop 3.85-4.0 (except nothing): kill everything in the gap
i,j=int(3.84*SR),int(3.995*SR); r=int(0.02*SR)
for o in (outL,outR):
    o[i-r:i]*=np.linspace(1,0,r); o[i:j]*=0.0; o[j:j+int(0.004*SR)]*=np.linspace(0,1,int(0.004*SR))
peak=max(np.abs(outL).max(),np.abs(outR).max()); g=0.92/peak
outL=np.tanh(outL*g*0.9)/np.tanh(0.9)*0.97; outR=np.tanh(outR*g*0.9)/np.tanh(0.9)*0.97
st=np.stack([outL,outR],1); pcm=(np.clip(st,-1,1)*32767).astype('<i2')
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio ok peak',peak)
