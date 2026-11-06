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
CHECKS=["טפסים שעובדים","תשלומים תקינים","אתר מהיר ויציב","אבטחה וחיבורים"]
CHK=[text_layer(c,58,WHITE_,None,maxw=560) for c in CHECKS]
LBL=text_layer("רמת לחץ",48,WHITE_,None,maxw=420)
VIG=(1-0.38*np.clip(r**2.2,0,1)).astype(np.float32)
# ---------- 3D pose / perspective
def find_coeffs(dst,src):
    A=[];Bv=[]
    for (x,y),(X,Y) in zip(dst,src):
        A.append([x,y,1,0,0,0,-X*x,-X*y]); Bv.append(X); A.append([0,0,0,x,y,1,-Y*x,-Y*y]); Bv.append(Y)
    return np.linalg.solve(np.array(A,np.float64),np.array(Bv,np.float64)).tolist()
def project(w,h,cx,cy,yaw,pitch,roll,scale,f=1500):
    out=[]; cyw,syw=math.cos(yaw),math.sin(yaw); cp,sp=math.cos(pitch),math.sin(pitch); cr,sr=math.cos(roll),math.sin(roll)
    for x,y in ((-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)):
        x*=scale; y*=scale; x1=x*cyw; z1=-x*syw; y1=y*cp-z1*sp; z2=y*sp+z1*cp; x2=x1*cr-y1*sr; y2=x1*sr+y1*cr; k=f/(f+z2); out.append((cx+x2*k,cy+y2*k))
    return out
CXW,CYW=540,745
def win_pose(t):
    d=math.radians; yaw=d(7*math.sin(t*0.9)); pitch=d(4*math.cos(t*0.7)); roll=0.0; sc=1.0; cy=CYW; al=1.0
    u=(t-(POP[0]-0.4))/0.7
    yaw+=d(40*(1-ease_out(u))); sc*=0.6+0.4*ease_back(u,1.3); al=clamp(u*1.6)
    if PUBLISH<=t<CUT3:
        q=clamp((t-PUBLISH)/5.8); roll+=d(1.8*q*math.sin(t*23)+3.2*q*math.sin(t*3.1)); yaw+=d(6*q*math.sin(t*17)); pitch+=d(3*q*math.cos(t*13))
    for ti,a in ((CLICK,5),(ERR500,16),(COLLAPSE,12),(FORM,9),(PAY,9),(WHITE,14),(STACK,24)):
        dd=decay([(ti,1)],t,0.2)
        if dd>0: yaw+=d(a*dd*math.sin((t-ti)*28)); pitch+=d(a*0.6*dd*math.cos((t-ti)*22)); roll+=d(a*0.35*dd*math.sin((t-ti)*31))
    if CUT3<=t<CUT3+0.5:
        k=ease_in((t-CUT3)/0.5); cy+=int(1300*k); roll+=d(28*k); yaw+=d(50*k); al*=1-k*0.5
    if t>=DROP:
        u2=clamp((t-DROP)/0.7); yaw+=d(34*(1-ease_out(u2))); sc*=1+0.14*(1-ease_out(u2)); al=clamp((t-DROP)/0.12)
    if t>=BTN-0.6:
        k=ease_in((t-(BTN-0.6))/0.5); sc*=1-0.3*k; cy+=int(280*k); yaw+=d(70*k); al*=1-k
    return yaw,pitch,roll,sc,cy,al
