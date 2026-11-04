# Shared timeline (seconds). 120 BPM -> beat=0.5s. Extended edit: 18s
B=0.5; DUR=18.0
DROP=4.0
LAND={'header':4.0,'c1':6.0,'c2':6.5,'c3':7.0,'c4':7.5,'c5':8.0,'note':99}
SWEEP=8.6                      # sequential shimmer over all cards (voice: "צילום, עריכה ופרסום")
EXIT=12.0
EXIT_STAGGER=0.08
CTA={'text':13.0,'sub':13.6,'btn':14.0,'phone':14.5,'url':15.5}
END=17.5
HOOK_HITS=[0.05,1.30,1.90,2.95]
HEART=[0.05,1.30,1.90,2.95,3.25,3.5,3.625,3.75]
RISER=(2.0,3.85)
def beats(a,b):
    out=[];t=a
    while t<b-1e-6: out.append(round(t,3)); t+=B
    return out
KICKS=HEART+beats(4.0,EXIT)+beats(EXIT+1.0,END)
PUNCH=[(0.05,.06),(1.30,.08),(1.90,.05),(2.95,.09),(4.0,.11),(6.0,.05),(6.5,.05),(7.0,.05),(7.5,.05),(8.0,.08),
       (CTA['text'],.09),(CTA['btn'],.05),(CTA['phone'],.09)]+[(t,.015) for t in beats(8.5,EXIT)+beats(CTA['btn']+1.0,END)]
SHAKE=[(0.05,14),(1.30,22),(1.90,12),(2.95,26),(3.5,6),(4.0,38),(6.0,10),(6.5,10),(7.0,10),(7.5,10),(8.0,18),(CTA['text'],22),(CTA['phone'],22)]
CHROMA=[(0.05,7),(1.30,12),(1.90,8),(2.95,14),(4.0,18),(8.0,7),(CTA['text'],10),(CTA['phone'],10)]
FLASH=[(4.0,0.75,0.1,(255,255,255)),(2.95,0.25,0.15,(255,60,90)),(CTA['text'],0.35,0.2,(205,255,60)),(CTA['phone'],0.3,0.2,(255,255,255)),(8.0,0.18,0.15,(205,255,60))]
