/* Artist Hub — design-rule audit (dev-only; not deployed).
   Loads each route headless, force-reveals scroll-gated content, and checks the
   MEASURABLE design rules: spacing on 4/8 scale, type scale, radius scale,
   contrast (AA), overflow/clip, element overlap, tap-target size, console errors.
   Prints one defect list and exits non-zero if anything fails (so a git/CI gate
   can block a bad deploy).  Run:  npm --prefix tools run audit
   Optional: AUDIT_URL=https://... node tools/audit.mjs  (audit a live URL).
   Cross-browser (pre-launch sweep): BROWSERS=chromium,firefox,webkit npm --prefix tools run audit */
import { chromium, firefox, webkit } from 'playwright';
import * as AxePkg from '@axe-core/playwright';
const AxeBuilder = AxePkg.AxeBuilder || AxePkg.default;
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, () => resolve(server));
  });
}

const ROUTES = [
  { name: 'landing', path: '/index.html' },
  { name: 'dashboard', path: '/dashboard.html' },
  { name: 'project', path: '/project.html?slug=onnorokom-erp' },
  { name: 'project-longname', path: '/project.html?slug=udvash-unmesh-e-commerce' },
];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

/* runs in the page; returns an array of {type, el, detail} */
function pageAudit() {
  // headless never fires IntersectionObserver reveals -> force opacity:0 reveal-gated content visible
  document.querySelectorAll('*').forEach((e) => {
    const cs = getComputedStyle(e);
    if (parseFloat(cs.opacity) < 0.99 && cs.transition.indexOf('opacity') >= 0) { e.style.opacity = '1'; e.style.transform = 'none'; }
  });

  const SPACING_OK = new Set([0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128]);
  const TYPE_OK = new Set([11, 12, 14, 16, 18, 20, 24]); // body/label range; >24 = display (often responsive clamp)
  const RADIUS_OK = new Set([4, 8, 12, 16]);
  const defects = [];
  const root = document.querySelector('.ah') || document.body;
  const els = root.querySelectorAll('*');

  const rgb = (c) => { const m = (c || '').match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const over = (c, base) => { const a = rgb(c); if (!a) return base; const al = a.length >= 4 ? a[3] : 1; return [0, 1, 2].map((i) => a[i] * al + base[i] * (1 - al)); };
  const effBg = (el) => { const st = []; let e = el; while (e) { st.push(getComputedStyle(e).backgroundColor); e = e.parentElement; } let col = [8, 8, 11]; for (let i = st.length - 1; i >= 0; i--) col = over(st[i], col); return col; };
  const lum = (c) => { const r = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]; };
  const contrast = (fg, bg) => { const a = rgb(fg); if (!a) return null; const f = over(fg, bg); const l1 = lum(f), l2 = lum(bg); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hasImgBg = (el) => { let e = el; while (e) { if (getComputedStyle(e).backgroundImage !== 'none') return true; e = e.parentElement; } return false; };
  const sel = (el) => el.tagName.toLowerCase() + (el.className && el.className.toString ? '.' + el.className.toString().trim().split(/\s+/).slice(0, 2).join('.') : '');
  const isInt = (v) => Math.abs(v - Math.round(v)) < 0.1; // integers = authored px; fractional = responsive clamp/vh -> skip

  const sp = {}, ty = {}, rd = {};
  els.forEach((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (el.closest('.cmdk, .toast-wrap, .gtip')) return;
    ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'gap', 'rowGap', 'columnGap'].forEach((p) => {
      const v = parseFloat(cs[p]); if (!isNaN(v) && v > 0 && isInt(v) && !SPACING_OK.has(Math.round(v))) sp[sel(el) + ' ' + p + '=' + Math.round(v)] = 1;
    });
    const fz = parseFloat(cs.fontSize); if (!isNaN(fz) && fz <= 24 && isInt(fz) && !TYPE_OK.has(Math.round(fz)) && !el.matches('h1,h2,.h1,.sub,.sect,.num,.intro,.cta-band')) ty[sel(el) + ' ' + Math.round(fz) + 'px'] = 1;
    const br = cs.borderTopLeftRadius; if (br && br.indexOf('%') < 0) { const bv = parseFloat(br); if (!isNaN(bv) && bv > 0 && bv < 100 && isInt(bv) && !RADIUS_OK.has(Math.round(bv))) rd[sel(el) + ' ' + Math.round(bv) + 'px'] = 1; }
    let txt = false; for (const n of el.childNodes) { if (n.nodeType === 3 && n.textContent.trim()) { txt = true; break; } }
    if (txt && fz < 24 && !hasImgBg(el)) { const ct = contrast(cs.color, effBg(el)); if (ct !== null && ct < 4.5) defects.push({ type: 'contrast', el: sel(el), detail: ct.toFixed(2) + ':1 "' + el.textContent.trim().slice(0, 18) + '"' }); }
    // per-element overflow:visible is benign (ellipsis etc.); real horizontal overflow checked at page level
    if ((el.tagName === 'BUTTON' || (el.tagName === 'A' && cs.display !== 'inline')) && (r.height < 24 || r.width < 24)) defects.push({ type: 'target', el: sel(el), detail: Math.round(r.width) + 'x' + Math.round(r.height) });
  });
  Object.keys(sp).forEach((k) => defects.push({ type: 'spacing', el: k }));
  Object.keys(ty).forEach((k) => defects.push({ type: 'type-scale', el: k }));
  Object.keys(rd).forEach((k) => defects.push({ type: 'radius', el: k }));
  if (document.documentElement.scrollWidth > window.innerWidth + 2) defects.push({ type: 'overflow', el: 'page', detail: 'h-scroll ' + document.documentElement.scrollWidth + '>' + window.innerWidth });

  // overlap among leaf text elements (catches floated/colliding content)
  const leaves = [];
  els.forEach((e) => { if (e.closest('.cmdk, .toast-wrap, .gtip')) return; if (e.children.length === 0 && (e.textContent || '').trim()) { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0) leaves.push({ e, r }); } });
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i].r, b = leaves[j].r;
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 8 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 8) {
      const p = leaves[i].e, q = leaves[j].e;
      if (!p.contains(q) && !q.contains(p)) defects.push({ type: 'overlap', el: sel(p) + ' ∩ ' + sel(q) });
    }
  }
  return defects;
}

