import subprocess, re, os, sys
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
VIDEO,MUSIC,OUT=sys.argv[1:4]
DUR=18.0
def lead(f):
    o=subprocess.run(["ffmpeg","-hide_banner","-i",f,"-af","silencedetect=noise=-33dB:d=0.06","-f","null","-"],capture_output=True,text=True).stderr
    m=re.search(r"silence_start: 0\b.*?silence_end: ([0-9.]+)",o.replace("\n"," "))
    return float(m.group(1)) if m else 0.0
inputs=[VIDEO,MUSIC]; chains=[]; labels=[]
def add(path,chain_fn):
    inputs.append(path); i=len(inputs)-1; lb=f"v{i}"
    chains.append(chain_fn(i,lb)); labels.append(f"[{lb}]")
def manual(path,a,b,delay,tempo=1.0,fo=0.06):
    def f(i,lb):
        dur=(b-a)/tempo
        t=f",atempo={tempo}" if tempo!=1.0 else ""
        return f"[{i}:a]atrim={a}:{b},afade=t=in:st=0:d=0.01,afade=t=out:st={(b-a)-fo:.3f}:d={fo},asetpts=PTS-STARTPTS{t},adelay={int(delay*1000)}|{int(delay*1000)}[{lb}]"
    add(path,f)
def auto(path,speech_at,norm=False,tempo=1.0):
    ld=lead(path); st=max(0,ld-0.02)
    def f(i,lb):
        return f"[{i}:a]atrim={st:.3f},afade=t=in:st=0:d=0.01,asetpts=PTS-STARTPTS{(f',atempo={tempo}' if tempo!=1.0 else '')}{(',loudnorm=I=-18:TP=-2:LRA=7' if norm else '')},adelay={int((speech_at-0.02)*1000)}|{int((speech_at-0.02)*1000)}[{lb}]"
    add(path,f)
used=[]
manual("vo/t1.mp3",0.10,1.22,0.05); used.append("hook A")
manual("vo/t1.mp3",1.90,3.60,1.30,fo=0.08); used.append("hook B")
manual("vo/l2.mp3",1.25,2.50,2.92,tempo=1.3,fo=0.08); used.append("hook C")
auto("vo/drop.mp3",4.12); used.append("drop line")
auto("vo/price.mp3",6.0); used.append("price")
if os.path.exists("vo/work_el.mp3"): auto("vo/work_el.mp3",9.0,tempo=1.2); used.append("work (ElevenLabs)")
auto("vo/cta.mp3",13.0); used.append("cta question")
if os.path.exists("vo/wa.mp3"): auto("vo/wa.mp3",13.95,norm=True); used.append("whatsapp")
n=len(labels)
fc=";".join(chains)+";"+"".join(labels)+f"amix=inputs={n}:normalize=0:duration=longest,aformat=channel_layouts=stereo,highpass=f=90,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=100:makeup=3,volume=1.5,apad=whole_dur={DUR},atrim=0:{DUR},asplit=2[vo][vosc];"
fc+=f"[1:a]atrim=0:{DUR},lowpass=f=12000[mus];[mus][vosc]sidechaincompress=threshold=0.03:ratio=4:attack=10:release=350[duck];[duck][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.95[a]"
cmd=["ffmpeg","-y","-loglevel","error"]
for p in inputs: cmd+=["-i",p]
cmd+=["-filter_complex",fc,"-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-t",str(DUR),"-movflags","+faststart",OUT]
subprocess.run(cmd,check=True); print("mixed:",", ".join(used))
