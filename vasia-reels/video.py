import math, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from tl import *
SRC="assets/poster.png"
FONT="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
OUT=sys.argv[1]; LIMIT=float(sys.argv[2]) if len(sys.argv)>2 else DUR
W,H,FPS=1080,1920,30
src=Image.open(SRC).convert("RGB"); SW,SH=src.size; S=W/SW
rng=np.random.default_rng(3)

# ---------- backgrounds
yy_,xx_=np.mgrid[0:H,0:W].astype(np.float32)
r=np.clip(np.sqrt(((xx_-W/2)/(W*0.75))**2+((yy_-H*0.45)/(H*0.7))**2),0,1)[...,None]
g=np.array([62,80,108],np.float32)*(1-r)+np.array([20,26,42],np.float32)*r
gl=np.exp(-(((xx_-W*0.3)/380)**2+((yy_-330)/300)**2))[...,None]*np.array([70,30,110],np.float32)
BG=np.clip(g+gl,0,255).astype(np.uint8)
HOOK_BG=(np.clip(g*0.28,0,255)).astype(np.float32)
# ---------- helpers
def ease_out(t): t=min(max(t,0),1); return 1-(1-t)**3
def ease_in(t): t=min(max(t,0),1); return t**3
def ease_back(t,c=1.7):
    t=min(max(t,0),1)-1; return 1+(c+1)*t**3+c*t**2
def crop(box,kind,feather=14,radius=38,scale=1.0):
    x0,y0,x1,y1=box
    im=src.crop(box).convert("RGBA")
    im=im.resize((round((x1-x0)*S*scale),round((y1-y0)*S*scale)),Image.LANCZOS)
    w,h=im.size; m=Image.new("L",(w,h),0); d=ImageDraw.Draw(m)
    if kind=="card": d.rounded_rectangle((0,0,w-1,h-1),radius=radius,fill=255)
    else:
        d.rectangle((feather,feather,w-feather,h-feather),fill=255); m=m.filter(ImageFilter.GaussianBlur(feather/2))
    im.putalpha(m); return im
def shadow_for(im,blur=22,alpha=110):
    a=im.split()[3]; sh=Image.new("L",(im.width+120,im.height+120),0)
    sh.paste(a.point(lambda v:int(v*alpha/255)),(60,70)); return sh.filter(ImageFilter.GaussianBlur(blur))
def paste(frame,im,x,y,alpha=1.0,mask=None):
    a=(mask if mask is not None else im.split()[3])
    if alpha<1: a=a.point(lambda v:int(v*alpha))
    frame.paste(im.convert("RGB"),(int(x),int(y)),a)
