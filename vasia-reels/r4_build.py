# Reel 4: faster no-voice cut of the Kling clips with a big hook, popping captions, flashes, end card
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
CLIPS=sys.argv[1]; OUT=sys.argv[2]
W,H=1080,1920; FONT="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
STY={"n":((76,32,140,230),(255,255,255),72),      # purple box, white text
     "hook":((205,255,40,245),(20,10,40),96),     # lime box, dark text, big
     "red":((215,30,45,240),(255,255,255),88),
     "win":((205,255,40,245),(20,10,40),92)}
# clip, src_start, dur  -> consecutive segments
SEG=[("a",0.0,3.6),("b",0.0,3.6),("c",0.8,3.8),("d",0.0,3.8),("e",0.4,4.0)]
END=3.5
# start, end, lines, style, y
CAPS=[(0.05,3.45,["בניתם אתר עם AI?"],"hook",230),
      (1.0,3.5,["נראה מעולה, נכון?"],"n",1330),
      (3.7,5.2,["ואז עולים לאוויר..."],"n",1330),
      (5.2,7.15,["והכול קורס."],"red",1300),
      (7.3,10.9,["לילות של פרומפטים,","ושום דבר לא זז."],"n",1330),
      (11.1,12.8,["ואז אני נכנסת לתמונה."],"n",1330),
      (12.8,14.7,["טפסים, תשלומים,","מהירות ואבטחה."],"n",1330),
      (14.9,18.7,["הכול עובד."],"win",1300),
      (19.0,22.3,["רוצים אתר שבאמת עובד?"],"n",850)]
os.makedirs("r4/cap",exist_ok=True)
def caption(lines,style,path):
    box,col,sz=STY[style]; f=ImageFont.truetype(FONT,sz); pad=int(sz*0.45); gap=int(sz*0.25)
    bb=[f.getbbox(l,direction="rtl",language="he") for l in lines]
    tw=max(b[2]-b[0] for b in bb); th=sum(b[3]-b[1] for b in bb)+gap*(len(lines)-1)
    im=Image.new("RGBA",(tw+2*pad+20,th+2*pad+20),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((10,10,10+tw+2*pad,10+th+2*pad),radius=int(sz*0.4),fill=box)
    y=10+pad
    for l,b in zip(lines,bb):
        x=10+pad+(tw-(b[2]-b[0]))//2-b[0]
        kw=dict(stroke_width=3,stroke_fill=(20,8,40)) if col==(255,255,255) else {}
        d.text((x,y-b[1]),l,font=f,fill=col,direction="rtl",language="he",**kw); y+=b[3]-b[1]+gap
    im.save(path)
for k,c in enumerate(CAPS): caption(c[2],c[3],f"r4/cap/c{k}.png")
inp=[]; fc=[]; t=0; cut=[]
for i,(k,s0,d) in enumerate(SEG):
    inp+=["-i",f"{CLIPS}/kling_clip_{k}.mp4"]
    ex=f",fade=t=out:st={d-0.25:.2f}:d=0.25" if k=="c" else ""
    fc.append(f"[{i}:v]trim={s0}:{s0+d},setpts=PTS-STARTPTS,fps=30,scale=1140:2069:flags=lanczos,crop={W}:{H}:30:56,setsar=1,format=yuv420p{ex}[s{i}]")
    t+=d; cut.append(round(t,2))
n=len(SEG)
inp+=["-loop","1","-t",str(END),"-i","r3/endcard.png"]
fc.append(f"[{n}:v]fps=30,scale=2160:-1,zoompan=z='1+0.04*on/105':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={W}x{H}:fps=30,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.3,trim=0:{END},setpts=PTS-STARTPTS[s{n}]")
fc.append("".join(f"[s{i}]" for i in range(n+1))+f"concat=n={n+1}:v=1:a=0,"
          f"drawbox=0:0:iw:ih:color=red@0.45:t=fill:enable='between(t,{cut[0]},{cut[0]+0.1})',"
          f"drawbox=0:0:iw:ih:color=white@0.35:t=fill:enable='between(t,{cut[2]},{cut[2]+0.08})',"
          f"drawbox=0:0:iw:ih:color=0xCDFF28@0.30:t=fill:enable='between(t,{cut[3]},{cut[3]+0.08})'[base]")
last="base"
for k,(a,b,lines,st,y) in enumerate(CAPS):
    j=n+1+k; d=b-a
    inp+=["-loop","1","-t",f"{d:.2f}","-i",f"r4/cap/c{k}.png"]
    fc.append(f"[{j}:v]format=rgba,fade=t=in:st=0:d=0.12:alpha=1,fade=t=out:st={d-0.12:.2f}:d=0.12:alpha=1,setpts=PTS-STARTPTS+{a}/TB[c{k}]")
    # pop: slide up 40px over 0.18s
    fc.append(f"[{last}][c{k}]overlay=x=(W-w)/2:y='{y}+40*max(0,1-(t-{a})/0.18)':eof_action=pass[o{k}]"); last=f"o{k}"
TOT=sum(s[2] for s in SEG)+END
cmd=["ffmpeg","-y","-loglevel","error",*inp,"-f","lavfi","-i","anullsrc=r=48000:cl=stereo","-filter_complex",";".join(fc),
     "-map",f"[{last}]","-map",f"{len(inp)//2 if False else n+1+len(CAPS)}:a","-t",f"{TOT}","-r","30",
     "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","128k","-shortest","-movflags","+faststart",OUT]
subprocess.run(cmd,check=True); print("ok",TOT,"cuts",cut)
