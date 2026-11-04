# Reel 3 timeline: Kling UGC clips a-e (5 s each) + end card. 120 BPM
B=0.5; DUR=29.0
POP=[1.0,1.4,1.8,2.2,2.6]          # hopeful sparkle while he builds/celebrates
LIVE=3.0
PUBLISH=4.4; CLICK=5.0            # cut to clip b (crash)
BROKEN_IMG=5.6; ERR500=6.0; CONSOLE=6.8; COLLAPSE=7.4
FORM=8.0; PAY=8.6; WHITE=9.2; STACK=9.7
CUT3=10.0; LOOPS=[10.6,11.6,12.6,13.6]; BLACK=14.7   # clip c (rage), fade to black
DROP=15.0; SWEEP=[15.5,15.75,16.0,16.25]            # clip d: the pro arrives
CHECK=[17.0,17.7,18.4,19.1]; DONE=20.0              # clip e: relief
BTN=25.0; PHONE=25.5; URL=26.3                      # end card
ERR_BEEPS=[CLICK,ERR500,CONSOLE,FORM,PAY,WHITE,STACK,STACK+0.15,STACK+0.3]+LOOPS
def beats(a,b):
    out=[];t=a
    while t<b-1e-6: out.append(round(t,3)); t+=B
    return out
HEART=beats(5.0,8.0)+[round(8.0+i*0.333,3) for i in range(0,9)]
KICKS_GOOD=beats(DROP,DUR-0.5)
