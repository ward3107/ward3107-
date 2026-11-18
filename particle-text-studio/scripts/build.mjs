// Assembles src/ into the single deployable index.html.
//   node scripts/build.mjs          minified (needs: npm install)
//   node scripts/build.mjs --dev    readable output, no dependencies
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(resolve(root, 'src', f), 'utf8');
const dev = process.argv.includes('--dev');

let js = read('engine.js') + '\n' + read('app.js');
js = js.replace('/*__I18N__*/null', () => JSON.stringify(JSON.parse(read('i18n.json'))));

let html = read('template.html')
  .replace('/*__CSS__*/', () => read('base.css').trim())
  .replace('/*__CSS_MAIN__*/', () => read('style.css').trim());

if (!dev) {
  const { minify } = await import('terser');
  const mm = await minify(js, { compress: { passes: 1 }, mangle: true, format: { comments: false, max_line_len: 150 } });
  if (mm.error) throw mm.error;
  js = mm.code;
}
html = html.replace('/*__ENGINE__*/\n/*__APP__*/', () => js);
if (!dev) {
  const hm = await import('html-minifier-terser');
  html = await hm.minify(html, { collapseWhitespace: false, removeComments: true, minifyCSS: true, minifyJS: false });
}
writeFileSync(resolve(root, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB', dev ? '(dev)' : '(minified)');
