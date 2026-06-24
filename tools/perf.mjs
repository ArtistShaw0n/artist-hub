/* Artist Hub — performance budget (dev-only; not deployed).
   Measures the perf signals that are MEANINGFUL on a local server — total
   transfer weight, request count, cumulative layout shift (CLS), and a
   backdrop-blur paint-cost proxy — against budgets, per route x viewport.
   (Timing like LCP is unrealistic on localhost; for real-network timing run
   a Lighthouse pass against the live URL separately.)
     npm --prefix tools run perf
   Budgets are set with headroom over the current good state, so this catches
   future BLOAT/regressions, not today's baseline. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET = { kb: 1600, requests: 45, cls: 0.1, blur: 40 };

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
];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

let server = null, base = process.env.AUDIT_URL;
if (!base) { server = await startServer(); base = `http://localhost:${server.address().port}`; }
const browser = await chromium.launch();
const rows = [];
let fails = 0;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await context.addInitScript(() => {
      window.__cls = 0;
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    });
    const page = await context.newPage();
    let bytes = 0, reqs = 0;
    page.on('response', async (r) => { reqs++; try { const h = r.headers()['content-length']; if (h) bytes += parseInt(h, 10); } catch (e) {} });
    await page.goto(base + route.path, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(900); // let layout settle / CLS accumulate
    const m = await page.evaluate(() => {
      const res = performance.getEntriesByType('resource');
      const nav = performance.getEntriesByType('navigation')[0];
      let t = (nav && nav.transferSize) || 0; res.forEach((e) => { t += e.transferSize || 0; });
      const blur = [].filter.call(document.querySelectorAll('*'), (el) => { if (el.closest('#design-gallery')) return false; /* gallery = temporary review tool */ const f = getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter; return f && f !== 'none'; }).length;
      return { transfer: t, cls: window.__cls || 0, blur };
    });
    await context.close();

    const kb = Math.round((m.transfer || bytes) / 1024);
    const cls = Math.round(m.cls * 1000) / 1000;
    const issues = [];
    if (kb > BUDGET.kb) issues.push(`weight ${kb}KB>${BUDGET.kb}`);
    if (reqs > BUDGET.requests) issues.push(`requests ${reqs}>${BUDGET.requests}`);
    if (cls > BUDGET.cls) issues.push(`CLS ${cls}>${BUDGET.cls}`);
    if (m.blur > BUDGET.blur) issues.push(`blur-els ${m.blur}>${BUDGET.blur}`);
    if (issues.length) fails++;
    rows.push({ name: `${route.name}/${vp.name}`, kb, reqs, cls, blur: m.blur, issues });
  }
}

await browser.close();
if (server) server.close();

console.log('\n=== Artist Hub performance budget ===  (base: ' + base + ')');
console.log('  route                weight  reqs   CLS   blur-els');
for (const r of rows) console.log('  ' + r.name.padEnd(20) + (r.kb + 'KB').padStart(7) + String(r.reqs).padStart(6) + String(r.cls).padStart(7) + String(r.blur).padStart(8) + (r.issues.length ? '   ❌ ' + r.issues.join(', ') : '   ✓'));
console.log('\nbudget: ' + JSON.stringify(BUDGET));
console.log(fails === 0 ? '✅ perf PASS — within budget' : `❌ perf FAIL — ${fails} route(s) over budget`);
process.exit(fails > 0 ? 1 : 0);
