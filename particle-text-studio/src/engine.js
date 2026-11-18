
/* ================= Engine: self-contained, exported as-is into the generated code ================= */
var enginePack = function () {
  var TAU = Math.PI * 2, L = 64, IMGB = L * 3 + 3, NB = IMGB + 32 * 3;
  /* P: loop length in seconds, out: when the exit starts, cs: color speed, rec: suggested clip length */
  var FX = [
    { P: 9.2, out: 4.4, cs: 1 },
    { P: Infinity, out: Infinity, cs: 2.4, rec: 6 },
    { P: 5.7, out: 3.8, cs: 1 },
    { P: 6, out: 5.0, cs: 1.4 },
    { P: 6, out: 4.4, cs: 1.8 },
    { P: 8, out: 4.2, cs: 0.8 },
    { P: 7, out: 4.6, cs: 1.2 },
    { P: Infinity, out: Infinity, cs: 0.7, rec: 8 },
    { P: 7, out: 5.2, cs: 1.2 },
    { P: Infinity, out: Infinity, cs: 2, rec: 6 },
    { P: 7, out: 4.6, cs: 1 },
    { P: 7, out: 4.8, cs: 1 },
    { P: 6, out: 4.4, cs: 1.6 },
    { P: 7, out: 5.0, cs: 1.3 },
    { P: Infinity, out: Infinity, cs: 1.2, rec: 6 },
    { P: 7, out: 4.6, cs: 1 },
    { P: 8, out: 5.8, cs: 1.4 },
    { P: 7, out: 4.6, cs: 1.8 },
    { P: 7, out: 4.8, cs: 0.9 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 6, out: 4.6, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 8, out: 6.0, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 8, out: 6.0, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.0, cs: 1 },
    { P: 7, out: 5.2, cs: 1 },
    { P: 7, out: 5.0, cs: 1 }
  ];
  var STYLE0 = 19; /* modes from here on draw the real letters instead of particles */
  var DEFAULTS = {
    text: 'VFX', mode: 0, stops: ['#1f6bff', '#4cc9ff', '#e2f8ff', '#5a7dff'],
    family: 'Montserrat', weight: 800, step: 3, speed: 1, glow: 1, shape: 'round',
    bg: 'black', loop: true, size: 0.76, interactive: true, image: '', imgColors: true,
    bgType: 'none', bgA: '#0b1020', bgB: '#1b2a6b', bgImg: '', bgDim: 0.35, ox: 0, oy: 0, rot: 0, hybrid: false, fontData: '', lowq: false
  };
  var REBUILD = { text: 1, family: 1, weight: 1, step: 1, size: 1, image: 1, bgImg: 1, fontData: 1 };
  var imgCache = {};
  /* the first strong character decides the base direction of a line */
  var RTL_RE = /^[^A-Za-z\u0400-\u052F\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]*[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  var fontCache = {};

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(x) { var u = 1 - x; return 1 - u * u * u; }
  function easeIn(x) { return x * x * x; }
  function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function frac(x) { return x - Math.floor(x); }
  function bounceOut(x) {
    var n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; }
    if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; }
    x -= 2.625 / d1; return n1 * x * x + 0.984375;
  }
  function easeOutBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function hash(a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }
  function hexRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  }

  /* median cut: reduces a list of [r,g,b] to at most `max` representative colors */
  function medianCut(cols, max) {
    var boxes = [cols];
    while (boxes.length < max) {
      var bi = -1, bestScore = 0, ch = 0;
      boxes.forEach(function (bx, i) {
        if (bx.length < 2) return;
        var mn = [255, 255, 255], mx = [0, 0, 0], c2;
        bx.forEach(function (c) { for (c2 = 0; c2 < 3; c2++) { if (c[c2] < mn[c2]) mn[c2] = c[c2]; if (c[c2] > mx[c2]) mx[c2] = c[c2]; } });
        for (c2 = 0; c2 < 3; c2++) { var sc = (mx[c2] - mn[c2]) * bx.length; if (sc > bestScore) { bestScore = sc; bi = i; ch = c2; } }
      });
      if (bi < 0) break;
      var box = boxes[bi]; box.sort(function (a, b) { return a[ch] - b[ch]; });
      var mid = box.length >> 1;
      boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
    }
    return boxes.map(function (bx) {
      var sum = [0, 0, 0], l = bx.length || 1;
      bx.forEach(function (c) { sum[0] += c[0]; sum[1] += c[1]; sum[2] += c[2]; });
      return [Math.round(sum[0] / l), Math.round(sum[1] / l), Math.round(sum[2] / l)];
    });
  }

  function loadImg(src) {
    if (!imgCache[src]) imgCache[src] = new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); }; im.onerror = function () { res(null); };
      im.src = src;
    });
    return imgCache[src];
  }

  /* Loads a Google Font by name and makes sure the glyph subset needed for `text` is available (Latin, Hebrew, Arabic, Cyrillic...). */
  function loadFont(family, weight, text, fontData) {
    if (fontData) { /* a font file the user uploaded: registered from its data URL */
      var fk = 'data|' + family + '|' + fontData.length;
      if (!fontCache[fk]) fontCache[fk] = new Promise(function (resolve) {
        try {
          var ff = new FontFace(family, 'url(' + fontData + ')');
          ff.load().then(function (f2) { document.fonts.add(f2); resolve({ ok: true, weight: 400 }); }, function () { resolve({ ok: false, weight: weight }); });
        } catch (e) { resolve({ ok: false, weight: weight }); }
      });
      return fontCache[fk];
    }
    var key = family + '|' + weight;
    if (!fontCache[key]) fontCache[key] = new Promise(function (resolve) {
      var fam = encodeURIComponent(family).replace(/%20/g, '+');
      function addLink(url, done) {
        var l = document.createElement('link'), fin = false, tm;
        function end(ok) { if (fin) return; fin = true; clearTimeout(tm); if (!ok && l.parentNode) l.parentNode.removeChild(l); done(ok); }
        l.rel = 'stylesheet'; l.href = url;
        l.onload = function () { end(true); };
        l.onerror = function () { end(false); };
        tm = setTimeout(function () { end(false); }, 3500);
        document.head.appendChild(l);
      }
      addLink('https://fonts.googleapis.com/css2?family=' + fam + ':wght@' + weight + '&display=swap', function (ok) {
        if (ok) return resolve({ ok: true, weight: weight });
        addLink('https://fonts.googleapis.com/css2?family=' + fam + '&display=swap', function (ok2) {
          resolve(ok2 ? { ok: true, weight: 400 } : { ok: false, weight: weight });
        });
      });
    });
    return fontCache[key].then(function (r) {
      if (!r.ok) return r;
      var spec = r.weight + ' 64px "' + family + '"';
      var timeout = new Promise(function (res) { setTimeout(res, 2500); });
      return Promise.race([document.fonts.load(spec, text || 'AaBb0123'), timeout]).then(function () { return r; }, function () { return r; });
    });
  }

  function create(canvas, userCfg) {
    var cfg = {}, key;
    for (key in DEFAULTS) cfg[key] = DEFAULTS[key];
    for (key in (userCfg || {})) cfg[key] = userCfg[key];
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, k = 1, n = 0, bs = 2, buildId = 0, mx = -9999, my = -9999;
    var hx, hy, nx, ny, sd, dl, sz, r4, r5, ca, sa, chn, px, py, ps, bk, order, iq, ilut = [], hasImgPal = false;
    var layout = null, lay = null, lctx = null, maskData = null, tmpc = null, tmpx = null, post = null, pctx = null, bgEl = null, logoEl = null, logoBox = null;
    var small = [], lut = [], lutKey = '';
    var counts = new Int32Array(NB + 1), cursor = new Int32Array(NB + 1), bandOff = new Float32Array(12);

    function buildLut() {
      var st = cfg.stops.map(hexRgb), ns, base = [], i;
      if (st.length < 2) st.push(st[0] || [255, 255, 255]);
      ns = st.length;
      for (i = 0; i < L; i++) {
        var p = (i / L) * ns, a = Math.floor(p) % ns, b = (a + 1) % ns, f = p - Math.floor(p);
        base.push([0, 1, 2].map(function (c) { return st[a][c] + (st[b][c] - st[a][c]) * f; }));
      }
      lut = [];
      [1, 0.55, 0.22].forEach(function (m) {
        base.forEach(function (c) { lut.push('rgb(' + Math.round(c[0] * m) + ',' + Math.round(c[1] * m) + ',' + Math.round(c[2] * m) + ')'); });
      });
      lut.push('rgb(255,40,60)', 'rgb(40,255,90)', 'rgb(50,90,255)');
      lutKey = cfg.stops.join(',');
    }

    function sample(data, st) {
      var xs = [], ys = [], x, y, sx, sy;
      for (y = 0; y < H; y += st) {
        for (x = 0; x < W; x += st) {
          sx = Math.min(W - 1, (x + Math.random() * st) | 0);
          sy = Math.min(H - 1, (y + Math.random() * st) | 0);
          if (data[(sy * W + sx) * 4 + 3] > 110) { xs.push(sx); ys.push(sy); }
        }
      }
      return [xs, ys];
    }

    function build(w, h, d) {
      var id = ++buildId;
      W = w; H = h; dpr = d || 1; k = Math.max(0.4, W / 1000);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      if (!lay || lay.width !== canvas.width || lay.height !== canvas.height) { lay = document.createElement('canvas'); lay.width = canvas.width; lay.height = canvas.height; lctx = lay.getContext('2d'); }
      small = [];
      var sw = canvas.width, sh = canvas.height, i;
      for (i = 0; i < 4; i++) {
        sw = Math.max(1, sw >> 1); sh = Math.max(1, sh >> 1);
        var c = document.createElement('canvas'); c.width = sw; c.height = sh;
        small.push({ c: c, x: c.getContext('2d') });
      }
      var fp = cfg.image ? Promise.resolve({ ok: true, weight: cfg.weight }) : loadFont(cfg.family, cfg.weight, cfg.text, cfg.fontData);
      var ip = cfg.image ? loadImg(cfg.image) : Promise.resolve(null);
      var bp = cfg.bgType === 'image' && cfg.bgImg ? loadImg(cfg.bgImg) : Promise.resolve(null);
      return Promise.all([fp, ip, bp]).then(function (res) {
        var f = res[0], img = res[1];
        bgEl = res[2]; logoEl = img;
        if (id !== buildId) return null;
        var lines = String(cfg.text).split('\n').map(function (t) { return t.trim(); }).filter(function (t) { return t; }).slice(0, 12);
        var face = '"' + cfg.family + '", system-ui, sans-serif';
        var off = document.createElement('canvas'); off.width = W; off.height = H;
        var o = off.getContext('2d', { willReadFrequently: true });
        if (img) {
          var sc0 = Math.min(W * cfg.size / img.width, H * 0.78 / img.height);
          o.drawImage(img, (W - img.width * sc0) / 2, (H - img.height * sc0) / 2, img.width * sc0, img.height * sc0);
          logoBox = { x: (W - img.width * sc0) / 2, y: (H - img.height * sc0) / 2, w: img.width * sc0, h: img.height * sc0 };
        } else if (lines.length) {
          var maxW = W * cfg.size, wMax = 1;
          o.font = f.weight + ' 100px ' + face;
          lines.forEach(function (t) { wMax = Math.max(wMax, o.measureText(t).width); });
          var size = Math.min(100 * maxW / wMax, lines.length === 1 ? H * 0.55 : H * 0.8 / (lines.length * 1.1));
          if (size < H * 0.16 && lines.some(function (t) { return t.indexOf(' ') > 0; })) {
            /* long text: wrap by words and use the largest size that still fits the frame */
            var wcache = {};
            var w100 = function (str) { return wcache[str] !== undefined ? wcache[str] : (wcache[str] = o.measureText(str).width); };
            var wrapAt = function (fs) {
              var res = [];
              lines.forEach(function (para) {
                var cur2 = '';
                para.split(' ').forEach(function (wd) {
                  var test = cur2 ? cur2 + ' ' + wd : wd;
                  if (!cur2 || w100(test) * fs / 100 <= maxW) cur2 = test; else { res.push(cur2); cur2 = wd; }
                });
                if (cur2) res.push(cur2);
              });
              return res;
            };
            var fs2 = H * 0.3, wrapped = wrapAt(fs2);
            while (fs2 > H * 0.03) {
              wrapped = wrapAt(fs2);
              var fits = wrapped.every(function (t) { return w100(t) * fs2 / 100 <= maxW * 1.001; });
              if (fits && wrapped.length * fs2 * 1.12 <= H * 0.82) break;
              fs2 *= 0.94;
            }
            lines = wrapped; size = fs2;
          }
          var nl = lines.length;
          o.font = f.weight + ' ' + size + 'px ' + face;
          o.textAlign = 'center'; o.textBaseline = 'alphabetic'; o.fillStyle = '#fff';
          var capH = o.measureText('H').actualBoundingBoxAscent || size * 0.72, lh = size * 1.12;
          lines.forEach(function (t, li) { o.direction = RTL_RE.test(t) ? 'rtl' : 'ltr'; o.fillText(t, W / 2, H / 2 + (li - (nl - 1) / 2) * lh + capH / 2); });
          /* geometry of every line and of its letters (or words, for joined scripts), used by the solid-font styles */
          o.textAlign = 'left';
          var ARJ = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
          var geo = lines.map(function (txt, li) {
            var rtl = RTL_RE.test(txt); o.direction = rtl ? 'rtl' : 'ltr';
            var wl = o.measureText(txt).width, xl = W / 2 - wl / 2, yl = H / 2 + (li - (nl - 1) / 2) * lh + capH / 2, units = [], ci;
            if (!rtl && !ARJ.test(txt)) {
              var prev = 0;
              for (ci = 0; ci < txt.length; ci++) { var pw = o.measureText(txt.slice(0, ci + 1)).width; units.push({ s: txt.charAt(ci), x: xl + prev, w: pw - prev }); prev = pw; }
            } else {
              var re = /\S+/g, mm;
              while ((mm = re.exec(txt))) {
                var wEnd = o.measureText(txt.slice(0, mm.index + mm[0].length)).width, wBef = o.measureText(txt.slice(0, mm.index)).width;
                units.push({ s: mm[0], x: rtl ? xl + wl - wEnd : xl + wBef, w: wEnd - wBef });
              }
            }
            return { text: txt, rtl: rtl, y: yl, w: wl, xl: xl, units: units };
          });
          layout = { size: size, font: f.weight + ' ' + size + 'px ' + face, lines: geo, capH: capH, lh: lh, top: geo[0].y - capH * 1.05, bottom: geo[geo.length - 1].y + size * 0.28 };
          if (!lay || lay.width !== canvas.width || lay.height !== canvas.height) { lay = document.createElement('canvas'); lay.width = canvas.width; lay.height = canvas.height; lctx = lay.getContext('2d'); }
        }
        if (!lines.length || img) layout = null;
        var data = o.getImageData(0, 0, W, H).data;
        maskData = layout ? data : null;
        if (img) {
          /* a logo without transparency: drop the background color found in its corner */
          var tc = document.createElement('canvas'); tc.width = tc.height = 48;
          var tx = tc.getContext('2d', { willReadFrequently: true });
          tx.drawImage(img, 0, 0, 48, 48);
          var td = tx.getImageData(0, 0, 48, 48).data, opaque = true, q;
          for (q = 3; q < td.length; q += 4) if (td[q] < 245) { opaque = false; break; }
          if (opaque) {
            for (q = 0; q < data.length; q += 4) {
              if (data[q + 3] > 0) {
                var dr = data[q] - td[0], dg = data[q + 1] - td[1], db = data[q + 2] - td[2];
                if (dr * dr + dg * dg + db * db < 4800) data[q + 3] = 0;
              }
            }
          }
        }
        var st = Math.max(1.4, cfg.step * k * (cfg.lowq ? 1.6 : 1)), CAP = 30000, pts = sample(data, st);
        if (pts[0].length > CAP) { st *= Math.sqrt(pts[0].length / CAP); pts = sample(data, st); }
        n = pts[0].length;
        hx = new Float32Array(n); hy = new Float32Array(n); nx = new Float32Array(n); ny = new Float32Array(n);
        sd = new Float32Array(n); dl = new Float32Array(n); sz = new Float32Array(n);
        r4 = new Float32Array(n); r5 = new Float32Array(n); ca = new Float32Array(n); sa = new Float32Array(n);
        chn = new Uint8Array(n); px = new Float32Array(n); py = new Float32Array(n); ps = new Float32Array(n);
        bk = new Uint16Array(n); order = new Uint32Array(n); iq = new Uint8Array(n);
        var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, j;
        for (j = 0; j < n; j++) {
          var X = pts[0][j], Y = pts[1][j];
          if (X < minX) minX = X; if (X > maxX) maxX = X;
          if (Y < minY) minY = Y; if (Y > maxY) maxY = Y;
        }
        var spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY), cx = W / 2, cy = H / 2;
        for (j = 0; j < n; j++) {
          hx[j] = pts[0][j]; hy[j] = pts[1][j];
          nx[j] = (hx[j] - minX) / spanX; ny[j] = (hy[j] - minY) / spanY;
          sd[j] = Math.random(); dl[j] = Math.random(); r4[j] = Math.random(); r5[j] = Math.random();
          sz[j] = 0.6 + Math.random() * 0.9; chn[j] = j % 3;
          var ang = Math.atan2(hy[j] - cy, hx[j] - cx) + (Math.random() - 0.5) * 0.9;
          ca[j] = Math.cos(ang); sa[j] = Math.sin(ang);
        }
        hasImgPal = false; ilut = [];
        if (img && n) {
          var cols = [], stp = Math.max(1, (n / 4000) | 0), pi;
          for (j = 0; j < n; j += stp) { pi = ((hy[j] | 0) * W + (hx[j] | 0)) * 4; cols.push([data[pi], data[pi + 1], data[pi + 2]]); }
          var pal = medianCut(cols, 32), qq;
          for (j = 0; j < n; j++) {
            pi = ((hy[j] | 0) * W + (hx[j] | 0)) * 4;
            var best = 0, bd = 1e9;
            for (qq = 0; qq < pal.length; qq++) {
              var er = data[pi] - pal[qq][0], eg = data[pi + 1] - pal[qq][1], eb = data[pi + 2] - pal[qq][2], dd = er * er + eg * eg + eb * eb;
              if (dd < bd) { bd = dd; best = qq; }
            }
            iq[j] = best;
          }
          pal.forEach(function (c) {
            [1, 0.55, 0.22].forEach(function (m) { ilut.push('rgb(' + Math.round(c[0] * m) + ',' + Math.round(c[1] * m) + ',' + Math.round(c[2] * m) + ')'); });
          });
          hasImgPal = true;
        }
        bs = st * 0.62;
        return { ok: f.ok, count: n };
      });
    }


    /* ===== solid-font styles: the real letters with a material and an animation ===== */
    function rgbaS(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }
    function mixA(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }

    function drawStyle(mode, t, tt, out) {
      var Lo = layout, sz = Lo.size, gl = cfg.glow, i;
      var C = cfg.stops.map(hexRgb);
      if (C.length < 2) C.push(C[0] || [255, 255, 255]);
      var c0 = C[0], c1 = C[1], c2 = C[2] || C[1], WH = [255, 255, 255];
      function pal(p) {
        var ns = C.length, q = (((p % 1) + 1) % 1) * ns, a0 = Math.floor(q) % ns, f0 = q - Math.floor(q), b0 = (a0 + 1) % ns;
        return mixA(C[a0], C[b0], f0);
      }
      function sb(px0) { return px0 * dpr; }
      function lines(fn) { Lo.lines.forEach(function (ln, li) { ctx.direction = ln.rtl ? 'rtl' : 'ltr'; fn(ln, li); }); }
      function layerBegin() {
        lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, lay.width, lay.height);
        lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1; lctx.shadowBlur = 0;
        lctx.font = Lo.font; lctx.textAlign = 'center'; lctx.textBaseline = 'alphabetic'; lctx.lineJoin = 'round';
      }
      function layerLines(fn) { Lo.lines.forEach(function (ln, li) { lctx.direction = ln.rtl ? 'rtl' : 'ltr'; fn(ln, li); }); }
      /* a stroke drawn only outside the letters, so overlapping inner contours never show */
      function outerStroke(wpx, style, alpha, blurPx, glowCol, comp, dash, dx) {
        layerBegin();
        lctx.lineWidth = wpx * 2; lctx.strokeStyle = style; lctx.lineCap = 'round';
        if (dash) lctx.setLineDash(dash);
        layerLines(function (ln) { lctx.strokeText(ln.text, W / 2, ln.y); });
        lctx.setLineDash([]); lctx.globalCompositeOperation = 'destination-out'; lctx.fillStyle = '#000';
        layerLines(function (ln) { lctx.fillText(ln.text, W / 2, ln.y); });
        ctx.save();
        ctx.globalAlpha = alpha; ctx.globalCompositeOperation = comp || 'source-over';
        ctx.shadowColor = glowCol || 'transparent'; ctx.shadowBlur = sb(blurPx);
        ctx.drawImage(lay, dx || 0, 0, W, H);
        ctx.restore();
      }
      /* draws the layer in thin horizontal strips, each shifted sideways: flames, water... */
      function strips(stepCss, y0c, y1c, offFn) {
        var step = Math.max(1, Math.round(stepCss * dpr)), ya = Math.max(0, Math.floor(y0c * dpr)), yb = Math.min(lay.height, Math.ceil(y1c * dpr)), sy, h2;
        for (sy = ya; sy < yb; sy += step) {
          h2 = Math.min(step, lay.height - sy);
          ctx.drawImage(lay, 0, sy, lay.width, h2, offFn(sy / dpr), sy / dpr, W, h2 / dpr);
        }
      }
      function roundRectPath(c, x, y, w, h, r) {
        c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.font = Lo.font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      var outP = clamp01((tt - out) / 1.2), inA = clamp01(tt / 0.7), vis = inA * (1 - outP), cx = W / 2, top = Lo.top, bot = Lo.bottom;
      var W2 = W, H2 = H;

      switch (mode) {
        case 19: { /* neon tube that flickers on */
          var I = 1;
          if (tt < 1.8) { var xs = tt / 1.8; I = tt > 1.6 ? 1 : (hash(Math.floor(tt * 16), 3) < (0.2 + 0.8 * xs) * (0.3 + 0.7 * xs) ? 1 : 0.1); }
          else if (tt >= out) { var oo = (tt - out) / 1.4; I = oo >= 1 ? 0 : (hash(Math.floor(tt * 14), 5) > oo * 0.9 ? 1 : 0.08) * (1 - oo * 0.6); }
          else if (hash(Math.floor(t * 5), 7) > 0.975) I = 0.45;
          var lw = sz * 0.05, passes = [[lw * 1.0, c1, 0.22, 38], [lw * 0.6, c1, 0.6, 20], [lw * 0.34, c2, 0.95, 8], [lw * 0.14, WH, 1, 3]];
          passes.forEach(function (ps2) { outerStroke(ps2[0], rgbaS(ps2[1], 1), Math.min(1, ps2[2] * I), ps2[3] * gl * k, rgbaS(c1, 1), 'lighter'); });
          ctx.shadowBlur = 0; ctx.globalAlpha = 0.07 * I; ctx.fillStyle = rgbaS(c1, 1);
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          break;
        }
        case 20: { /* solid 3D extrusion with a swaying light */
          var ex = easeOut(clamp01(tt / 1.4)) * (1 - easeIn(clamp01((tt - out) / 1.2)));
          var depth = sz * 0.16 * ex, ang = 0.75 + 0.4 * Math.sin(t * 0.9), ddx = Math.cos(ang), ddy = Math.sin(ang);
          var nl = Math.max(1, Math.min(70, Math.round(depth / (1.1 * k))));
          ctx.globalAlpha = Math.min(1, tt * 3) * (1 - outP * outP);
          for (i = nl; i >= 1; i--) {
            var off = depth * i / nl, shade = mixA(mixA(c0, [0, 0, 0], 0.55), c0, 1 - i / nl);
            ctx.fillStyle = rgbaS(shade, 1);
            lines(function (ln) { ctx.fillText(ln.text, cx + ddx * off, ln.y + ddy * off); });
          }
          var g = ctx.createLinearGradient(0, top, 0, bot);
          g.addColorStop(0, rgbaS(mixA(c2, WH, 0.35), 1)); g.addColorStop(1, rgbaS(c1, 1));
          ctx.fillStyle = g; ctx.shadowColor = rgbaS(c1, 0.5); ctx.shadowBlur = sb(14 * gl * k);
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          ctx.shadowBlur = 0;
          outerStroke(Math.max(1, sz * 0.012), rgbaS(mixA(c2, WH, 0.7), 1), 0.8 * ctx.globalAlpha, 0, null);
          break;
        }
        case 21: { /* polished chrome with a moving highlight */
          layerBegin();
          var cg = lctx.createLinearGradient(0, top, 0, bot);
          cg.addColorStop(0, rgbaS(mixA(c2, WH, 0.85), 1)); cg.addColorStop(0.42, rgbaS(mixA(c1, WH, 0.35), 1));
          cg.addColorStop(0.5, rgbaS(mixA(c0, [0, 0, 0], 0.8), 1)); cg.addColorStop(0.56, rgbaS(mixA(c0, [0, 0, 0], 0.45), 1));
          cg.addColorStop(1, rgbaS(mixA(c2, WH, 0.3), 1));
          lctx.lineWidth = sz * 0.03; lctx.strokeStyle = rgbaS(mixA(c0, [0, 0, 0], 0.7), 1);
          layerLines(function (ln) { lctx.strokeText(ln.text, cx, ln.y); });
          lctx.fillStyle = cg;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          lctx.globalCompositeOperation = 'source-atop';
          var sx2 = ((t * 0.45) % 1.7 - 0.35) * W2, sg = lctx.createLinearGradient(sx2 - sz * 0.5, top, sx2 + sz * 0.5, bot);
          sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
          lctx.fillStyle = sg; lctx.fillRect(0, top - 10, W2, bot - top + 20);
          var sc = 0.92 + 0.08 * easeOut(clamp01(tt / 1.0));
          ctx.globalAlpha = vis; ctx.shadowColor = rgbaS(c1, 0.55); ctx.shadowBlur = sb(22 * gl * k);
          ctx.save(); ctx.translate(cx, (top + bot) / 2); ctx.scale(sc, sc); ctx.translate(-cx, -(top + bot) / 2);
          ctx.drawImage(lay, 0, 0, W2, H2); ctx.restore();
          break;
        }
        case 22: { /* outline that draws itself, then fills */
          var pIn = easeInOut(clamp01(tt / 2.0)), pOut = clamp01((tt - out) / 1.4), prog = pIn * (1 - easeIn(pOut));
          var fillA = clamp01((tt - 1.8) / 0.9) * (1 - clamp01(pOut * 1.6));
          outerStroke(Math.max(1.5, sz * 0.02), rgbaS(mixA(c1, WH, 0.25), 1), 1, 14 * gl * k, rgbaS(c1, 0.9), 'source-over', [sz * 8 * prog + 0.01, sz * 60]);
          var fg = ctx.createLinearGradient(cx - W2 * 0.4, 0, cx + W2 * 0.4, 0);
          fg.addColorStop(0, rgbaS(c0, 1)); fg.addColorStop(0.5, rgbaS(c1, 1)); fg.addColorStop(1, rgbaS(c2, 1));
          ctx.globalAlpha = fillA; ctx.fillStyle = fg;
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          break;
        }
        case 23: { /* colors flowing through the letters */
          var per = W2, shift = -((t * 0.18) % 1) * per, gf = ctx.createLinearGradient(shift, 0, shift + 2 * per, 0);
          for (i = 0; i <= 8; i++) gf.addColorStop(i / 8, rgbaS(C[(i % 4) % C.length], 1));
          ctx.fillStyle = gf; ctx.shadowColor = rgbaS(c1, 0.55); ctx.shadowBlur = sb(20 * gl * k);
          lines(function (ln, li) {
            var ti = clamp01((tt - li * 0.18) / 1.0), to = clamp01((tt - out - li * 0.1) / 0.9);
            ctx.globalAlpha = ti * (1 - to);
            ctx.fillText(ln.text, cx, ln.y + (1 - easeOut(ti)) * sz * 0.5 - easeIn(to) * sz * 0.4 + Math.sin(t * 1.6 + li) * sz * 0.012);
          });
          break;
        }
        case 24: { /* frosted glass */
          layerBegin();
          var gg = lctx.createLinearGradient(0, top, 0, bot);
          gg.addColorStop(0, 'rgba(255,255,255,0.30)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.10)'); gg.addColorStop(1, 'rgba(255,255,255,0.18)');
          lctx.fillStyle = gg;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          lctx.globalCompositeOperation = 'source-atop';
          var gx = ((t * 0.35) % 1.7 - 0.35) * W2, gs = lctx.createLinearGradient(gx - sz * 0.4, top, gx + sz * 0.4, bot);
          gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.5, 'rgba(255,255,255,0.7)'); gs.addColorStop(1, 'rgba(255,255,255,0)');
          lctx.fillStyle = gs; lctx.fillRect(0, top - 10, W2, bot - top + 20);
          ctx.globalAlpha = vis; ctx.shadowColor = rgbaS(c1, 0.9); ctx.shadowBlur = sb(28 * gl * k);
          ctx.drawImage(lay, 0, (1 - easeOut(inA)) * sz * 0.2, W2, H2);
          ctx.shadowBlur = 0;
          outerStroke(Math.max(1.2, sz * 0.012), 'rgba(255,255,255,0.85)', vis, 10 * gl * k, rgbaS(c1, 0.9));
          break;
        }
        case 25: { /* 80s retro: banded gradient with a neon edge */
          layerBegin();
          var rg = lctx.createLinearGradient(0, top, 0, bot);
          rg.addColorStop(0, rgbaS(mixA(c2, WH, 0.3), 1)); rg.addColorStop(0.5, rgbaS(c1, 1)); rg.addColorStop(1, rgbaS(c0, 1));
          lctx.fillStyle = rg;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          lctx.globalCompositeOperation = 'destination-out';
          var midY = top + (bot - top) * 0.5, sp = Math.max(4, sz * 0.085), j = 0, yy;
          for (yy = midY; yy < bot; yy += sp, j++) lctx.fillRect(0, yy, W2, Math.min(sp * 0.9, 1 + j * sz * 0.012));
          var slide = (1 - easeOut(clamp01(tt / 1.2))) * W2 * 0.18, fadeR = vis;
          ctx.globalAlpha = fadeR; ctx.shadowColor = rgbaS(c1, 0.95); ctx.shadowBlur = sb(18 * gl * k);
          ctx.drawImage(lay, slide, 0, W2, H2);
          ctx.shadowBlur = 0;
          outerStroke(Math.max(1.5, sz * 0.012), rgbaS(mixA(c1, WH, 0.3), 1), fadeR, 10 * gl * k, rgbaS(c1, 0.95), 'source-over', null, slide);
          break;
        }
        case 26: { /* RGB-split glitch on the real letters */
          var slot = Math.floor(t * 10), act = hash(slot, 1) > 0.72 || (tt < 1.0 && hash(slot, 4) > 0.4) || (tt >= out && hash(slot, 6) > 0.35);
          var split = (act ? 5 + 11 * hash(slot, 2) : 1.2) * k, nb = 10, bh = (bot - top) / nb;
          var reveal = clamp01(tt / 0.9) * (1 - clamp01((tt - out) / 0.9));
          var chans = [[255, 0, 40], [0, 255, 90], [30, 90, 255]];
          ctx.globalCompositeOperation = 'lighter';
          chans.forEach(function (chn2, ci2) {
            ctx.fillStyle = rgbaS(chn2, 0.95);
            if (!act) { ctx.save(); ctx.beginPath(); ctx.rect(0, top - 6, W2, (bot - top + 12) * reveal); ctx.clip(); lines(function (ln) { ctx.fillText(ln.text, cx + (ci2 - 1) * split, ln.y); }); ctx.restore(); }
            else for (var bi = 0; bi < nb; bi++) {
              var dxb = hash(slot, bi + 3) > 0.55 ? (hash(slot, bi + 9) - 0.5) * 70 * k : 0;
              ctx.save(); ctx.beginPath(); ctx.rect(0, top + bi * bh, W2, bh + 0.5); ctx.clip();
              lines(function (ln) { ctx.fillText(ln.text, cx + dxb + (ci2 - 1) * split, ln.y); });
              ctx.restore();
            }
          });
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.28 * reveal; ctx.fillStyle = rgbaS(c1, 1);
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          break;
        }
        case 27: { /* kinetic type: letters pop in, bob, and drop out */
          var idx = 0, total = 0;
          Lo.lines.forEach(function (ln) { total += ln.units.length; });
          ctx.textAlign = 'left';
          Lo.lines.forEach(function (ln) {
            ctx.direction = ln.rtl ? 'rtl' : 'ltr';
            ln.units.forEach(function (u) {
              var ti = clamp01((tt - 0.1 - idx * Math.min(0.07, 1.4 / total)) / 0.7), pIn2 = easeOutBack(ti);
              var to = easeIn(clamp01((tt - out - idx * Math.min(0.04, 0.8 / total)) / 0.6));
              var scl = pIn2 * (1 - to), bob = Math.sin(t * 2.4 + idx * 0.55) * sz * 0.03 * ti * (1 - to);
              if (scl > 0.002 && u.s.trim()) {
                ctx.save();
                ctx.translate(u.x + u.w / 2, ln.y - Lo.capH / 2 + (1 - ti) * sz * 0.7 + to * sz * 0.5 + bob);
                ctx.rotate((1 - ti) * -0.6 + to * 0.8); ctx.scale(scl, scl);
                ctx.fillStyle = rgbaS(pal(u.x / W2 * 0.8 + t * 0.08), 1);
                ctx.shadowColor = rgbaS(c1, 0.6); ctx.shadowBlur = sb(12 * gl * k);
                ctx.fillText(u.s, -u.w / 2, Lo.capH / 2);
                ctx.restore();
              }
              idx++;
            });
          });
          break;
        }
        case 28: { /* a roaming spotlight lights the letters */
          var sxp = cx + Math.sin(t * 0.9) * W2 * 0.33, cyp = (top + bot) / 2;
          layerBegin();
          lctx.fillStyle = rgbaS(mixA(c2, WH, 0.5), 1);
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          lctx.globalCompositeOperation = 'destination-in';
          var rgr = lctx.createRadialGradient(sxp, cyp, 0, sxp, cyp, sz * 2.4);
          rgr.addColorStop(0, 'rgba(0,0,0,1)'); rgr.addColorStop(0.55, 'rgba(0,0,0,0.85)'); rgr.addColorStop(1, 'rgba(0,0,0,0)');
          lctx.fillStyle = rgr; lctx.fillRect(0, 0, W2, H2);
          ctx.globalAlpha = 0.16 * vis; ctx.fillStyle = rgbaS(c1, 1);
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          ctx.globalAlpha = vis; ctx.shadowColor = rgbaS(c1, 0.8); ctx.shadowBlur = sb(26 * gl * k);
          ctx.drawImage(lay, 0, 0, W2, H2);
          ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.14 * vis;
          var cone = ctx.createRadialGradient(sxp, cyp, 0, sxp, cyp, sz * 3.2);
          cone.addColorStop(0, rgbaS(c1, 1)); cone.addColorStop(1, rgbaS(c1, 0));
          ctx.fillStyle = cone; ctx.fillRect(0, 0, W2, H2);
          break;
        }
        case 29: { /* text standing on a mirror floor */
          var yShift = -sz * 0.34, rise = easeOut(clamp01(tt / 1.2)), fl = bot + yShift - sz * 0.22;
          var tg = ctx.createLinearGradient(0, top + yShift, 0, bot + yShift);
          tg.addColorStop(0, rgbaS(mixA(c2, WH, 0.4), 1)); tg.addColorStop(1, rgbaS(c1, 1));
          ctx.globalAlpha = vis; ctx.fillStyle = tg; ctx.shadowColor = rgbaS(c1, 0.6); ctx.shadowBlur = sb(18 * gl * k);
          var dy = (1 - rise) * sz * 0.3;
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y + yShift + dy); });
          ctx.shadowBlur = 0;
          layerBegin();
          lctx.setTransform(dpr, 0, 0, -dpr, 0, 2 * fl * dpr);
          lctx.fillStyle = rgbaS(c1, 1); lctx.font = Lo.font; lctx.textAlign = 'center';
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y + yShift + dy); });
          lctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.globalCompositeOperation = 'destination-in';
          var fade = lctx.createLinearGradient(0, fl, 0, fl + sz * 1.0);
          fade.addColorStop(0, 'rgba(0,0,0,0.5)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
          lctx.fillStyle = fade; lctx.fillRect(0, fl, W2, sz * 1.2);
          ctx.globalAlpha = vis;
          var sy, step = Math.max(2, Math.round(3 * dpr)), pxH = lay.height;
          for (sy = Math.floor(fl * dpr); sy < Math.min(pxH, (fl + sz * 1.2) * dpr); sy += step) {
            var wob = Math.sin(sy * 0.09 + t * 3) * 3 * k * dpr;
            ctx.drawImage(lay, 0, sy, lay.width, step, wob / dpr, sy / dpr, W2, step / dpr);
          }
          var fy = ctx.createLinearGradient(cx - W2 * 0.4, 0, cx + W2 * 0.4, 0);
          fy.addColorStop(0, rgbaS(c1, 0)); fy.addColorStop(0.5, rgbaS(c1, 0.9)); fy.addColorStop(1, rgbaS(c1, 0));
          ctx.fillStyle = fy; ctx.globalAlpha = vis * 0.9; ctx.fillRect(cx - W2 * 0.4, fl - 1, W2 * 0.8, 2);
          break;
        }
        case 30: { /* flat design with a long cast shadow */
          var e30 = easeOut(clamp01(tt / 1.2)) * (1 - easeIn(clamp01((tt - out) / 1.0)));
          var len = sz * 0.95 * e30, ns = Math.max(1, Math.min(170, Math.round(len / 1.4))), slide30 = (1 - e30) * -W2 * 0.06;
          var dark = mixA(c0, [0, 0, 0], 0.55);
          ctx.globalAlpha = Math.min(1, tt * 3);
          for (i = ns; i >= 1; i--) {
            var off2 = len * i / ns * 0.7071;
            ctx.fillStyle = rgbaS(dark, 0.9 * Math.pow(1 - i / (ns + 1), 0.8));
            lines(function (ln) { ctx.fillText(ln.text, cx + off2 + slide30, ln.y + off2); });
          }
          ctx.fillStyle = rgbaS(mixA(c2, WH, 0.55), 1);
          lines(function (ln) { ctx.fillText(ln.text, cx + slide30, ln.y); });
          break;
        }
        case 31: { /* typewriter with a blinking cursor */
          var nU = 0;
          Lo.lines.forEach(function (ln) { nU += ln.units.length; });
          var dur = Math.min(3.2, Math.max(1.2, nU / 14)), prg = clamp01((tt - 0.3) / dur) * (1 - clamp01((tt - out) / 1.0));
          var shown = prg * nU, cursorX = null, cursorY = 0;
          ctx.fillStyle = rgbaS(mixA(c2, WH, 0.3), 1); ctx.shadowColor = rgbaS(c1, 0.7); ctx.shadowBlur = sb(10 * gl * k);
          var passed = 0;
          Lo.lines.forEach(function (ln) {
            ctx.direction = ln.rtl ? 'rtl' : 'ltr';
            var n2 = ln.units.length, m = Math.max(0, Math.min(n2, Math.floor(shown - passed)));
            if (m > 0) {
              var left, right;
              if (!ln.rtl) { left = ln.xl - 4; right = ln.units[m - 1].x + ln.units[m - 1].w; }
              else { left = ln.units[m - 1].x; right = ln.xl + ln.w + 4; }
              ctx.save(); ctx.beginPath(); ctx.rect(left, ln.y - Lo.capH * 1.3, right - left + 2, Lo.capH * 1.9); ctx.clip();
              ctx.fillText(ln.text, cx, ln.y); ctx.restore();
              cursorX = ln.rtl ? left : right; cursorY = ln.y;
            } else if (cursorX === null && passed <= shown) { cursorX = ln.rtl ? ln.xl + ln.w : ln.xl; cursorY = ln.y; }
            passed += n2;
          });
          if (cursorX !== null && (Math.floor(t * 2) % 2 === 0 || (prg > 0 && prg < 1)) && tt < out + 1.2) {
            ctx.shadowBlur = sb(14 * gl * k); ctx.fillStyle = rgbaS(c1, 1);
            ctx.fillRect(cursorX + (Lo.lines[0].rtl ? -sz * 0.09 : 3), cursorY - Lo.capH * 1.05, Math.max(2, sz * 0.06), Lo.capH * 1.3);
          }
          break;
        }

        case 32: { /* flames licking the letters */
          layerBegin();
          var fg2 = lctx.createLinearGradient(0, bot, 0, top - sz * 0.1);
          fg2.addColorStop(0, rgbaS(mixA(c2, WH, 0.65), 1)); fg2.addColorStop(0.3, rgbaS(c2, 1)); fg2.addColorStop(0.7, rgbaS(c1, 1)); fg2.addColorStop(1, rgbaS(c0, 1));
          lctx.fillStyle = fg2;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          ctx.globalAlpha = vis * 0.55; ctx.shadowColor = rgbaS(c1, 1); ctx.shadowBlur = sb(34 * gl * k);
          ctx.drawImage(lay, 0, -sz * 0.05 * (0.6 + 0.4 * Math.sin(t * 7)), W2, H2);
          ctx.shadowBlur = 0; ctx.globalAlpha = vis;
          strips(2, top - sz * 0.3, bot + sz * 0.3, function (yy) {
            var rel = clamp01((bot - yy) / (bot - top));
            return (Math.sin(yy * 0.07 + t * 9) * 0.6 + Math.sin(yy * 0.13 - t * 6.5) * 0.4) * sz * (0.018 + 0.065 * rel);
          });
          break;
        }
        case 33: { /* letters seen through rippling water */
          layerBegin();
          var wg = lctx.createLinearGradient(0, top, 0, bot);
          wg.addColorStop(0, rgbaS(mixA(c2, WH, 0.55), 1)); wg.addColorStop(0.5, rgbaS(c1, 1)); wg.addColorStop(1, rgbaS(c0, 1));
          lctx.fillStyle = wg;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          var settle = (1 - easeOut(clamp01(tt / 1.8))) + easeIn(outP), ampW = sz * (0.014 + 0.1 * settle);
          ctx.globalAlpha = vis * 0.5; ctx.shadowColor = rgbaS(c1, 0.8); ctx.shadowBlur = sb(18 * gl * k);
          ctx.drawImage(lay, 0, 0, W2, H2);
          ctx.shadowBlur = 0; ctx.globalAlpha = vis;
          strips(2, top - sz * 0.2, bot + sz * 0.2, function (yy) { return Math.sin(yy * 0.11 + t * 3.2) * ampW; });
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = vis * 0.28;
          strips(2, top - sz * 0.2, bot + sz * 0.2, function (yy) { return Math.sin(yy * 0.17 - t * 2.4 + 1.3) * ampW * 1.2; });
          break;
        }
        case 34: { /* letters carved into a stone slab, lit by a moving light */
          var ang34 = t * 0.8, lx = Math.cos(ang34), ly = Math.sin(ang34), dd = sz * 0.016 * easeOut(clamp01(tt / 1.0)) * (1 - outP);
          var wdt = 0;
          Lo.lines.forEach(function (ln) { wdt = Math.max(wdt, ln.w); });
          var pad = sz * 0.4, px0 = cx - wdt / 2 - pad, py0 = top - pad * 0.7, pw = wdt + pad * 2, ph = (bot - top) + pad * 1.4;
          var slab = mixA(c0, [120, 120, 128], 0.6);
          ctx.globalAlpha = vis;
          var pgr = ctx.createLinearGradient(0, py0, 0, py0 + ph);
          pgr.addColorStop(0, rgbaS(mixA(slab, WH, 0.14), 1)); pgr.addColorStop(1, rgbaS(mixA(slab, [0, 0, 0], 0.3), 1));
          ctx.fillStyle = pgr; roundRectPath(ctx, px0, py0, pw, ph, sz * 0.12); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          lines(function (ln) { ctx.fillText(ln.text, cx + lx * dd * 1.4, ln.y + ly * dd * 1.4); });
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          lines(function (ln) { ctx.fillText(ln.text, cx - lx * dd * 1.2, ln.y - ly * dd * 1.2); });
          ctx.fillStyle = rgbaS(mixA(slab, [0, 0, 0], 0.08), 1);
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          break;
        }
        case 35: { /* stacked paper cut-outs with parallax */
          var nLay = 4, li2;
          for (li2 = 0; li2 < nLay; li2++) {
            var tiP = clamp01((tt - li2 * 0.18) / 0.8), toP = clamp01((tt - out - li2 * 0.08) / 0.7);
            var scP = easeOutBack(tiP) * (1 - easeIn(toP)), colr = pal(li2 * 0.23 + 0.05), lw2 = (nLay - 1 - li2) * sz * 0.034;
            var par = Math.sin(t * 0.9) * (li2 - 1.5) * sz * 0.012;
            ctx.save();
            ctx.translate(cx + par, (top + bot) / 2 + (1 - tiP) * sz * 0.4); ctx.scale(Math.max(0.001, scP), Math.max(0.001, scP)); ctx.translate(-cx, -(top + bot) / 2);
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = sb(10 * k); ctx.shadowOffsetY = 4 * k * dpr;
            ctx.fillStyle = rgbaS(colr, 1); ctx.strokeStyle = rgbaS(colr, 1); ctx.lineWidth = Math.max(0.01, lw2 * 2);
            lines(function (ln) { if (lw2 > 0.1) ctx.strokeText(ln.text, cx, ln.y); ctx.fillText(ln.text, cx, ln.y); });
            ctx.restore();
          }
          break;
        }
        case 36: { /* LED dot-matrix sign */
          if (!maskData) break;
          var cs = Math.max(4, sz * 0.05), rr = cs * 0.4, wdt36 = 0;
          Lo.lines.forEach(function (ln) { wdt36 = Math.max(wdt36, ln.w); });
          var gx0 = Math.max(0, Math.floor(cx - wdt36 / 2 - cs * 2)), gx1 = Math.min(W2, Math.ceil(cx + wdt36 / 2 + cs * 2));
          var gy0 = Math.max(0, Math.floor(top - cs * 2)), gy1 = Math.min(H2, Math.ceil(bot + cs * 2));
          var prog = tt < out ? easeOut(clamp01(tt / 1.6)) : 1 - easeIn(clamp01((tt - out) / 1.2));
          var NBk = 16, bxs = [], dim = [], bi2, xx2, yy2;
          for (bi2 = 0; bi2 < NBk; bi2++) bxs.push([]);
          for (yy2 = gy0 + cs / 2; yy2 < gy1; yy2 += cs) {
            for (xx2 = gx0 + cs / 2; xx2 < gx1; xx2 += cs) {
              var ix = xx2 | 0, iy = yy2 | 0, colp = (xx2 - gx0) / Math.max(1, gx1 - gx0);
              var lit = ix < W2 && iy < H2 && maskData[(iy * W2 + ix) * 4 + 3] > 110;
              if (lit && colp < prog + (hash(ix, iy) - 0.5) * 0.12) {
                var q2 = ((colp * 0.8 + t * 0.12) % 1 + 1) % 1; bxs[Math.min(NBk - 1, Math.floor(q2 * NBk))].push(xx2, yy2);
              } else dim.push(xx2, yy2);
            }
          }
          ctx.globalAlpha = vis > 0 ? 1 : 0; ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath();
          for (i = 0; i < dim.length; i += 2) { ctx.moveTo(dim[i] + rr, dim[i + 1]); ctx.arc(dim[i], dim[i + 1], rr, 0, TAU); }
          ctx.fill();
          ctx.globalCompositeOperation = 'lighter';
          for (bi2 = 0; bi2 < NBk; bi2++) {
            var arr = bxs[bi2];
            if (!arr.length) continue;
            var pc = pal((bi2 + 0.5) / NBk);
            [[1.9, 0.2], [1, 1]].forEach(function (pass) {
              ctx.fillStyle = rgbaS(pass[1] === 1 ? mixA(pc, WH, 0.25) : pc, pass[1]); ctx.beginPath();
              for (var ai = 0; ai < arr.length; ai += 2) { ctx.moveTo(arr[ai] + rr * pass[0], arr[ai + 1]); ctx.arc(arr[ai], arr[ai + 1], rr * pass[0], 0, TAU); }
              ctx.fill();
            });
          }
          break;
        }
        case 37: { /* horizontal slices slide in from alternating sides */
          layerBegin();
          var sgd = lctx.createLinearGradient(0, top, 0, bot);
          sgd.addColorStop(0, rgbaS(mixA(c2, WH, 0.3), 1)); sgd.addColorStop(1, rgbaS(c1, 1));
          lctx.fillStyle = sgd;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          var nS = 9, hS = (bot - top) / nS, si;
          ctx.shadowColor = rgbaS(c1, 0.6); ctx.shadowBlur = sb(10 * gl * k);
          for (si = 0; si < nS; si++) {
            var ti3 = clamp01((tt - si * 0.07) / 0.9), to3 = clamp01((tt - out - si * 0.05) / 0.8);
            var offS = (si % 2 ? 1 : -1) * W2 * ((1 - easeOut(ti3)) + easeIn(to3)) + Math.sin(t * 1.5 + si) * 2 * k * (ti3 > 0.99 ? 1 : 0);
            var sy2 = Math.max(0, Math.floor((top + si * hS) * dpr)), shh = Math.min(Math.ceil(hS * dpr) + 1, lay.height - sy2);
            if (shh > 0) ctx.drawImage(lay, 0, sy2, lay.width, shh, offS, sy2 / dpr, W2, shh / dpr);
          }
          break;
        }
        case 38: { /* pixelation resolves into sharp letters */
          layerBegin();
          var pgd = lctx.createLinearGradient(0, top, 0, bot);
          pgd.addColorStop(0, rgbaS(mixA(c2, WH, 0.3), 1)); pgd.addColorStop(1, rgbaS(c1, 1));
          lctx.fillStyle = pgd;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          var pxl = 1 + ((1 - easeOut(clamp01(tt / 1.8))) + easeIn(outP)) * sz * 0.22;
          ctx.globalAlpha = clamp01(tt * 3) * (1 - outP * 0.8); ctx.shadowColor = rgbaS(c1, 0.6); ctx.shadowBlur = sb(14 * gl * k);
          if (pxl < 1.6) ctx.drawImage(lay, 0, 0, W2, H2);
          else {
            var tw = Math.max(1, Math.ceil(W2 / pxl)), th = Math.max(1, Math.ceil(H2 / pxl));
            if (!tmpc) { tmpc = document.createElement('canvas'); tmpx = tmpc.getContext('2d'); }
            tmpc.width = tw; tmpc.height = th; tmpx.imageSmoothingQuality = 'high';
            tmpx.drawImage(lay, 0, 0, lay.width, lay.height, 0, 0, tw, th);
            ctx.imageSmoothingEnabled = false; ctx.drawImage(tmpc, 0, 0, tw, th, 0, 0, tw * pxl, th * pxl); ctx.imageSmoothingEnabled = true;
          }
          break;
        }
        case 39: { /* letters melt and drip */
          layerBegin();
          var mgd = lctx.createLinearGradient(0, top, 0, bot);
          mgd.addColorStop(0, rgbaS(mixA(c2, WH, 0.3), 1)); mgd.addColorStop(1, rgbaS(c1, 1));
          lctx.fillStyle = mgd;
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          var mlt = tt < out ? 1 - easeOut(clamp01(tt / 1.5)) : easeIn(clamp01((tt - out) / 1.6)), stp = Math.max(1, Math.round(2 * dpr)), sx3;
          for (sx3 = 0; sx3 < lay.width; sx3 += stp) {
            var nz = hash(Math.floor(sx3 / stp), 11), m2 = Math.min(1, mlt * (0.5 + nz)), stretch = 1 + m2 * 1.6;
            ctx.globalAlpha = 1 - m2 * 0.85;
            ctx.drawImage(lay, sx3, 0, stp, lay.height, sx3 / dpr, top * (1 - stretch) + m2 * sz * (0.2 + nz), stp / dpr, H2 * stretch);
          }
          break;
        }
        case 40: { /* sci-fi hologram with scanlines */
          layerBegin();
          lctx.fillStyle = rgbaS(mixA(c1, WH, 0.35), 1);
          layerLines(function (ln) { lctx.fillText(ln.text, cx, ln.y); });
          lctx.globalCompositeOperation = 'destination-out'; lctx.fillStyle = 'rgba(0,0,0,0.5)';
          var yy3;
          for (yy3 = top; yy3 < bot; yy3 += 3 * k) lctx.fillRect(0, yy3, W2, 1.4 * k);
          lctx.globalCompositeOperation = 'source-atop';
          var by3 = top + ((t * 0.45) % 1.4 - 0.2) * (bot - top), bgr = lctx.createLinearGradient(0, by3 - sz * 0.2, 0, by3 + sz * 0.2);
          bgr.addColorStop(0, 'rgba(255,255,255,0)'); bgr.addColorStop(0.5, 'rgba(255,255,255,0.85)'); bgr.addColorStop(1, 'rgba(255,255,255,0)');
          lctx.fillStyle = bgr; lctx.fillRect(0, by3 - sz * 0.2, W2, sz * 0.4);
          var flk = 0.8 + 0.2 * hash(Math.floor(t * 18), 9), jit = hash(Math.floor(t * 7), 3) > 0.92 ? (hash(Math.floor(t * 7), 5) - 0.5) * 12 * k : 0;
          var rev = tt < out ? easeOut(clamp01(tt / 1.2)) : 1 - easeIn(clamp01((tt - out) / 1.0));
          ctx.save(); ctx.beginPath(); ctx.rect(0, top - sz * 0.15, W2, (bot - top + sz * 0.3) * rev); ctx.clip();
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 * flk;
          ctx.drawImage(lay, -3 * k + jit, 0, W2, H2); ctx.drawImage(lay, 3 * k + jit, 0, W2, H2);
          ctx.globalAlpha = flk; ctx.shadowColor = rgbaS(c1, 0.9); ctx.shadowBlur = sb(24 * gl * k);
          ctx.drawImage(lay, jit, 0, W2, H2);
          ctx.restore();
          break;
        }
        case 41: { /* die-cut sticker with a drop shadow */
          var tS = clamp01(tt / 0.7), pop = Math.max(0.001, easeOutBack(tS) * (1 - easeIn(clamp01((tt - out) / 0.7))));
          layerBegin();
          lctx.lineWidth = sz * 0.14; lctx.strokeStyle = '#ffffff'; lctx.fillStyle = '#ffffff';
          layerLines(function (ln) { lctx.strokeText(ln.text, cx, ln.y); lctx.fillText(ln.text, cx, ln.y); });
          ctx.save();
          ctx.translate(cx, (top + bot) / 2); ctx.rotate(Math.sin(t * 1.3) * 0.02 + (1 - tS) * -0.15); ctx.scale(pop, pop); ctx.translate(-cx, -(top + bot) / 2);
          ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = sb(12 * k); ctx.shadowOffsetY = 7 * k * dpr;
          ctx.drawImage(lay, 0, 0, W2, H2);
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
          var sg2 = ctx.createLinearGradient(0, top, 0, bot);
          sg2.addColorStop(0, rgbaS(c2, 1)); sg2.addColorStop(1, rgbaS(c0, 1));
          ctx.fillStyle = sg2;
          lines(function (ln) { ctx.fillText(ln.text, cx, ln.y); });
          ctx.restore();
          break;
        }
      }
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    /* solid-font styles on a logo: a pop-in with glow and a moving shine */
    function drawLogoStyle(t, tt, out) {
      var C = cfg.stops.map(hexRgb);
      if (C.length < 2) C.push(C[0] || [255, 255, 255]);
      var c1 = C[1], bx = logoBox, gl = cfg.glow;
      var inP = easeOutBack(clamp01(tt / 1.0)), outP = easeIn(clamp01((tt - out) / 1.0)), sc = Math.max(0.001, inP * (1 - outP)), vis = clamp01(tt * 3) * (1 - outP);
      lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, lay.width, lay.height);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
      lctx.drawImage(logoEl, bx.x, bx.y, bx.w, bx.h);
      lctx.globalCompositeOperation = 'source-atop';
      var sx = bx.x + (((t * 0.45) % 1.7) - 0.35) * bx.w, sg = lctx.createLinearGradient(sx - bx.w * 0.15, 0, sx + bx.w * 0.15, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.7)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = sg; lctx.fillRect(bx.x, bx.y, bx.w, bx.h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = vis; ctx.shadowColor = 'rgba(' + (c1[0] | 0) + ',' + (c1[1] | 0) + ',' + (c1[2] | 0) + ',0.85)'; ctx.shadowBlur = 26 * gl * k * dpr;
      ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(lay, 0, 0, W, H);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }

    /* the picture or colors behind the text */
    function drawBg() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var tp = cfg.bgType;
      if (tp === 'color') { ctx.fillStyle = cfg.bgA; ctx.fillRect(0, 0, W, H); }
      else if (tp === 'gradient') { var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, cfg.bgA); g.addColorStop(1, cfg.bgB); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      else if (tp === 'image' && bgEl) {
        var sc = Math.max(W / bgEl.width, H / bgEl.height), dw = bgEl.width * sc, dh = bgEl.height * sc;
        ctx.drawImage(bgEl, (W - dw) / 2, (H - dh) / 2, dw, dh);
        if (cfg.bgDim > 0) { ctx.fillStyle = 'rgba(0,0,0,' + cfg.bgDim + ')'; ctx.fillRect(0, 0, W, H); }
      }
    }

    /* draws one frame: the effect, moved and rotated if asked, over the chosen background */
    function render(t) {
      var hasBg = cfg.bgType && cfg.bgType !== 'none', ox = +cfg.ox || 0, oy = +cfg.oy || 0, rot = +cfg.rot || 0;
      if (!hasBg && !ox && !oy && !rot) { renderText(t, false); return; }
      renderText(t, true);
      var cx = W / 2, cy = H / 2;
      if (ox || oy || rot) {
        if (!post || post.width !== canvas.width || post.height !== canvas.height) { post = document.createElement('canvas'); post.width = canvas.width; post.height = canvas.height; pctx = post.getContext('2d'); }
        pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.globalCompositeOperation = 'source-over'; pctx.globalAlpha = 1;
        pctx.clearRect(0, 0, post.width, post.height); pctx.drawImage(canvas, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (hasBg) drawBg(); else if (cfg.bg !== 'transparent') { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.translate(cx + ox * W / 100, cy + oy * H / 100); ctx.rotate(rot * Math.PI / 180); ctx.translate(-cx, -cy);
        ctx.drawImage(post, 0, 0, W, H);
      } else { ctx.globalCompositeOperation = 'destination-over'; drawBg(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }

    function renderText(t, transparent) {
      var bgTransparent = transparent || cfg.bg === 'transparent';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (bgTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
      else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      var hybridTT = -1;
      if ((cfg.mode | 0) >= STYLE0 && layout && !cfg.image) {
        var fxS = FX[cfg.mode | 0] || FX[0], ttS, hyb = cfg.hybrid && n > 0;
        if (hyb) { var Ph = fxS.out + 4.6; ttS = fxS.P === Infinity ? t : (cfg.loop ? t % Ph : Math.min(t, fxS.out)); }
        else if (fxS.P === Infinity) ttS = t; else if (cfg.loop) ttS = t % fxS.P; else ttS = Math.min(t, fxS.out);
        if (!(hyb && ttS >= fxS.out)) { drawStyle(cfg.mode | 0, t, ttS, fxS.out); return; }
        hybridTT = 4.4 + (ttS - fxS.out);
      } else if ((cfg.mode | 0) >= STYLE0 && cfg.image && logoEl && logoBox) {
        var fxL = FX[cfg.mode | 0] || FX[0], ttL = cfg.loop ? t % fxL.P : Math.min(t, fxL.out);
        drawLogoStyle(t, ttL, fxL.out);
        return;
      }
      if (!n) return;
      if (cfg.stops.join(',') !== lutKey) buildLut();

      var mode = (cfg.mode | 0) >= STYLE0 ? 0 : cfg.mode | 0, fx = FX[mode] || FX[0], out = fx.out, tt, i, useImg = cfg.imgColors && hasImgPal;
      if (hybridTT >= 0) tt = hybridTT; else if (fx.P === Infinity) tt = t; else if (cfg.loop) tt = t % fx.P; else tt = Math.min(t, out);
      var cx = W / 2, cy = H / 2, hasM = cfg.interactive && mx > -1000, R = 110 * Math.max(0.6, k), R2 = R * R;

      var split = 0;
      if (mode === 3) {
        var slot = Math.floor(t * 10), act = hash(slot, 1) > 0.7, b;
        for (b = 0; b < 12; b++) bandOff[b] = (act && hash(slot, b + 3) > 0.5) ? (hash(slot, b + 9) - 0.5) * 80 * k : 0;
        split = act && hash(slot, 2) > 0.35 ? 6 * k : 0;
      }

      var bolt = mode === 9 && hash(Math.floor(t * 8), 5) > 0.78 ? 1 : 0;
      var heart = 0, spinC = 1, spinS = 0, spinA = 1;
      if (mode === 14) { var m1 = t % 1.1; heart = Math.exp(-(m1 - 0.1) * (m1 - 0.1) * 60) + 0.6 * Math.exp(-(m1 - 0.35) * (m1 - 0.35) * 60); }
      if (mode === 16) {
        var o16 = clamp01((tt - 5.8) / 1.0);
        var th16 = -Math.PI / 2 * (1 - easeOut(clamp01(tt / 1.4))) + 2 * Math.PI * (easeInOut(clamp01((tt - 2.0) / 1.4)) + easeInOut(clamp01((tt - 4.0) / 1.4))) + Math.PI / 2 * easeIn(o16);
        spinC = Math.cos(th16); spinS = Math.sin(th16); spinA = 1 - o16;
      }
      counts.fill(0);
      for (i = 0; i < n; i++) {
        var x = hx[i], y = hy[i], a = 1, wv = 1, ch = -1, cOff = 0;
        var sdv = sd[i], dlv = dl[i], nxv = nx[i], nyv = ny[i], r4v = r4[i], r5v = r5[i];
        switch (mode) {
          case 0: {
            var din = clamp01((tt - dlv * 0.7) / 1.9), sIn = 1 - easeOut(din);
            var dout = clamp01((tt - out - nxv * 1.7 - dlv * 0.4) / 2.3), sOut = dout * dout * dout;
            x += -(120 + sdv * 480) * k * sIn + (80 + r4v * 520) * k * sOut;
            y += (r5v - 0.5) * 260 * k * sIn + ((r4v - 0.5) * 300 - 50) * k * sOut + Math.sin(tt * 2.2 + sdv * 40) * 30 * k * sOut;
            a = Math.min(1, din * 2) * (1 - dout * dout);
            break;
          }
          case 1: {
            var d1 = clamp01((tt - dlv * 0.7) / 1.8), s1 = 1 - easeOut(d1);
            x += -(120 + sdv * 480) * k * s1 + Math.sin(t * 3.1 + sdv * 50) * 0.7;
            y += (r5v - 0.5) * 260 * k * s1 + Math.cos(t * 2.7 + sdv * 70) * 0.7;
            a = Math.min(1, d1 * 2);
            wv = 1 + 0.7 * Math.max(0, Math.sin(t * 3 - nxv * 8));
            break;
          }
          case 2: {
            var s2;
            if (tt < out) s2 = 1 - easeInOut(clamp01((tt - dlv * 0.5) / 1.8));
            else s2 = easeOut(clamp01((tt - out - dlv * 0.25) / 1.2));
            var dist = (150 + r4v * 600) * k;
            x += ca[i] * dist * s2 + Math.sin(t * 1.3 + sdv * 60) * 10 * k * s2;
            y += sa[i] * dist * s2 + Math.cos(t * 1.1 + sdv * 80) * 10 * k * s2;
            a = 1 - 0.4 * s2;
            break;
          }
          case 3: {
            var d3 = clamp01((tt - nyv * 0.9) * 6), o3 = clamp01((tt - out - nyv * 0.7) * 5);
            a = d3 * (1 - o3);
            x += (sdv - 0.5) * 170 * k * ((1 - d3) + o3);
            var bnd = Math.min(11, Math.max(0, ((y / H) * 12) | 0));
            x += bandOff[bnd];
            if (split > 0) { ch = chn[i]; x += (ch - 1) * split; }
            a *= 0.88 + 0.12 * Math.sin(t * 40 + nyv * 30);
            break;
          }
          case 4: {
            var d4 = clamp01((tt - nxv - dlv * 0.2) / 1.4), s4 = 1 - easeOut(d4);
            var o4 = clamp01((tt - out - nxv - dlv * 0.2) / 1.4), so4 = o4 * o4;
            var ph = hx[i] / k * 0.018 + t * 2.6, amp = d4 * (1 - o4);
            y += (80 + r4v * 220) * k * (s4 + so4) + (Math.sin(ph) * 12 + Math.sin(ph * 0.5 + t) * 6) * k * amp;
            a = Math.min(1, d4 * 2) * (1 - so4);
            wv = 1 + 0.6 * Math.max(0, Math.sin(ph)) * amp;
            break;
          }
          case 5: {
            var d5 = clamp01((tt - dlv - (1 - nyv) * 0.8) / 1.3), s5 = 1 - easeOut(d5);
            var o5 = clamp01((tt - out - nyv * 1.5 - r4v * 0.6) / 2.0);
            y += -(H * 0.5 + r5v * H * 0.6) * s5 + (H * 0.55 + r5v * H * 0.5) * o5 * o5;
            x += (sdv - 0.5) * 40 * k * s5 + (sdv - 0.5) * 110 * k * o5;
            a = Math.min(1, d5 * 2) * (1 - o5 * o5 * o5);
            break;
          }
          case 6: {
            var s6 = tt < out ? 1 - easeOut(clamp01((tt - dlv * 0.5) / 2.0)) : easeIn(clamp01((tt - out - dlv * 0.4) / 2.0));
            var th = s6 * (4 + sdv * 3), c6 = Math.cos(th), n6 = Math.sin(th), sc = 1 + s6 * 1.6 * (0.6 + r4v * 0.8);
            var rx = x - cx, ry = y - cy;
            x = cx + (rx * c6 - ry * n6) * sc; y = cy + (rx * n6 + ry * c6) * sc;
            a = 1 - s6 * s6;
            break;
          }
          case 8: {
            var ta = nxv * 2.6, d8 = clamp01((tt - ta) * 6), hot = tt >= ta ? clamp01(1 - (tt - ta) / 0.45) : 0;
            var o8 = clamp01((tt - out - (1 - nxv) * 0.9) * 4);
            x += (sdv - 0.5) * 50 * k * (1 - d8);
            y += -r5v * 70 * k * (1 - d8) - 40 * k * o8;
            a = d8 * (1 - o8); wv = 1 + 1.4 * hot; cOff = hot * 0.5;
            break;
          }
          case 9: {
            var d9 = clamp01((tt - dlv * 0.7) / 1.4), s9 = 1 - easeOut(d9);
            x += -(100 + sdv * 300) * k * s9; y += (r5v - 0.5) * 200 * k * s9;
            var jx = Math.sin(t * 41 + sdv * 90) * Math.sin(t * 7 + r4v * 30), jy = Math.cos(t * 37 + dlv * 80) * Math.sin(t * 9 + r5v * 20);
            var amp = (sdv < 0.45 ? 1 : 0.25) * (3 + 11 * bolt);
            x += jx * amp * k; y += jy * amp * k;
            a = Math.min(1, d9 * 2) * (0.8 + 0.2 * Math.sin(t * 50 + sdv * 40));
            wv = 1 + bolt * 1.1; cOff = bolt * 0.4;
            break;
          }
          case 10: {
            var s10 = 1 - easeOut(clamp01((tt - dlv * 0.5) / 1.8)), dist10 = (500 + r4v * 900) * k;
            x += ca[i] * dist10 * s10; y += sa[i] * dist10 * s10;
            var o10 = easeIn(clamp01((tt - out - dlv * 0.3) / 1.6)), sc10 = 1 + o10 * 7;
            x = cx + (x - cx) * sc10; y = cy + (y - cy) * sc10;
            a = (1 - s10 * s10) * (1 - o10);
            break;
          }
          case 11: {
            var tau = tt - (nxv * 0.9 + dlv * 0.15);
            y += -H * 0.9 * (1 - bounceOut(clamp01(tau / 1.3)));
            var o11 = clamp01((tt - out - (1 - nxv) * 0.6 - dlv * 0.1) / 0.9);
            y += -H * 1.2 * o11 * o11;
            a = clamp01(tau * 8) * (1 - o11 * o11 * o11);
            break;
          }
          case 12: {
            var sIn12 = tt / 1.6 * 1.2 - 0.1, sOut12 = 1.2 - (tt - out) / 1.4 * 1.3, sc12 = tt < out ? sIn12 : sOut12;
            a = tt < out ? clamp01((sIn12 - nxv) * 10) : clamp01((sOut12 - nxv) * 10 + 0.5);
            var hotL = clamp01(1 - Math.abs(nxv - sc12) * 16) * ((tt < 1.8) || (tt >= out && tt < out + 1.6) ? 1 : 0);
            wv = 1 + 2.2 * hotL; cOff = 0.45 * hotL;
            y += (r5v - 0.5) * 8 * k * hotL;
            break;
          }
          case 13: {
            var ddx = x - cx, ddy = y - cy, rr = Math.sqrt(ddx * ddx + ddy * ddy) || 1, rn = rr / (W * 0.4);
            var R13 = tt < out ? tt * 0.6 : 1.5 - (tt - out) * 0.75;
            var vis13 = clamp01((R13 - rn) * 7 + (tt < out ? 0 : 0.3));
            var wave = Math.sin(rn * 16 - tt * 5) * (6 + 10 * Math.max(0, Math.sin(tt * 1.4))) * k * vis13;
            x += ddx / rr * wave; y += ddy / rr * wave;
            var ring = clamp01(1 - Math.abs(rn - R13) * 9);
            a = vis13; wv = 1 + 1.6 * ring; cOff = 0.35 * ring;
            break;
          }
          case 14: {
            var d14 = clamp01((tt - dlv * 0.7) / 1.6), s14 = 1 - easeOut(d14);
            x += -(100 + sdv * 300) * k * s14; y += (r5v - 0.5) * 200 * k * s14;
            var sc14 = 1 + 0.05 * heart * d14;
            x = cx + (x - cx) * sc14; y = cy + (y - cy) * sc14;
            a = Math.min(1, d14 * 2); wv = 1 + 1.2 * heart * d14; cOff = 0.3 * heart * d14;
            break;
          }
          case 15: {
            var z15 = easeOutBack(clamp01((tt - dlv * 0.3) / 1.5)), o15 = easeIn(clamp01((tt - out) / 1.5)), sc15 = z15 * (1 + o15 * 6);
            x = cx + (x - cx) * sc15; y = cy + (y - cy) * sc15;
            a = clamp01((tt - dlv * 0.3) * 3) * (1 - o15);
            break;
          }
          case 16: {
            var dx16 = x - cx, z0 = (r4v - 0.5) * 70 * k;
            var x3 = dx16 * spinC + z0 * spinS, z3 = -dx16 * spinS + z0 * spinC, pp = 900 * k / (900 * k - z3);
            x = cx + x3 * pp; y = cy + (y - cy) * pp;
            a = spinA * clamp01(0.55 + (pp - 1) * 3.5); wv = pp * pp;
            break;
          }
          case 17: {
            var tg = tt - r4v * 2.2, to17 = out + r5v * 1.6;
            a = clamp01(tg * 5) * (1 - clamp01((tt - to17) * 6)) * (0.78 + 0.22 * Math.sin(t * 3 + sdv * 60));
            wv = 1 + (tg > 0 ? 3 * Math.exp(-tg * 6) : 0) + (sdv > 0.9 ? 1.6 * Math.max(0, Math.sin(t * 2 + r5v * 40)) : 0);
            break;
          }
          case 18: {
            var o18 = clamp01((tt - out) / 1.6);
            var Bf = (1 - easeOut(clamp01(tt / 2.2))) * 70 * k + (4 + 3 * Math.sin(t * 1.6)) * k + easeIn(o18) * 90 * k;
            var ang18 = sdv * 6.2832 + t * 0.7;
            x += Math.cos(ang18) * Bf * (0.4 + r4v); y += Math.sin(ang18) * Bf * (0.4 + r4v);
            a = (1 - 0.5 * clamp01(Bf / (60 * k))) * (1 - 0.6 * o18);
            break;
          }
          default: {
            var d7 = clamp01((tt - dlv * 0.7) / 1.8), s7 = 1 - easeOut(d7);
            x += -(120 + sdv * 480) * k * s7; y += (r5v - 0.5) * 260 * k * s7;
            a = Math.min(1, d7 * 2);
            if (sdv < 0.12 + 0.45 * (1 - nyv)) {
              var p = frac(t * (0.18 + dlv * 0.35) + r4v * 7.3);
              y -= p * p * (120 + r5v * 220) * k * d7;
              x += (Math.sin(t * 1.7 + sdv * 40) * p * 26 + (r4v - 0.5) * p * 40) * k * d7;
              a *= (1 - p); wv = 1 - p * 0.5; cOff = p * 0.3;
            } else {
              a *= 0.82 + 0.18 * Math.sin(t * 9 + sdv * 60);
              wv = 0.95 + 0.15 * Math.sin(t * 5 + r4v * 50);
            }
          }
        }

        if (hasM) {
          var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            var d = Math.sqrt(d2) || 1, fo = 1 - d / R, push = fo * fo * R * 0.9;
            x += dx / d * push; y += dy / d * push;
          }
        }

        var c = nxv * 0.75 + t * 0.16 * fx.cs + sdv * 0.18 + cOff;
        if (mode === 1) c += 0.18 * Math.sin(t * 7 + sdv * 40) + 0.12 * Math.sin(t * 2.3 - nxv * 6);
        c -= Math.floor(c);
        var lvl = a > 0.66 ? 0 : a > 0.33 ? 1 : 2;
        var bi = ch >= 0 ? L * 3 + ch : useImg ? IMGB + iq[i] * 3 + lvl : ((c * L) | 0) + L * lvl;
        bk[i] = bi; counts[bi + 1]++;
        px[i] = x; py[i] = y;
        ps[i] = a < 0.04 ? 0 : bs * sz[i] * (0.5 + 0.5 * a) * (0.75 + 0.25 * Math.sin(t * (4 + sdv * 6) + sdv * 100)) * wv;
      }

      for (i = 0; i < NB; i++) counts[i + 1] += counts[i];
      for (i = 0; i <= NB; i++) cursor[i] = counts[i];
      for (i = 0; i < n; i++) order[cursor[bk[i]]++] = i;

      ctx.globalCompositeOperation = 'lighter';
      var round = cfg.shape !== 'square', lastB = -1, q, s;
      if (round) ctx.beginPath();
      for (q = 0; q < n; q++) {
        i = order[q];
        if (ps[i] <= 0) continue;
        if (bk[i] !== lastB) {
          if (round && lastB >= 0) { ctx.fill(); ctx.beginPath(); }
          lastB = bk[i]; ctx.fillStyle = lastB >= IMGB ? ilut[lastB - IMGB] : lut[lastB];
        }
        s = ps[i] * dpr;
        if (round) { var X2 = px[i] * dpr, Y2 = py[i] * dpr, r = s * 0.5; ctx.moveTo(X2 + r, Y2); ctx.arc(X2, Y2, r, 0, TAU); }
        else ctx.fillRect(px[i] * dpr - s / 2, py[i] * dpr - s / 2, s, s);
      }
      if (round && lastB >= 0) ctx.fill();

      if (cfg.glow > 0 && !cfg.lowq) {
        var src = canvas, idx;
        for (idx = 0; idx < small.length; idx++) {
          small[idx].x.globalCompositeOperation = 'copy';
          small[idx].x.drawImage(src, 0, 0, small[idx].c.width, small[idx].c.height);
          src = small[idx].c;
        }
        ctx.globalAlpha = Math.min(1, 0.7 * cfg.glow); ctx.drawImage(small[1].c, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = Math.min(1, 0.6 * cfg.glow); ctx.drawImage(small[3].c, 0, 0, canvas.width, canvas.height);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    return {
      cfg: cfg,
      build: build,
      render: render,
      setPointer: function (x, y) { mx = x; my = y; },
      recDuration: function () { var f = FX[cfg.mode | 0] || FX[0]; if (cfg.hybrid && (cfg.mode | 0) >= STYLE0) return f.out + 4.6; return f.rec || f.P; }
    };
  }

  /* A sequence of scenes drawn on one canvas. scenes: [{ cfg, dur }]. dur is in seconds; 0 means a single free-running scene. */
  function createSeq(canvas, scenes, opts) {
    var engs = scenes.map(function (sc) { return create(canvas, sc.cfg); });
    /* extra text layers: each one is its own effect drawn on a transparent canvas and laid over the scene */
    var lays = scenes.map(function (sc) {
      return (sc.layers || []).slice(0, 6).map(function (lc) {
        var lcv = document.createElement('canvas'), cc = {}, key;
        for (key in lc) cc[key] = lc[key];
        cc.bg = 'transparent'; cc.bgType = 'none'; cc.rot = 0; cc.interactive = false; cc.image = '';
        return { c: lcv, e: create(lcv, cc), delay: Math.max(0, +lc.delay || 0) };
      });
    });
    var flat = [];
    lays.forEach(function (L) { L.forEach(function (o) { flat.push(o.e); }); });
    var fade = Math.max(0, +(opts && opts.fade) || 0), c2d = canvas.getContext('2d'), snapA = null, snapB = null, bsnap = null;
    var beat = (opts && opts.beat) || null;
    function dur(i) { return Math.max(0, +scenes[i].dur || 0); }
    function fd(i) { return i < scenes.length - 1 ? Math.min(fade, dur(i) * 0.5, dur(i + 1) * 0.5) : 0; }
    function starts() { var a2 = [], acc = 0, i; for (i = 0; i < scenes.length; i++) { a2.push(acc); acc += dur(i) - fd(i); } return a2; }
    function total() { var s2 = 0, i; for (i = 0; i < scenes.length; i++) s2 += dur(i) - fd(i); return Math.max(0, s2); }
    function locate(t) {
      var tot = total();
      if (tot <= 0) return [{ i: 0, local: t }];
      var tt = t % tot, st = starts(), res = [], i;
      for (i = 0; i < scenes.length; i++) if (tt >= st[i] && tt < st[i] + dur(i)) res.push({ i: i, local: tt - st[i] });
      if (!res.length) res.push({ i: scenes.length - 1, local: tt - st[scenes.length - 1] });
      return res;
    }
    function snap(s2) {
      if (!s2 || s2.width !== canvas.width || s2.height !== canvas.height) { s2 = document.createElement('canvas'); s2.width = canvas.width; s2.height = canvas.height; }
      var x = s2.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'copy'; x.drawImage(canvas, 0, 0);
      return s2;
    }
    /* one scene: its main effect, then every extra layer whose delay has passed (engT is already speed-scaled) */
    function renderScene(i, engT) {
      engs[i].render(engT);
      var L = lays[i], j, sp = engs[i].cfg.speed || 1;
      for (j = 0; j < L.length; j++) {
        var lt = engT - L[j].delay * sp;
        if (lt < 0) continue;
        L[j].e.render(lt);
        c2d.setTransform(1, 0, 0, 1, 0, 0); c2d.globalAlpha = 1; c2d.globalCompositeOperation = 'source-over';
        c2d.drawImage(L[j].c, 0, 0);
      }
    }
    /* beat pulse: a short punch-in and flash on the finished frame, driven by an envelope taken from the music */
    function applyBeat(gT) {
      if (!beat || !beat.amount) return;
      var e = beat.at(gT);
      if (!(e > 0.02)) return;
      bsnap = snap(bsnap);
      var cw = canvas.width, ch = canvas.height, sc = 1 + 0.055 * beat.amount * e;
      c2d.setTransform(1, 0, 0, 1, 0, 0); c2d.globalAlpha = 1;
      c2d.globalCompositeOperation = 'copy';
      c2d.drawImage(bsnap, (cw - cw * sc) / 2, (ch - ch * sc) / 2, cw * sc, ch * sc);
      c2d.globalCompositeOperation = 'lighter'; c2d.globalAlpha = Math.min(0.6, 0.35 * beat.amount * e);
      c2d.drawImage(bsnap, (cw - cw * sc) / 2, (ch - ch * sc) / 2, cw * sc, ch * sc);
      c2d.globalAlpha = 1; c2d.globalCompositeOperation = 'source-over';
    }
    return {
      engines: engs,
      scenes: scenes,
      total: total,
      allEngines: function () { return engs.concat(flat); },
      layers: function (i) { return lays[i] || []; },
      setBeat: function (b) { beat = b || null; },
      setFade: function (f) { fade = Math.max(0, +f || 0); },
      build: function (w, h, d) {
        var lp = Promise.all(flat.map(function (e) { return e.build(w, h, d); }));
        return Promise.all(engs.map(function (e) { return e.build(w, h, d); })).then(function (rs) {
          return lp.then(function () {
            if (rs.some(function (r) { return !r; })) return null;
            return rs.filter(function (r) { return !r.ok; })[0] || rs[0];
          });
        });
      },
      renderScene: function (i, engT, gT) { renderScene(i, engT); if (gT !== undefined) applyBeat(gT); },
      render: function (t) {
        var L = locate(t);
        if (L.length === 1) { renderScene(L[0].i, L[0].local * engs[L[0].i].cfg.speed); applyBeat(t); return L[0].i; }
        var A = L[0], B = L[1], f = clamp01(B.local / Math.max(1e-6, fd(A.i)));
        renderScene(A.i, A.local * engs[A.i].cfg.speed); snapA = snap(snapA);
        renderScene(B.i, B.local * engs[B.i].cfg.speed); snapB = snap(snapB);
        c2d.setTransform(1, 0, 0, 1, 0, 0); c2d.globalAlpha = 1; c2d.globalCompositeOperation = 'source-over';
        c2d.clearRect(0, 0, canvas.width, canvas.height);
        c2d.globalCompositeOperation = 'lighter';
        c2d.globalAlpha = 1 - f; c2d.drawImage(snapA, 0, 0);
        c2d.globalAlpha = f; c2d.drawImage(snapB, 0, 0);
        c2d.globalAlpha = 1; c2d.globalCompositeOperation = 'source-over';
        applyBeat(t);
        return f > 0.5 ? B.i : A.i;
      },
      setPointer: function (x, y) { engs.forEach(function (e) { e.setPointer(x, y); }); }
    };
  }

  /* Mounts an effect (one cfg object) or a sequence (array of { cfg, dur }) inside any sized element. */
  function mount(container, spec, hooks) {
    hooks = hooks || {};
    var opts = {}, scenes;
    if (Array.isArray(spec)) scenes = spec;
    else if (spec && Array.isArray(spec.scenes)) { scenes = spec.scenes; opts = spec; }
    else scenes = [{ cfg: spec, dur: 0 }];
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    container.appendChild(canvas);
    var seq = createSeq(canvas, scenes, opts), engs = seq.engines;
    var qual = opts.quality || 'auto', lowMode = qual === 'low', slow = 0, nFrames = 0;
    seq.allEngines().forEach(function (e) { e.cfg.lowq = lowMode; });
    var sel = 0, playAll = scenes.length > 1, clock = 0, lastIdx = -1;
    var last = performance.now(), vis = true, timer = 0, dead = false;
    var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function size() { return [container.clientWidth, container.clientHeight, lowMode ? 1 : Math.min(window.devicePixelRatio || 1, 2)]; }
    function done(r) { if (r && hooks.onBuilt) hooks.onBuilt(r); return r; }
    function rebuild() {
      var z = size();
      if (!z[0] || !z[1]) return Promise.resolve(null);
      return seq.build(z[0], z[1], z[2]).then(done);
    }
    function sched() { clearTimeout(timer); timer = setTimeout(rebuild, 150); }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(sched); ro.observe(container); }
    else window.addEventListener('resize', sched);

    function setP(e) { var r = container.getBoundingClientRect(); seq.setPointer(e.clientX - r.left, e.clientY - r.top); }
    function clearP() { seq.setPointer(-9999, -9999); }
    container.addEventListener('pointermove', setP);
    container.addEventListener('pointerdown', setP);
    container.addEventListener('pointerleave', clearP);
    container.addEventListener('pointercancel', clearP);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(container);

    function frame(now) {
      if (dead) return;
      requestAnimationFrame(frame);
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!vis) return;
      if (qual === 'auto' && !lowMode && ++nFrames > 60) {
        if (dt > 0.034) slow++; else slow = Math.max(0, slow - 2);
        if (slow > 90) { lowMode = true; seq.allEngines().forEach(function (e) { e.cfg.lowq = true; }); rebuild(); if (hooks.onQuality) hooks.onQuality('low'); }
      }
      if (playAll) {
        if (!rm) clock += dt;
        var idx;
        if (rm) { engs[0].render(3.4); idx = 0; } else idx = seq.render(clock);
        if (idx !== lastIdx) { lastIdx = idx; if (hooks.onScene) hooks.onScene(idx); }
      } else {
        var e = engs[sel];
        if (!rm) clock += dt * e.cfg.speed;
        seq.renderScene(sel, rm ? 3.4 : clock);
      }
    }
    requestAnimationFrame(frame);
    rebuild();

    return {
      seq: seq,
      canvas: canvas,
      update: function (p) {
        var e = engs[sel], rb = false, key;
        for (key in p) { if (REBUILD[key] && e.cfg[key] !== p[key]) rb = true; e.cfg[key] = p[key]; }
        if (!rb) return Promise.resolve(null);
        var z = size();
        return z[0] && z[1] ? e.build(z[0], z[1], z[2]).then(done) : Promise.resolve(null);
      },
      updateLayer: function (j, p) {
        var lo = seq.layers(sel)[j], rb = false, key;
        if (!lo) return Promise.resolve(null);
        for (key in p) {
          if (key === 'delay') { lo.delay = Math.max(0, +p[key] || 0); continue; }
          if (REBUILD[key] && lo.e.cfg[key] !== p[key]) rb = true;
          lo.e.cfg[key] = p[key];
        }
        if (!rb) return Promise.resolve(null);
        var z = size();
        return z[0] && z[1] ? lo.e.build(z[0], z[1], z[2]).then(done) : Promise.resolve(null);
      },
      setBeat: function (b) { seq.setBeat(b); },
      replay: function () { clock = 0; },
      select: function (i) { sel = Math.max(0, Math.min(engs.length - 1, i | 0)); if (!playAll) clock = 0; },
      setPlayAll: function (v) { playAll = !!v; clock = 0; lastIdx = -1; },
      setDur: function (i, d) { if (scenes[i]) scenes[i].dur = d; },
      setFade: function (f) { seq.setFade(f); },
      setQuality: function (q) { qual = q; lowMode = q === 'low'; slow = 0; seq.allEngines().forEach(function (e) { e.cfg.lowq = lowMode; }); rebuild(); },
      total: seq.total,
      destroy: function () {
        dead = true; clearTimeout(timer);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', sched);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  return { create: create, createSeq: createSeq, mount: mount, loadFont: loadFont };
};
