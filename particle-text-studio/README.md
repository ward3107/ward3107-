# Particle Text Studio

Static, installable web app (PWA) for creating particle and solid-font text effects and exporting them as video, GIF, PNG or embeddable code. No backend.

- Interface in Hebrew, Arabic, Russian and English; text in any of those scripts.
- 19 particle effects and 23 solid-font styles, scenes with cross-fades, extra text layers per scene, logo and background images, own font upload.
- Music in exported video, with an optional beat sync (the text pulses with the bass).
- Export: MP4 / WebM (frame-exact, WebCodecs), GIF (own encoder), PNG, embeddable code, JSON.
- Projects: saved in the browser (IndexedDB) or as a project file.
- Everything runs in the browser. Nothing is uploaded anywhere.

## Layout

```
src/template.html   page markup and script/style placeholders
src/base.css        tiny base styles
src/style.css       app styles
src/engine.js       the rendering engine (also embedded verbatim in exported code)
src/app.js          the page: state, UI, export, projects
src/i18n.json       translations, keyed by the Hebrew source string
scripts/build.mjs   assembles src/ into index.html
scripts/check-fonts.py  checks the font script table against Google Fonts
tests/smoke.mjs     browser smoke test
```

`index.html` is generated; edit `src/` and rebuild.

## Build

```
npm install
npm run build        # minified index.html
npm run build:dev    # readable index.html, no dependencies needed
```

## Deploy

Serve this folder as-is, e.g. `npx vercel --prod` from inside it (`vercel.json` sets the cache headers), or drag it to Netlify Drop.

## Tests

```
npm install && npx playwright install chromium
npm test
npm run check-fonts   # needs network
```

The smoke test covers effects, Hebrew / Arabic / Russian text, text layers, saved projects and project files, GIF export, full UI translation and page errors.

## Known limits

- Arabic and Russian interface strings were written without a native-speaker review.
- Beat sync is available in the preview and in exported video, not in the embeddable code.
- GIF export is limited to 640 px on the long side and 20 fps, and has no sound.
- Projects are stored per browser. There is no account or cloud storage.
