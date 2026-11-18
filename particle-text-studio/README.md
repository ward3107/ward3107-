# Particle Text Studio

Static, installable web app (PWA) for creating particle and solid-font text effects and exporting them as video, PNG or embeddable code. No build step.

- Interface in Hebrew, Arabic, Russian and English; text in any of those scripts.
- 19 particle effects and 23 solid-font styles, scenes with cross-fades, logo and background images, own font upload, music in exported video.
- Everything runs in the browser. Nothing is uploaded anywhere.

## Deploy

Serve this folder as-is, e.g. `npx vercel --prod` from inside it (see `vercel.json` for the cache headers).

## Smoke test

```
npm i -D playwright && npx playwright install chromium
node particle-text-studio/tests/smoke.mjs
```
