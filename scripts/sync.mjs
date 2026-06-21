#!/usr/bin/env node
/**
 * Artist Hub — project sync.  GitHub + Vercel  ->  data/projects.json
 * Node 22+ (native fetch, ESM). No dependencies.
 *
 *   export GH_TOKEN=$(gh auth token)
 *   export VERCEL_TOKEN=xxxxx
 *   export VERCEL_TEAM_ID=team_vsmuA2pazKMXAKETUq2A9YMj   # optional, has a default
 *   node scripts/sync.mjs
 *
 * Precedence (last wins):  inferred(github+vercel)  ->  figma-map.json  ->  overrides.json
 * So manual edits in data/overrides.json survive every re-sync. Keyed by project slug.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "team_vsmuA2pazKMXAKETUq2A9YMj";

if (!VERCEL_TOKEN) { console.error("✗ Missing VERCEL_TOKEN (vercel.com → Settings → Tokens)"); process.exit(1); }
if (!GH_TOKEN) console.warn("! No GH_TOKEN — GitHub fields (commits/PRs) will be skipped.");

const teamQ = VERCEL_TEAM_ID ? `teamId=${VERCEL_TEAM_ID}` : "";
const COVERS = [
  "linear-gradient(135deg,#4c1d95,#7c3aed)", "linear-gradient(135deg,#0f766e,#14b8a6)",
  "linear-gradient(135deg,#1e3a8a,#3b82f6)", "linear-gradient(135deg,#92400e,#f59e0b)",
  "linear-gradient(135deg,#9d174d,#ec4899)", "linear-gradient(135deg,#334155,#64748b)",
];

async function vercel(path) {
  const url = `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}${teamQ}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
  if (!r.ok) throw new Error(`Vercel ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}
async function gh(path) {
  if (!GH_TOKEN) return null;
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "artist-hub-sync" },
  });
  if (!r.ok) return null;
  return r.json();
}
const readJSON = async (f, fb) => { try { return JSON.parse(await readFile(join(DATA, f), "utf8")); } catch { return fb; } };

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const daysSince = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : 1e9);
function deepMerge(a, b) {
  if (b === undefined || b === null) return a;
  if (typeof b !== "object" || Array.isArray(b)) return b;
  const o = Array.isArray(a) ? [] : { ...(a || {}) };
  for (const k of Object.keys(b)) { if (k.startsWith("_")) continue; o[k] = deepMerge(o[k], b[k]); }
  return o;
}
function inferType(name, desc) {
  const s = `${name} ${desc}`.toLowerCase();
  if (/storybook|design[- ]system/.test(s)) return "Design system";
  if (/wireframe/.test(s)) return "Wireframes";
  if (/e-?commerce|shop|store/.test(s)) return "E-commerce";
  if (/\berp\b/.test(s)) return "ERP";
  if (/\bhris\b|human resource/.test(s)) return "HRIS";
  if (/portal/.test(s)) return "Portal";
  return "Web app";
}
function inferClient(name) {
  const s = name.toLowerCase();
  if (s.includes("udvash") || s.includes("unmesh")) return "Udvash–Unmesh";
  if (s.includes("onnorokom")) return "Onnorokom";
  if (s.includes("ignite")) return "Ignite";
  return "Internal";
}
function inferStage(type, deployState, lastActivity) {
  if (type === "Wireframes") return "design";
  if (deployState === "READY") return daysSince(lastActivity) > 21 ? "maintenance" : "launch";
  if (deployState === "ERROR") return "qa";
  return "development";
}
function inferProgress(stage) {
  return { lead: 10, planning: 25, proposal: 35, design: 30, development: 60, qa: 80, launch: 90, maintenance: 100 }[stage] ?? 50;
}
function bestAlias(prod) {
  const a = (prod && prod.alias) || [];
  return a.find((x) => x && !x.endsWith(".vercel.app")) || a[0] || "";
}

async function main() {
  console.log("→ Fetching Vercel projects…");
  const { projects: vps } = await vercel("/v9/projects?limit=100");
  console.log(`  ${vps.length} Vercel projects`);
  const figmaMap = await readJSON("figma-map.json", {});
  const overrides = await readJSON("overrides.json", {});

  const out = [];
  const unmatched = [];
  for (const v of vps) {
    if (v.name === "artist-hub") continue; // skip the hub itself
    const slug = slugify(v.name);
    const link = v.link || {};
    const repoFull = link.org && link.repo ? `${link.org}/${link.repo}` : "";
    const prod = (v.targets && v.targets.production) || {};
    const alias = bestAlias(prod);
    const live = alias ? `https://${alias}` : "";
    const deployState = prod.readyState || "—";
    const lastDeployed = prod.createdAt ? new Date(prod.createdAt).toISOString() : "";

    let repoInfo = { fullName: repoFull, language: "", lastCommitDate: "", lastCommitMsg: "", openPRs: 0, private: false };
    let desc = "";
    if (repoFull) {
      const meta = await gh(`/repos/${repoFull}`);
      if (meta) { repoInfo.language = meta.language || ""; repoInfo.private = !!meta.private; desc = meta.description || ""; }
      const commits = await gh(`/repos/${repoFull}/commits?per_page=1`);
      if (Array.isArray(commits) && commits[0]) { repoInfo.lastCommitMsg = commits[0].commit?.message?.split("\n")[0] || ""; repoInfo.lastCommitDate = commits[0].commit?.committer?.date || ""; }
      const prs = await gh(`/search/issues?q=${encodeURIComponent(`repo:${repoFull} is:pr is:open`)}`);
      if (prs && typeof prs.total_count === "number") repoInfo.openPRs = prs.total_count;
    }
    if (!repoFull && !live) { unmatched.push(v.name); continue; }

    const type = inferType(v.name, desc);
    const lastActivity = repoInfo.lastCommitDate || lastDeployed;
    const stage = inferStage(type, deployState, lastActivity);
    const figmaUrl = (figmaMap[slug] && figmaMap[slug][0] && figmaMap[slug][0].url) || "";

    const inferred = {
      slug, name: v.name, client: inferClient(v.name), type, summary: desc,
      stage, health: deployState === "ERROR" ? "blocked" : "on_track", progress: inferProgress(stage),
      coverGradient: COVERS[out.length % COVERS.length],
      links: { figma: figmaUrl, repo: repoFull ? `https://github.com/${repoFull}` : "", dev: "", staging: "", live, docs: "" },
      repoInfo, deploy: { provider: "Vercel", url: live, state: deployState, lastDeployed },
    };
    out.push(deepMerge(inferred, overrides[slug]));
  }

  // sort: live/maintenance first, then by last activity desc
  out.sort((a, b) => new Date(b.deploy.lastDeployed || 0) - new Date(a.deploy.lastDeployed || 0));

  const payload = { generatedAt: new Date().toISOString().slice(0, 10), source: "scripts/sync.mjs", projects: out };
  await writeFile(join(DATA, "projects.json"), JSON.stringify(payload, null, 2) + "\n");
  console.log(`✓ Wrote data/projects.json — ${out.length} projects`);
  if (unmatched.length) console.log(`  (skipped, no repo+live: ${unmatched.join(", ")})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