# ---------- ambient particles / code rain
prng=np.random.default_rng(5); NP=70
PX=prng.uniform(0,W,NP); PY=prng.uniform(0,H,NP); PS=prng.uniform(0.5,1.6,NP); PR=prng.uniform(4,24,NP); PA=prng.uniform(40,110,NP); PPH=prng.uniform(0,6.28,NP)
def lerp3(a,b,k): return tuple(int(a[i]+(b[i]-a[i])*k) for i in range(3))
def ambience(frame,t):
    calm=(150,140,255); red=(255,70,60); green=(120,255,170)
    if t<PUBLISH: col=calm; sp=18
    elif t<SWEEP[0]: k=clamp((t-PUBLISH)/1.2); col=lerp3(calm,red,k); sp=18+110*k
    else: k=clamp((t-SWEEP[0])/0.8); col=lerp3(red,green,k); sp=130-80*k
    ov=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
    for i in range(NP):
        y=(PY[i]-sp*PS[i]*t)%(H+60)-30; x=PX[i]+18*math.sin(t*0.7+PPH[i]); a=int(PA[i]*(0.6+0.4*math.sin(t*2+PPH[i])))
        d.ellipse((x-PR[i],y-PR[i],x+PR[i],y+PR[i]),fill=col+(a,))
    ov=ov.filter(ImageFilter.GaussianBlur(2.2)); frame.paste(ov.convert("RGB"),(0,0),ov.split()[3])
    if PUBLISH+0.4<=t<SWEEP[0]:
        k=clamp((t-PUBLISH-0.4)/1.0)*(1.0 if t<SWEEP[0]-0.3 else clamp((SWEEP[0]-t)/0.3)); ov=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
        words=["ERR","500","null","undefined","NaN","404","Error","fail","502","FATAL","timeout","x"]
        for c in range(14):
            cx=30+c*77; speed=240+(c*53)%180; off=(c*371)%H
            for j in range(9):
                y=((t*speed+off-j*54)%(H+60))-30; a=int(120*k*(1-j/9)); d.text((cx,y),words[(c*3+j)%len(words)],font=F(FMR,22),fill=(255,90,90,a))
        frame.paste(ov.convert("RGB"),(0,0),ov.split()[3])
