/* ================= Page ================= */
(function () {
  var PT = enginePack();
  var $ = function (s) { return document.querySelector(s); };
  var stage = $('#stage');

  var I18N = /*__I18N__*/null;;

  var PALETTES = {
    ice:    { name: 'קרח',     accent: '#4cc9ff', stops: ['#1f6bff', '#4cc9ff', '#e2f8ff', '#5a7dff'] },
    neon:   { name: 'ניאון',    accent: '#ff4de0', stops: ['#ff2bd6', '#7a5cff', '#ffffff', '#00e5ff'] },
    ember:  { name: 'להבה',    accent: '#ff9100', stops: ['#ff3d00', '#ff9100', '#fff0b0', '#ff4f7b'] },
    gold:   { name: 'זהב',     accent: '#ffd76a', stops: ['#c58a12', '#ffd76a', '#fff8dc', '#e8a92a'] },
    aurora: { name: 'זוהר',    accent: '#03e1ff', stops: ['#9b5cff', '#00c8ff', '#d6fff3', '#00ff9d'] },
    sunset: { name: 'שקיעה',   accent: '#ffb36b', stops: ['#ff5f6d', '#ffc371', '#fff1c1', '#845ec2'] },
    matrix: { name: 'מטריקס',  accent: '#39ff6a', stops: ['#008f11', '#00ff41', '#d2ffd9', '#00b82e'] },
    mono:   { name: 'כסף',     accent: '#c9d4e6', stops: ['#7f8ca6', '#dfe6f3', '#ffffff', '#a9b6cc'] },
    custom: { name: 'צבעים משלי', accent: '#00e5ff', stops: null }
  };
  var MODES = ['פירוק לחלקיקים', 'ריצוד צבעים', 'פיצוץ והרכבה', 'גליץ׳ דיגיטלי', 'גל זורם', 'חול נופל', 'מערבולת', 'גחלים עולות', 'הדפסה בניצוצות', 'ברק חשמלי', 'מסע בין כוכבים', 'נפילה וקפיצה', 'סריקת לייזר', 'אדווה', 'דופק', 'זום קולנועי', 'סיבוב תלת־ממד', 'התגלות מנצנצת', 'פוקוס',
    'ניאון זוהר', 'תלת־ממד מוצק', 'מתכת כרום', 'קו מתאר מצייר', 'מעבר צבעים זורם', 'זכוכית', 'רטרו שנות ה-80', 'גליץ׳ RGB', 'אותיות קופצות', 'זרקור', 'השתקפות', 'צל ארוך', 'מכונת כתיבה עם סמן',
    'אש בוערת', 'גלי מים', 'תבליט אבן', 'שכבות נייר', 'שלט LED', 'פרוסות', 'פיקסלציה', 'נמס', 'הולוגרמה', 'מדבקה'];
  /* [family, default weight, scripts it covers: l = Latin, c = Cyrillic, h = Hebrew, a = Arabic] */
  var FONTLIST = [
    ['Montserrat', 800, 'lc'], ['Anton', 400, 'l'], ['Bebas Neue', 400, 'l'], ['Oswald', 700, 'lc'], ['Archivo Black', 400, 'l'],
    ['Bungee', 400, 'l'], ['Black Ops One', 400, 'l'], ['Russo One', 400, 'lc'], ['Alfa Slab One', 400, 'l'], ['Titan One', 400, 'l'],
    ['Orbitron', 800, 'l'], ['Audiowide', 400, 'l'], ['Michroma', 400, 'l'], ['Syncopate', 700, 'l'], ['Unbounded', 800, 'lc'],
    ['Exo 2', 800, 'lc'], ['Rajdhani', 700, 'l'], ['Press Start 2P', 400, 'lc'], ['Share Tech Mono', 400, 'l'], ['Space Grotesk', 700, 'l'],
    ['Playfair Display', 800, 'lc'], ['Cinzel', 800, 'l'], ['Abril Fatface', 400, 'l'], ['Cormorant Garamond', 700, 'lc'], ['DM Serif Display', 400, 'l'],
    ['Pacifico', 400, 'lc'], ['Lobster', 400, 'lc'], ['Permanent Marker', 400, 'l'], ['Caveat', 700, 'lc'], ['Righteous', 400, 'l'],
    ['Poppins', 800, 'l'], ['Raleway', 800, 'lc'], ['Sora', 800, 'l'], ['Outfit', 800, 'l'],
    ['Rubik', 800, 'lhac'], ['Heebo', 800, 'lh'], ['Assistant', 800, 'lh'], ['Alef', 700, 'lh'], ['Secular One', 400, 'lh'], ['Suez One', 400, 'lh'],
    ['Karantina', 700, 'lh'], ['Frank Ruhl Libre', 900, 'lh'], ['Varela Round', 400, 'lh'], ['Miriam Libre', 700, 'lh'], ['David Libre', 700, 'lh'],
    ['Open Sans', 800, 'lch'], ['Amatic SC', 700, 'lhc'],
    ['Cairo', 900, 'la'], ['Tajawal', 800, 'la'], ['Almarai', 800, 'la'], ['Changa', 800, 'la'], ['Lalezar', 400, 'la'], ['Reem Kufi', 700, 'la'],
    ['Amiri', 700, 'la'], ['El Messiri', 700, 'lac'], ['Aref Ruqaa', 700, 'la'], ['Lemonada', 700, 'la'], ['Markazi Text', 700, 'la'], ['Noto Kufi Arabic', 800, 'la'],
    ['Rubik Mono One', 400, 'lc'], ['Comfortaa', 700, 'lc'], ['Jura', 700, 'lc'], ['Yeseva One', 400, 'lc'], ['Stalinist One', 400, 'lc'],
    ['Fira Sans Extra Condensed', 800, 'lc'], ['Philosopher', 700, 'lc'], ['Neucha', 400, 'lc'], ['Bad Script', 400, 'lc'], ['Marck Script', 400, 'lc']
  ];
  var FONTSCR = {};
  FONTLIST.forEach(function (f) { FONTSCR[f[0]] = f[2]; });
  var FONTMAP = {};
  FONTLIST.forEach(function (f) { FONTMAP[f[0]] = f[1]; });

  /* which scripts does a piece of text need? (l, h, a, c) */
  function scriptsOf(text) {
    var r = '';
    if (/[A-Za-z0-9\u00C0-\u024F]/.test(text)) r += 'l';
    if (/[\u0590-\u05FF]/.test(text)) r += 'h';
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) r += 'a';
    if (/[\u0400-\u052F]/.test(text)) r += 'c';
    return r;
  }
  function supports(fam, need) {
    var have = FONTSCR[fam];
    if (!have) return true;
    for (var i = 0; i < need.length; i++) if (have.indexOf(need[i]) < 0) return false;
    return true;
  }
  var TEXT_OK = /[^\x20-\x7E\u00A0-\u024F\u0400-\u052F\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200E\u200F\n]/g;

  var S = {
    text: 'VFX', mode: 0, pal: 'ice', custom: ['#ff2d95', '#7a5cff', '#00e5ff'],
    family: 'Montserrat', weightSel: 0, step: 3, speed: 1, glow: 1, size: 0.76,
    shape: 'round', bg: 'black', loop: true, kind: 'embed', image: '', imgColors: true, fscript: 'all',
    ox: 0, oy: 0, rot: 0, bgType: 'none', bgA: '#0b1020', bgB: '#1b2a6b', bgImg: '', bgDim: 0.35, fontData: '', hybrid: false, fade: 0, quality: 'auto', layers: [], beat: false, beatAmt: 0.6
  };
  var moveMode = false;
  var S0 = JSON.parse(JSON.stringify(S));

  function stops(d) { d = d || S; return d.pal === 'custom' ? d.custom.slice() : PALETTES[d.pal].stops.slice(); }
  function effWeight(d) { d = d || S; return d.weightSel || FONTMAP[d.family] || 700; }
  /* picks the font actually used: the chosen one, or a close substitute when it has no glyphs for the text's script */
  function resolveFont(d) {
    d = d || S;
    var need = d.image ? '' : scriptsOf(d.text);
    if (!need || supports(d.family, need)) return { family: d.family, weight: effWeight(d), sub: false };
    var ladder = ['Montserrat', 'Heebo', 'Cairo', 'Open Sans', 'El Messiri', 'Rubik'], i;
    for (i = 0; i < ladder.length; i++) if (supports(ladder[i], need)) return { family: ladder[i], weight: FONTMAP[ladder[i]], sub: true };
    return { family: 'Rubik', weight: 800, sub: true };
  }
  function fontPatch(d) { var r = resolveFont(d); return { family: r.family, weight: r.weight }; }
  function cfgFor(d) {
    d = d || S;
    var rf = resolveFont(d);
    return {
      text: d.text, mode: d.mode, stops: stops(d), family: rf.family, weight: rf.weight, step: d.step,
      speed: d.speed, glow: d.glow, shape: d.shape, bg: d.bg, loop: d.loop, size: d.size, interactive: !moveMode, image: d.image, imgColors: d.imgColors,
      ox: d.ox, oy: d.oy, rot: d.rot, bgType: d.bgType, bgA: d.bgA, bgB: d.bgB, bgImg: d.bgImg, bgDim: d.bgDim, hybrid: d.hybrid, fontData: d.fontData
    };
  }
  function setMsg(el, text, err) { el.textContent = text || ''; el.className = 'msg' + (err ? ' err' : ''); }

  /* ---------- interface language (Hebrew text is the translation key) ---------- */
  var LANGS = { he: { name: 'עברית', dir: 'rtl' }, ar: { name: 'العربية', dir: 'rtl' }, ru: { name: 'Русский', dir: 'ltr' }, en: { name: 'English', dir: 'ltr' } };
  var lang = 'he';
  try {
    var sl = localStorage.getItem('ptx-lang'), nl0 = (navigator.language || '').slice(0, 2).toLowerCase();
    if (sl && LANGS[sl]) lang = sl; else if (nl0 === 'ar' || nl0 === 'ru') lang = nl0;
  } catch (e) {}
  function t(key, vars) {
    var d = I18N[lang], str = (lang !== 'he' && d && d[key]) || key;
    if (vars) str = str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return str;
  }
  var HEB = /[\u0590-\u05FF]/, origNode = new WeakMap();
  function translateDOM(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (nd) {
      var par = nd.parentNode;
      if (!par || /^(SCRIPT|STYLE|TEXTAREA)$/.test(par.nodeName) || (par.closest && par.closest('[data-notr]'))) return;
      var rec = origNode.get(nd);
      if (!rec) {
        var raw = nd.nodeValue, key = raw.replace(/\s+/g, ' ').trim();
        if (!HEB.test(key)) return;
        rec = { key: key, lead: /^\s/.test(raw) ? ' ' : '', trail: /\s$/.test(raw) ? ' ' : '' };
        origNode.set(nd, rec);
      }
      nd.nodeValue = rec.lead + t(rec.key) + rec.trail;
    });
    Array.prototype.forEach.call(root.querySelectorAll('[aria-label],[placeholder],[title]'), function (el) {
      if (el.closest && el.closest('[data-notr]')) return;
      ['aria-label', 'placeholder', 'title'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v === null) return;
        var o = el.getAttribute('data-o-' + a);
        if (o === null) { if (!HEB.test(v)) return; o = v; el.setAttribute('data-o-' + a, o); }
        el.setAttribute(a, t(o));
      });
    });
  }


  /* ---------- scenes: data model, remembered in this browser ---------- */
  var DESIGN_KEYS = ['text', 'mode', 'pal', 'custom', 'family', 'weightSel', 'step', 'speed', 'glow', 'size', 'shape', 'bg', 'loop', 'image', 'imgColors', 'ox', 'oy', 'rot', 'bgType', 'bgA', 'bgB', 'bgImg', 'bgDim', 'hybrid', 'fontData', 'layers'];
  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function pickDesign(d) { var o = {}; DESIGN_KEYS.forEach(function (k) { o[k] = clone(d[k] !== undefined ? d[k] : S0[k]); }); return o; }
  function mergeDesign(src) {
    var d = pickDesign(S0);
    if (src && typeof src === 'object') DESIGN_KEYS.forEach(function (key) {
      if (src[key] !== undefined && typeof src[key] === typeof d[key] && (key !== 'pal' || PALETTES[src[key]]) && (key !== 'mode' || (src[key] >= 0 && src[key] < MODES.length))) d[key] = clone(src[key]);
    });
    d.layers = (src && Array.isArray(src.layers)) ? src.layers.slice(0, 4).map(sanitizeLayer) : [];
    return d;
  }
  function sanitizeLayer(l) {
    l = l || {};
    var num = function (v, a, b, def) { v = Number(v); return isFinite(v) ? Math.max(a, Math.min(b, v)) : def; };
    return {
      text: typeof l.text === 'string' ? l.text.replace(TEXT_OK, '').slice(0, 120) : '',
      mode: (typeof l.mode === 'number' && l.mode >= 0 && l.mode < MODES.length) ? l.mode : 0,
      pal: (typeof l.pal === 'string' && PALETTES[l.pal] && PALETTES[l.pal].stops) ? l.pal : 'ice',
      size: num(l.size, 0.2, 0.95, 0.45), ox: num(l.ox, -50, 50, 0), oy: num(l.oy, -50, 50, 28), delay: num(l.delay, 0, 30, 0.6)
    };
  }
  function layerFromCfg(c) {
    var m = Object.keys(PALETTES).filter(function (k) { return PALETTES[k].stops && Array.isArray(c.stops) && PALETTES[k].stops.join() === c.stops.join(); })[0];
    return sanitizeLayer({ text: c.text, mode: c.mode, pal: m, size: c.size, ox: c.ox, oy: c.oy, delay: c.delay });
  }
  /* an extra layer is a full effect of its own, built from the scene's design with the layer's own text, effect, colors, size and position */
  function layerCfg(d, l) {
    var base = cfgFor(Object.assign({}, d, { text: l.text, mode: l.mode, pal: l.pal, size: l.size, ox: l.ox, oy: l.oy, rot: 0, image: '', bgType: 'none', bg: 'transparent', hybrid: false }));
    base.interactive = false; base.delay = l.delay;
    return base;
  }
  function layerCfgs(d) { return (d.layers || []).map(function (l) { return layerCfg(d, l); }); }
  function sceneSpec(sc, dur) { var o = { cfg: cfgFor(sc.d), dur: dur === undefined ? sc.dur : dur }, lc = layerCfgs(sc.d); if (lc.length) o.layers = lc; return o; }
  /* a scene lasts as long as one full run of its effect */
  function defaultDur(d) {
    var r = PT.create(document.createElement('canvas'), cfgFor(d)).recDuration() / d.speed;
    if (!d.loop) r = Math.min(r, 5);
    return Math.max(2.5, Math.round(r * 2) / 2);
  }
  var scenes = [], cur = 0;
  try {
    var sv = JSON.parse(localStorage.getItem('ptx-v2') || localStorage.getItem('ptx-v1') || 'null');
    var hm = (location.hash || '').match(/^#p=([\w-]+)$/);
    if (hm) {
      try {
        var shared = JSON.parse(decodeURIComponent(escape(atob(hm[1].replace(/-/g, '+').replace(/_/g, '/')))));
        if (shared && Array.isArray(shared.scenes)) sv = shared;
      } catch (e3) {}
    }
    if (sv && typeof sv === 'object') {
      if (typeof sv.kind === 'string') S.kind = sv.kind;
      if (typeof sv.fade === 'number') S.fade = Math.max(0, Math.min(2, sv.fade));
      if (sv.quality === 'auto' || sv.quality === 'high' || sv.quality === 'low') S.quality = sv.quality;
      if (typeof sv.beat === 'boolean') S.beat = sv.beat;
      if (typeof sv.beatAmt === 'number') S.beatAmt = Math.max(0.2, Math.min(1, sv.beatAmt));
      if (Array.isArray(sv.scenes) && sv.scenes.length) {
        sv.scenes.slice(0, 12).forEach(function (sc) { scenes.push({ d: mergeDesign(sc && sc.d), dur: Math.min(120, Math.max(1, +(sc && sc.dur) || 5)) }); });
        cur = Math.min(scenes.length - 1, Math.max(0, sv.cur | 0));
      } else scenes.push({ d: mergeDesign(sv), dur: 0 });
    }
  } catch (e) {}
  if (!scenes.length) scenes.push({ d: pickDesign(S0), dur: 0 });
  scenes.forEach(function (sc) { if (/^Custom /.test(sc.d.family) && !sc.d.fontData) sc.d.family = 'Montserrat'; });
  Object.assign(S, clone(scenes[cur].d));
  scenes.forEach(function (sc) { if (!sc.dur) sc.dur = defaultDur(sc.d); });

  function commit() { scenes[cur].d = pickDesign(S); }
  function persist() {
    commit();
    function lean(d, strip) { var o = clone(d); ['image', 'bgImg', 'fontData'].forEach(function (key) { if (strip || (o[key] && o[key].length > 600000)) o[key] = ''; }); if (/^Custom /.test(o.family) && !o.fontData) o.family = 'Montserrat'; return o; }
    var payload = { kind: S.kind, cur: cur, fade: S.fade, quality: S.quality, beat: S.beat, beatAmt: S.beatAmt, scenes: scenes.map(function (sc) { return { d: lean(sc.d, false), dur: sc.dur }; }) };
    try { localStorage.setItem('ptx-v2', JSON.stringify(payload)); }
    catch (e) {
      try { payload.scenes = scenes.map(function (sc) { return { d: lean(sc.d, true), dur: sc.dur }; }); localStorage.setItem('ptx-v2', JSON.stringify(payload)); } catch (e2) {}
    }
  }
  function syncControls() {
    $('#txt').value = S.text; $('#den').value = 7 - S.step; $('#spd').value = S.speed; $('#glow').value = S.glow;
    $('#size').value = Math.round(S.size * 100); $('#wt').value = String(S.weightSel);
    ['c1', 'c2', 'c3'].forEach(function (id, i) { $('#' + id).value = S.custom[i]; });
    $('#imgName').textContent = S.image ? t('לוגו נטען') : ''; $('#imgClear').hidden = !S.image;
    $('#imgcols').hidden = !S.image; $('#txt').disabled = !!S.image; $('#txt').style.opacity = S.image ? 0.45 : 1;
    $('#ox').value = S.ox; $('#oy').value = S.oy; $('#rot').value = S.rot; $('#bga').value = S.bgA; $('#bgb').value = S.bgB; $('#bgdim').value = Math.round(S.bgDim * 100);
    $('#bgcolors').hidden = !(S.bgType === 'color' || S.bgType === 'gradient'); $('#bgb').hidden = S.bgType !== 'gradient';
    $('#bgimgrow').hidden = S.bgType !== 'image'; $('#bgdimrow').hidden = S.bgType !== 'image'; $('#bgimgClear').hidden = !S.bgImg;
    $('#fontClear').hidden = !S.fontData; $('#fadesel').value = String(S.fade); $('#qual').value = S.quality;
    $('#hybridRow').hidden = S.mode < 19 || !!S.image; $('#hybrid').setAttribute('aria-pressed', S.hybrid ? 'true' : 'false');
    $('#beatBtn').setAttribute('aria-pressed', S.beat ? 'true' : 'false'); $('#beatAmt').value = Math.round(S.beatAmt * 100);
    renderLayers();
    updateVals();
  }
  function updateVals() {
    var set = function (id, txt) { var el = $('#v-' + id); if (el) el.textContent = txt; };
    set('den', $('#den').value); set('spd', Number($('#spd').value).toFixed(1) + '×'); set('glow', Number($('#glow').value).toFixed(1));
    set('size', $('#size').value + '%'); set('ox', $('#ox').value + '%'); set('oy', $('#oy').value + '%'); set('rot', $('#rot').value + '°');
    set('bgdim', $('#bgdim').value + '%'); set('avol', $('#avol').value + '%'); set('beatAmt', $('#beatAmt').value + '%');
  }
  syncControls();

  /* ---------- live preview ---------- */
  var fmsg = $('#fmsg');
  var playAll = false, playingIdx = -1;
  function sceneSpecs() { return { scenes: scenes.map(function (sc) { return sceneSpec(sc); }), fade: S.fade, quality: S.quality }; }
  var mountHooks = {
    onBuilt: function (r) {
      if (!r.ok) setMsg(fmsg, t('הגופן "{name}" לא נמצא ב-Google Fonts, מוצג גופן גיבוי.', { name: resolveFont(S).family }), true);
      else updateFontHint();
    },
    onQuality: function () { setMsg($('#vmsg'), t('המכשיר נראה איטי, עברנו למצב חסכוני.')); $('#qual').value = 'low'; S.quality = 'low'; },
    onScene: function (i) {
      playingIdx = i;
      Array.prototype.forEach.call(document.querySelectorAll('#scenes .chip'), function (c, k) { c.classList.toggle('playing', playAll && k === i); });
    }
  };
  var pt = PT.mount(stage, sceneSpecs(), mountHooks);
  pt.select(cur); pt.setPlayAll(false);

  /* ---------- chips ---------- */
  var groups = {};
  function makeChips(el, group, items) {
    groups[group] = el;
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip' + (it.cls ? ' ' + it.cls : '');
      b.innerHTML = it.html; b.dataset.v = String(it.v);
      if (it.style) b.style.cssText = it.style;
      if (it.title) { b.title = it.title; b.setAttribute('aria-label', it.title); }
      b.addEventListener('click', function () { pick(group, it.v); });
      el.appendChild(b);
    });
  }
  function paint() {
    Object.keys(groups).forEach(function (g) {
      var cur = String(g === 'family' ? S.family : S[g]);
      Array.prototype.forEach.call(groups[g].children, function (c) { c.setAttribute('aria-pressed', c.dataset.v === cur ? 'true' : 'false'); });
    });
    $('#custom').hidden = S.pal !== 'custom';
    $('#hybridRow').hidden = S.mode < 19 || !!S.image; $('#hybrid').setAttribute('aria-pressed', S.hybrid ? 'true' : 'false');
    document.documentElement.style.setProperty('--accent', S.pal === 'custom' ? S.custom[1] : PALETTES[S.pal].accent);
    stage.classList.toggle('transp', S.bg === 'transparent');
  }
  function pick(group, v) {
    if (group === 'mode') { S.mode = Number(v); pt.update({ mode: S.mode }); pt.replay(); }
    else if (group === 'pal') { S.pal = v; pt.update({ stops: stops() }); }
    else if (group === 'family') { S.family = v; pt.update(fontPatch()); pt.replay(); setMsg(fmsg, ''); hintShown = false; }
    else if (group === 'fscript') { S.fscript = v; applyFontFilter(); }
    else if (group === 'shape') { S.shape = v; pt.update({ shape: v }); }
    else if (group === 'bg') { S.bg = v; pt.update({ bg: v }); }
    else if (group === 'loop') { S.loop = (v === 'true' || v === true); pt.update({ loop: S.loop }); pt.replay(); }
    else if (group === 'kind') { S.kind = v; }
    else if (group === 'bgType') { S.bgType = v; pt.update({ bgType: v }); syncControls(); }
    else if (group === 'imgColors') { S.imgColors = (v === 'true' || v === true); pt.update({ imgColors: S.imgColors }); }
    paint(); refreshCode();
  }

  makeChips($('#modes'), 'mode', MODES.map(function (m, i) { return { v: i, html: m }; }));
  (function () {
    var box = $('#modes'), kids = box.children;
    [[0, 'חלקיקים'], [19, 'פונט מלא (האותיות עצמן, בלי חלקיקים)']].forEach(function (g) {
      var lb = document.createElement('span');
      lb.className = 'grp'; lb.textContent = g[1];
      box.insertBefore(lb, kids[g[0] === 0 ? 0 : g[0] + 1]);
    });
  })();
  makeChips($('#pals'), 'pal', Object.keys(PALETTES).map(function (key) {
    var p = PALETTES[key];
    var sw = p.stops ? '<span class="swatch" style="background:linear-gradient(90deg,' + p.stops.join(',') + ')"></span>'
                     : '<span class="swatch" style="background:conic-gradient(from 90deg,#ff2d95,#7a5cff,#00e5ff,#39ff6a,#ffd76a,#ff2d95)"></span>';
    return { v: key, html: sw + p.name };
  }));
  makeChips($('#fonts'), 'family', FONTLIST.map(function (f) {
    return { v: f[0], html: f[0], cls: 'fnt', style: 'font-family:"' + f[0] + '",system-ui,sans-serif;font-weight:' + f[1] };
  }));
  makeChips($('#fscripts'), 'fscript', [{ v: 'all', html: 'כל הגופנים' }, { v: 'l', html: 'לטינית' }, { v: 'h', html: 'עברית' }, { v: 'a', html: 'ערבית' }, { v: 'c', html: 'רוסית' }]);
  makeChips($('#bgtypes'), 'bgType', [{ v: 'none', html: 'ללא' }, { v: 'color', html: 'צבע אחיד' }, { v: 'gradient', html: 'גרדיינט' }, { v: 'image', html: 'תמונה' }]);
  makeChips($('#shapes'), 'shape', [{ v: 'round', html: 'עיגולים' }, { v: 'square', html: 'ריבועים' }]);
  makeChips($('#bgs'), 'bg', [{ v: 'black', html: 'שחור' }, { v: 'transparent', html: 'שקוף (אתר, PNG, WebM)' }]);
  makeChips($('#imgcols'), 'imgColors', [{ v: 'true', html: 'צבעי הלוגו המקוריים' }, { v: 'false', html: 'צבעי הפלטה' }]);
  makeChips($('#loops'), 'loop', [{ v: 'true', html: 'חוזר בלולאה' }, { v: 'false', html: 'מתאסף ונשאר' }]);

  /* load all curated fonts in the background so each chip shows its own face */
  function applyFontFilter() {
    Array.prototype.forEach.call(groups.family.children, function (c) {
      var sc = FONTSCR[c.dataset.v];
      c.hidden = !(S.fscript === 'all' || !sc || sc.indexOf(S.fscript) >= 0);
    });
  }
  if (window.IntersectionObserver) {
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { fio.unobserve(en.target); PT.loadFont(en.target.dataset.v, FONTMAP[en.target.dataset.v] || 700); } });
    }, { root: $('#fonts'), rootMargin: '120px' });
    Array.prototype.forEach.call(groups.family.children, function (c) { fio.observe(c); });
  } else {
    FONTLIST.forEach(function (f, i) { setTimeout(function () { PT.loadFont(f[0], f[1]); }, 600 + i * 140); });
  }
  applyFontFilter();
  var hintShown = false;
  function updateFontHint() {
    var r = resolveFont(S);
    if (r.sub) { setMsg(fmsg, t('הגופן {a} לא תומך בכתב של הטקסט, ולכן מוצג {b}.', { a: S.family, b: r.family })); hintShown = true; }
    else if (hintShown) { setMsg(fmsg, ''); hintShown = false; }
  }

  if (!FONTMAP[S.family]) addFontChip(S.family, S.weightSel || 700);

  /* ---------- scene list ---------- */
  var sceneBox = $('#scenes'), sdur = $('#sdur');
  function firstLine(t) { return (t || '').split('\n')[0].trim(); }
  function totalLen() {
    var sum = scenes.reduce(function (a, sc) { return a + sc.dur; }, 0), i;
    for (i = 0; i < scenes.length - 1; i++) sum -= Math.min(S.fade, scenes[i].dur * 0.5, scenes[i + 1].dur * 0.5);
    return Math.max(0, sum);
  }
  function renderScenes() {
    sceneBox.innerHTML = '';
    scenes.forEach(function (sc, i) {
      var d = i === cur ? S : sc.d, b = document.createElement('button');
      b.type = 'button'; b.className = 'chip scene'; b.dataset.i = String(i);
      b.setAttribute('aria-pressed', i === cur ? 'true' : 'false');
      b.textContent = (i + 1) + ' · ' + (d.image ? t('לוגו') : (firstLine(d.text) || t('ריק'))) + ' · ' + sc.dur + ' ' + t('ש׳');
      if (playAll && i === playingIdx) b.classList.add('playing');
      b.addEventListener('click', function () { selectScene(i); });
      sceneBox.appendChild(b);
    });
    if (document.activeElement !== sdur) sdur.value = scenes[cur].dur;
    $('#sDel').disabled = scenes.length < 2; $('#sLeft').disabled = cur === 0; $('#sRight').disabled = cur === scenes.length - 1;
    $('#sAdd').disabled = scenes.length >= 12;
    $('#sTotal').textContent = t('אורך הרצף: {n} שניות', { n: totalLen().toFixed(1) });
  }
  function rebuildMount() {
    pt.destroy();
    pt = PT.mount(stage, sceneSpecs(), mountHooks);
    pt.select(cur); pt.setPlayAll(playAll); syncBeat();
    if (playAll) startMusic();
    renderScenes(); refreshCode();
  }
  function selectScene(i) {
    if (i === cur) return;
    commit(); cur = i; Object.assign(S, clone(scenes[i].d));
    pt.select(i); syncControls(); paint(); setMsg(fmsg, ''); renderScenes(); refreshCode();
  }
  $('#sAdd').addEventListener('click', function () {
    commit();
    scenes.splice(cur + 1, 0, { d: clone(scenes[cur].d), dur: scenes[cur].dur });
    cur += 1; Object.assign(S, clone(scenes[cur].d));
    syncControls(); paint(); rebuildMount();
  });
  $('#sDel').addEventListener('click', function () {
    if (scenes.length < 2) return;
    scenes.splice(cur, 1); cur = Math.min(cur, scenes.length - 1); Object.assign(S, clone(scenes[cur].d));
    syncControls(); paint(); rebuildMount();
  });
  function moveScene(dir) {
    var j = cur + dir; if (j < 0 || j >= scenes.length) return;
    commit(); var t = scenes[cur]; scenes[cur] = scenes[j]; scenes[j] = t; cur = j; rebuildMount();
  }
  $('#sLeft').addEventListener('click', function () { moveScene(-1); });
  $('#sRight').addEventListener('click', function () { moveScene(1); });
  sdur.addEventListener('input', function () {
    var v = Math.min(120, Math.max(1, Number(sdur.value) || 1));
    scenes[cur].dur = v; pt.setDur(cur, v); refreshCode();
  });
  $('#sPlay').addEventListener('click', function () {
    playAll = !playAll; pt.setPlayAll(playAll);
    this.textContent = playAll ? t('■ עצירה וחזרה לסצנה הנבחרת') : t('▶ נגן את כל הרצף');
    if (playAll) startMusic(); else stopMusic();
    renderScenes();
  });
  $('#replay').addEventListener('click', function () { if (playAll) startMusic(); });

  /* ---------- music ---------- */
  var actx = null, musicBuf = null, musicSrc = null, musicGain = null, musicInfo = null, musicEnv = null;
  /* beat envelope at 100 values per second: the bass is isolated, rises above its recent average count as hits, and each hit decays quickly */
  function computeBeat(buf) {
    var sr = buf.sampleRate, nch = Math.min(2, buf.numberOfChannels), hop = Math.max(1, Math.floor(sr / 100)), frames = Math.floor(buf.length / hop);
    if (frames < 30) return null;
    var chs = [], c, f, i;
    for (c = 0; c < nch; c++) chs.push(buf.getChannelData(c));
    var a = 1 - Math.exp(-2 * Math.PI * 160 / sr), y = [0, 0], en = new Float32Array(frames);
    for (f = 0; f < frames; f++) {
      var acc = 0, base = f * hop;
      for (c = 0; c < nch; c++) { var yy = y[c], ch = chs[c]; for (i = 0; i < hop; i++) { yy += a * (ch[base + i] - yy); acc += yy * yy; } y[c] = yy; }
      en[f] = Math.sqrt(acc / hop);
    }
    var pre = new Float64Array(frames + 1), flux = new Float32Array(frames), W = 25;
    for (f = 0; f < frames; f++) pre[f + 1] = pre[f] + en[f];
    for (f = 0; f < frames; f++) { var lo = Math.max(0, f - W), mean = f > lo ? (pre[f] - pre[lo]) / (f - lo) : en[f]; flux[f] = Math.max(0, en[f] - mean * 1.15); }
    var sorted = Float32Array.from(flux).sort(), p = sorted[Math.floor(sorted.length * 0.97)] || sorted[sorted.length - 1];
    if (!(p > 1e-5)) return null;
    var out = new Float32Array(frames), v = 0;
    for (f = 0; f < frames; f++) { v = Math.max(Math.max(0, Math.min(1, flux[f] / p) - 0.15) / 0.85, v * 0.9); out[f] = v; }
    return out;
  }
  function syncBeat() {
    if (!pt) return;
    if (!(S.beat && musicEnv && musicBuf)) { pt.setBeat(null); return; }
    var dur = musicBuf.duration;
    pt.setBeat({ amount: S.beatAmt, at: function (tm) { var tot = totalLen(), len = dur > tot ? tot : dur; return musicEnv[Math.floor((tm % len) * 100)] || 0; } });
  }
  $('#beatBtn').addEventListener('click', function () {
    S.beat = !S.beat; this.setAttribute('aria-pressed', S.beat ? 'true' : 'false');
    if (S.beat && !musicEnv) setMsg($('#mmsg'), t('טענו קובץ מוזיקה כדי שהפעימה תעבוד.'), true); else setMsg($('#mmsg'), t(MUSIC_NOTE));
    syncBeat(); persist();
  });
  $('#beatAmt').addEventListener('input', function (e) { S.beatAmt = Number(e.target.value) / 100; syncBeat(); persist(); });
  var MUSIC_NOTE = 'המוזיקה נכנסת לסרטון המיוצא בהתחלה ובסיום עם עלייה וירידה הדרגתית, ומתנגנת גם בתצוגת הרצף.';
  var LOGO_NOTE = 'הלוגו הופך לחלקיקים, בצבעיו המקוריים או בצבעי הפלטה. עדיף PNG או SVG עם רקע שקוף, ואם אין שקיפות הרקע יוסר אוטומטית.';
  function renderMusicName() { $('#mname').textContent = musicInfo ? musicInfo.name + ' (' + musicInfo.dur + ' ' + t('ש׳') + ')' : ''; }
  function ac() { if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } return actx; }
  function stopMusic() { if (musicSrc) { try { musicSrc.stop(); } catch (e) {} try { musicSrc.disconnect(); } catch (e) {} musicSrc = null; } }
  function startMusic() {
    stopMusic();
    var c = ac(); if (!musicBuf || !c) return;
    var src = c.createBufferSource(), g = c.createGain(), tot = totalLen();
    src.buffer = musicBuf; src.loop = true;
    if (musicBuf.duration > tot) { src.loopStart = 0; src.loopEnd = tot; }
    g.gain.value = Number($('#avol').value) / 100;
    src.connect(g); g.connect(c.destination); musicGain = g;
    if (c.state === 'suspended') c.resume();
    src.start(); musicSrc = src;
  }
  $('#avol').addEventListener('input', function (e) { if (musicGain) musicGain.gain.value = Number(e.target.value) / 100; });
  function loadMusic(f) {
    var mm = $('#mmsg'), c = ac();
    if (!f) return;
    if (!c) { setMsg(mm, t('הדפדפן לא תומך בקבצי שמע.'), true); return; }
    setMsg(mm, t('טוען את המוזיקה...'));
    f.arrayBuffer().then(function (ab) { return c.decodeAudioData(ab); }).then(function (buf) {
      musicBuf = buf; musicInfo = { name: f.name, dur: buf.duration.toFixed(0) }; renderMusicName(); $('#musicClear').hidden = false;
      musicEnv = computeBeat(buf); syncBeat();
      setMsg(mm, t(MUSIC_NOTE));
      if (playAll) startMusic();
    }).catch(function () { setMsg(mm, t('לא ניתן לפענח את קובץ השמע. נסו MP3, WAV או M4A.'), true); });
  }
  $('#music').addEventListener('change', function (e) { loadMusic(e.target.files && e.target.files[0]); });
  $('#musicClear').addEventListener('click', function () {
    stopMusic(); musicBuf = null; musicEnv = null; syncBeat(); $('#music').value = ''; musicInfo = null; renderMusicName(); this.hidden = true;
  });

  /* ---------- position, background, own font, transitions, performance ---------- */
  function setStyleFlag(patch) { pt.update(patch); refreshCode(); }
  ['ox', 'oy', 'rot'].forEach(function (id) {
    $('#' + id).addEventListener('input', function (e) { var u = {}; S[id] = Number(e.target.value); u[id] = S[id]; setStyleFlag(u); });
  });
  $('#posReset').addEventListener('click', function () { S.ox = 0; S.oy = 0; S.rot = 0; syncControls(); setStyleFlag({ ox: 0, oy: 0, rot: 0 }); });
  $('#dragMode').addEventListener('click', function () {
    moveMode = !moveMode; this.setAttribute('aria-pressed', moveMode ? 'true' : 'false');
    stage.style.cursor = moveMode ? 'grab' : ''; stage.style.touchAction = moveMode ? 'none' : '';
    pt.update({ interactive: !moveMode });
  });
  var dragSt = null;
  function clampv(v, a, b) { return Math.max(a, Math.min(b, v)); }
  stage.addEventListener('pointerdown', function (e) {
    if (!moveMode) return;
    dragSt = { x: e.clientX, y: e.clientY, ox: S.ox, oy: S.oy };
    if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
    stage.style.cursor = 'grabbing'; e.preventDefault();
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragSt) return;
    var r = stage.getBoundingClientRect();
    S.ox = Math.round(clampv(dragSt.ox + (e.clientX - dragSt.x) / r.width * 100, -50, 50));
    S.oy = Math.round(clampv(dragSt.oy + (e.clientY - dragSt.y) / r.height * 100, -50, 50));
    $('#ox').value = S.ox; $('#oy').value = S.oy; updateVals(); pt.update({ ox: S.ox, oy: S.oy });
  });
  function endDrag() { if (dragSt) { dragSt = null; stage.style.cursor = moveMode ? 'grab' : ''; refreshCode(); } }
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);

  $('#hybrid').addEventListener('click', function () { S.hybrid = !S.hybrid; this.setAttribute('aria-pressed', S.hybrid ? 'true' : 'false'); pt.update({ hybrid: S.hybrid }); pt.replay(); refreshCode(); });
  $('#bga').addEventListener('input', function (e) { S.bgA = e.target.value; setStyleFlag({ bgA: S.bgA }); });
  $('#bgb').addEventListener('input', function (e) { S.bgB = e.target.value; setStyleFlag({ bgB: S.bgB }); });
  $('#bgdim').addEventListener('input', function (e) { S.bgDim = Number(e.target.value) / 100; setStyleFlag({ bgDim: S.bgDim }); });
  $('#bgimg').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var w = im.naturalWidth || 1280, h = im.naturalHeight || 720, sc = Math.min(1, 1920 / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        S.bgImg = c.toDataURL('image/jpeg', 0.85); S.bgType = 'image'; syncControls(); paint(); pt.update({ bgType: 'image', bgImg: S.bgImg }); refreshCode();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  });
  $('#bgimgClear').addEventListener('click', function () { $('#bgimg').value = ''; S.bgImg = ''; S.bgType = 'none'; syncControls(); paint(); pt.update({ bgType: 'none', bgImg: '' }); refreshCode(); });

  $('#fontfile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 3 * 1048576) { setMsg(fmsg, t('הקובץ גדול מדי (עד 3 MB).'), true); return; }
    var rd = new FileReader();
    rd.onload = function () {
      var name = 'Custom ' + f.name.replace(/\.[^.]+$/, '').replace(/[^\w ]+/g, ' ').trim().slice(0, 24);
      S.fontData = rd.result; S.family = name; FONTMAP[name] = 400;
      pt.update(Object.assign({ fontData: S.fontData }, fontPatch())); pt.replay();
      setMsg(fmsg, t('הגופן נטען: {name}', { name: f.name })); hintShown = false; syncControls(); paint(); refreshCode();
    };
    rd.onerror = function () { setMsg(fmsg, t('לא ניתן לקרוא את קובץ הגופן.'), true); };
    rd.readAsDataURL(f);
  });
  $('#fontClear').addEventListener('click', function () {
    $('#fontfile').value = ''; S.fontData = ''; S.family = 'Montserrat';
    pt.update(Object.assign({ fontData: '' }, fontPatch())); setMsg(fmsg, ''); syncControls(); paint(); refreshCode();
  });
  $('#fadesel').addEventListener('change', function (e) { S.fade = Number(e.target.value); pt.setFade(S.fade); renderScenes(); refreshCode(); });
  $('#qual').addEventListener('change', function (e) { S.quality = e.target.value; pt.setQuality(S.quality); refreshCode(); });
  document.addEventListener('input', updateVals);


  /* ---------- extra text layers ---------- */
  var LAYER_MAX = 4;
  function palOptions() { return Object.keys(PALETTES).filter(function (k) { return PALETTES[k].stops; }).map(function (k) { return '<option value="' + k + '">' + PALETTES[k].name + '</option>'; }).join(''); }
  function modeOptions() { return MODES.map(function (m, i) { return '<option value="' + i + '">' + m + '</option>'; }).join(''); }
  function layerSlider(k, lab, min, max, step) { return '<div class="ctl"><label>' + lab + ' <span class="val" data-v="' + k + '"></span></label><input type="range" class="ls" data-k="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" aria-label="' + lab + '"></div>'; }
  function layerVal(k, v) { return k === 'delay' ? Number(v).toFixed(1) + ' ' + t('ש׳') : Math.round(v) + '%'; }
  function renderLayers() {
    var box = $('#layerList'); if (!box) return;
    box.innerHTML = '';
    (S.layers || []).forEach(function (l, j) {
      var row = document.createElement('div'); row.className = 'layer'; row.dataset.j = String(j);
      row.innerHTML = '<div class="row"><span class="hint"><span>שכבה</span> ' + (j + 2) + '</span><button class="btn lx" type="button">מחיקת השכבה</button></div>' +
        '<input type="text" class="lt" maxlength="120" dir="auto" aria-label="טקסט השכבה" autocomplete="off" spellcheck="false">' +
        '<div class="sl"><div class="ctl"><label>אפקט השכבה</label><select class="lm" aria-label="אפקט השכבה">' + modeOptions() + '</select></div>' +
        '<div class="ctl"><label>צבעי השכבה</label><select class="lp" aria-label="צבעי השכבה">' + palOptions() + '</select></div></div>' +
        '<div class="sl">' + layerSlider('size', 'גודל הטקסט', 25, 95, 1) + layerSlider('ox', 'מיקום אופקי', -50, 50, 1) + layerSlider('oy', 'מיקום אנכי', -50, 50, 1) + layerSlider('delay', 'עיכוב הופעה', 0, 10, 0.1) + '</div>';
      row.querySelector('.lt').value = l.text; row.querySelector('.lm').value = String(l.mode); row.querySelector('.lp').value = l.pal;
      [['size', l.size * 100], ['ox', l.ox], ['oy', l.oy], ['delay', l.delay]].forEach(function (kv) {
        row.querySelector('.ls[data-k="' + kv[0] + '"]').value = kv[1];
        row.querySelector('.val[data-v="' + kv[0] + '"]').textContent = layerVal(kv[0], kv[1]);
      });
      box.appendChild(row);
    });
    if (lang !== 'he') translateDOM(box);
    $('#layerAdd').disabled = (S.layers || []).length >= LAYER_MAX;
  }
  function onLayerInput(e) {
    var tg = e.target, row = tg.closest && tg.closest('.layer');
    if (!row) return;
    var j = Number(row.dataset.j), l = S.layers[j], patch = null, k;
    if (!l) return;
    if (tg.classList.contains('lt')) { if (e.type === 'change') return; l.text = tg.value.replace(TEXT_OK, ''); patch = { text: l.text }; }
    else if (tg.classList.contains('lm')) { l.mode = Number(tg.value); patch = { mode: l.mode }; }
    else if (tg.classList.contains('lp')) { l.pal = tg.value; patch = { stops: PALETTES[l.pal].stops.slice() }; }
    else if (tg.classList.contains('ls')) {
      k = tg.dataset.k; var v = Number(tg.value);
      if (k === 'size') { l.size = v / 100; patch = { size: l.size }; } else { l[k] = v; patch = {}; patch[k] = v; }
      row.querySelector('.val[data-v="' + k + '"]').textContent = layerVal(k, v);
    }
    if (!patch) return;
    pt.updateLayer(j, patch);
    if (patch.mode !== undefined) pt.replay();
    refreshCode();
  }
  $('#layerList').addEventListener('input', onLayerInput);
  $('#layerList').addEventListener('change', onLayerInput);
  $('#layerList').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.lx'), row = b && b.closest('.layer');
    if (!row) return;
    S.layers.splice(Number(row.dataset.j), 1); renderLayers(); rebuildMount();
  });
  $('#layerAdd').addEventListener('click', function () {
    if (S.layers.length >= LAYER_MAX) return;
    S.layers.push(sanitizeLayer({ text: 'NEW', mode: S.mode, pal: S.pal === 'custom' ? 'ice' : S.pal, size: 0.4, ox: 0, oy: 28, delay: 0.6 }));
    renderLayers(); rebuildMount();
  });
  renderLayers();

  /* ---------- GIF export: own encoder (median-cut palette + LZW), no libraries ---------- */
  function gifPalette(hist, nCol) {
    var items = [], k;
    for (k = 0; k < 32768; k++) if (hist[k]) items.push(k);
    if (!items.length) items.push(0);
    function ch(k2, c2) { return c2 === 0 ? (k2 >> 10) & 31 : c2 === 1 ? (k2 >> 5) & 31 : k2 & 31; }
    function stat(idx) {
      var mn = [31, 31, 31], mx = [0, 0, 0], pop = 0, i, c2, best = 0;
      for (i = 0; i < idx.length; i++) { pop += hist[idx[i]]; for (c2 = 0; c2 < 3; c2++) { var v = ch(idx[i], c2); if (v < mn[c2]) mn[c2] = v; if (v > mx[c2]) mx[c2] = v; } }
      for (c2 = 1; c2 < 3; c2++) if (mx[c2] - mn[c2] > mx[best] - mn[best]) best = c2;
      return { idx: idx, pop: pop, ch: best, range: mx[best] - mn[best] };
    }
    var boxes = [stat(items)];
    while (boxes.length < nCol) {
      var bi = -1, bs = 0, i2;
      for (i2 = 0; i2 < boxes.length; i2++) { var b = boxes[i2]; if (b.idx.length < 2 || b.range < 1) continue; var sc = b.range * Math.sqrt(b.pop); if (sc > bs) { bs = sc; bi = i2; } }
      if (bi < 0) break;
      var bx = boxes[bi], c4 = bx.ch;
      bx.idx.sort(function (x2, y2) { return ch(x2, c4) - ch(y2, c4); });
      var half = bx.pop / 2, cum = 0, m = 0;
      while (m < bx.idx.length && cum < half) { cum += hist[bx.idx[m]]; m++; }
      m = Math.max(1, Math.min(bx.idx.length - 1, m));
      boxes.splice(bi, 1, stat(bx.idx.slice(0, m)), stat(bx.idx.slice(m)));
    }
    return boxes.map(function (bx2) {
      var r = 0, g = 0, bl = 0, i3, w;
      for (i3 = 0; i3 < bx2.idx.length; i3++) { w = hist[bx2.idx[i3]]; r += ((bx2.idx[i3] >> 10) & 31) * w; g += ((bx2.idx[i3] >> 5) & 31) * w; bl += (bx2.idx[i3] & 31) * w; }
      return [Math.round(r / bx2.pop * 255 / 31), Math.round(g / bx2.pop * 255 / 31), Math.round(bl / bx2.pop * 255 / 31)];
    });
  }
  function gifNearest(pal, k) {
    var r = ((k >> 10) & 31) * 255 / 31, g = ((k >> 5) & 31) * 255 / 31, b = (k & 31) * 255 / 31, best = 0, bd = 1e12, i;
    for (i = 0; i < pal.length; i++) {
      var dr = pal[i][0] - r, dg = pal[i][1] - g, db = pal[i][2] - b, d2 = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d2 < bd) { bd = d2; best = i; }
    }
    return best;
  }
  /* variable-width LZW as the GIF format defines it; returns the data as ready-made sub-blocks */
  function gifLzw(pix, mcs) {
    var HSIZE = 5003, MAXB = 12, MAXMAX = 4096, htab = new Int32Array(HSIZE), codetab = new Int32Array(HSIZE);
    var out = [], pack = new Uint8Array(256), apos = 0;
    var gInit = mcs + 1, nBits = gInit, maxcode = (1 << nBits) - 1, clearCode = 1 << mcs, eofCode = clearCode + 1, freeEnt = clearCode + 2, clearFlg = false, curAccum = 0, curBits = 0;
    function flushChar() { if (apos > 0) { out.push(apos); for (var q = 0; q < apos; q++) out.push(pack[q]); apos = 0; } }
    function charOut(b) { pack[apos++] = b; if (apos >= 254) flushChar(); }
    function output(code) {
      curAccum &= (1 << curBits) - 1;
      if (curBits > 0) curAccum |= (code << curBits); else curAccum = code;
      curBits += nBits;
      while (curBits >= 8) { charOut(curAccum & 255); curAccum >>= 8; curBits -= 8; }
      if (freeEnt > maxcode || clearFlg) {
        if (clearFlg) { nBits = gInit; maxcode = (1 << nBits) - 1; clearFlg = false; }
        else { ++nBits; maxcode = nBits === MAXB ? MAXMAX : (1 << nBits) - 1; }
      }
      if (code === eofCode) { while (curBits > 0) { charOut(curAccum & 255); curAccum >>= 8; curBits -= 8; } flushChar(); }
    }
    function clBlock() { htab.fill(-1); freeEnt = clearCode + 2; clearFlg = true; output(clearCode); }
    var hshift = 0, fc;
    for (fc = HSIZE; fc < 65536; fc *= 2) ++hshift;
    hshift = 8 - hshift;
    htab.fill(-1); output(clearCode);
    var ent = pix[0], pos = 1, n = pix.length;
    outer: while (pos < n) {
      var c = pix[pos++], fcode = (c << MAXB) + ent, i = (c << hshift) ^ ent;
      if (htab[i] === fcode) { ent = codetab[i]; continue; }
      else if (htab[i] >= 0) {
        var disp = HSIZE - i; if (i === 0) disp = 1;
        do { if ((i -= disp) < 0) i += HSIZE; if (htab[i] === fcode) { ent = codetab[i]; continue outer; } } while (htab[i] >= 0);
      }
      output(ent); ent = c;
      if (freeEnt < MAXMAX) { codetab[i] = freeEnt++; htab[i] = fcode; } else clBlock();
    }
    output(ent); output(eofCode);
    return out;
  }
  async function recordGif(specs, wh, secs, fps, transp) {
    var sc = Math.min(1, 640 / Math.max(wh[0], wh[1])), W = Math.max(2, Math.round(wh[0] * sc)), H = Math.max(2, Math.round(wh[1] * sc));
    var gfps = Math.max(8, Math.min(20, fps, Math.floor(400 / Math.max(1, secs)))), total = Math.max(1, Math.round(secs * gfps));
    var c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
    var seq = PT.createSeq(c, specs, { fade: S.fade });
    await seq.build(W, H, 1);
    var hist = new Uint32Array(32768), ns = Math.min(total, 12), i, p;
    for (i = 0; i < ns; i++) {
      seq.render(Math.floor(i * total / ns) / gfps);
      var d0 = x.getImageData(0, 0, W, H).data;
      for (p = 0; p < d0.length; p += 12) { if (transp && d0[p + 3] < 128) continue; hist[((d0[p] >> 3) << 10) | ((d0[p + 1] >> 3) << 5) | (d0[p + 2] >> 3)]++; }
    }
    var off = transp ? 1 : 0, pal = gifPalette(hist, 256 - off), lut = new Int16Array(32768).fill(-1);
    var parts = [], hdr = [71, 73, 70, 56, 57, 97, W & 255, W >> 8, H & 255, H >> 8, 0xF7, 0, 0], gct = new Uint8Array(768), q;
    hdr[1] = 73; hdr[2] = 70;
    for (q = 0; q < 256; q++) { var pc = q >= off && pal[q - off] ? pal[q - off] : [0, 0, 0]; gct[q * 3] = pc[0]; gct[q * 3 + 1] = pc[1]; gct[q * 3 + 2] = pc[2]; }
    parts.push(new Uint8Array(hdr), gct);
    parts.push(new Uint8Array([0x21, 0xFF, 0x0B, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0]));
    var delay = Math.round(100 / gfps), idx = new Uint8Array(W * H), ch = new MessageChannel();
    function yieldUI() { return new Promise(function (r) { ch.port1.onmessage = r; ch.port2.postMessage(0); }); }
    var done = 0;
    for (i = 0; i < total; i++) {
      if (stopReq) break;
      seq.render(i / gfps);
      var d = x.getImageData(0, 0, W, H).data;
      for (p = 0, q = 0; p < idx.length; p++, q += 4) {
        if (transp && d[q + 3] < 128) { idx[p] = 0; continue; }
        var key = ((d[q] >> 3) << 10) | ((d[q + 1] >> 3) << 5) | (d[q + 2] >> 3), v = lut[key];
        if (v < 0) { v = gifNearest(pal, key); lut[key] = v; }
        idx[p] = v + off;
      }
      parts.push(new Uint8Array([0x21, 0xF9, 4, transp ? 9 : 4, delay & 255, delay >> 8, 0, 0]));
      parts.push(new Uint8Array([0x2C, 0, 0, 0, 0, W & 255, W >> 8, H & 255, H >> 8, 0, 8]));
      parts.push(Uint8Array.from(gifLzw(idx, 8)), new Uint8Array([0]));
      done++;
      if (i % 2 === 0) { vprog.value = i / total; await yieldUI(); }
    }
    parts.push(new Uint8Array([0x3B]));
    audioNote = (musicBuf ? '' : '') + t('GIF: {w}×{h}, {f} פריימים לשנייה. הקובץ לא כולל שמע.', { w: W, h: H, f: gfps });
    return new Blob(parts, { type: 'image/gif' });
  }

  /* ---------- saved projects: this browser (IndexedDB) and project files ---------- */
  function payloadFull() {
    commit();
    return { app: 'particle-text-studio', v: 2, kind: S.kind, cur: cur, fade: S.fade, quality: S.quality, beat: S.beat, beatAmt: S.beatAmt, scenes: scenes.map(function (sc) { return { d: clone(sc.d), dur: sc.dur }; }) };
  }
  function applyPayload(sv) {
    if (!sv || !Array.isArray(sv.scenes) || !sv.scenes.length) return false;
    var ns = sv.scenes.slice(0, 12).map(function (sc) { return { d: mergeDesign(sc && sc.d), dur: Math.min(120, Math.max(1, +(sc && sc.dur) || 5)) }; });
    ns.forEach(function (sc) {
      if (/^Custom /.test(sc.d.family) && !sc.d.fontData) sc.d.family = 'Montserrat';
      if (!FONTMAP[sc.d.family] && !/^Custom /.test(sc.d.family)) addFontChip(sc.d.family, sc.d.weightSel || 700);
    });
    scenes = ns; cur = Math.min(ns.length - 1, Math.max(0, sv.cur | 0));
    if (typeof sv.fade === 'number') S.fade = Math.max(0, Math.min(2, sv.fade));
    if (sv.quality === 'auto' || sv.quality === 'high' || sv.quality === 'low') S.quality = sv.quality;
    if (typeof sv.beat === 'boolean') S.beat = sv.beat;
    if (typeof sv.beatAmt === 'number') S.beatAmt = Math.max(0.2, Math.min(1, sv.beatAmt));
    Object.assign(S, clone(scenes[cur].d));
    syncControls(); paint(); rebuildMount();
    return true;
  }
  function idbOpen() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('ptx-projects', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('p', { keyPath: 'name' }); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function idbDo(mode, fn) {
    return idbOpen().then(function (db) {
      if (!db) return null;
      return new Promise(function (res) {
        try {
          var tx = db.transaction('p', mode), rq = fn(tx.objectStore('p'));
          tx.oncomplete = function () { db.close(); res(rq && rq.result !== undefined ? rq.result : true); };
          tx.onerror = tx.onabort = function () { db.close(); res(null); };
        } catch (e) { res(null); }
      });
    });
  }
  var projMsg = $('#projMsg');
  function renderProjects(selectName) {
    return idbDo('readonly', function (st) { return st.getAll(); }).then(function (list) {
      var sel = $('#projList');
      if (list === null) { $('#projLocal').hidden = true; return; }
      list = (list === true ? [] : list).sort(function (a, b) { return b.saved - a.saved; });
      sel.innerHTML = '';
      if (!list.length) { var o0 = document.createElement('option'); o0.value = ''; o0.textContent = t('אין פרויקטים שמורים'); sel.appendChild(o0); }
      list.forEach(function (rec) { var o = document.createElement('option'); o.value = rec.name; o.textContent = rec.name; sel.appendChild(o); });
      if (selectName) sel.value = selectName;
      $('#projLoad').disabled = $('#projDel').disabled = !list.length;
    });
  }
  $('#projSave').addEventListener('click', function () {
    var name = $('#projName').value.trim().slice(0, 40) || firstLine(S.text) || (t('פרויקט') + ' ' + new Date().toLocaleDateString());
    idbDo('readwrite', function (st) { return st.put({ name: name, saved: Date.now(), data: payloadFull() }); }).then(function (r) {
      if (r === null) { setMsg(projMsg, t('לא ניתן היה לשמור את הפרויקט.'), true); return; }
      setMsg(projMsg, t('הפרויקט "{name}" נשמר.', { name: name })); $('#projName').value = ''; renderProjects(name);
    });
  });
  $('#projLoad').addEventListener('click', function () {
    var name = $('#projList').value; if (!name) return;
    idbDo('readonly', function (st) { return st.get(name); }).then(function (rec) {
      if (rec && rec.data && applyPayload(rec.data)) setMsg(projMsg, t('הפרויקט "{name}" נפתח.', { name: name }));
      else setMsg(projMsg, t('לא ניתן היה לשמור את הפרויקט.'), true);
    });
  });
  $('#projDel').addEventListener('click', function () {
    var name = $('#projList').value; if (!name) return;
    idbDo('readwrite', function (st) { return st.delete(name); }).then(function () { setMsg(projMsg, t('הפרויקט נמחק.')); renderProjects(); });
  });
  $('#projExport').addEventListener('click', function () { saveFile('particle-text-project-' + slug() + '.json', JSON.stringify(payloadFull()), projMsg); });
  $('#projFile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    f.text().then(function (x) { importSettings(x, projMsg); e.target.value = ''; });
  });
  renderProjects();

  /* a link that opens the same project (images and font files are left out to keep it short) */
  if (window.claude && window.claude.use) $('#shareLink').hidden = true;
  $('#shareLink').addEventListener('click', function () {
    commit();
    var lean = function (d) { var o = clone(d); ['image', 'bgImg', 'fontData'].forEach(function (key) { o[key] = ''; }); if (/^Custom /.test(o.family)) o.family = 'Montserrat'; return o; };
    var data = JSON.stringify({ scenes: scenes.map(function (sc) { return { d: lean(sc.d), dur: sc.dur }; }), cur: cur, fade: S.fade });
    var b64 = btoa(unescape(encodeURIComponent(data))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    var url = location.href.split('#')[0] + '#p=' + b64, cm = $('#cmsg');
    if (url.length > 7000) { setMsg(cm, t('הקישור ארוך מדי לשיתוף. נסו פחות סצנות.'), true); return; }
    var ok = function () { setMsg(cm, t('הקישור הועתק. הוא לא כולל תמונות וקבצי גופן.')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { setMsg(cm, url); }); else setMsg(cm, url);
  });

  /* ---------- presets, logo, reset ---------- */
  var PRESET_BASE = { weightSel: 0, speed: 1, glow: 1, shape: 'round', bg: 'black', loop: true };
  var PRESETS = [
    ['פתיחת קולנוע', { mode: 0, pal: 'ice', family: 'Montserrat', glow: 1.1 }],
    ['סייבר ניאון', { mode: 3, pal: 'neon', family: 'Orbitron', glow: 1.3 }],
    ['אש', { mode: 7, pal: 'ember', family: 'Anton', glow: 1.2, loop: false }],
    ['זהב יוקרתי', { mode: 1, pal: 'gold', family: 'Cinzel', speed: 0.8, loop: false }],
    ['מטריקס', { mode: 5, pal: 'matrix', family: 'Share Tech Mono' }],
    ['מסע בין כוכבים', { mode: 10, pal: 'aurora', family: 'Unbounded', glow: 1.2 }],
    ['מכונת כתיבה', { mode: 8, pal: 'mono', family: 'Space Grotesk' }],
    ['שקיעה זורמת', { mode: 4, pal: 'sunset', family: 'Poppins' }],
    ['מערבולת', { mode: 6, pal: 'neon', family: 'Sora' }],
    ['חשמל', { mode: 9, pal: 'ice', family: 'Rajdhani', glow: 1.4, loop: false }],
    ['כניסה דרמטית', { mode: 15, pal: 'gold', family: 'Playfair Display', glow: 1.1 }],
    ['לייזר', { mode: 12, pal: 'neon', family: 'Orbitron', glow: 1.3 }],
    ['תלת־ממד', { mode: 16, pal: 'ice', family: 'Unbounded', glow: 1.1 }],
    ['דופק', { mode: 14, pal: 'ember', family: 'Montserrat', glow: 1.3, loop: false }],
    ['שלט ניאון', { mode: 19, pal: 'neon', family: 'Bebas Neue', glow: 1.3 }],
    ['לוגו כרום', { mode: 21, pal: 'mono', family: 'Archivo Black', glow: 0.9 }],
    ['רטרו 80', { mode: 25, pal: 'neon', family: 'Righteous', glow: 1.2 }],
    ['זכוכית', { mode: 24, pal: 'ice', family: 'Poppins', glow: 1.1 }],
    ['כותרת קינטית', { mode: 27, pal: 'sunset', family: 'Montserrat', glow: 1 }],
    ['כותרת בוערת', { mode: 32, pal: 'ember', family: 'Anton', glow: 1.2 }],
    ['הולוגרמה', { mode: 40, pal: 'aurora', family: 'Orbitron', glow: 1.2 }],
    ['שלט LED', { mode: 36, pal: 'neon', family: 'Share Tech Mono', glow: 1 }]
  ];
  function applyState(partial) {
    for (var key in partial) S[key] = partial[key];
    syncControls(); pt.update(cfgFor()); pt.replay(); setMsg(fmsg, ''); paint(); refreshCode();
  }
  PRESETS.forEach(function (pr) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = pr[0];
    b.addEventListener('click', function () {
      var st = {}, key;
      for (key in PRESET_BASE) st[key] = PRESET_BASE[key];
      for (key in pr[1]) st[key] = pr[1][key];
      if (!FONTMAP[st.family]) addFontChip(st.family, 700);
      applyState(st);
    });
    $('#presets').appendChild(b);
  });
  $('#reset').addEventListener('click', function () {
    scenes = [{ d: pickDesign(S0), dur: 0 }]; scenes[0].dur = defaultDur(scenes[0].d); cur = 0;
    Object.assign(S, clone(scenes[0].d)); S.kind = 'embed';
    syncControls(); paint(); setMsg(fmsg, ''); rebuildMount();
  });

  /* src: a File/Blob or a data: URL string. Shrinks it to 700px and turns it into the logo. */
  function loadLogo(src, msgEl) {
    msgEl = msgEl || $('#imsg2');
    function fromUrl(url) {
      var im = new Image();
      im.onload = function () {
        var w = im.naturalWidth || 600, h = im.naturalHeight || 600, sc = Math.min(1, 700 / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        applyState({ image: c.toDataURL('image/png') });
        setMsg(msgEl, t('הלוגו נטען.'));
      };
      im.onerror = function () { setMsg(msgEl, t('לא ניתן לקרוא את הקובץ. נסו PNG או SVG.'), true); };
      im.src = url;
    }
    if (typeof src === 'string') fromUrl(src);
    else { var rd = new FileReader(); rd.onload = function () { fromUrl(rd.result); }; rd.readAsDataURL(src); }
  }
  $('#img').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; if (f) loadLogo(f); });
  $('#imgClear').addEventListener('click', function () { $('#img').value = ''; applyState({ image: '' }); setMsg($('#imsg2'), t(LOGO_NOTE)); });

  /* ---------- inputs ---------- */
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }
  var pushBuild = debounce(function () { pt.update(Object.assign({ text: S.text, step: S.step, size: S.size }, fontPatch())); }, 220);

  $('#txt').addEventListener('input', function (e) {
    var v = e.target.value.replace(TEXT_OK, '').split('\n').slice(0, 12).join('\n');
    var needNL = scriptsOf(v).replace('l', '');
    if (needNL.length === 1 && S.fscript !== needNL) { S.fscript = needNL; applyFontFilter(); paint(); }
    if (v !== e.target.value) e.target.value = v;
    S.text = v; pt.replay(); pushBuild(); refreshCode();
  });
  $('#den').addEventListener('input', function (e) { S.step = 7 - Number(e.target.value); pushBuild(); refreshCode(); });
  $('#spd').addEventListener('input', function (e) { S.speed = Number(e.target.value); pt.update({ speed: S.speed }); refreshCode(); });
  $('#glow').addEventListener('input', function (e) { S.glow = Number(e.target.value); pt.update({ glow: S.glow }); refreshCode(); });
  $('#size').addEventListener('input', function (e) { S.size = Number(e.target.value) / 100; pushBuild(); refreshCode(); });
  $('#wt').addEventListener('change', function (e) { S.weightSel = Number(e.target.value); pt.update(fontPatch()); setMsg(fmsg, ''); refreshCode(); });
  ['c1', 'c2', 'c3'].forEach(function (id, i) {
    $('#' + id).addEventListener('input', function (e) { S.custom[i] = e.target.value; if (S.pal === 'custom') { pt.update({ stops: stops() }); paint(); refreshCode(); } });
  });
  $('#replay').addEventListener('click', function () { pt.replay(); });

  var fsBtn = $('#fs');
  if (!document.fullscreenEnabled) fsBtn.hidden = true;
  fsBtn.addEventListener('click', function () {
    var p = stage.requestFullscreen && stage.requestFullscreen();
    if (p && p.catch) p.catch(function () { setMsg(fmsg, t('מסך מלא לא זמין כאן. אפשר להקליט את החלון כמו שהוא.')); });
  });

  function addFontChip(name, w) {
    FONTMAP[name] = w;
    if (!groups.family.querySelector('[data-v="' + name.replace(/"/g, '') + '"]')) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip fnt'; b.textContent = name; b.dataset.v = name;
      b.style.fontFamily = '"' + name + '",system-ui,sans-serif'; b.style.fontWeight = w;
      b.addEventListener('click', function () { pick('family', name); });
      groups.family.insertBefore(b, groups.family.firstChild);
    }
  }
  function loadCustomFont() {
    var name = $('#gf').value.trim().replace(/["<>]/g, '');
    if (!name) return;
    setMsg(fmsg, t('טוען את {name}...', { name: name }));
    PT.loadFont(name, S.weightSel || 700).then(function (r) {
      if (!r.ok) { setMsg(fmsg, t('לא נמצא גופן בשם "{name}" ב-Google Fonts. בדקו את האיות.', { name: name }), true); return; }
      addFontChip(name, r.weight);
      pick('family', name);
      setMsg(fmsg, t('הגופן {name} נטען.', { name: name }));
    });
  }
  $('#gfBtn').addEventListener('click', loadCustomFont);
  $('#gf').addEventListener('keydown', function (e) { if (e.key === 'Enter') loadCustomFont(); });

  /* ---------- code export ---------- */
  makeChips($('#kinds'), 'kind', [
    { v: 'embed', html: 'קטע להטמעה באתר' },
    { v: 'page', html: 'דף HTML מלא' },
    { v: 'json', html: 'הגדרות JSON' }
  ]);

  function genCode(which) {
    commit();
    var multi = scenes.length > 1, hasLayers = scenes.some(function (sc) { return (sc.d.layers || []).length; });
    var spec = (multi || hasLayers) ? { scenes: scenes.map(function (sc) { return sceneSpec(sc, multi ? sc.dur : 0); }), fade: S.fade } : cfgFor(scenes[0].d);
    var json = JSON.stringify(spec, null, 2);
    if (which === 'json') return json;
    var cfg = cfgFor(scenes[0].d);
    var engine = enginePack.toString().replace(/<\/script/gi, '<\\/script');
    var bgcss = cfg.bg === 'transparent' ? 'transparent' : '#000';
    var js = 'var ParticleText = (' + engine + ')();\n\n' +
      'var pt = ParticleText.mount(document.getElementById("particle-text"), ' + json + ');\n\n' +
      '// Later, change anything on the fly:\n// pt.update({ text: "HELLO", mode: 3 });\n// pt.replay();\n';
    if (which === 'embed') {
      return '<!-- Particle text effect. Paste into an HTML / custom-code block. Needs internet for Google Fonts. -->\n' +
        '<div id="particle-text" style="position:relative;width:100%;aspect-ratio:2/1;background:' + bgcss + ';"></div>\n' +
        '<script>\n' + js + '<\/script>\n';
    }
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Particle Text</title>\n' +
      '<style>html,body{margin:0;height:100%;background:' + bgcss + '}#particle-text{position:fixed;inset:0}</style>\n</head>\n<body>\n<div id="particle-text"></div>\n' +
      '<script>\n' + js + '<\/script>\n</body>\n</html>\n';
  }
  var codeEl = $('#code');
  var refreshCode = debounce(function () { persist(); renderScenes(); updateFontHint(); codeEl.value = genCode(S.kind); }, 120);

  function slug() { return (S.text.split('\n')[0].trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'text').toLowerCase(); }

  var STANDALONE = !(window.claude && window.claude.use);
  var dl = null;
  if (window.claude && window.claude.use) {
    window.claude.use('downloads').then(function (d) { dl = d; syncSaveButtons(); }, function () {});
  }
  function syncSaveButtons() {
    var off = !dl && !STANDALONE;
    ['#savecode', '#png', '#vsave'].forEach(function (s) { var b = $(s); b.disabled = off; b.title = off ? t('שמירה לקובץ לא זמינה בתצוגה הזו') : ''; });
  }
  function saveFile(name, data, msgEl) {
    if (STANDALONE) {
      var blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      setMsg(msgEl, t('הקובץ {name} הורד.', { name: name }));
      return Promise.resolve();
    }
    if (!dl) { setMsg(msgEl, 'שמירה לקובץ לא זמינה בתצוגה הזו.', true); return Promise.resolve(); }
    return dl.save({ filename: name, data: data }).then(function () { setMsg(msgEl, t('הקובץ {name} נשמר.', { name: name })); },
      function (e) { setMsg(msgEl, e && e.code === 'declined' ? t('השמירה בוטלה.') : t('השמירה נכשלה ({code}).', { code: (e && e.code) || t('שגיאה') }), true); });
  }

  var cmsg = $('#cmsg');
  $('#copy').addEventListener('click', function () {
    var done = function () { setMsg(cmsg, t('הקוד הועתק.')); };
    var fallback = function () {
      codeEl.removeAttribute('readonly'); codeEl.focus(); codeEl.select();
      try { document.execCommand('copy'); done(); } catch (e) { setMsg(cmsg, t('סמנו את הקוד והעתיקו ידנית.'), true); }
      codeEl.setAttribute('readonly', '');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(codeEl.value).then(done, fallback); else fallback();
  });
  $('#savecode').addEventListener('click', function () {
    var ext = S.kind === 'json' ? 'json' : 'html';
    saveFile('particle-text-' + slug() + (S.kind === 'embed' ? '-embed' : '') + '.' + ext, codeEl.value, cmsg);
  });

  /* import settings */
  function cfgToDesign(o) {
    var d = pickDesign(S0);
    if (typeof o.text === 'string') d.text = o.text.replace(TEXT_OK, '').slice(0, 300);
    d.image = (typeof o.image === 'string' && o.image.indexOf('data:image/') === 0) ? o.image : '';
    if (typeof o.imgColors === 'boolean') d.imgColors = o.imgColors;
    if (typeof o.mode === 'number' && o.mode >= 0 && o.mode < MODES.length) d.mode = o.mode;
    if (Array.isArray(o.stops) && o.stops.length >= 2) {
      var match = Object.keys(PALETTES).filter(function (k) { return PALETTES[k].stops && PALETTES[k].stops.join() === o.stops.join(); })[0];
      if (match) d.pal = match; else { d.pal = 'custom'; d.custom = [o.stops[0], o.stops[1], o.stops[2] || o.stops[1]]; }
    }
    if (typeof o.family === 'string') { d.family = o.family; if (!FONTMAP[o.family]) addFontChip(o.family, o.weight || 700); }
    if (o.weight && FONTMAP[d.family] !== o.weight) d.weightSel = o.weight;
    ['step', 'speed', 'glow', 'size'].forEach(function (key) { if (typeof o[key] === 'number') d[key] = o[key]; });
    if (o.shape === 'round' || o.shape === 'square') d.shape = o.shape;
    if (o.bg === 'black' || o.bg === 'transparent') d.bg = o.bg;
    if (typeof o.loop === 'boolean') d.loop = o.loop;
    ['ox', 'oy', 'rot', 'bgDim'].forEach(function (key) { if (typeof o[key] === 'number') d[key] = o[key]; });
    ['bgA', 'bgB'].forEach(function (key) { if (typeof o[key] === 'string' && /^#[0-9a-f]{3,8}$/i.test(o[key])) d[key] = o[key]; });
    if (['none', 'color', 'gradient', 'image'].indexOf(o.bgType) >= 0) d.bgType = o.bgType;
    if (typeof o.bgImg === 'string' && o.bgImg.indexOf('data:image/') === 0) d.bgImg = o.bgImg;
    if (typeof o.fontData === 'string' && o.fontData.indexOf('data:') === 0) d.fontData = o.fontData;
    if (typeof o.hybrid === 'boolean') d.hybrid = o.hybrid;
    return d;
  }
  function importSettings(str, el, quiet) {
    try {
      var o = JSON.parse(str);
      if (o && typeof o === 'object' && Array.isArray(o.scenes) && o.scenes[0] && o.scenes[0].d && typeof o.scenes[0].d === 'object') { if (!applyPayload(o)) throw new Error('x'); setMsg(el, t('הפרויקט נפתח ({n} סצנות).', { n: Math.min(12, o.scenes.length) })); return true; }
      if (typeof o !== 'object' || !o || !(Array.isArray(o.scenes) || typeof o.text === 'string' || typeof o.mode === 'number' || o.cfg)) throw new Error('x');
      var list = Array.isArray(o.scenes) && o.scenes.length ? o.scenes.slice(0, 12) : [o];
      var ns = list.map(function (it) { var d0 = cfgToDesign(it.cfg || it); d0.layers = Array.isArray(it.layers) ? it.layers.slice(0, 4).map(layerFromCfg) : []; return { d: d0, dur: Math.min(120, Math.max(0, +it.dur || 0)) }; });
      ns.forEach(function (sc) { if (!sc.dur) sc.dur = defaultDur(sc.d); });
      scenes = ns; cur = 0; Object.assign(S, clone(scenes[0].d));
      if (typeof o.fade === 'number') S.fade = Math.max(0, Math.min(2, o.fade));
      syncControls(); paint(); rebuildMount();
      setMsg(el, t('ההגדרות הוחלו ({n} סצנות).', { n: ns.length }));
      return true;
    } catch (e) { if (!quiet) setMsg(el, t('ה-JSON לא תקין.'), true); return false; }
  }
  $('#impBtn').addEventListener('click', function () { importSettings($('#imp').value, $('#imsg')); });

  /* ---------- paste from anywhere, and drag & drop ---------- */
  var TYPO = [[/[\u2018\u2019\u201B]/g, "'"], [/[\u201C\u201D\u201E]/g, '"'], [/[\u2013\u2014\u2212]/g, '-'], [/\u2026/g, '...'], [/[\u2022\u00B7]/g, '-']];
  /* cleans any copied text down to what the effect can draw: supported scripts, up to 3 lines, 60 characters */
  function normalizeText(raw) {
    var s2 = String(raw).replace(/\r\n?/g, '\n');
    TYPO.forEach(function (r) { s2 = s2.replace(r[0], r[1]); });
    s2 = s2.replace(/[ \t\u00A0\u2000-\u200A\u202F\u205F\u3000]+/g, ' ');
    var lines = s2.replace(TEXT_OK, '').split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l; });
    var text = lines.slice(0, 12).join('\n');
    if (text.length > 300) text = text.slice(0, 300).trim();
    return { text: text, changed: s2.replace(/\s+/g, '') !== text.replace(/\s+/g, '') };
  }
  function setTextFromPaste(raw) {
    var r = normalizeText(raw), tm = $('#tmsg');
    if (!r.text) return false;
    if (S.image) applyState({ image: '' });
    var ta = $('#txt');
    ta.value = r.text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    setMsg(tm, r.changed ? t('הטקסט הודבק. חלק מהתווים הוסרו או שהטקסט קוצר (עד 12 שורות ו-300 תווים).') : t('הטקסט הודבק.'));
    return true;
  }
  function handlePastedText(text) {
    var tr = String(text).trim();
    if (!tr) return;
    if (/^(<\?xml[\s\S]*?\?>\s*)?(<!--[\s\S]*?-->\s*)?<svg[\s>]/i.test(tr) && /<\/svg>\s*$/i.test(tr)) { loadLogo(new Blob([tr], { type: 'image/svg+xml' })); return; }
    if (/^data:image\//i.test(tr)) { loadLogo(tr); return; }
    if (/^[\[{]/.test(tr) && importSettings(tr, $('#tmsg'), true)) return;
    setTextFromPaste(text);
  }
  function clipboardImage(cd) {
    var i, it;
    for (i = 0; cd.items && i < cd.items.length; i++) { it = cd.items[i]; if (it.kind === 'file' && /^image\//.test(it.type)) return it.getAsFile(); }
    for (i = 0; cd.files && i < cd.files.length; i++) if (/^image\//.test(cd.files[i].type)) return cd.files[i];
    return null;
  }
  /* inside the text box: clean and limit what is pasted */
  $('#txt').addEventListener('paste', function (e) {
    var cd = e.clipboardData;
    if (!cd || clipboardImage(cd)) return;
    var raw = cd.getData('text/plain');
    if (!raw) return;
    e.preventDefault(); e.stopPropagation();
    var ta = e.target, a = ta.selectionStart, b = ta.selectionEnd;
    var r = normalizeText(ta.value.slice(0, a) + raw + ta.value.slice(b));
    ta.value = r.text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    setMsg($('#tmsg'), r.changed ? t('הטקסט הודבק. חלק מהתווים הוסרו או שהטקסט קוצר (עד 12 שורות ו-300 תווים).') : t('הטקסט הודבק.'));
  });
  /* anywhere else on the page */
  document.addEventListener('paste', function (e) {
    var cd = e.clipboardData;
    if (!cd) return;
    var img = clipboardImage(cd);
    if (img) { e.preventDefault(); loadLogo(img); return; }
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.nodeName)) return;
    var text = cd.getData('text/plain');
    if (!text || !text.trim()) return;
    e.preventDefault();
    handlePastedText(text);
  });
  function handleFiles(files) {
    var f = files[0];
    if (!f) return false;
    if (/^image\//.test(f.type) || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name)) { loadLogo(f); return true; }
    if (/^audio\//.test(f.type) || /\.(mp3|wav|m4a|ogg|aac)$/i.test(f.name)) { loadMusic(f); return true; }
    if (/json/.test(f.type) || /\.json$/i.test(f.name)) { f.text().then(function (x) { importSettings(x, $('#tmsg')); }); return true; }
    if (/^text\//.test(f.type) || /\.txt$/i.test(f.name)) { f.text().then(handlePastedText); return true; }
    return false;
  }
  function isField(el) { return el && /^(INPUT|TEXTAREA)$/.test(el.nodeName) && el.type !== 'file'; }
  document.addEventListener('dragover', function (e) {
    if (isField(e.target)) return;
    var ty = e.dataTransfer && e.dataTransfer.types ? Array.prototype.slice.call(e.dataTransfer.types) : [];
    if (ty.indexOf('Files') >= 0 || ty.indexOf('text/plain') >= 0) { e.preventDefault(); stage.classList.add('drop'); }
  });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) stage.classList.remove('drop'); });
  document.addEventListener('drop', function (e) {
    stage.classList.remove('drop');
    var dt = e.dataTransfer;
    if (!dt || isField(e.target)) return;
    e.preventDefault();
    if (dt.files && dt.files.length) { if (!handleFiles(dt.files)) setMsg($('#tmsg'), t('סוג הקובץ לא נתמך. אפשר לגרור תמונה, קובץ שמע, JSON או טקסט.'), true); return; }
    var tx = dt.getData('text/plain');
    if (tx) handlePastedText(tx);
  });

  /* ---------- video + image export ---------- */
  var vfmt = $('#vfmt'), vmsg = $('#vmsg'), vprog = $('#vprog'), vrec = $('#vrec'), vsave = $('#vsave');
  var formats = [], alphaOK = false, lastVideo = null, recording = false, stopReq = false;

  function resolution() { var r = $('#vres').value.split('x'); return [Number(r[0]), Number(r[1])]; }
  function applyAspect() { var r = resolution(); stage.style.setProperty('--ar', String(r[0] / r[1])); }
  $('#vres').addEventListener('change', applyAspect);
  applyAspect();

  function fmtLabel(f) {
    return (f.lkey ? t(f.lkey, { fmt: f.fmtname }) : t(f.label)) + (f.kind === 'wc-webm' && alphaOK ? t(' + שקיפות') : '');
  }
  function fillFormats() {
    var keep = vfmt.value;
    vfmt.innerHTML = '';
    formats.forEach(function (f, i) {
      var o = document.createElement('option'); o.value = String(i); o.textContent = fmtLabel(f); vfmt.appendChild(o);
    });
    if (keep && vfmt.querySelector('option[value="' + keep + '"]')) vfmt.value = keep;
  }
  function detectFormats() {
    var jobs = [], found = [];
    var base = { width: 1920, height: 1080, bitrate: 2e7, framerate: 30 };
    function cfgWith(o) { var c = {}; for (var k in base) c[k] = base[k]; for (k in o) c[k] = o[k]; return c; }
    if (window.VideoEncoder && window.Mp4Muxer) {
      jobs.push(VideoEncoder.isConfigSupported(cfgWith({ codec: 'avc1.640033' })).then(function (r) {
        if (r.supported) found.push({ o: 0, kind: 'wc-mp4', ext: 'mp4', label: 'MP4 (H.264), מדויק ומומלץ' });
      }).catch(function () {}));
    }
    if (window.VideoEncoder && window.WebMMuxer) {
      jobs.push(VideoEncoder.isConfigSupported(cfgWith({ codec: 'vp09.00.51.08' })).then(function (r) {
        if (r.supported) found.push({ o: 1, kind: 'wc-webm', ext: 'webm', label: 'WebM (VP9), מדויק' });
      }).catch(function () {}));
      jobs.push(VideoEncoder.isConfigSupported(cfgWith({ codec: 'vp09.00.51.08', alpha: 'keep' })).then(function (r) {
        alphaOK = !!(r.supported && r.config && r.config.alpha === 'keep');
      }).catch(function () {}));
    }
    if (window.MediaRecorder) {
      [['video/mp4;codecs=avc1.42E01E', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm', 'webm']].forEach(function (f) {
        if (MediaRecorder.isTypeSupported(f[0]) && !found.some(function (x) { return x.kind === 'live' && x.ext === f[1]; }))
          found.push({ o: 2, kind: 'live', ext: f[1], mime: f[0], lkey: '{fmt} (הקלטה בזמן אמת, פחות מדויק)', fmtname: f[1].toUpperCase() });
      });
    }
    found.push({ o: 3, kind: 'gif', ext: 'gif', label: 'GIF (אנימציה, בלי שמע)' });
    return Promise.all(jobs).then(function () {
      found.sort(function (a, b) { return a.o - b.o; });
      formats = found;
      fillFormats();
      if (!formats.length) { vrec.disabled = true; setMsg(vmsg, t('הדפדפן הזה לא תומך בהקלטת סרטון. אפשר להשתמש בהקלטת מסך.'), true); }
    });
  }
  detectFormats();

  /* Mixes the music into one stereo track of exactly `secs` seconds, with a short fade in and a longer fade out. */
  async function renderMusic(buf, secs) {
    var sr = 48000, len = Math.ceil(secs * sr), oc = new OfflineAudioContext(2, len, sr);
    var src = oc.createBufferSource(), g = oc.createGain(), vol = Number($('#avol').value) / 100;
    var fin = Math.min(0.3, secs / 4), fout = Math.min(2, secs / 3);
    src.buffer = buf; src.loop = buf.duration < secs;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(vol, fin);
    g.gain.setValueAtTime(vol, Math.max(fin, secs - fout)); g.gain.linearRampToValueAtTime(0, secs);
    src.connect(g); g.connect(oc.destination); src.start(0);
    return oc.startRendering();
  }
  async function pickAudioCodec(kind) {
    var list = kind === 'wc-mp4' ? [['mp4a.40.2', 'aac'], ['opus', 'opus']] : [['opus', 'A_OPUS']], i;
    if (!window.AudioEncoder || !window.OfflineAudioContext) return null;
    for (i = 0; i < list.length; i++) {
      try {
        var r = await AudioEncoder.isConfigSupported({ codec: list[i][0], sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 });
        if (r.supported) return { enc: list[i][0], mux: list[i][1] };
      } catch (e) {}
    }
    return null;
  }

  /* Frame-by-frame encoding: every frame is rendered exactly, so the file is smooth at any size. */
  var audioNote = '';
  async function recordWC(fmt, specs, wh, secs, fps, useAlpha, music) {
    var c = document.createElement('canvas'), seq = PT.createSeq(c, specs, { fade: S.fade }), W = wh[0], H = wh[1];
    await seq.build(W, H, 1);
    if (music && S.beat && musicEnv) seq.setBeat({ amount: S.beatAmt, at: function (tt) { var mt = music.duration < secs ? tt % music.duration : tt; return musicEnv[Math.floor(mt * 100)] || 0; } });
    var total = Math.round(secs * fps), bitrate = Math.round(W * H * fps * 0.28), muxer, codec, err = null, ai = 0, achunks = [];
    var ac = music ? await pickAudioCodec(fmt.kind) : null;
    audioNote = music && !ac ? t('הדפדפן הזה לא מקודד שמע, ולכן הסרטון נוצר בלי המוזיקה.') : '';
    var aopt = ac ? { codec: ac.mux, numberOfChannels: 2, sampleRate: 48000 } : null;
    if (fmt.kind === 'wc-mp4') {
      var mo = { target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: fps }, fastStart: 'in-memory' };
      if (aopt) mo.audio = aopt;
      muxer = new Mp4Muxer.Muxer(mo); codec = 'avc1.640033';
    } else {
      var wo = { target: new WebMMuxer.ArrayBufferTarget(), video: { codec: 'V_VP9', width: W, height: H, frameRate: fps, alpha: useAlpha } };
      if (aopt) wo.audio = aopt;
      muxer = new WebMMuxer.Muxer(wo); codec = 'vp09.00.51.08';
    }
    if (ac) {
      var rendered = await renderMusic(music, secs), sr = 48000, len = rendered.length;
      var aenc = new AudioEncoder({ output: function (ch, meta) { achunks.push([ch, meta]); }, error: function (e) { err = e; } });
      aenc.configure({ codec: ac.enc, sampleRate: sr, numberOfChannels: 2, bitrate: 192000 });
      for (var off = 0; off < len; off += sr) {
        var n = Math.min(sr, len - off), data = new Float32Array(n * 2);
        data.set(rendered.getChannelData(0).subarray(off, off + n), 0);
        data.set(rendered.getChannelData(1).subarray(off, off + n), n);
        var ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(off / sr * 1e6), data: data });
        aenc.encode(ad); ad.close();
      }
      await aenc.flush();
    }
    function drain(untilUs) {
      while (ai < achunks.length && achunks[ai][0].timestamp <= untilUs) { muxer.addAudioChunk(achunks[ai][0], achunks[ai][1]); ai++; }
    }
    var enc = new VideoEncoder({ output: function (chunk, meta) { muxer.addVideoChunk(chunk, meta); }, error: function (e) { err = e; } });
    var conf = { codec: codec, width: W, height: H, bitrate: bitrate, framerate: fps };
    if (useAlpha) conf.alpha = 'keep';
    enc.configure(conf);
    var ch = new MessageChannel();
    function yieldUI() { return new Promise(function (r) { ch.port1.onmessage = r; ch.port2.postMessage(0); }); }
    for (var i = 0; i < total; i++) {
      if (stopReq) break;
      if (err) throw err;
      seq.render(i / fps);
      var frame = new VideoFrame(c, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      drain(i * 1e6 / fps);
      while (enc.encodeQueueSize > 6) await yieldUI();
      if (i % 3 === 0) { vprog.value = i / total; await yieldUI(); }
    }
    await enc.flush();
    if (err) throw err;
    drain(1e15);
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: fmt.kind === 'wc-mp4' ? 'video/mp4' : 'video/webm' });
  }

  /* Fallback for browsers without WebCodecs: records in real time, so a slow machine can drop frames. */
  function recordLive(fmt, cfg, wh, secs) { /* cfg is the list of scene specs */
    return new Promise(function (resolve, reject) {
      var c = document.createElement('canvas');
      c.style.cssText = 'position:fixed;left:-99999px;top:0;width:8px;height:8px';
      document.body.appendChild(c);
      var eng = PT.createSeq(c, cfg, { fade: S.fade });
      eng.build(wh[0], wh[1], 1).then(function () {
        var stream = c.captureStream(30), chunks = [];
        var rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: Math.round(wh[0] * wh[1] * 30 * 0.25) });
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onerror = function (e) { reject(e.error || new Error('recorder')); };
        rec.onstop = function () { if (c.parentNode) c.parentNode.removeChild(c); resolve(new Blob(chunks, { type: fmt.mime.split(';')[0] })); };
        eng.render(0); rec.start(250);
        var start = performance.now();
        (function tick(now) {
          var el = (now - start) / 1000;
          if (stopReq || el >= secs) { try { rec.stop(); } catch (e) {} return; }
          eng.render(el); vprog.value = el / secs; requestAnimationFrame(tick);
        })(performance.now());
      }, reject);
    });
  }

  vrec.addEventListener('click', async function () {
    if (recording) { stopReq = true; return; }
    var fmt = formats[Number(vfmt.value)];
    if (!fmt) return;
    commit();
    var wh = resolution(), fps = Number($('#vfps').value), multi = scenes.length > 1;
    var allTransp = scenes.every(function (sc) { return sc.d.bg === 'transparent'; });
    var useAlpha = allTransp && ((fmt.kind === 'wc-webm' && alphaOK) || fmt.kind === 'gif');
    var specs = scenes.map(function (sc) {
      var c = cfgFor(sc.d); c.interactive = false; c.bg = useAlpha ? 'transparent' : 'black';
      var o = { cfg: c, dur: multi ? sc.dur : 0 }, lc = layerCfgs(sc.d);
      if (lc.length) o.layers = lc;
      return o;
    });
    var totalSecs = totalLen();
    recording = true; stopReq = false; lastVideo = null; vsave.hidden = true; vprog.hidden = false; vprog.value = 0;
    vrec.textContent = t('עצירה וסיום');
    setMsg(vmsg, fmt.kind === 'live' ? t('מקליט בזמן אמת... השאירו את הלשונית פתוחה.') : t('מצייר ומקודד פריים אחרי פריים...'));
    try {
      var d = $('#vdur').value, secs = d === 'loop' ? totalSecs : Number(d);
      audioNote = '';
      if (musicBuf && fmt.kind === 'live') audioNote = t('הקלטה בזמן אמת לא כוללת מוזיקה. בחרו פורמט "מדויק" כדי לצרף אותה.');
      var blob = fmt.kind === 'gif' ? await recordGif(specs, wh, secs, fps, useAlpha) : fmt.kind === 'live' ? await recordLive(fmt, specs, wh, secs) : await recordWC(fmt, specs, wh, secs, fps, useAlpha, musicBuf);
      if (!blob.size) throw new Error('empty');
      lastVideo = { blob: blob, name: 'particle-text-' + slug() + '.' + fmt.ext };
      vsave.hidden = false;
      var note = (allTransp && !useAlpha) ? t('הרקע נשמר שחור, כי הפורמט הזה לא תומך בשקיפות.') : '';
      setMsg(vmsg, [t('הסרטון מוכן ({mb} MB, {s} שניות). לחצו על "שמירת הקובץ".', { mb: (blob.size / 1048576).toFixed(1), s: secs.toFixed(1) }), note, audioNote].filter(Boolean).join(' '));
    } catch (e) {
      setMsg(vmsg, t('ההקלטה נכשלה: {err}. נסו גודל קטן יותר או פורמט אחר.', { err: (e && e.message) || e }), true);
    } finally {
      recording = false; vrec.textContent = t('הקלטת סרטון'); vprog.hidden = true;
    }
  });
  vsave.addEventListener('click', function () { if (lastVideo) saveFile(lastVideo.name, lastVideo.blob, vmsg); });

  function makePngBlob() {
    var wh = resolution(), c = document.createElement('canvas');
    var cfg = cfgFor(); cfg.interactive = false; cfg.loop = false;
    var eng = PT.create(c, cfg);
    return eng.build(wh[0], wh[1], 1).then(function () {
      eng.render(3.6);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    });
  }
  $('#png').addEventListener('click', function () {
    var pm = $('#pmsg');
    setMsg(pm, t('מכין תמונה...'));
    makePngBlob().then(function (blob) {
      if (!blob) { setMsg(pm, t('יצירת התמונה נכשלה.'), true); return; }
      saveFile('particle-text-' + slug() + '.png', blob, pm);
    });
  });
  if (!window.ClipboardItem || !(navigator.clipboard && navigator.clipboard.write)) $('#pngCopy').hidden = true;
  $('#pngCopy').addEventListener('click', function () {
    var pm = $('#pmsg');
    setMsg(pm, t('מכין תמונה...'));
    try {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': makePngBlob().then(function (b) { if (!b) throw new Error('png'); return b; }) })])
        .then(function () { setMsg(pm, t('התמונה הועתקה ללוח.')); }, function () { setMsg(pm, t('העתקת תמונה ללוח לא נתמכת כאן. אפשר לשמור את הקובץ.'), true); });
    } catch (e) { setMsg(pm, t('העתקת תמונה ללוח לא נתמכת כאן. אפשר לשמור את הקובץ.'), true); }
  });

  /* ---------- start ---------- */
  /* ---------- language switcher ---------- */
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('ptx-lang', l); } catch (e) {}
    var m = document.querySelector('main.wrap');
    m.lang = l; m.dir = LANGS[l].dir;
    document.documentElement.lang = l; document.documentElement.dir = LANGS[l].dir;
    translateDOM(document.body);
    document.title = t('סטודיו אפקטי טקסט');
    ['#fmsg', '#vmsg', '#pmsg', '#cmsg', '#imsg', '#tmsg', '#projMsg'].forEach(function (id) { setMsg($(id), ''); });
    hintShown = false;
    setMsg($('#mmsg'), musicBuf ? t(MUSIC_NOTE) : t(MUSIC_NOTE));
    setMsg($('#imsg2'), t(LOGO_NOTE));
    $('#sPlay').textContent = playAll ? t('■ עצירה וחזרה לסצנה הנבחרת') : t('▶ נגן את כל הרצף');
    vrec.textContent = recording ? t('עצירה וסיום') : t('הקלטת סרטון');
    renderMusicName(); fillFormats(); syncSaveButtons(); syncControls(); renderScenes(); updateFontHint(); renderProjects($('#projList').value);
    Array.prototype.forEach.call($('#langs').children, function (c) { c.setAttribute('aria-pressed', c.getAttribute('lang') === l ? 'true' : 'false'); });
  }
  Object.keys(LANGS).forEach(function (code) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.setAttribute('lang', code); b.setAttribute('data-notr', ''); b.textContent = LANGS[code].name;
    b.addEventListener('click', function () { setLang(code); });
    $('#langs').appendChild(b);
  });

  syncSaveButtons();
  paint();
  setLang(lang);
  refreshCode();
})();
