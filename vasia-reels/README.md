# Vasia Instagram Reels – project files

Scripts and small assets used to build Hebrew vertical (1080x1920, 30fps) Instagram Reels for "Vasia"
(vasia.dev, WhatsApp 054-451-3141). Everything is generated procedurally with Python + ffmpeg (no video editor).
Large outputs (mp4/wav) are NOT committed; regenerate them with the commands below.

## Requirements
`python3`, `ffmpeg`, `pip install pillow numpy edge-tts faster-whisper librosa` (PIL needs libraqm for Hebrew RTL text).
Run every command from this folder (paths are relative). Hebrew text uses `LiberationSans-Bold` (installed system font).

## Reel 1 – "Vasia social media price list" (poster -> animated reel, 18s)
Source poster: `assets/poster.png` (cropped into animated slices).
```
python3 audio2.py music7.wav            # music + soft SFX (timeline in tl.py)
python3 video.py v_long.mp4             # animated video (silent)
python3 mix.py v_long.mp4 music7.wav out.mp4         # voiceover mix (Liam / ElevenLabs clips in vo/)
python3 mix_all.py v_long.mp4 music7.wav out_free.mp4 7b   # all-free version with Microsoft Avri voice (edge/)
```
- `tl.py` = shared timeline (beats, landings, exits, CTA). Audio and video both read it, so edits stay in sync.
- `vo/*.mp3` are ElevenLabs "Liam" clips (cost credits, so keep them). Line 7 "דברו איתי בוואטסאפ" was never generated with ElevenLabs (free tier was busy/blocked).
- `edge/b_*.mp3` are free Microsoft Hebrew voice (he-IL-AvriNeural) clips from `edge_synth2.py`.

## Reel 2 – "AI-built website crashes, a pro fixes it" (22.5s, characters)
```
python3 r2_audio.py r2/music.wav
python3 reel2b.py r2/video_b.mp4        # heavy render (~7 min): 3D window, cracks, owner/robot/pro characters
python3 mix2.py r2/video_b.mp4 r2/music.wav reel2.mp4
python3 reel2b.py stills 5.9 13.5       # dump preview stills to r2/b_<t>.png
```
- `tl2.py` = timeline of reel 2. `reel2b.py` is the final renderer (`reel2b_head.py` + `reel2b_tail.py` are its source parts; `reel2.py` is the earlier flat version).
- Voiceover clips for reel 2 are in `r2/` (`r2_tts*.py`, free Avri voice). Whisper-small check showed some short phrases are pronounced unclearly; a better voice would help.

## Edge-tts behind a proxy
`edge-tts` uses its own cert bundle; the scripts point it at `/root/.ccr/ca-bundle.crt` (`_c._SSL_CTX=...`). Never disable TLS verification.

## Reel 3/4 – same story with realistic AI clips (Kling, UGC style)
Footage: five 5 s image-to-video clips from Kling (`kling-video-v3_0_turbo`, 9:16, 40 credits each), started from
the stills in `stills/` (a = hopeful, b2 = crash, c = rage, d3 = the pro arrives, e = relief; made earlier with Wan 2.2 5B in ComfyUI).
The mp4 clips are not committed (~17 MB). Put them in one folder as `kling_clip_a.mp4` ... `kling_clip_e.mp4` and pass that folder below.
Kling's free-tier watermark (source y 1240-1275) is removed by the scale/crop in the builders.
```
python3 r3_build.py <clips_dir> r3/video_v2.mp4     # 29 s cut, Hebrew captions + end card (also writes r3/endcard.png)
python3 r4_build.py <clips_dir> r4/vasia_reel_fast.mp4   # 22 s faster no-voice ad cut (needs r3/endcard.png from r3_build)
python3 r3_audio.py r3/music.wav; python3 mix3.py r3/video_v2.mp4 r3/music.wav out.mp4   # old Avri-voice + synth music mix (rejected)
```
- `tl3.py` = 29 s timeline used by `r3_audio.py`. `r4_build.py` has its own segment/caption table at the top.
- Captions use the approved script: "בניתם אתר עם AI? / נראה מעולה, נכון?", "ואז עולים לאוויר... / והכול קורס.",
  "לילות של פרומפטים, / ושום דבר לא זז.", "ואז אני נכנסת לתמונה.", "טפסים, תשלומים, / מהירות ואבטחה.", "הכול עובד.", end card "רוצים אתר שבאמת עובד?".
- Final choice: **no voice**. Add music when posting (paid ads: Meta Sound Collection / TikTok Commercial Music Library; organic: a trending sound).
- `r3/vo/line1_take1.mp3`, `line5_take1.mp3`: ElevenLabs "Danit – Natural Israeli Hebrew" (eleven_v4) takes of lines 1 and 5, kept because they cost credits.
  The other lines were never generated (free tier busy).
- The procedural music/SFX from `r3_audio.py` and the Avri TTS voice were rejected as sounding bad on realistic footage.
- RunPod/ComfyUI was abandoned: on both an RTX 5080 and an RTX 4090 pod (template runpod/comfyui 0.35.0, cu128) the GPU fell over
  (`comfy_aimdo` vbar fault / CUDA "unspecified launch failure") after the first clip of a session. The API key stays only in `RUNPOD_API_KEY`.

## Things learned
- The old "noise" came from reverb louder than the dry signal and white-noise whooshes; fixed in `audio2.py` (filtered noise, reverb ~20% of dry, click-free fades).
- Hebrew AI video text is unreliable, so generate footage without text and add captions here.
