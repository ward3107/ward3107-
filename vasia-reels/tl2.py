# Reel 2 timeline: "AI-built site crashes -> pro fixes it" (seconds). 120 BPM
B=0.5; DUR=22.5
POP=[2.0,2.3,2.6,2.9,3.2]          # site components build in
LIVE=3.6                          # "Deployed ✓ Live"
PUBLISH=4.0; CLICK=4.8            # user hits publish
BROKEN_IMG=5.4; ERR500=5.9; CONSOLE=6.5; COLLAPSE=7.0
FORM=7.3; PAY=8.3; WHITE=9.3; STACK=9.8
CUT3=10.2; LOOPS=[10.5,11.1,11.7,12.3]; BLACK=12.7
DROP=13.0; SWEEP=[13.5,13.75,14.0,14.25]
CHECK=[15.0,15.7,16.4,17.1]; DONE=17.8
BTN=19.0; PHONE=19.6; URL=20.4
ERR_BEEPS=[CLICK,ERR500,CONSOLE,FORM,PAY,WHITE,STACK,STACK+0.15,STACK+0.3]+LOOPS
def beats(a,b):
    out=[];t=a
    while t<b-1e-6: out.append(round(t,3)); t+=B
    return out
HEART=beats(5.0,8.0)+[round(8.0+i*0.333,3) for i in range(0,9)]   # accelerating
KICKS_GOOD=beats(DROP,DUR-0.5)
PUNCH=[(CLICK,.05),(ERR500,.08),(COLLAPSE,.06),(FORM,.06),(PAY,.06),(WHITE,.07),(STACK,.1),(CUT3,.08),(LOOPS[3],.1),(DROP,.12),(DONE,.08),(PHONE,.08)]+[(t,.015) for t in KICKS_GOOD]
SHAKE=[(CLICK,10),(ERR500,28),(CONSOLE,12),(COLLAPSE,20),(FORM,16),(PAY,16),(WHITE,22),(STACK,34),(CUT3,20),(LOOPS[1],12),(LOOPS[2],16),(LOOPS[3],40),(DROP,30)]
CHROMA=[(CLICK,6),(ERR500,16),(COLLAPSE,12),(FORM,9),(PAY,9),(WHITE,14),(STACK,20),(LOOPS[3],18),(DROP,16)]
FLASH=[(DROP,0.8,0.12,(255,255,255)),(CLICK,0.25,0.12,(255,60,60)),(ERR500,0.3,0.12,(255,40,40)),(STACK,0.4,0.14,(255,30,30)),(LIVE,0.2,0.15,(90,255,150)),(DONE,0.3,0.18,(120,255,160))]
