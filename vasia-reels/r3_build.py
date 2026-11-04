# Reel 3: Kling UGC clips a-e + Hebrew captions + Vasia end card -> silent 1080x1920 30fps video
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
CLIPS=sys.argv[1]; OUT=sys.argv[2]          # folder with kling_clip_[a-e].mp4, output mp4
W,H=1080,1920; FONT="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
PURPLE=(76,32,140); LIME=(205,255,40)
os.makedirs("r3/cap",exist_ok=True)
# (start, end, lines) - text matches the voiceover
CAPS=[(0.3,4.6,["בניתם אתר עם AI?","נראה מעולה, נכון?"],1330),
      (5.1,9.0,["ואז עולים לאוויר...","והכול קורס."],1330),
      (10.4,14.5,["לילות של פרומפטים,","ושום דבר לא זז."],1330),
      (15.2,17.3,["ואז אני נכנסת לתמונה."],1330),
      (17.3,21.8,["טפסים, תשלומים,","מהירות ואבטחה.","הכול עובד."],1330),
      (25.4,28.9,["רוצים אתר שבאמת עובד?"],850)]
def caption(lines,path,hl_last=True):
    f=ImageFont.truetype(FONT,72); pad=34; gap=18
    sizes=[f.getbbox(l,direction="rtl",language="he") for l in lines]
    tw=max(b[2]-b[0] for b in sizes); th=sum(b[3]-b[1] for b in sizes)+gap*(len(lines)-1)
    im=Image.new("RGBA",(tw+2*pad+20,th+2*pad+20),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((10,10,10+tw+2*pad,10+th+2*pad),radius=28,fill=PURPLE+(225,))
    y=10+pad
    for i,(l,b) in enumerate(zip(lines,sizes)):
        lw=b[2]-b[0]; x=10+pad+(tw-lw)//2-b[0]
        col=LIME if (hl_last and i==len(lines)-1 and len(lines)>1) else (255,255,255)
        d.text((x,y-b[1]),l,font=f,fill=col,direction="rtl",language="he",stroke_width=3,stroke_fill=(20,8,40))
        y+=b[3]-b[1]+gap
    im.save(path)
for k,(a,b,lines,_y) in enumerate(CAPS): caption(lines,f"r3/cap/c{k}.png")
# end card from the poster: logo (top) + WhatsApp/phone/site block (bottom)
P=Image.open("assets/poster.png").convert("RGB")
import numpy as np
yy,xx=np.mgrid[0:H,0:W]; r=np.sqrt(((xx-W/2)/(W*0.75))**2+((yy-H*0.45)/(H*0.6))**2).clip(0,1)[...,None]
inner=np.array((46,64,92)); outer=np.array((16,25,42))
card=Image.fromarray((inner*(1-r)+outer*r).astype("uint8"))
def feather(im,f=28):
    m=Image.new("L",im.size,0); ImageDraw.Draw(m).rectangle((f,f,im.width-f,im.height-f),fill=255)
    return m.filter(ImageFilter.GaussianBlur(f/2))
def put(crop,w,x,y):
    c=crop.resize((w,int(crop.height*w/crop.width)),Image.LANCZOS); card.paste(c,(x,y),feather(c)); return c.height
vlogo=P.crop((55,10,405,310)); word=P.crop((430,10,1070,166))
put(vlogo,330,70,470); put(word,600,420,540)
cta=P.crop((95,1100,1027,1402)); put(cta,1000,40,1080)
card.save("r3/endcard.png")
# video
inp=[]; fc=[]
for i,k in enumerate("abcde"):
    inp+=["-i",f"{CLIPS}/kling_clip_{k}.mp4"]
    extra=",fade=t=out:st=4.7:d=0.3" if k=="c" else ""
    fc.append(f"[{i}:v]trim=0:5,setpts=PTS-STARTPTS,fps=30,scale=1140:2069:flags=lanczos,crop={W}:{H}:30:56,setsar=1,format=yuv420p{extra}[s{i}]")
inp+=["-loop","1","-t","4","-i","r3/endcard.png"]
fc.append(f"[5:v]fps=30,scale=2160:-1,zoompan=z='1+0.04*on/120':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={W}x{H}:fps=30,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.35,trim=0:4,setpts=PTS-STARTPTS[s5]")
fc.append("".join(f"[s{i}]" for i in range(6))+"concat=n=6:v=1:a=0[base]")
last="base"
for k,(a,b,lines,cy) in enumerate(CAPS):
    n=6+k; d=b-a
    inp+=["-loop","1","-t",f"{d:.2f}","-i",f"r3/cap/c{k}.png"]
    fc.append(f"[{n}:v]format=rgba,fade=t=in:st=0:d=0.15:alpha=1,fade=t=out:st={d-0.15:.2f}:d=0.15:alpha=1,setpts=PTS-STARTPTS+{a}/TB[c{k}]")
    fc.append(f"[{last}][c{k}]overlay=x=(W-w)/2:y={cy}:eof_action=pass[o{k}]"); last=f"o{k}"
cmd=["ffmpeg","-y","-loglevel","error",*inp,"-filter_complex",";".join(fc),"-map",f"[{last}]","-t","29","-r","30",
     "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",OUT]
subprocess.run(cmd,check=True); print("video ok")
