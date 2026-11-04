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

## Next step (in progress)
Replace the drawn characters with realistic AI-generated clips (ComfyUI on RunPod pod `wide_ivory_rodent`, RTX 5080),
then combine them with Hebrew captions, voiceover, music and the CTA end card using the same mixing scripts.
The RunPod API key must only live in the environment variable `RUNPOD_API_KEY` (never in files or chat).

## Things learned
- The old "noise" came from reverb louder than the dry signal and white-noise whooshes; fixed in `audio2.py` (filtered noise, reverb ~20% of dry, click-free fades).
- Hebrew AI video text is unreliable, so generate footage without text and add captions here.
