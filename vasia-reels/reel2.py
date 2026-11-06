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
    # glitch slices
    gb=max([clamp(1-(t-e)/0.35) for e in (CLICK,BROKEN_IMG,ERR500,COLLAPSE,FORM,PAY,WHITE,STACK) if 0<=t-e<0.35]+[0])
    if t>=STACK and t<SWEEP[0]: gb=max(gb,0.5)
    if gb>0:
        rnd=random.Random(int(t*30))
        for _ in range(int(3+9*gb)):
            y=rnd.randint(70,WH-60); h=rnd.randint(10,50); dx=rnd.randint(-int(70*gb),int(70*gb)); strip=img.crop((0,y,WW,y+h)); img.paste(strip,(dx,y))
    return img
def draw_chat(w,h,t,big=False):
    img=Image.new("RGBA",(w,h),(24,28,44,255)); d=ImageDraw.Draw(img)
    d.rectangle((0,0,w,56),fill=(36,42,66)); d.ellipse((18,16,42,40),fill=(129,140,248)); d.text((56,12),"AI Website Builder",font=F(FB,26),fill=(230,234,250))
    def bubble(x,y,txt,user,col=None,fs=24,maxw=None):
        f=F(FB if user else FR,fs); bb=f.getbbox(txt); tw=bb[2]-bb[0]; th=fs+16
        bw=tw+36; 
        bx=(w-bw-24) if user else 24
        rr(d,(bx,y,bx+bw,y+th+12),18,col or ((99,102,241) if user else (46,52,80))); d.text((bx+18,y+8),txt,font=f,fill=(255,255,255)); return y+th+26
    if not big:
        y=76
        # typed prompt
        prompt="Build me a website for my business"
        n=int(clamp((t-0.5)/1.1)*len(prompt)) if t<PUBLISH else len(prompt)
        if n>0: y=bubble(0,y,prompt[:n],True)
        if t>=1.7:
            if t<2.6: y=bubble(0,y,"Generating"+"."*(1+int(t*4)%3),False)
            elif t<PUBLISH+1.6: y=bubble(0,y,"Your website is ready!",False,col=(22,120,70))
            else: y=bubble(0,y,"Error: deployment failed",False,col=(160,30,40))
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
CHK=[text_layer(c,58,WHITE_,None,maxw=760) for c in CHECKS]
def render(t):
    # ----- background
    tension=0.0
    if t<DROP: tension=clamp((t-PUBLISH)/5.5)
    bgmix=BG
    if CUT3<=t<DROP: base=RED*(1-0.0)
    else: base=BG*(1-0.55*tension)+RED*(0.55*tension)*1.6
    frame=Image.fromarray(np.clip(base,0,255).astype(np.uint8))
    pulse=0.0
    if t<DROP and t>=PUBLISH: pulse=decay([(h_,1) for h_ in HEART],t,0.12)
    if pulse>0: frame=Image.blend(frame,Image.new("RGB",(W,H),(120,10,20)),clamp(0.18*pulse))
    if t>=BLACK and t<DROP-0.01: frame=Image.new("RGB",(W,H),(0,0,0))
    # ----- scenes
    if t<CUT3 or t>=DROP:
        # window
        wi=draw_site(t)
        wy=WY; wx=WX; sc=1.0; al=1.0
        if t<POP[0]-0.4: wi=None
        if t>=BTN-0.6:  # exit to CTA
            k=ease_in((t-(BTN-0.6))/0.5); sc=1-0.25*k; al=1-k; wy=WY+int(260*k)
        if t>=DROP and t<DROP+0.35: sc=1+0.1*(1-ease_out((t-DROP)/0.35))
        if wi is not None and al>0.01:
            if t<POP[0]+0.2 : al*=clamp((t-(POP[0]-0.4))/0.5)
            if sc!=1.0: wi=wi.resize((int(WW*sc),int(WH*sc)),Image.LANCZOS)
            sh=Image.new("L",(wi.width+80,wi.height+80),0); sh.paste(Image.new("L",wi.size,150),(40,50)); sh=sh.filter(ImageFilter.GaussianBlur(24))
            frame.paste(Image.new("RGB",sh.size,(0,0,0)),(wx-40+(WW-wi.width)//2,wy-30+(WH-wi.height)//2),sh.point(lambda v:int(v*al)))
            m=Image.new("L",wi.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,wi.width-1,wi.height-1),26,fill=int(255*al))
            frame.paste(wi.convert("RGB"),(wx+(WW-wi.width)//2,wy+(WH-wi.height)//2),m)
        # chat panel (scenes 1-2) / checklist (scene 4)
        if t<DROP:
            if t>=0.3 and t<CUT3:
                cw,ch=940,260; cy_=1340
                if t<0.7: cy_+=int((1-ease_out((t-0.3)/0.4))*80)
                c=draw_chat(cw,ch,t); m=Image.new("L",c.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,cw-1,ch-1),26,fill=255); frame.paste(c.convert("RGB"),(70,cy_),m)
        else:
            if CHECK[0]-0.1<=t<BTN-0.6+0.5:
                ex=0.0
                if t>=BTN-0.6: ex=ease_in((t-(BTN-0.6))/0.5)
                for i,tc in enumerate(CHECK):
                    if t<tc: continue
                    k=ease_back((t-tc)/0.35,1.6); y0=1350+i*86
                    row=Image.new("RGBA",(940,76),(0,0,0,0)); rd=ImageDraw.Draw(row); rr(rd,(0,0,939,75),20,(20,60,44,235),(34,197,94,255),3)
                    rd.ellipse((860,14,916,62),fill=(34,197,94)); rd.line((872,38,885,50),fill=(255,255,255),width=7); rd.line((885,50,906,26),fill=(255,255,255),width=7)
                    tl=CHK[i].copy(); 
                    tt_=tl.resize((int(tl.width*0.78),int(tl.height*0.78)),Image.LANCZOS); row.alpha_composite(tt_,(max(10,850-tt_.width+50),38-tt_.height//2))
                    xoff=int((1-k)*500)+int(ex*900)
                    paste(frame,row,70+xoff,y0,clamp(1-ex))
    else:
        # scene 3: frustration loop, big chat
        big=draw_chat(940,860,t,True); m=Image.new("L",big.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,939,859),28,fill=255)
        frame.paste(big.convert("RGB"),(70,420),m)
    # ----- captions
    def capshow(key,text,col,gl,a,b,y=150,size=96):
        if a<=t<b:
            im=cap(key,text,col,gl,size); lt=t-a; k=ease_back(lt/0.25,2.0); sc=max(0.2,1+0.6*(1-k)) if lt<0.25 else 1+0.01*math.sin(lt*8)
            lay=im if abs(sc-1)<0.004 else im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
            out=1.0 if t<b-0.15 else clamp((b-t)/0.15)
            paste(frame,lay,(W-lay.width)//2+int(8*math.exp(-lt/.2)*math.sin(lt*110)),y-lay.height//2,min(1,lt/0.06)*out)
    capshow("c1","בנית אתר בעזרת AI",WHITE_,(160,120,255),0.3,PUBLISH)
    capshow("c2","ואז... ההשקה",WHITE_,(160,120,255),PUBLISH,ERR500)
    capshow("c3","והכל קורס.",PINK,(255,40,80),ERR500,CUT3)
    capshow("c4","שעות של פרומפטים.",WHITE_,(160,120,255),CUT3,LOOPS[1]+0.2,y=190,size=92)
    capshow("c5","כלום לא עובד.",PINK,(255,40,80),LOOPS[1]+0.2,BLACK,y=190,size=104)
    capshow("c6","מגיע איש מקצוע.",LIME,(120,190,0),DROP+0.45,CHECK[0]-0.1,y=170,size=92)
    # logo
    if t>=DROP:
        lt=t-DROP; k=ease_back(lt/0.35,1.6)
        LS=0.82
        if lt<0.6:
            sc=(1.7-0.7*ease_out(lt/0.6))*LS/1.0; lay=LOGO.resize((int(LOGO.width*sc),int(LOGO.height*sc)),Image.LANCZOS); cy=int(H*0.45-(H*0.45-175)*ease_in((lt-0.2)/0.4)) if lt>0.2 else int(H*0.45)
        else: lay=LOGO.resize((int(LOGO.width*LS),int(LOGO.height*LS)),Image.LANCZOS); cy=175
        if t>=BTN:
            kk=ease_in((t-BTN)/0.4); cy=int(175+20*kk)
        paste(frame,lay,(W-lay.width)//2,cy-lay.height//2+ (0),min(1,lt/0.08))
    # CTA
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
    # ----- camera
    z=1+decay(PUNCH,t,0.11)
    dxs=decay(SHAKE,t,0.13); dx=dxs*math.sin(t*97); dy=dxs*math.cos(t*83)
    if PUBLISH<=t<CUT3: dx+=1.5*math.sin(t*60); dy+=1.5*math.cos(t*55)
    if z>1.002 or abs(dx)>0.5 or abs(dy)>0.5:
        cw,ch=W/z,H/z; frame=frame.transform((W,H),Image.AFFINE,(1/z,0,(W-cw)/2-dx,0,1/z,(H-ch)/2-dy),resample=Image.BICUBIC)
    arr=np.asarray(frame); d_=int(decay(CHROMA,t,0.1))
    if d_>=1: arr=arr.copy(); arr[...,0]=np.roll(arr[...,0],d_,axis=1); arr[...,2]=np.roll(arr[...,2],-d_,axis=1)
    fl=np.zeros(3,np.float32); fa=0.0
    for ti,amp,tau,col in FLASH:
        if ti<=t<ti+1: a=amp*math.exp(-(t-ti)/tau); fl+=np.array(col,np.float32)*a; fa+=a
    if fa>0.01: arr=np.clip(arr.astype(np.float32)*(1-min(1,fa))+fl,0,255).astype(np.uint8)
    if t>DUR-0.8: arr=(arr.astype(np.float32)*max(0,(DUR-t)/0.8)).astype(np.uint8)
    return arr
if __name__=="__main__":
    if sys.argv[1]=="stills":
        for tt in sys.argv[2:]: Image.fromarray(render(float(tt))).resize((360,640),Image.LANCZOS).save(f"r2/s_{tt}.png"); print("ok",tt)
    else:
        p=subprocess.Popen(["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","libx264","-preset","medium","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart",sys.argv[1]],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
        for f in range(int(FPS*DUR)): p.stdin.write(render(f/FPS).tobytes())
        p.stdin.close(); p.wait(); print("video ok")
