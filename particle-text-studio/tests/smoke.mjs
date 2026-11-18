// Smoke test for Particle Text Studio. Needs Playwright:  npm i -D playwright && npx playwright install chromium
// Run from the repository root:  node particle-text-studio/tests/smoke.mjs [path-to-index.html]
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(process.argv[2] || resolve(here, '../index.html'));
const failures = [];
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) failures.push(msg); };

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + file);
await page.waitForTimeout(2500);

const inkAt = async (ms) => {
  await page.waitForTimeout(ms);
  return page.evaluate(() => {
    const c = document.querySelector('#stage canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let s = 0; for (let i = 0; i < d.length; i += 40) s += d[i] + d[i + 1] + d[i + 2];
    return s;
  });
};

check((await page.$$('#modes .chip')).length >= 42, 'effect list has 42+ effects');
check((await page.$$('#presets .chip')).length >= 20, 'preset list is populated');
check(await inkAt(500) > 0, 'default effect draws something');

for (const mode of [3, 14, 19, 27, 36, 40]) {
  await page.evaluate((m) => document.querySelector(`#modes .chip[data-v="${m}"]`).click(), mode);
  check(await inkAt(2500) > 0, `effect ${mode} draws something`);
}

await page.fill('#txt', 'שלום مرحبا Привет');
check(await inkAt(2500) > 0, 'Hebrew + Arabic + Russian text draws');

for (const lang of ['ar', 'ru', 'en', 'he']) {
  await page.click(`#langs .chip[lang="${lang}"]`);
  const left = await page.evaluate((l) => {
    if (l === 'he') return 0;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, c = 0;
    while ((n = w.nextNode())) { const p = n.parentNode; if (/SCRIPT|STYLE|TEXTAREA/.test(p.nodeName) || p.closest('[data-notr], #scenes')) continue; /* scene labels show the user's own text */ if (/[֐-׿]/.test(n.nodeValue)) c++; }
    return c;
  }, lang);
  check(left === 0, `UI fully translated (${lang})`);
}

await page.click('#kinds .chip[data-v="json"]');
await page.waitForTimeout(400);
let ok = true; try { JSON.parse(await page.inputValue('#code')); } catch { ok = false; }
check(ok, 'settings export is valid JSON');

check(errors.length === 0, 'no uncaught page errors' + (errors.length ? ': ' + errors[0] : ''));
await browser.close();
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll checks passed');
