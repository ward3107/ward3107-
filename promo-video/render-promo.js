// Parallel, deterministic frame-by-frame renderer: render-promo.html -> silent MP4.
// Usage: node render-promo.js <ar|he> [out.mp4] [width] [height] [fps] [workers]
const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const isWorker = process.argv[2] === '--worker';
const A = isWorker ? process.argv.slice(3) : process.argv.slice(2);
const URL = lang => 'file://' + path.join(__dirname, 'render-promo.html') + '?lang=' + lang;

async function renderChunk(lang, W, H, FPS, f0, f1, out) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto(URL(lang));
  await page.waitForFunction('window.READY === true');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-g', String(FPS), out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  for (let i = f0; i < f1; i++) {
    await page.evaluate(t => window.seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done; await browser.close();
}

(async () => {
  const lang = A[0] === 'he' ? 'he' : 'ar';
  if (isWorker) { await renderChunk(lang, +A[1], +A[2], +A[3], +A[4], +A[5], A[6]); return; }
  const OUT = A[1] || path.join(__dirname, '..', 'landing', 'media', `led-promo-${lang}.mp4`);
  const W = +A[2] || 1920, H = +A[3] || 1080, FPS = +A[4] || 30, N = +A[5] || os.cpus().length;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto(URL(lang)); await p.waitForFunction('window.READY === true');
  const frames = Math.round((await p.evaluate('window.DUR')) * FPS); await b.close();

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-'));
  const per = Math.ceil(frames / N), parts = [];
  await Promise.all(Array.from({ length: N }, (_, k) => new Promise((res, rej) => {
    const f0 = k * per, f1 = Math.min(frames, f0 + per); if (f0 >= f1) return res();
    const out = path.join(tmp, `part${k}.mp4`); parts[k] = out;
    spawn(process.execPath, [__filename, '--worker', lang, W, H, FPS, f0, f1, out], { stdio: 'inherit' })
      .on('close', c => c ? rej(new Error('worker ' + k + ' failed')) : res());
  })));
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, parts.filter(Boolean).map(f => `file '${f}'`).join('\n'));
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  if (r.status) throw new Error('concat failed');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT, frames, 'frames,', lang);
})().catch(e => { console.error(e); process.exit(1); });