// ---- run ----
let server = null, base = process.env.AUDIT_URL;
if (!base) { server = await startServer(); base = `http://localhost:${server.address().port}`; }
const ENGINES = { chromium, firefox, webkit };
const BROWSERS = (process.env.BROWSERS || 'chromium').split(',').map((x) => x.trim()).filter(Boolean);
const all = [];
for (const bname of BROWSERS) {
  const engine = ENGINES[bname];
  if (!engine) { console.log('  (skipping unknown browser: ' + bname + ')'); continue; }
  const browser = await engine.launch();
for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const cerr = [];
    page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text()); });
    page.on('pageerror', (e) => cerr.push(String(e)));
    try {
      await page.goto(base + route.path, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(700);
      const defects = await page.evaluate(pageAudit);
      cerr.forEach((e) => defects.push({ type: 'console-error', el: '-', detail: e.slice(0, 120) }));
      try {
        const axeRes = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze(); // contrast handled by custom check above (axe unreliable with backdrop-filter glass)
        for (const v of axeRes.violations) for (const node of v.nodes.slice(0, 4)) defects.push({ type: 'a11y', el: (node.target || []).join(' ').slice(0, 50), detail: v.id + ' [' + (v.impact || '?') + ']' });
      } catch (e) { defects.push({ type: 'a11y-error', el: '-', detail: String(e).slice(0, 100) }); }
      defects.forEach((d) => all.push({ browser: bname, route: route.name, vp: vp.name, ...d }));
    } catch (err) {
      all.push({ browser: bname, route: route.name, vp: vp.name, type: 'load-error', el: '-', detail: String(err).slice(0, 120) });
    }
    await page.close();
    await context.close();
  }
}
  await browser.close();
}
if (server) server.close();

// ---- report ----
const byType = {};
for (const d of all) (byType[d.type] ||= []).push(d);
const order = ['load-error', 'console-error', 'a11y-error', 'a11y', 'overflow', 'overlap', 'contrast', 'target', 'spacing', 'type-scale', 'radius'];
console.log('\n=== Artist Hub design-rule audit ===  (base: ' + base + ')');
let total = 0;
for (const t of order) {
  const list = byType[t]; if (!list || !list.length) continue;
  const seen = new Set(); const uniq = [];
  for (const d of list) { const k = (d.browser || '') + '|' + d.route + '|' + d.el + '|' + (d.detail || ''); if (!seen.has(k)) { seen.add(k); uniq.push(d); } }
  total += uniq.length;
  console.log(`\n[${t}]  ${uniq.length} unique`);
  for (const d of uniq.slice(0, 40)) console.log(`  ${d.browser || 'chromium'}/${d.route}/${d.vp}: ${d.el}${d.detail ? ' — ' + d.detail : ''}`);
  if (uniq.length > 40) console.log(`  …and ${uniq.length - 40} more`);
}
console.log(`\n${total === 0 ? '✅ PASS — no defects' : '❌ FAIL — ' + total + ' unique defects'}\n`);
process.exit(total > 0 ? 1 : 0);
