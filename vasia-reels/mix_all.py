import subprocess, json, sys, os
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
VIDEO,MUSIC,OUT=sys.argv[1:4]; LINE7=sys.argv[4] if len(sys.argv)>4 else "7b"
DUR=18.0
info=json.load(open("edge/b_info.json"))
# key, speech_start_target, max_window (None = no limit)
plan=[("1a",0.08,1.17),("1b",1.25,None),("2",2.95,0.89),("3",4.12,None),("4",6.0,None),("5",9.0,3.10),("6",13.0,0.99),(LINE7,14.1,None)]
inputs=[VIDEO,MUSIC]; chains=[]; labels=[]
for k,start,win in plan:
    inf=info[k]; a=max(0,inf["lead"]-0.03); b=inf["lead"]+inf["speech"]+0.06
    tempo=1.0
    if win and inf["speech"]>win: tempo=min(1.5,inf["speech"]/win)
    inputs.append(f"edge/b_{k}.mp3"); i=len(inputs)-1; lb=f"v{i}"
    t=f",atempo={tempo:.3f}" if tempo>1.001 else ""
    d=int(max(0,start-0.03)*1000)
    chains.append(f"[{i}:a]atrim={a:.3f}:{b:.3f},afade=t=in:st=0:d=0.015,afade=t=out:st={(b-a)-0.05:.3f}:d=0.05,asetpts=PTS-STARTPTS{t},loudnorm=I=-18:TP=-2:LRA=7,adelay={d}|{d}[{lb}]")
    labels.append(f"[{lb}]")
n=len(labels)
fc=";".join(chains)+";"+"".join(labels)+f"amix=inputs={n}:normalize=0:duration=longest,aformat=channel_layouts=stereo,highpass=f=90,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=100:makeup=3,volume=1.5,apad=whole_dur={DUR},atrim=0:{DUR},asplit=2[vo][vosc];"
fc+=f"[1:a]atrim=0:{DUR},lowpass=f=12000[mus];[mus][vosc]sidechaincompress=threshold=0.03:ratio=4:attack=10:release=350[duck];[duck][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.95[a]"
cmd=["ffmpeg","-y","-loglevel","error"]
for p in inputs: cmd+=["-i",p]
cmd+=["-filter_complex",fc,"-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-t",str(DUR),"-movflags","+faststart",OUT]
subprocess.run(cmd,check=True); print("mixed all-Avri, last line =",LINE7)
