/* Artist Hub — content / secret / PII scan (dev-only).
   Static scan of the DEPLOYED files (what users actually receive) for leaked
   secrets/tokens/credentials and possible PII. Secrets BLOCK; PII warns (review).
   Fast (no browser) — runs in the pre-push gate too.   npm --prefix tools run scan */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [];
for (const f of ['index.html', 'dashboard.html', 'project.html', 'designs.html', 'favicon.svg', 'logo.svg']) {
  if (fs.existsSync(path.join(ROOT, f))) FILES.push(f);
}
for (const d of ['assets', 'data']) {
  const dir = path.join(ROOT, d);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (/\.(js|css|json|svg)$/.test(f)) FILES.push(path.posix.join(d, f));
}

const SECRETS = [
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}/, 'GitHub fine-grained PAT'],
  [/\bsk-[A-Za-z0-9]{20,}/, 'secret key (sk-)'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/\bAIza[0-9A-Za-z_-]{35}/, 'Google API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/(?:password|passwd|client[_-]?secret|access[_-]?token|auth[_-]?token|api[_-]?key|vercel[_-]?token|secret[_-]?key)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i, 'credential assignment'],
];
const PII = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, 'email'],
];

const findings = [];
for (const rel of FILES) {
  const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [re, name] of SECRETS) { const m = line.match(re); if (m) findings.push({ sev: 'SECRET', file: rel, line: i + 1, name, snippet: m[0].slice(0, 6) + '…(redacted)' }); }
    for (const [re, name] of PII) { const m = line.match(re); if (m) findings.push({ sev: 'PII', file: rel, line: i + 1, name, snippet: m[0] }); }
  });
}

const secrets = findings.filter((f) => f.sev === 'SECRET');
const pii = findings.filter((f) => f.sev === 'PII');
console.log('\n=== Artist Hub content / secret / PII scan ===  (' + FILES.length + ' deployed files)');
for (const f of secrets) console.log(`  ❌ SECRET  ${f.file}:${f.line} — ${f.name}: ${f.snippet}`);
for (const f of pii) console.log(`  ⚠ PII     ${f.file}:${f.line} — ${f.name}: ${f.snippet}`);
if (!findings.length) console.log('✅ clean — no secrets or PII in deployed files');
console.log(secrets.length ? `\n❌ scan FAIL — ${secrets.length} secret(s) in deployed output` : (pii.length ? `\n⚠ scan PASS — ${pii.length} possible PII (review above)` : '\n✅ scan PASS'));
process.exit(secrets.length ? 1 : 0);