def text_layer(text,size,fill,glow=None,maxw=980,rtl=True):
    kw=dict(direction="rtl",language="he") if rtl else {}
    def F(sz): return ImageFont.truetype(FONT,sz,layout_engine=ImageFont.Layout.RAQM)
    f=F(size)
    while True:
        bb=f.getbbox(text,**kw); w=bb[2]-bb[0]
        if w<=maxw or size<30: break
        size-=4; f=F(size)
    pad=70; h=bb[3]-bb[1]
    im=Image.new("RGBA",(w+2*pad,h+2*pad),(0,0,0,0))
    sw=max(4,size//16)
    if glow:
        gm=Image.new("L",im.size,0); ImageDraw.Draw(gm).text((pad-bb[0],pad-bb[1]),text,font=f,fill=255,stroke_width=sw+4,**kw)
        gm=gm.filter(ImageFilter.GaussianBlur(size//5)); gl_=Image.new("RGBA",im.size,glow+(0,)); gl_.putalpha(gm.point(lambda v:min(255,int(v*1.4)))); im.alpha_composite(gl_)
    ImageDraw.Draw(im).text((pad-bb[0],pad-bb[1]),text,font=f,fill=fill,stroke_width=sw,stroke_fill=(10,8,20),**kw)
    return im
# ---------- reveal items
els=[("header",(0,0,1122,312),"soft"),("c1",(44,322,1080,454),"card"),("c2",(44,462,1080,590),"card"),
 ("c3",(44,596,1080,724),"card"),("c4",(44,730,1080,866),"card"),("c5",(44,871,1080,1010),"card")]
ITEMS={}; y=230
for n,box,kind in els:
    im=crop(box,kind,feather=(36 if n=="header" else 14)); it=dict(im=im,x=(W-im.width)//2,y=y,kind=kind)
    if kind=="card": it["sh"]=shadow_for(im)
    ITEMS[n]=it; y+=im.height+26
# CTA assets
BTN=crop((150,1098,970,1198),"soft",scale=1.2); PHONE=crop((90,1196,1040,1335),"soft",scale=1.1)
URLI=text_layer("vasia.dev",74,(255,255,255),(160,120,255),rtl=False)
# hook text
HOOK=[ # text,size,color,glow,y,t_in,t_out  (timed to the voiceover word onsets)
 ("העסק שלך מעולה.",118,(255,255,255),(160,120,255),760,0.05,2.95),
 ("אבל הלקוחות",128,(255,92,120),(255,40,80),930,1.30,2.95),
 ("לא רואים אותו.",128,(255,92,120),(255,40,80),1080,1.90,2.95),
 ("הם בוחרים",132,(255,255,255),(160,120,255),880,2.95,3.86),
 ("במתחרים.",150,(255,70,100),(255,30,70),1060,3.10,3.86)]
HOOKI=[(text_layer(t,s,c,gl),y,a,b) for t,s,c,gl,y,a,b in HOOK]
CTA_T=text_layer("מוכן שיראו אותך?",118,(255,255,255),(160,120,255))
CTA_S=text_layer("הודעה אחת בוואטסאפ — ומתחילים.",54,(205,255,60),(120,190,0),maxw=1000)
# ---------- fx
def decay(events,t,tau,default=0.0):
    s=default
    for ti,a in events:
        if ti<=t<ti+1.2: s+=a*math.exp(-(t-ti)/tau)
    return s
def shock(frame,cx,cy,lt,color=(255,255,255),dur=0.7,maxr=1200):
    if not (0<=lt<dur): return
    k=ease_out(lt/dur); r=maxr*k; a=int(200*(1-k)); 
    ov=Image.new("L",(W,H),0); d=ImageDraw.Draw(ov); w=int(24*(1-k)+3)
    d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=a,width=w); ov=ov.filter(ImageFilter.GaussianBlur(2))
    frame.paste(Image.new("RGB",(W,H),color),(0,0),ov)
p=subprocess.Popen(["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
    "-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart",OUT],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
N=int(FPS*LIMIT)
for f in range(N):
    t=f/FPS
    # ---- scene composition
    if t<DROP:
        # tension background: darker, red creeping in
        tens=min(1,max(0,(t-0.8)/3.0))
        base=HOOK_BG.copy(); base[...,0]+=tens*38; base[...,1]-=tens*4
        beat=decay([(h,1) for h in HEART],t,0.12)
        base*= (1+0.25*beat)
        frame=Image.fromarray(np.clip(base,0,255).astype(np.uint8))
        if t<3.86:
            for im,y_,a,b in HOOKI:
                lt=t-a
                if lt<0 or t>=b: continue
                k=ease_back(lt/0.22,2.2); sc=1+0.9*(1-k) if lt<0.22 else 1.0
                sc=max(0.2,sc)
                if lt>=0.22: sc=1+0.012*math.sin(lt*9)
                imm=im if abs(sc-1)<0.003 else im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
                jx=int(decay([(0,0)],t,1)+ (12*math.exp(-lt/0.2)*math.sin(lt*110)))
                paste(frame,imm,(W-imm.width)//2+jx,y_-imm.height//2,alpha=min(1,lt/0.06))
        else:
            frame=Image.new("RGB",(W,H),(0,0,0))
    else:
        frame=Image.fromarray(BG)
        # glow pulse behind CTA scene
        if t>=CTA['text']:
            pk=decay([(h,1) for h in beats(CTA['text'],END)],t,0.18)
            ov=np.exp(-(((xx_-W/2)/520)**2+((yy_-1150)/520)**2))
            ov=(ov*(0.28+0.22*pk)*255).astype(np.uint8)
            frame.paste(Image.new("RGB",(W,H),(150,90,255)),(0,0),Image.fromarray(ov))
        # reveal group
        if t<EXIT+0.9:
            order=['c1','c2','c3','c4','c5']
            for n,it in ITEMS.items():
                land=LAND[n]; im=it["im"]; x=it["x"]; yv=it["y"]; alpha=1.0; sc=1.0
                lt=t-(land-0.4)
                if t<(land-0.4) and n!='header': continue
                if n=='header':
                    lt2=t-land
                    if lt2<0: continue
                    sc=1+0.75*(1-ease_back(lt2/0.3,1.6)) if lt2<0.3 else 1
                elif n=='note':
                    alpha=ease_out(lt/0.5); yv+= (1-ease_out(lt/0.5))*30
                else:
                    k=ease_back(lt/0.4,1.4); x+=(1-k)*520 if lt<0.4 else 0
                    alpha=ease_out(lt/0.2)
                # exit
                if t>=EXIT:
                    if n in order:
                        i=order.index(n); le=(t-EXIT-i*EXIT_STAGGER)/0.5
                        if le>0: x+=((-1)**i)*-1*ease_in(le)*1300; alpha*=1-ease_in(le)*0.4
                    elif n=='header':
                        le=(t-EXIT)/0.5; sc*=1+0.5*ease_in(le); alpha*=max(0,1-ease_in(le))
                    else:
                        alpha*=max(0,1-(t-EXIT)/0.3)
                if alpha<=0.01: continue
                layer=im
                if abs(sc-1)>0.003:
                    layer=im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
                    x=it["x"]-(layer.width-im.width)//2; yv=it["y"]-(layer.height-im.height)//2
                if "sh" in it: paste(frame,Image.new("RGB",it["sh"].size,(0,0,0)),x-60,yv-50,alpha*0.9,it["sh"])
                sp=None
                if n=='c4' and t>LAND['c4']+0.3 and t<SWEEP:
                    ph=((t-LAND['c4']-0.3)%1.0)
                    if ph<0.5: sp=ph/0.5
                if n in order and SWEEP<=t<EXIT:
                    u=(t-(SWEEP+0.3*order.index(n)))/0.6
                    if 0<=u<=1: sp=u
                if sp is not None:
                    w_,h_=layer.size; xs=np.arange(w_)[None,:]/w_; ys=np.arange(h_)[:,None]/h_
                    d=(xs+ys*0.35)-(-0.3+sp*1.6); band=np.exp(-(d/0.07)**2)*0.6
                    arr=np.array(layer).astype(np.float32); a_=arr[...,3:4]/255
                    arr[...,:3]=np.clip(arr[...,:3]+band[...,None]*255*a_,0,255); layer=Image.fromarray(arr.astype(np.uint8),"RGBA")
                paste(frame,layer,x,yv,alpha)
        # CTA group
        def cta_pop(im,key,cy,c=2.0,pulse=False,fade=False):
            lt=t-CTA[key]
            if lt<0: return
            if fade:
                paste(frame,im,(W-im.width)//2,cy-im.height//2+(1-ease_out(lt/.4))*24,ease_out(lt/.4)); return
            k=ease_back(lt/0.4,c); sc=max(0.05,0.4+0.6*k) if lt<0.4 else 1.0
            if pulse and lt>0.4: sc*=1+0.035*math.exp(-(t%B)/0.12)
            lay=im if abs(sc-1)<0.003 else im.resize((max(1,int(im.width*sc)),max(1,int(im.height*sc))),Image.LANCZOS)
            paste(frame,lay,(W-lay.width)//2,cy-lay.height//2,min(1,lt/0.12))
        if t>=CTA['text']:
            lt=t-CTA['text']; k=ease_back(lt/0.25,2.2); sc=1+0.8*(1-k) if lt<0.25 else 1+0.012*math.sin(lt*8)
            lay=CTA_T.resize((int(CTA_T.width*sc),int(CTA_T.height*sc)),Image.LANCZOS)
            paste(frame,lay,(W-lay.width)//2+int(10*math.exp(-lt/.2)*math.sin(lt*100)),560-lay.height//2,min(1,lt/0.06))
            cta_pop(CTA_S,'sub',700,fade=True)
            cta_pop(BTN,'btn',900,pulse=True)
            cta_pop(PHONE,'phone',1110,c=2.4,pulse=True)
            cta_pop(URLI,'url',1300,fade=True)
            shock(frame,W//2,1110,t-CTA['phone'],(205,255,60))
            shock(frame,W//2,560,t-CTA['text'],(255,255,255),0.5,900)
        shock(frame,W//2,300,t-DROP,(255,255,255),0.8,1500)
    # ---- post: camera punch + shake
    z=1+decay(PUNCH,t,0.11)+0.03*max(0,(t-DROP))/DUR*0
    dx=decay([(a,b) for a,b in SHAKE],t,0.13)*math.sin(t*97); dy=decay([(a,b) for a,b in SHAKE],t,0.13)*math.cos(t*83)
    if t<1.0 or True:
        # continuous tension shake in the pre-drop riser
        if RISER[0]<=t<3.86:
            q=((t-RISER[0])/(3.86-RISER[0]))**2; dx+=q*9*math.sin(t*140); dy+=q*9*math.cos(t*120); z+=0.05*q
    if z>1.002 or abs(dx)>0.5 or abs(dy)>0.5:
        cw,ch=W/z,H/z
        frame=frame.transform((W,H),Image.AFFINE,(1/z,0,(W-cw)/2-dx,0,1/z,(H-ch)/2-dy),resample=Image.BICUBIC)
    arr=np.asarray(frame)
    d=int(decay(CHROMA,t,0.1))
    if RISER[0]<=t<3.86: d=max(d,int(((t-RISER[0])/(3.86-RISER[0]))**3*8))
    if d>=1:
        arr=arr.copy(); arr[...,0]=np.roll(arr[...,0],d,axis=1); arr[...,2]=np.roll(arr[...,2],-d,axis=1)
    fl=np.zeros(3,np.float32); fa=0.0
    for ti,amp,tau,col in FLASH:
        if ti<=t<ti+1: 
            a=amp*math.exp(-(t-ti)/tau); fl+=np.array(col,np.float32)*a; fa+=a
    if fa>0.01:
        arr=np.clip(arr.astype(np.float32)*(1-min(1,fa))+fl,0,255).astype(np.uint8)
    # fade out
    if t>DUR-0.5 and LIMIT>=DUR-0.01: arr=(arr.astype(np.float32)*max(0,(DUR-t)/0.5)).astype(np.uint8)
    p.stdin.write(arr.tobytes())
p.stdin.close(); p.wait(); print("video ok")