# ---------- mood face + meter
def face(D,s,t,happy):
    Sx=4; N=D*Sx; im=Image.new("RGBA",(N,N),(0,0,0,0)); d=ImageDraw.Draw(im); cx=cy=N//2; R=int(N*0.40)
    base=(255,214,170); hot=(255,92,76); k=clamp((s-0.45)/0.55); skin=lerp3(base,hot,k)
    d.ellipse((cx-R,cy-R,cx+R,cy+R),fill=skin+(255,),outline=(40,30,40,255),width=int(N*0.018))
    ex=int(N*0.15); ey=int(-N*0.04); rx=int(N*0.075); ry=int(N*0.095)
    if happy:
        for sgn in (-1,1):
            x=cx+sgn*ex; d.arc((x-rx,cy+ey-ry//2,x+rx,cy+ey+ry),200,340,fill=(40,30,40,255),width=int(N*0.022))
        d.ellipse((cx-int(N*0.27),cy+int(N*0.06),cx-int(N*0.17),cy+int(N*0.12)),fill=(255,130,150,170)); d.ellipse((cx+int(N*0.17),cy+int(N*0.06),cx+int(N*0.27),cy+int(N*0.12)),fill=(255,130,150,170))
        d.arc((cx-int(N*0.16),cy+int(N*0.04),cx+int(N*0.16),cy+int(N*0.26)),15,165,fill=(40,30,40,255),width=int(N*0.026))
    else:
        for sgn in (-1,1):
            x=cx+sgn*ex; d.ellipse((x-rx,cy+ey-ry,x+rx,cy+ey+ry),fill=(255,255,255,255),outline=(40,30,40,255),width=int(N*0.01))
            px=x-sgn*int(rx*0.3*k); d.ellipse((px-int(rx*0.4),cy+ey-int(ry*0.35),px+int(rx*0.4),cy+ey+int(ry*0.45)),fill=(30,20,30,255))
            tilt=int(N*0.075*k)+int(N*0.01*(s>0.3)); by=cy+ey-ry-int(N*0.04)
            d.line((x-sgn*int(N*0.06)-sgn*0,by+(-tilt if sgn==1 else tilt)*0+ (tilt if True else 0)*0, x+sgn*int(N*0.07),by-0),fill=(40,30,40,255),width=1)
            d.line((x+sgn*(-int(N*0.07)), by+ (-tilt if False else 0) + (tilt*(-1 if sgn==-1 else 1) if False else 0), x+sgn*int(N*0.07), by+(0)),fill=(40,30,40,0),width=1)
            ix=x-sgn*int(N*0.08); ox_=x+sgn*int(N*0.08)
            d.line((ox_,by-int(N*0.0),ix,by+tilt),fill=(40,30,40,255),width=int(N*0.022))
        my=cy+int(N*0.20)
        if s<0.3: d.arc((cx-int(N*0.14),my-int(N*0.10),cx+int(N*0.14),my+int(N*0.08)),20,160,fill=(40,30,40,255),width=int(N*0.022))
        elif s<0.6: d.line((cx-int(N*0.11),my,cx+int(N*0.11),my+int(N*0.01*math.sin(t*20))),fill=(40,30,40,255),width=int(N*0.022))
        elif s<0.9: d.arc((cx-int(N*0.14),my-int(N*0.02),cx+int(N*0.14),my+int(N*0.14)),200,340,fill=(40,30,40,255),width=int(N*0.022))
        else:
            d.ellipse((cx-int(N*0.13),my-int(N*0.02),cx+int(N*0.13),my+int(N*0.12)),fill=(70,10,20,255),outline=(40,30,40,255),width=int(N*0.015)); d.rectangle((cx-int(N*0.10),my-int(N*0.01),cx+int(N*0.10),my+int(N*0.025)),fill=(255,255,255,255))
        if 0.4<s<0.9:
            dy_=int(((t*1.3)%1.0)*N*0.12); x=cx+int(N*0.30); y=cy-int(N*0.20)+dy_
            d.polygon([(x,y-int(N*0.06)),(x-int(N*0.03),y+int(N*0.01)),(x+int(N*0.03),y+int(N*0.01))],fill=(90,170,255,220)); d.ellipse((x-int(N*0.035),y-int(N*0.005),x+int(N*0.035),y+int(N*0.06)),fill=(90,170,255,220))
        if s>=0.88:
            for j in range(3):
                u=((t*1.4+j*0.33)%1.0); x=cx+int((j-1)*N*0.16)+int(10*math.sin(t*9+j)); y=cy-R-int(u*N*0.16); rr_=int(N*0.05*(1-0.4*u)); a=int(220*(1-u))
                d.ellipse((x-rr_,y-rr_,x+rr_,y+rr_),fill=(255,255,255,a))
    return im.resize((D,D),Image.LANCZOS)
STRESS=[(0,0.05),(PUBLISH,0.08),(CLICK,0.2),(ERR500,0.45),(FORM,0.6),(PAY,0.7),(WHITE,0.82),(STACK,0.95),(LOOPS[0],1.0),(DROP,1.0),(SWEEP[0],0.62),(SWEEP[1],0.38),(SWEEP[2],0.16),(SWEEP[3],0.04),(DUR,0.0)]
def stress(t): return float(np.interp(t,[a for a,_ in STRESS],[b for _,b in STRESS]))
def mood_band(frame,t,alpha=1.0,shake=0.0):
    if alpha<=0.01: return
    s=stress(t); bx0,bx1,by0,by1=372,708,1592,1632
    ov=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov); d.rounded_rectangle((bx0,by0,bx1,by1),20,fill=(10,12,24,210),outline=(255,255,255,100),width=3)
    fw=int((bx1-bx0-12)*max(0.03,s))
    for xx in range(fw):
        u=xx/max(1,(bx1-bx0-12)); col=lerp3((34,197,94),(250,204,21),clamp(u*2)) if u<0.5 else lerp3((250,204,21),(239,68,68),clamp((u-0.5)*2))
        d.line((bx0+6+xx,by0+6,bx0+6+xx,by1-6),fill=col+(255,))
    d.rounded_rectangle((bx0,by0,bx1,by1),20,outline=(255,255,255,130),width=3)
    frame.paste(ov.convert("RGB"),(0,0),ov.split()[3].point(lambda v:int(v*alpha)))
    lb=LBL.resize((int(LBL.width*0.55),int(LBL.height*0.55)),Image.LANCZOS); paste(frame,lb,(bx0+bx1)//2-lb.width//2,by0-lb.height+30,alpha)
# ---------- bursts / rings
BURSTS=[(ts,540,720,26,i+1) for i,ts in enumerate(SWEEP)]+[(tc,880,1500,20,20+i) for i,tc in enumerate(CHECK)]+[(DONE,540,700,60,99),(PHONE,540,1110,40,77)]
def bursts(frame,t):
    ov=None
    for t0,cx,cy,n,seed in BURSTS:
        lt=t-t0
        if not (0<=lt<1.4): continue
        if ov is None: ov=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
        rr_=random.Random(seed)
        for i in range(n):
            ang=rr_.uniform(0,2*math.pi); sp=rr_.uniform(250,900); col=rr_.choice([(205,255,60),(255,255,255),(160,120,255),(120,255,170),(255,215,90)]); sz=rr_.uniform(5,13)
            x=cx+math.cos(ang)*sp*lt; y=cy+math.sin(ang)*sp*lt+0.5*900*lt*lt; a=int(255*(1-clamp((lt-0.7)/0.7)))
            d.rectangle((x-sz/2,y-sz/2,x+sz/2,y+sz/2),fill=col+(a,)) if i%2 else d.ellipse((x-sz/2,y-sz/2,x+sz/2,y+sz/2),fill=col+(a,))
    if ov is not None: frame.paste(ov.convert("RGB"),(0,0),ov.split()[3])
def ring(frame,cx,cy,lt,color=(255,255,255),dur=0.8,maxr=1300):
    if not (0<=lt<dur): return
    k=ease_out(lt/dur); rad=maxr*k; a=int(210*(1-k)); ov=Image.new("L",(W,H),0); ImageDraw.Draw(ov).ellipse((cx-rad,cy-rad,cx+rad,cy+rad),outline=a,width=int(26*(1-k)+3)); ov=ov.filter(ImageFilter.GaussianBlur(2))
    frame.paste(Image.new("RGB",(W,H),color),(0,0),ov)

SK=(255,214,170)
def _thick(d,p0,p1,w,col):
    d.line([p0,p1],fill=col,width=w); r=w//2
    for p in (p0,p1): d.ellipse((p[0]-r,p[1]-r,p[0]+r,p[1]+r),fill=col)
def owner_sprite(t):
    s=stress(t); happy=t>=SWEEP[3]; S=2; Wc,Hc=330*S,300*S; im=Image.new("RGBA",(Wc,Hc),(0,0,0,0)); d=ImageDraw.Draw(im); cx=Wc//2
    shirt=(66,133,244); hair=(52,36,30)
    mode="cheer" if happy else "calm" if s<0.28 else "worry" if s<0.62 else "cheeks" if s<0.93 else "angry"
    bob=int(7*math.sin(t*3)) if mode!="angry" else int(7*math.sin(t*45))
    if mode=="cheer": bob=-abs(int(22*math.sin(t*7)))
    d.rounded_rectangle((cx-230,360+bob,cx+230,Hc+90),70,fill=shirt)
    d.polygon([(cx-60,360+bob),(cx,440+bob),(cx+60,360+bob)],fill=(235,240,252)); d.rectangle((cx-38,300+bob,cx+38,375+bob),fill=SK)
    shL=(cx-195,440+bob); shR=(cx+195,440+bob)
    if mode=="cheer": a=int(28*math.sin(t*9)); hL=(cx-290,70+bob+a); hR=(cx+290,70+bob-a)
    elif mode=="calm": hL=(cx-250,300+bob); hR=(cx+250,300+bob)
    elif mode=="worry": hL=(cx-105,340+bob); hR=(cx+105,340+bob)
    elif mode=="cheeks": w_=int(9*math.sin(t*14)); hL=(cx-150,250+bob+w_); hR=(cx+150,250+bob-w_)
    else: j=int(16*math.sin(t*38)); hL=(cx-275+j,120+bob); hR=(cx+275-j,120+bob+j)
    d.ellipse((cx-138,60+bob,cx+138,255+bob),fill=hair)
    fc=face(300,s,t,happy); im.alpha_composite(fc,(cx-150,70+bob))
    for sh,hh in ((shL,hL),(shR,hR)):
        _thick(d,sh,hh,64,shirt); d.ellipse((hh[0]-44,hh[1]-44,hh[0]+44,hh[1]+44),fill=SK,outline=(40,30,40),width=4)
    if mode=="angry":
        for (x,y) in ((cx+150,70+bob),(cx-170,90+bob)):
            d.line((x-22,y-22,x+22,y+22),fill=(220,30,30),width=10); d.line((x-22,y+22,x+22,y-22),fill=(220,30,30),width=10)
    return im.resize((330,300),Image.LANCZOS)
def robot_sprite(t,state):
    S=2; Wc,Hc=330*S,300*S; im=Image.new("RGBA",(Wc,Hc),(0,0,0,0)); d=ImageDraw.Draw(im); cx=Wc//2; bob=int(6*math.sin(t*3)); body=(104,120,168); dark=(22,26,46)
    d.rounded_rectangle((cx-190,410+bob,cx+190,Hc+60),50,fill=body); d.rounded_rectangle((cx-70,430+bob,cx+70,510+bob),16,fill=(70,82,120))
    d.ellipse((cx-18,452+bob,cx+18,488+bob),fill=(34,197,94) if state=="ok" else (250,204,21)); d.rectangle((cx-30,350+bob,cx+30,420+bob),fill=(70,82,120))
    if state=="sorry":
        for sgn in (-1,1): _thick(d,(cx+sgn*170,450+bob),(cx+sgn*250,330+bob),46,body); d.ellipse((cx+sgn*250-34,330+bob-34,cx+sgn*250+34,330+bob+34),fill=(150,164,210))
    d.rounded_rectangle((cx-210,60+bob,cx+210,370+bob),70,fill=(130,146,198),outline=(60,70,110),width=8); d.rounded_rectangle((cx-170,100+bob,cx+170,330+bob),46,fill=dark)
    d.line((cx,60+bob,cx,12+bob),fill=(60,70,110),width=10); blink=int(t*4)%2
    d.ellipse((cx-18,-6+bob,cx+18,30+bob),fill=(34,197,94) if state=="ok" else ((239,68,68) if blink else (120,20,20)))
    ey=205+bob; ex=72
    if state=="ok":
        c=(80,230,255)
        for sgn in (-1,1): d.arc((cx+sgn*ex-36,ey-36,cx+sgn*ex+36,ey+36),200,340,fill=c,width=15)
        d.arc((cx-62,ey+22,cx+62,ey+96),20,160,fill=c,width=13)
    elif state=="error":
        c=(255,70,70)
        for sgn in (-1,1):
            x=cx+sgn*ex; d.line((x-30,ey-30,x+30,ey+30),fill=c,width=15); d.line((x-30,ey+30,x+30,ey-30),fill=c,width=15)
        pts=[(cx-70+i*28,ey+78+(14 if i%2 else -14)) for i in range(6)]; d.line(pts,fill=c,width=12)
        rr_=random.Random(int(t*12))
        for _ in range(4):
            x=cx+rr_.randint(-230,230); y=60+rr_.randint(-40,140)+bob; d.line((x,y,x+rr_.randint(-40,40),y+rr_.randint(-40,40)),fill=(255,230,90),width=7)
    else:
        c=(250,204,21)
        for sgn in (-1,1): d.ellipse((cx+sgn*ex-14,ey-14,cx+sgn*ex+14,ey+14),fill=c)
        pts=[(cx-70+i*20,ey+84+(8 if i%2 else -8)) for i in range(8)]; d.line(pts,fill=c,width=11)
        d.polygon([(cx+150,150+bob),(cx+134,196+bob),(cx+166,196+bob)],fill=(90,170,255))
    return im.resize((330,300),Image.LANCZOS)
def pro_sprite(t,thumbs):
    S=2; Wc,Hc=330*S,300*S; im=Image.new("RGBA",(Wc,Hc),(0,0,0,0)); d=ImageDraw.Draw(im); cx=Wc//2; bob=int(5*math.sin(t*3.4)); hood=(99,102,241)
    d.rounded_rectangle((cx-235,350+bob,cx+235,Hc+90),70,fill=hood); d.ellipse((cx-125,320+bob,cx+125,430+bob),fill=(79,70,229))
    d.line((cx-30,390+bob,cx-34,470+bob),fill=(235,238,255),width=7); d.line((cx+30,390+bob,cx+34,470+bob),fill=(235,238,255),width=7)
    fc=face(300,0.04,t,False); im.alpha_composite(fc,(cx-150,70+bob))
    for sgn in (-1,1):
        x=cx+sgn*72; d.rounded_rectangle((x-58,160+bob,x+58,225+bob),24,fill=(18,18,28)); d.line((x-34,172+bob,x-8,196+bob),fill=(130,140,180),width=6)
    d.line((cx-14,185+bob,cx+14,185+bob),fill=(18,18,28),width=9)
    d.chord((cx-145,20+bob,cx+145,230+bob),180,360,fill=LIME); d.rounded_rectangle((cx-148,128+bob,cx+148,172+bob),18,fill=(150,205,20))
    for sgn in (-1,1): d.ellipse((cx+sgn*158-26,190+bob,cx+sgn*158+26,285+bob),fill=(60,50,170))
    d.arc((cx-158,70+bob,cx+158,300+bob),200,340,fill=(60,50,170),width=12)
    ty=int(14*math.sin(t*22))
    if thumbs:
        _thick(d,(cx+200,440+bob),(cx+300,250+bob),62,hood); d.ellipse((cx+300-44,250+bob-44,cx+300+44,250+bob+44),fill=SK,outline=(40,30,40),width=4); d.rounded_rectangle((cx+288,170+bob,cx+322,240+bob),16,fill=SK,outline=(40,30,40),width=3)
        d.ellipse((cx-150-40,460+bob+ty-40,cx-150+40,460+bob+ty+40),fill=SK,outline=(40,30,40),width=4)
    else:
        for sgn,off in ((-1,ty),(1,-ty)): d.ellipse((cx+sgn*150-40,455+bob+off-40,cx+sgn*150+40,455+bob+off+40),fill=SK,outline=(40,30,40),width=4)
    d.rounded_rectangle((cx-205,470+bob,cx+205,Hc+40),24,fill=(188,194,212),outline=(120,126,146),width=6)
    g=Image.new("RGBA",(300,300),(0,0,0,0)); gd=ImageDraw.Draw(g); gd.ellipse((60,60,240,240),fill=LIME+(120,)); g=g.filter(ImageFilter.GaussianBlur(26)); im.alpha_composite(g,(cx-150,Hc-310))
    d.text((cx-40,Hc-195),"V",font=F(FB,110),fill=(30,40,10))
    return im.resize((330,300),Image.LANCZOS)
def sorry_bubble():
    im=Image.new("RGBA",(190,70),(0,0,0,0)); d=ImageDraw.Draw(im); rr(d,(0,0,189,54),22,(255,255,255,255),(40,40,60,255),3); d.polygon([(130,52),(150,52),(150,68)],fill=(255,255,255,255)); d.text((26,10),"Sorry!",font=F(FB,32),fill=(40,40,60)); return im
SORRY=sorry_bubble()
def render(t):
    tension=clamp((t-PUBLISH)/5.5) if t<DROP else 0.0
    base=RED if CUT3<=t<DROP else BG*(1-0.55*tension)+RED*(0.55*tension)*1.6
    frame=Image.fromarray(np.clip(base,0,255).astype(np.uint8))
    if PUBLISH<=t<DROP:
        pulse=decay([(h_,1) for h_ in HEART],t,0.12)
        if pulse>0: frame=Image.blend(frame,Image.new("RGB",(W,H),(120,10,20)),clamp(0.18*pulse))
    if t>=BLACK and t<DROP-0.01: frame=Image.new("RGB",(W,H),(0,0,0))
    else: ambience(frame,t)
    exitk=ease_in((t-(BTN-0.6))/0.5) if t>=BTN-0.6 else 0.0
    # ---- 3D window
    if (t<CUT3+0.5 or t>=DROP) and t>=POP[0]-0.4:
        yaw,pitch,roll,sc,cy,al=win_pose(t)
        if al>0.01:
            wi=draw_site(t); ws=wi.resize((827,880),Image.LANCZOS); m=Image.new("L",ws.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,ws.width-1,ws.height-1),24,fill=255); ws.putalpha(m)
            canvas=Image.new("RGBA",(W,H),(0,0,0,0)); ox=CXW-ws.width//2; oy=CYW-ws.height//2; canvas.paste(ws,(ox,oy))
            dst=project(ws.width,ws.height,CXW,cy,yaw,pitch,roll,sc); srcq=[(ox,oy),(ox+ws.width,oy),(ox+ws.width,oy+ws.height),(ox,oy+ws.height)]
            try: wp=canvas.transform((W,H),Image.PERSPECTIVE,find_coeffs(dst,srcq),Image.BICUBIC)
            except Exception: wp=canvas
            a=wp.split()[3].point(lambda v:int(v*al)); sh=Image.new("L",(W,H),0); sh.paste(a.point(lambda v:int(v*0.6)),(0,48)); sh=sh.filter(ImageFilter.GaussianBlur(28))
            frame.paste(Image.new("RGB",(W,H),(0,0,0)),(0,0),sh); frame.paste(wp.convert("RGB"),(0,0),a)
            # glow rim during fix
            if t>=SWEEP[3] and t<SWEEP[3]+1.2:
                g=Image.new("L",(W,H),0); g.paste(a.point(lambda v:int(v*0.8*(1-(t-SWEEP[3])/1.2))),(0,0)); g=g.filter(ImageFilter.GaussianBlur(30)); frame.paste(Image.new("RGB",(W,H),(90,255,160)),(0,0),g)
    # ---- panels
    if t<DROP:
        if 0.3<=t<CUT3:
            cy_=1182+(int((1-ease_out((t-0.3)/0.4))*80) if t<0.7 else 0); c=draw_chat(940,190,t); m=Image.new("L",c.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,939,189),26,fill=255); frame.paste(c.convert("RGB"),(70,cy_),m)
        if CUT3<=t<DROP:
            big=draw_chat(940,860,t,True); m=Image.new("L",big.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,939,859),28,fill=255)
            k=clamp((t-CUT3)/0.25); frame.paste(big.convert("RGB"),(70,420+int((1-ease_out(k))*900)),m)
    else:
        if CHECK[0]-0.2<=t<BTN-0.6+0.5:
            dimk=clamp((t-(CHECK[0]-0.2))/0.3)*(1-exitk); ovm=Image.new("L",(W,H),0); ImageDraw.Draw(ovm).rounded_rectangle((127,300,953,1180),24,fill=int(170*dimk)); frame.paste(Image.new("RGB",(W,H),(4,18,10)),(0,0),ovm)
            for i,tc in enumerate(CHECK):
                if t<tc: continue
                k=ease_back((t-tc)/0.35,1.6); y0=470+i*150; row=Image.new("RGBA",(800,112),(0,0,0,0)); rd=ImageDraw.Draw(row); rr(rd,(0,0,799,111),30,(18,70,48,240),(34,197,94,255),4)
                rd.ellipse((706,16,782,92),fill=(34,197,94)); rd.line((722,54,739,70),fill=(255,255,255),width=9); rd.line((739,70,768,36),fill=(255,255,255),width=9)
                tt_=CHK[i]; row.alpha_composite(tt_,(max(10,690-tt_.width+70),56-tt_.height//2))
                paste(frame,row,140+int((1-k)*600)+int(exitk*900),y0,clamp(1-exitk))
    # ---- characters stage
    if 0.4<=t<BTN-0.2:
        ex=ease_in((t-(BTN-0.6))/0.5) if t>=BTN-0.6 else 0.0
        ka=clamp((t-0.4)/0.5); ox=30+int((1-ease_out(ka))*-420)-int(ex*520); oy=1385
        sprite=owner_sprite(t); s_=stress(t)
        jit=int(7*math.sin(t*50)) if (s_>0.93 and t<DROP) else 0
        paste(frame,sprite,ox+jit,oy,clamp(ka)*(1-ex))
        if POP[0]-0.2<=t<DROP+0.7:
            rk=clamp((t-(POP[0]-0.2))/0.5); rx=720+int((1-ease_out(rk))*420); ry=1385; ra=1.0
            state="ok" if t<ERR500 else "error" if t<CUT3 else "sorry"
            if t>=DROP: u=ease_in((t-DROP)/0.6); rx+=int(u*700); ry+=int(u*180); ra=1-u
            if ra>0.02: paste(frame,robot_sprite(t,state),rx,ry,clamp(rk)*ra)
            for lt in LOOPS:
                if lt+0.15<=t<lt+0.8 and t<DROP: paste(frame,SORRY,690,1318,clamp((t-lt-0.15)/0.1))
        if t>=DROP+0.2:
            pk=clamp((t-DROP-0.2)/0.6); px=700+int((1-ease_back(pk,1.5))*520)+int(ex*520); paste(frame,pro_sprite(t,t>=DONE),px,1385,clamp(pk*2)*(1-ex))
    # ---- mood band
    if 0.5<=t<BTN-0.2:
        bk=clamp((t-0.5)/0.4)*(1-exitk); shake_=0.0
        if STACK<=t<DROP: shake_=3+9*clamp((t-STACK)/2.0)
        if LOOPS[3]<=t<LOOPS[3]+0.6: shake_=14
        mood_band(frame,t,bk,shake_)
    bursts(frame,t)
    # ---- captions
    def capshow(key,text,col,gl,a,b,y=150,size=96):
        if a<=t<b:
            im=cap(key,text,col,gl,size); lt=t-a; k=ease_back(lt/0.25,2.0); sc=max(0.2,1+0.6*(1-k)) if lt<0.25 else 1+0.01*math.sin(lt*8)
            lay=im if abs(sc-1)<0.004 else im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS); out=1.0 if t<b-0.15 else clamp((b-t)/0.15)
            paste(frame,lay,(W-lay.width)//2+int(8*math.exp(-lt/.2)*math.sin(lt*110)),y-lay.height//2,min(1,lt/0.06)*out)
    capshow("c1","בנית אתר בעזרת AI",WHITE_,(160,120,255),0.3,PUBLISH)
    capshow("c2","ואז... ההשקה",WHITE_,(160,120,255),PUBLISH,ERR500)
    capshow("c3","והכל קורס.",PINK,(255,40,80),ERR500,CUT3)
    capshow("c4","שעות של פרומפטים.",WHITE_,(160,120,255),CUT3,LOOPS[1]+0.2,y=190,size=92)
    capshow("c5","כלום לא עובד.",PINK,(255,40,80),LOOPS[1]+0.2,BLACK,y=190,size=104)
    capshow("c6","מגיע איש מקצוע.",LIME,(120,190,0),DROP+0.45,CHECK[0]-0.1,y=190,size=92)
    if t>=DROP:
        lt=t-DROP; LS=0.82
        if lt<0.6: sc=(1.7-0.7*ease_out(lt/0.6))*LS; lay=LOGO.resize((int(LOGO.width*sc),int(LOGO.height*sc)),Image.LANCZOS); cy=int(H*0.45-(H*0.45-175)*ease_in((lt-0.2)/0.4)) if lt>0.2 else int(H*0.45)
        else: lay=LOGO.resize((int(LOGO.width*LS),int(LOGO.height*LS)),Image.LANCZOS); cy=175
        if t>=BTN: cy=int(175+20*ease_in((t-BTN)/0.4))
        paste(frame,lay,(W-lay.width)//2,cy-lay.height//2,min(1,lt/0.08))
    def pop(im,tp,cy,c=2.0,pulse=False):
        lt=t-tp
        if lt<0: return
        k=ease_back(lt/0.4,c); sc=max(0.05,0.4+0.6*k) if lt<0.4 else 1.0
        if pulse and lt>0.4: sc*=1+0.03*math.exp(-(t%B)/0.12)
        lay=im if abs(sc-1)<0.003 else im.resize((max(1,int(im.width*sc)),max(1,int(im.height*sc))),Image.LANCZOS); paste(frame,lay,(W-lay.width)//2,cy-lay.height//2,min(1,lt/0.12))
    if t>=BTN-0.2:
        lt=t-(BTN-0.2); k=ease_back(lt/0.3,2.0); im=cap("cta","האתר שלך — עובד באמת.",WHITE_,(160,120,255),88)
        sc=max(0.3,1+0.6*(1-k)) if lt<0.3 else 1.0; lay=im if sc==1.0 else im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
        paste(frame,lay,(W-lay.width)//2,640-lay.height//2,min(1,lt/0.1))
        pop(BTN_I,BTN,900,pulse=True); pop(PHONE_I,PHONE,1110,c=2.4,pulse=True); pop(URLI,URL,1320)
    ring(frame,540,500,t-DROP,(255,255,255),0.9,1500); ring(frame,540,720,t-DONE,(150,255,180),0.9,1300); ring(frame,540,1110,t-PHONE,(205,255,60),0.8,1100)
    # ---- camera (3D-ish push + shake + punch)
    z=1+0.03*(t/DUR)+decay(PUNCH,t,0.11); dxs=decay(SHAKE,t,0.13); dx=dxs*math.sin(t*97); dy=dxs*math.cos(t*83)
    if PUBLISH<=t<CUT3: dx+=1.5*math.sin(t*60); dy+=1.5*math.cos(t*55)
    if z>1.002 or abs(dx)>0.5 or abs(dy)>0.5:
        cw,ch=W/z,H/z; frame=frame.transform((W,H),Image.AFFINE,(1/z,0,(W-cw)/2-dx,0,1/z,(H-ch)/2-dy),resample=Image.BICUBIC)
    arr=np.asarray(frame).astype(np.float32)*VIG; arr=np.clip(arr,0,255).astype(np.uint8); d_=int(decay(CHROMA,t,0.1))
    if d_>=1: arr=arr.copy(); arr[...,0]=np.roll(arr[...,0],d_,axis=1); arr[...,2]=np.roll(arr[...,2],-d_,axis=1)
    fl=np.zeros(3,np.float32); fa=0.0
    for ti,amp,tau,col in FLASH:
        if ti<=t<ti+1: a=amp*math.exp(-(t-ti)/tau); fl+=np.array(col,np.float32)*a; fa+=a
    if fa>0.01: arr=np.clip(arr.astype(np.float32)*(1-min(1,fa))+fl,0,255).astype(np.uint8)
    if t>DUR-0.8: arr=(arr.astype(np.float32)*max(0,(DUR-t)/0.8)).astype(np.uint8)
    return arr
if __name__=="__main__":
    if sys.argv[1]=="stills":
        for tt in sys.argv[2:]: Image.fromarray(render(float(tt))).resize((360,640),Image.LANCZOS).save(f"r2/b_{tt}.png"); print("ok",tt,flush=True)
    else:
        p=subprocess.Popen(["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart",sys.argv[1]],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
        for f in range(int(FPS*DUR)): p.stdin.write(render(f/FPS).tobytes())
        p.stdin.close(); p.wait(); print("video ok")
