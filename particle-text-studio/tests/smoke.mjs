// Smoke test for Particle Text Studio. Needs Playwright:  npm i -D playwright && npx playwright install chromium
// Run from the repository root:  node particle-text-studio/tests/smoke.mjs [path-to-index.html]
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(process.argv[2] || resolve(here, '../index.html'));
const failures = [];
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) failures.push(msg); };

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage();
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

// extra text layers
await page.click('#layerAdd');
await page.fill('#layerList .layer .lt', 'SUB');
check((await page.$$('#layerList .layer')).length === 1, 'a text layer can be added');
await page.click('#kinds .chip[data-v="json"]');
await page.waitForTimeout(400);
check((await page.inputValue('#code')).includes('"layers"'), 'layers are part of the exported settings');
check(await inkAt(1500) > 0, 'a scene with a layer draws');

// saved projects (IndexedDB) and project files
await page.fill('#projName', 'smoke');
await page.click('#projSave');
await page.waitForTimeout(600);
check((await page.$$eval('#projList option', (o) => o.map((x) => x.value))).includes('smoke'), 'project is saved in the browser');
await page.click('#layerList .layer button');
await page.waitForTimeout(300);
check((await page.$$('#layerList .layer')).length === 0, 'a text layer can be deleted');
await page.click('#projLoad');
await page.waitForTimeout(1200);
check((await page.$$('#layerList .layer')).length === 1, 'opening the saved project restores the layer');
const [pf] = await Promise.all([page.waitForEvent('download'), page.click('#projExport')]);
const projJson = JSON.parse(await readFile(await pf.path(), 'utf8'));
check(projJson.app === 'particle-text-studio' && projJson.scenes[0].d.layers.length === 1, 'project file has the scenes and layers');

// GIF export
const gifOpt = (await page.$$eval('#vfmt option', (o) => o.map((x) => [x.value, x.textContent]))).find((x) => /GIF/.test(x[1]));
check(!!gifOpt, 'GIF format is offered');
await page.selectOption('#vfmt', gifOpt[0]);
await page.selectOption('#vres', '1280x720');
await page.selectOption('#vdur', '5');
await page.click('#vrec');
await page.waitForSelector('#vsave:not([hidden])', { timeout: 120000 });
const [gf] = await Promise.all([page.waitForEvent('download'), page.click('#vsave')]);
const gifBytes = await readFile(await gf.path());
check(gifBytes.subarray(0, 6).toString() === 'GIF89a' && gifBytes[gifBytes.length - 1] === 0x3b && gifBytes.length > 5000, 'GIF export is a complete GIF89a file');

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
