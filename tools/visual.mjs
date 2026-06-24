/* Artist Hub — visual-regression (dev-only; not deployed).
   Screenshots every route x viewport (animations frozen, scroll-reveals forced
   so output is deterministic) and pixel-diffs them against committed baselines.
   Catches ANY unintended visual change — the aesthetic rules (composition,
   balance, hierarchy) a rule-audit can't measure.
     npm --prefix tools run visual            compare against baselines (gate)
     npm --prefix tools run visual -- --update   (re)record baselines
   Baselines: tools/baselines/*.png (committed).  Diffs: tools/diffs/ (gitignored). */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BASE = path.join(HERE, 'baselines');
const DIFF = path.join(HERE, 'diffs');
const UPDATE = process.argv.includes('--update');
const DIFF_TOLERANCE = 80; // ignore <= this many differing px (sub-pixel/AA noise)

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
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

// force scroll-reveal content visible (IntersectionObserver never fires headless)
function forceReveal() {
  document.querySelectorAll('*').forEach((e) => {
    const cs = getComputedStyle(e);
    if (parseFloat(cs.opacity) < 0.99 && cs.transition.indexOf('opacity') >= 0) { e.style.opacity = '1'; e.style.transform = 'none'; }
  });
}

fs.mkdirSync(BASE, { recursive: true });
const server = await startServer();
const baseUrl = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
let created = 0, changed = 0, ok = 0;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(baseUrl + route.path, { waitUntil: 'networkidle', timeout: 15000 });
    await page.evaluate(forceReveal);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
    const buf = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
    await context.close();

    const name = `${route.name}-${vp.name}.png`;
    const basePath = path.join(BASE, name);
    if (UPDATE || !fs.existsSync(basePath)) { fs.writeFileSync(basePath, buf); created++; console.log('  baseline:', name); continue; }

    const cur = PNG.sync.read(buf);
    const ref = PNG.sync.read(fs.readFileSync(basePath));
    if (cur.width !== ref.width || cur.height !== ref.height) {
      changed++; console.log(`  CHANGED (size): ${name}  ${ref.width}x${ref.height} -> ${cur.width}x${cur.height}`);
      fs.mkdirSync(DIFF, { recursive: true }); fs.writeFileSync(path.join(DIFF, 'cur-' + name), buf);
      continue;
    }
    const diff = new PNG({ width: ref.width, height: ref.height });
    const n = pixelmatch(ref.data, cur.data, diff.data, ref.width, ref.height, { threshold: 0.12 });
    if (n > DIFF_TOLERANCE) {
      changed++; console.log(`  CHANGED: ${name}  ${n} px differ`);
      fs.mkdirSync(DIFF, { recursive: true });
      fs.writeFileSync(path.join(DIFF, name), PNG.sync.write(diff));
      fs.writeFileSync(path.join(DIFF, 'cur-' + name), buf);
    } else { ok++; }
  }
}

await browser.close();
server.close();

console.log('\n=== Artist Hub visual-regression ===');
if (created) console.log(`${created} baseline(s) recorded.`);
if (!UPDATE) {
  console.log(`${ok} unchanged, ${changed} changed.`);
  console.log(changed === 0 ? '✅ visual PASS — no changes' : `❌ visual FAIL — ${changed} screen(s) changed (see tools/diffs/, review then 'run visual -- --update' to accept)`);
}
process.exit(changed > 0 ? 1 : 0);
