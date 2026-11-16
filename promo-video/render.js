// Renders render.html frame-by-frame (deterministic) and encodes an MP4 with ffmpeg.
// Usage: node render.js [width] [height] [fps] [out.mp4]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const W = +process.argv[2] || 1920, H = +process.argv[3] || 1080, FPS = +process.argv[4] || 30;
const OUT = process.argv[5] || path.join(__dirname, 'led-promo.mp4');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto('file://' + path.join(__dirname, 'render.html'));
  await page.waitForFunction('window.READY === true');
  const heebo = await page.evaluate(() => document.fonts.check('900 40px Heebo'));
  console.log('Heebo loaded:', heebo);
  const DUR = await page.evaluate('window.DUR');
  const frames = Math.round(DUR * FPS);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));

  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log('wrote', OUT);
})();
