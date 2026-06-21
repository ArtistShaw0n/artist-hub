# Connecting real projects to Artist Hub

The hub no longer uses hand-typed demo cards. Project cards on the landing (`index.html`) and the
dashboard (`dashboard.html`) are rendered at runtime from **`data/projects.json`**, which is generated
from your **GitHub + Vercel** accounts (and your **Figma** links) by a small sync script.

```
GitHub (gh token) ─┐
Vercel REST API  ─┼─►  scripts/sync.mjs  ──►  merge figma-map + overrides  ──►  data/projects.json
data/figma-map.json┘                                                                │
                                                  index.html / dashboard.html  fetch('/data/projects.json')
```

No build step — the pages fetch a static JSON file and render the cards.

## Files

| File | Role |
|---|---|
| `data/projects.json` | **generated** — the live project list (committed, served at `/data/projects.json`) |
| `data/figma-map.json` | hand-maintained — maps a project slug → its Figma file URL(s) |
| `data/overrides.json` | hand-maintained — manual edits that **win** over synced fields and survive re-sync |
| `scripts/sync.mjs` | the sync script (Node 22, native fetch, zero deps) |
| `assets/render-projects.js` | renders the cards into any `[data-projects-grid]` |
| `.github/workflows/sync.yml` | cron (every 6h) + manual button that re-syncs and commits |

## How matching works

Vercel is the anchor: each Vercel project knows its linked Git repo (`link.org/link.repo`). The script
joins on `owner/repo`, pulls per-project data, and writes one card. The `artist-hub` project itself is skipped.

| Source | Fields pulled |
|---|---|
| **GitHub** | language, description, last commit (message + date), open PR count, private flag |
| **Vercel** | production URL (prefers a custom domain), latest prod deploy **state** + timestamp |
| **Figma** | file URL from `data/figma-map.json` (Figma has no list-files API, so links are added by hand) |

Inferred fields (stage, health, progress, type, client, cover) are best-guesses — correct any of them in
`overrides.json` and they’ll stick.

## Run it

```bash
export GH_TOKEN=$(gh auth token)
export VERCEL_TOKEN=xxxxx                 # vercel.com → Settings → Tokens
export VERCEL_TEAM_ID=team_vsmuA2pazKMXAKETUq2A9YMj
node scripts/sync.mjs                       # writes data/projects.json
git add data/projects.json && git commit -m "sync" && git push   # Vercel redeploys
```

### Keep it fresh automatically
`.github/workflows/sync.yml` runs every 6 hours and on the manual **Run workflow** button. Add two repo
secrets first: **`VERCEL_TOKEN`** and **`VERCEL_TEAM_ID`** (Settings → Secrets → Actions). `GITHUB_TOKEN`
is provided automatically.

## Adding Figma files

Figma can’t be auto-listed, so paste each project’s Figma file URL into `data/figma-map.json`:

```json
{ "ignite-traders": [{ "label": "Storefront", "url": "https://www.figma.com/file/XXXX/Ignite" }] }
```

Then re-run sync (or just edit `links.figma` in `overrides.json`). Once a Figma URL is set, the card shows
a Figma link; in Phase 2 we can pull live thumbnails via the Figma API.

## Overriding inferred fields

```json
{
  "bangla-zoom": { "stage": "development", "health": "at_risk", "progress": 40 },
  "udvash-ds-storybook": { "hidden": true }
}
```

`hidden: true` removes a card from the hub. Everything else deep-merges on top of the synced data.

## Phase 2 (Next.js app)

The same script becomes a **backfill/seed** job. Live updates flip to push-based: a **GitHub App**
(`push`/`pull_request`/`check_suite` webhooks), **Vercel deploy webhooks**, and **Figma OAuth + webhooks**
normalize into a Neon Postgres DB; the UI reads from the DB. `overrides.json` becomes editable columns and
`figma-map.json` becomes the `figma_files` table. Both horizons key on the same project slug, so migration
is seamless.
