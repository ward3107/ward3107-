import math, subprocess, sys, random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from tl2 import *
SRC="assets/poster.png"
FB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"; FR="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FM="/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"; FMR="/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
W,H,FPS=1080,1920,30
src=Image.open(SRC).convert("RGB"); SW,SH=src.size; S=W/SW
_f={}
def F(p,s):
    k=(p,s)
    if k not in _f: _f[k]=ImageFont.truetype(p,s)
    return _f[k]
def ease_out(t): t=min(max(t,0),1); return 1-(1-t)**3
def ease_in(t): t=min(max(t,0),1); return t**3
def ease_back(t,c=1.7):
    t=min(max(t,0),1)-1; return 1+(c+1)*t**3+c*t**2
def clamp(x,a=0,b=1): return max(a,min(b,x))
def decay(ev,t,tau):
    s=0.0
    for ti,a in ev:
        if ti<=t<ti+1.2: s+=a*math.exp(-(t-ti)/tau)
    return s
# ---------- backgrounds
yy_,xx_=np.mgrid[0:H,0:W].astype(np.float32)
r=np.clip(np.sqrt(((xx_-W/2)/(W*0.75))**2+((yy_-H*0.45)/(H*0.7))**2),0,1)[...,None]
g=np.array([62,80,108],np.float32)*(1-r)+np.array([20,26,42],np.float32)*r
gl=np.exp(-(((xx_-W*0.3)/380)**2+((yy_-330)/300)**2))[...,None]*np.array([70,30,110],np.float32)
BG=np.clip(g+gl,0,255).astype(np.float32)
RED=np.clip(np.array([70,10,16],np.float32)*(1-0.7*r)+np.array([20,2,6],np.float32)*0.7*r,0,255)
# ---------- text helpers (Hebrew RTL via raqm)
def text_layer(text,size,fill,glow=None,maxw=980,rtl=True):
    kw=dict(direction="rtl",language="he") if rtl else {}
    f=ImageFont.truetype(FB,size,layout_engine=ImageFont.Layout.RAQM)
    while True:
        bb=f.getbbox(text,**kw); w=bb[2]-bb[0]
        if w<=maxw or size<30: break
        size-=4; f=ImageFont.truetype(FB,size,layout_engine=ImageFont.Layout.RAQM)
    pad=70; h=bb[3]-bb[1]; im=Image.new("RGBA",(w+2*pad,h+2*pad),(0,0,0,0)); sw=max(4,size//16)
    if glow:
        gm=Image.new("L",im.size,0); ImageDraw.Draw(gm).text((pad-bb[0],pad-bb[1]),text,font=f,fill=255,stroke_width=sw+4,**kw)
        gm=gm.filter(ImageFilter.GaussianBlur(size//5)); gl_=Image.new("RGBA",im.size,glow+(0,)); gl_.putalpha(gm.point(lambda v:min(255,int(v*1.4)))); im.alpha_composite(gl_)
    ImageDraw.Draw(im).text((pad-bb[0],pad-bb[1]),text,font=f,fill=fill,stroke_width=sw,stroke_fill=(10,8,20),**kw)
    return im
def paste(frame,im,x,y,alpha=1.0):
    a=im.split()[3]
    if alpha<1: a=a.point(lambda v:int(v*alpha))
    frame.paste(im.convert("RGB"),(int(x),int(y)),a)
WHITE_=(255,255,255); LIME=(205,255,60); PINK=(255,92,120)
CAP={}
def cap(key,text,color,glow,size=96):
    if key not in CAP: CAP[key]=text_layer(text,size,color,glow)
    return CAP[key]
def crop(box,kind,feather=14,radius=38,scale=1.0):
    x0,y0,x1,y1=box; im=src.crop(box).convert("RGBA")
    im=im.resize((round((x1-x0)*S*scale),round((y1-y0)*S*scale)),Image.LANCZOS); w,h=im.size
    m=Image.new("L",(w,h),0); d=ImageDraw.Draw(m)
    d.rectangle((feather,feather,w-feather,h-feather),fill=255); m=m.filter(ImageFilter.GaussianBlur(feather/2)); im.putalpha(m); return im
LOGO=crop((0,0,1122,312),"soft",feather=36,scale=1.0)
BTN_I=crop((150,1098,970,1198),"soft",scale=1.15); PHONE_I=crop((90,1196,1040,1335),"soft",scale=1.1)
URLI=text_layer("vasia.dev",74,WHITE_,(160,120,255),rtl=False)
# ---------- mock UI drawing
WX,WY,WW,WH=70,300,940,1000
def rr(d,box,rad,fill,outline=None,width=1): d.rounded_rectangle(box,radius=rad,fill=fill,outline=outline,width=width)
def sad_face(d,cx,cy,s,col=(120,128,140)):
    d.ellipse((cx-s,cy-s,cx+s,cy+s),outline=col,width=max(4,s//10))
    d.ellipse((cx-s*0.4-s*0.1,cy-s*0.3-s*0.1,cx-s*0.4+s*0.1,cy-s*0.3+s*0.1),fill=col); d.ellipse((cx+s*0.4-s*0.1,cy-s*0.3-s*0.1,cx+s*0.4+s*0.1,cy-s*0.3+s*0.1),fill=col)
    d.arc((cx-s*0.45,cy+s*0.15,cx+s*0.45,cy+s*0.75),200,340,fill=col,width=max(4,s//10))
def dialog(img,x,y,w,h,title,body,hdr=(220,38,38),rot=0,mono=True):
    lay=Image.new("RGBA",(w+40,h+40),(0,0,0,0)); d=ImageDraw.Draw(lay)
    sh=Image.new("RGBA",lay.size,(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((26,32,w+16,h+28),16,fill=(0,0,0,120)); sh=sh.filter(ImageFilter.GaussianBlur(10)); lay.alpha_composite(sh); d=ImageDraw.Draw(lay)
    rr(d,(20,20,w+20,h+20),14,(255,255,255,255),(180,180,190,255),2); d.rounded_rectangle((20,20,w+20,70),14,fill=hdr+(255,)); d.rectangle((20,50,w+20,70),fill=hdr+(255,))
    d.text((36,28),title,font=F(FB,26),fill=(255,255,255)); 
    yy=88
    for ln in body:
        d.text((38,yy),ln,font=F(FMR if mono else FR,22),fill=(60,60,70)); yy+=32
    rr(d,(w-120,h-34,w+6,h+8),8,(235,238,244,255),(170,170,180,255),2); d.text((w-82,h-28),"OK",font=F(FB,22),fill=(60,60,70))
    if rot: lay=lay.rotate(rot,expand=True,resample=Image.BICUBIC)
    img.alpha_composite(lay,(int(x-lay.width/2+w/2),int(y)))
def draw_site(t):
    """returns RGBA 940x1000 mock website window in current (clean/broken) state"""
    img=Image.new("RGBA",(WW,WH),(246,248,252,255)); d=ImageDraw.Draw(img)
    broken=PUBLISH<=t<SWEEP[3]+0.2 or False
    # fixed progress after drop
    fixed_pop=t>=SWEEP[0]; fixed_white=t>=SWEEP[1]; fixed_layout=t>=SWEEP[2]; fixed_form=t>=SWEEP[3]
    in_break=lambda tb: (t>=tb)
    # title bar
    d.rectangle((0,0,WW,64),fill=(228,232,242)); 
    for i,c in enumerate(((255,95,86),(255,189,46),(39,201,63))): d.ellipse((22+i*28,22,40+i*28,40),fill=c)
    rr(d,(130,12,WW-90,52),20,(255,255,255),(200,205,215),2); d.text((158,19),"myshop.ai-built.app",font=F(FR,24),fill=(90,98,115))
    def pop_a(tp): return ease_out((t-tp)/0.35) if t>=tp else 0
    def layer_draw(fn,tp,dy=40):
        a=pop_a(tp)
        if a<=0: return
        lay=Image.new("RGBA",(WW,WH),(0,0,0,0)); fn(ImageDraw.Draw(lay),lay); 
        al=lay.split()[3].point(lambda v:int(v*a)); lay.putalpha(al)
        img.alpha_composite(lay,(0,int((1-ease_out((t-tp)/0.35))*dy)))
    bad_nav=in_break(CLICK) and not fixed_layout
    bad_img=in_break(BROKEN_IMG) and not fixed_layout
    bad_cards=in_break(COLLAPSE) and not fixed_layout
    form_fail=in_break(FORM) and not fixed_form
    pay_fail=in_break(PAY) and not fixed_form
    def nav(dd,lay):
        ox=int(30*math.sin(t*9)*clamp((t-CLICK)/0.6)) if bad_nav else 0; oy=int(14*clamp((t-CLICK)/0.6)) if bad_nav else 0
        dd.rectangle((0,64,WW,134),fill=(255,255,255)); dd.ellipse((30+ox,84+oy,66+ox,120+oy),fill=(99,102,241)); dd.text((78+ox,88+oy),"MyShop",font=F(FB,32),fill=(30,34,60))
        for i,l in enumerate(("Home","About","Shop")): dd.text((470+i*100-ox*2,92+oy),l,font=F(FR,26),fill=(90,98,115))
        rr(dd,(WW-190+ox,84+oy,WW-30+ox,122+oy),19,(99,102,241)); dd.text((WW-168+ox,90+oy),"Contact",font=F(FB,22),fill=(255,255,255))
    def hero(dd,lay):
        dd.text((40,170),"Your Business,",font=F(FB,56),fill=(30,34,60)); dd.text((40,236),"Online.",font=F(FB,56),fill=(99,102,241))
        dd.text((40,320),"Fast. Modern. Built with AI.",font=F(FR,28),fill=(100,108,125))
        rr(dd,(40,380,290,440),30,(34,197,94)); dd.text((76,392),"Get Started",font=F(FB,28),fill=(255,255,255))
    def himg(dd,lay):
        x0,y0,x1,y1=560,160,WW-40,460
        if bad_img:
            rr(dd,(x0,y0,x1,y1),22,(225,228,236),(200,60,60),4); dd.line((x0+40,y0+40,x1-40,y1-40),fill=(200,60,60),width=8); dd.line((x1-40,y0+40,x0+40,y1-40),fill=(200,60,60),width=8)
            dd.text((x0+20,y1-34),"img_hero.png  (404)",font=F(FMR,20),fill=(160,40,40))
        else:
            rr(dd,(x0,y0,x1,y1),22,(129,140,248)); dd.ellipse((x1-150,y0+40,x1-70,y0+120),fill=(253,224,71)); dd.polygon([(x0,y1),(x0+140,y0+170),(x0+260,y1)],fill=(79,70,229)); dd.polygon([(x0+160,y1),(x0+300,y0+120),(x1,y1)],fill=(99,102,241))
    def cards(dd,lay):
        for i in range(3):
            cx=40+i*300; cy=500
            if bad_cards:
                k=clamp((t-COLLAPSE)/0.5); cx-=int(i*130*k); cy+=int((i*38-20)*k)
            c=Image.new("RGBA",(270,190),(0,0,0,0)); cd=ImageDraw.Draw(c); rr(cd,(0,0,269,189),18,(255,255,255,255),(220,224,235,255),2)
            cd.ellipse((22,22,70,70),fill=[(99,102,241),(34,197,94),(244,114,182)][i]+(255,)); cd.rectangle((22,90,200,104),fill=(210,214,226)); cd.rectangle((22,118,150,130),fill=(228,231,240)); cd.rectangle((22,146,180,158),fill=(228,231,240))
            if bad_cards: c=c.rotate((i-1)*10*clamp((t-COLLAPSE)/0.5),expand=True,resample=Image.BICUBIC)
            lay.alpha_composite(c,(cx,cy))
    def form(dd,lay):
        rr(dd,(40,730,WW-40,960),20,(255,255,255),(220,224,235),2); dd.text((64,750),"Contact us",font=F(FB,30),fill=(30,34,60))
        rr(dd,(64,800,460,850),10,(240,243,249),(210,215,228),2); dd.text((80,812),"Your email",font=F(FR,24),fill=(150,156,170))
        rr(dd,(64,872,230,930),12,(220,38,38) if form_fail else (99,102,241)); dd.text((92,884),"Send",font=F(FB,26),fill=(255,255,255))
        rr(dd,(260,872,470,930),12,(220,38,38) if pay_fail else (245,158,11)); dd.text((288,884),"Pay now",font=F(FB,26),fill=(255,255,255))
        if form_fail: dd.text((490,810),"x Failed to submit",font=F(FB,26),fill=(220,38,38))
        if pay_fail: dd.text((490,884),"x Payment failed",font=F(FB,26),fill=(220,38,38))
    layer_draw(nav,POP[0],20); layer_draw(hero,POP[1]); layer_draw(himg,POP[2],0); layer_draw(cards,POP[3]); layer_draw(form,POP[4])
    # live badge
    if LIVE<=t<PUBLISH+0.8 or (t>=SWEEP[3] and t<DONE+3):
        a=ease_back((t-(LIVE if t<PUBLISH+1 else SWEEP[3]))/0.4); 
        if a>0:
            rr(d,(WW-250,980-60,WW-30,980-10) if False else (WW-260,950,WW-30,994),22,(34,197,94)); d.text((WW-240,956),"Live",font=F(FB,26),fill=(255,255,255)); d.line((WW-150,972,WW-140,983),fill=(255,255,255),width=5); d.line((WW-140,983,WW-122,962),fill=(255,255,255),width=5)
    # white-out + spinner
    if WHITE<=t<SWEEP[1]:
        a=clamp((t-WHITE)/0.25); ov=Image.new("RGBA",(WW,WH),(250,250,252,int(255*a))); img.alpha_composite(ov)
        dd=ImageDraw.Draw(img); cx,cy=WW//2,WH//2-60
        if t-WHITE<0.9:
            for i in range(10):
                ang=t*8+i*0.63; x=cx+int(60*math.cos(ang)); y=cy+int(60*math.sin(ang)); c=int(220-i*18); dd.ellipse((x-9,y-9,x+9,y+9),fill=(c,c,c))
            dd.text((cx-70,cy+100),"Loading...",font=F(FB,32),fill=(120,128,140))
        else:
            sad_face(dd,cx,cy-20,90); dd.text((cx-250,cy+130),"This site can't be reached",font=F(FB,36),fill=(60,66,80)); dd.text((cx-250,cy+185),"ERR_CONNECTION_TIMED_OUT",font=F(FMR,26),fill=(150,60,60))
    # console
    if CONSOLE<=t<SWEEP[0]:
        k=ease_out((t-CONSOLE)/0.25); h=int(250*k); y0=WH-h
        d=ImageDraw.Draw(img); d.rectangle((0,y0,WW,WH),fill=(26,26,32)); d.text((16,y0+8),"Console",font=F(FB,20),fill=(160,160,170))
        lines=["Uncaught TypeError: Cannot read properties of undefined","    at render (app.js:1042)","Failed to load resource: 500 (Internal Server Error)","CORS policy: No 'Access-Control-Allow-Origin'","Uncaught (in promise) Error: Network Error","Warning: Each child in a list needs a unique key"]
        n=int((t-CONSOLE)/0.1)+1
        for i,l in enumerate(lines[:n]): d.text((16,y0+38+i*34),("x " if i%2==0 else "! ")+l,font=F(FMR,20),fill=(255,110,110) if i%2==0 else (255,200,90))
    # dialogs
    if ERR500<=t<SWEEP[0] and t<WHITE+3:
        k=ease_back((t-ERR500)/0.25,2.0); sc=0.6+0.4*k
        dialog(img,WW//2-300,300,600,250,"500 - Internal Server Error",["The server encountered an error","and could not complete your","request. (app/deploy.js:88)"],rot=-2)
    if PAY+0.3<=t<SWEEP[0]:
        dialog(img,WW//2-260+60,560,560,200,"Payment failed",["Card declined / gateway error","code: 402  PAYMENT_REQUIRED"],hdr=(180,30,60),rot=3)
    if STACK<=t<SWEEP[0]:
        names=[("Build failed",["npm ERR! code ELIFECYCLE"]),("404 Not Found",["/api/contact  not found"]),("Deploy failed",["exit code 1"]),("Database error",["ECONNREFUSED 5432"]),("SSL certificate invalid",["NET::ERR_CERT_AUTHORITY"]),("Timeout",["Request timed out (30s)"]),("Warning",["Mobile layout broken"]),("Server error",["502 Bad Gateway"])]
        for i,(tt,bd) in enumerate(names):
            ts=STACK+i*0.1
            if t<ts: continue
            rnd=random.Random(i*7+3); x=rnd.randint(80,WW-460); y=rnd.randint(120,WH-300)
            k=ease_back((t-ts)/0.2,2.0); 
            dialog(img,x-300+230,y,460,150,tt,bd,rot=rnd.randint(-6,6),mono=True)
    # cracks in the glass
    if ERR500+0.2<=t<SWEEP[2]+0.35:
        g=clamp((t-ERR500-0.2)/1.4)+(0.5 if t>=STACK else 0)+(0.4 if t>=WHITE else 0)
        fade=1.0 if t<SWEEP[2] else clamp(1-(t-SWEEP[2])/0.35)
        cl=Image.new("RGBA",(WW,WH),(0,0,0,0)); cd=ImageDraw.Draw(cl); rr_=random.Random(11)
        ox,oy=int(WW*0.62),330
        for ray in range(11):
            ang=ray/11*2*math.pi+rr_.uniform(-.2,.2); px,py=ox,oy; length=rr_.uniform(260,640)*min(1.4,g)
            pts=[(px,py)]; steps=6
            for k in range(steps):
                step=length/steps; ang+=rr_.uniform(-.35,.35); px+=math.cos(ang)*step; py+=math.sin(ang)*step; pts.append((px,py))
                if k==2 and ray%2==0:
                    bx,by=px,py; ba=ang+rr_.uniform(.5,1.0)*(1 if ray%4 else -1)
                    cd.line([(bx,by),(bx+math.cos(ba)*step*1.6,by+math.sin(ba)*step*1.6)],fill=(255,255,255,int(200*fade)),width=2)
            cd.line(pts,fill=(20,20,30,int(150*fade)),width=6); cd.line(pts,fill=(255,255,255,int(235*fade)),width=3)
        cd.ellipse((ox-9,oy-9,ox+9,oy+9),fill=(255,255,255,int(255*fade)))
        img.alpha_composite(cl)
    # glitch slices
    gb=max([clamp(1-(t-e)/0.35) for e in (CLICK,BROKEN_IMG,ERR500,COLLAPSE,FORM,PAY,WHITE,STACK) if 0<=t-e<0.35]+[0])
    if t>=STACK and t<SWEEP[0]: gb=max(gb,0.5)
    if gb>0:
        rnd=random.Random(int(t*30))
        for _ in range(int(3+9*gb)):
            y=rnd.randint(70,WH-60); h=rnd.randint(10,50); dx=rnd.randint(-int(70*gb),int(70*gb)); strip=img.crop((0,y,WW,y+h)); img.paste(strip,(dx,y))
    if SWEEP[3]<=t<SWEEP[3]+0.8:
        u=(t-SWEEP[3])/0.8; ov=np.zeros((WH,WW,4),np.float32); xs=np.arange(WW)[None,:]/WW; ys=np.arange(WH)[:,None]/WH
        dd_=(xs+ys*0.5)-(-0.3+u*1.9); ov[...,:3]=255; ov[...,3]=np.exp(-(dd_/0.08)**2)*150
        img.alpha_composite(Image.fromarray(ov.astype(np.uint8),"RGBA"))
    return img
def draw_chat(w,h,t,big=False):
    img=Image.new("RGBA",(w,h),(24,28,44,255)); d=ImageDraw.Draw(img)
    hh=56 if big else 40; d.rectangle((0,0,w,hh),fill=(36,42,66)); d.ellipse((18,hh//2-10,38,hh//2+10),fill=(129,140,248)); d.text((50,hh//2-14),"AI Website Builder",font=F(FB,26 if big else 22),fill=(230,234,250))
    def bubble(x,y,txt,user,col=None,fs=24,maxw=None):
        f=F(FB if user else FR,fs); bb=f.getbbox(txt); tw=bb[2]-bb[0]; th=fs+16
        bw=tw+36; 
        bx=(w-bw-24) if user else 24
        rr(d,(bx,y,bx+bw,y+th+12),18,col or ((99,102,241) if user else (46,52,80))); d.text((bx+18,y+8),txt,font=f,fill=(255,255,255)); return y+th+26
    if not big:
        y=50
        # typed prompt
        prompt="Build me a website for my business"
        n=int(clamp((t-0.5)/1.1)*len(prompt)) if t<PUBLISH else len(prompt)
        if n>0: y=bubble(0,y,prompt[:n],True,fs=20)
        if t>=1.7:
            if t<2.6: y=bubble(0,y,"Generating"+"."*(1+int(t*4)%3),False,fs=20)
            elif t<PUBLISH+1.6: y=bubble(0,y,"Your website is ready!",False,col=(22,120,70),fs=20)
            else: y=bubble(0,y,"Error: deployment failed",False,col=(160,30,40),fs=20)
    else:
        msgs=[]
        for i,lt in enumerate(LOOPS):
            if t>=lt-0.2: msgs.append(("u","Fix it!!"+("!"*i)))
            if t>=lt+0.15: msgs.append(("a","Sorry! Here's a fix:"))
            if t>=lt+0.35: msgs.append(("e","x Error: Build failed ("+str(i+2)+")"))
        y=76; vis=msgs[-8:]; 
        for kind,txt in vis:
            if kind=="u": y=bubble(0,y,txt,True,fs=34)
            elif kind=="a": y=bubble(0,y,txt,False,fs=30)
            else: y=bubble(0,y,txt,False,col=(160,30,40),fs=28)
    return img
