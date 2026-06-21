# Artist Hub

Single source of truth for every project (websites & apps) — from planning to live and maintenance. Docs, Figma files, repos, dev/live links, assets, tasks and clients, all in one home per project.

**Live:** https://artist-shawon-hub.vercel.app

> This is the early-stage UI mockup. The visual language follows [motion.dev](https://motion.dev) (dark-first, bold typography, gradient accents, spring-physics motion); the content is Artist Hub's.

## Structure

```
index.html                       Public landing page (animated, Motion)
dashboard.html                   App / dashboard mockup
logo.svg, favicon.svg            Brand mark (monochrome Hub)
mockups/artist-hub-ui.html       Source mockup (mirrors dashboard.html)
docs/master-plan.md              Full product master plan
docs/information-architecture.md Data model / schema reference
```

## Roadmap

- **Phase 1 — No-code:** Notion workspace as the working source of truth.
- **Phase 2 — Custom build:** Next.js (App Router) + Tailwind/shadcn + Motion on Vercel, Neon Postgres + Drizzle, Clerk auth, Vercel Blob.

See [`docs/master-plan.md`](docs/master-plan.md) for the complete plan.

## Deploy

Static site — auto-deploys from this repo on Vercel.
