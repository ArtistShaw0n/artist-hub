# Artist Hub — Master Plan

> Single source of truth for every project (websites & apps), from planning to live and maintenance.
> Built from a multi-agent design pass (information architecture, no-code setup, custom build, integrations, lifecycle/UX) and reconciled into one actionable plan.

---

## 0. Design Language

The entire product UI/UX and animation language follows **[motion.dev](https://motion.dev/)**:

- **Dark-first** theme — near-black surfaces, layered elevation.
- **Bold, tight typography** — large display headings, confident hierarchy.
- **Vibrant accents & gradients** used sparingly against the dark base.
- **Spring-physics motion** — smooth, springy enter/hover/scroll animations; nothing linear or abrupt.
- **Rounded, glassy cards** with subtle low-opacity borders.

Only the *content* is Artist Hub's; the *look & feel* mirrors motion.dev.

---

## 1. Vision & Core Concept

Today every project's information is scattered across Figma, GitHub, Drive, Vercel, email — and your head. **Artist Hub fixes that with one rule: every project has exactly one home page, and from that page you can reach everything about it in two clicks or fewer** — requirement docs, the Figma file, the repo, the dev/staging link, the live site, assets, contracts, notes, credentials, and full history.

The platform is the **index of record, not a replacement** for your real tools. You keep using Figma, GitHub, and Drive — Artist Hub typed-links and lightly syncs them, and adds a thin layer of native content (requirement docs, tasks, approvals) where it adds value. The discipline that makes it work: *if it relates to a project, there is exactly one obvious place it lives.*

---

## 2. The Project Lifecycle Model

Eight stages, each with an explicit **gate** — a checkable condition that must be satisfied before a project advances.

| # | Stage | Key Artifacts | Gate to Advance |
|---|-------|---------------|-----------------|
| 1 | **Lead / Intake** | Contact, source, budget range, intake questionnaire | Lead **qualified** |
| 2 | **Planning & Requirements** | Requirements doc, sitemap, scope, references, rough estimate | Requirements **signed off by client** |
| 3 | **Proposal / Contract** | Proposal/SOW, signed contract, deposit invoice | Contract **signed AND deposit received** |
| 4 | **Design (Figma)** | Figma links (wireframe → hi-fi → prototype), design system, exports | Final designs **client-approved**, approved version pinned |
| 5 | **Development** | Repo link(s), branches/PRs, dev URL, credentials | Feature-complete build on **staging URL** |
| 6 | **QA / Staging (UAT)** | Staging URL, QA checklist, bug list, a11y/perf reports | Blocking bugs fixed, **client UAT approved**, go-live date set |
| 7 | **Launch / Go-Live** | Live URL, production deploy, DNS/SSL, analytics, handover doc | Site **live + verified**, final payment received |
| 8 | **Maintenance / Support** | Maintenance log, recurring checklists, retainer invoices | Open-ended → **Archive** when engagement ends |

**Non-linearity is expected:** Design ↔ Dev ↔ QA loop in practice. A project shows one *primary stage* while sub-tasks can reopen earlier-stage work.

---

## 3. Information Architecture (summary)

**Project is the center of gravity.** Almost everything foreign-keys to it. Full detail in [`information-architecture.md`](information-architecture.md).

Core entities: Workspace · User + Membership + Role · ProjectMember · Client + Contact · **Project** · Stage · Task / Milestone / Deliverable · **Link** · Asset · Document · Credential · IntegrationConnection · Deployment · Comment · Activity · Tag.

### The single most important decision: the typed `Link` entity

Do **not** put `figma_url`, `repo_url`, `dev_url`, `live_url` as columns on Project — that breaks the moment a project has two repos or three environments. Use **one `Link` entity with a `type` enum** (`figma | repo | dev | staging | live | doc | drive | deploy | other`), each with a `label`, `is_primary` flag, and `environment`. This is what makes "everything in one place" queryable and scalable.

**Principle carried through both phases:** keep identical entity names and enums in the no-code tool and the SQL database, so migration is a *column-map copy, not a redesign*.

---

## 4. Phased Roadmap

### Phase 1 — No-Code: **Notion** (build this week)

Notion is the only tool that simultaneously gives (1) true relational databases, (2) live Figma/Drive embeds inline, (3) per-page client sharing where **clients are free guests, not paid seats**, and (4) a data model that maps almost 1:1 onto the future Postgres tables. Buy the **Plus plan** (~$10/user/mo) for unlimited guests + file uploads.

**Six databases inside a top-level "Artist Hub HQ" page:**

1. **Projects** (the spine) — Title, Client (relation), Lifecycle Stage (status), Health, dates, typed link properties (Figma/Repo/Staging/Live/Drive), relations to Tasks/Assets/Stages/Credentials, Budget, rollups (Open Tasks, Progress %), `Client Visible?` checkbox.
2. **Clients** — name, logo, contacts, projects relation, status.
3. **Tasks** — title, Project + Stage relations, status, assignee, due date, priority, type, `Client Visible?`.
4. **Assets** — name, Project + Stage relations, type, preview file, source link, `Approved?`.
5. **Stages** — name, Project relation, phase, status, owner, target date.
6. **Credentials** — locked-down, team-only teamspace; never shared to clients.

**Views:** Projects → Board by Lifecycle Stage (pipeline), Gallery (covers), Timeline (Gantt), Table; Tasks → Calendar + Board; a filtered **"Client View"** (`Client Visible? = checked`, internal columns hidden). A **"🚀 New Project" template** auto-creates the Quick Links callout, four sub-pages (Requirements / Design / Dev / Launch), a linked Tasks board, and a button that spawns the 8 lifecycle stage rows in one click.

**Accept these Notion limits now (SQL fixes them in Phase 2):** no field-level encryption or row-level security (keep Credentials in a separate team-only DB; store secrets in 1Password/Bitwarden and only keep vault links in Notion), and coarse per-page permissions.

### Phase 2 — Custom Build: Artist Hub on Next.js + Vercel

**When to migrate (triggers, not a date):** Notion's coarse permissions risk leaking client data, you need real credential encryption, you want live integration sync (deploy status/CI/commits) instead of manual badges, or upkeep exceeds the time a custom app would save. Realistically once you have ~5+ active client projects.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components + Server Actions |
| Hosting | **Vercel, Fluid Compute, Node.js 24** | Full Node runtime for integration SDKs |
| UI | **Tailwind + shadcn/ui** (motion.dev aesthetic) | Owned, themeable, dark-first |
| Animation | **Motion** (motion.dev library) | Spring physics matching the design language |
| Database | **Neon Postgres** (Marketplace) | Vercel Postgres deprecated; DB branch per preview |
| ORM | **Drizzle** | TypeScript-first, near-zero cold-start |
| Auth + RBAC | **Clerk** | Organizations, roles, invitations out of the box |
| File storage | **Vercel Blob** (private by default) | Signed access for private client files |
| Cache / locks | **Upstash Redis** (Marketplace) | Vercel KV deprecated; sync locks, rate-limit |
| Background sync | **Vercel Cron** + **Workflow (WDK)** | Durable multi-step syncs, retry from failed step |
| Email | **Resend + React Email** | Invites, status changes, digests |
| AI (optional) | **Vercel AI Gateway + AI SDK** | Doc summaries, status drafts, semantic search |
| Validation | **Zod** | One schema, client + server |

**Auth & RBAC — two-tier:** Org role (Clerk: `owner`/`admin`/`member`/`client`/`guest`) + Project role (DB `project_members`: `lead`/`contributor`/`viewer`/`client`). Effective permission = **the more restrictive of the two.** Every data path calls `authorizedProjectIds(ctx)`; clients get `visibility='client_shared'` filters at the **query layer**, so internal notes and the credential vault are physically excluded from their result sets. Credentials are **AES-256-GCM encrypted**, decrypted only server-side for owner/team, every access logged.

**Build order:** (1) auth + orgs + RBAC + schema + tenancy guard, (2) Projects CRUD + workspace shell + Links + Assets/Blob, (3) Docs + tasks + activity + comments, (4) integrations (GitHub + Vercel webhooks first, then Figma/Drive), (5) client portal + share links + notifications, (6) migration + cutover, (7) AI last.

### Migration Path (Notion → Artist Hub)

Idempotent, re-runnable ETL — goal is zero data loss and **stable links**: (1) field map, (2) pre-generate UUIDs in Notion + `legacy_id` columns on targets, (3) export CSV/JSON, (4) transform (split combined link fields into typed `Link` rows, map statuses → enums, match users by email), (5) files → Vercel Blob, (6) **Credentials & integrations FIRST and by hand** (never import plaintext), (7) load in FK order, upserting on `legacy_id`, (8) keep external URLs untouched; for Notion-internal shared views, mint fresh share links + email clients, (9) reconciliation report → brief parallel run → Notion read-only → archive.

---

## 5. Full Feature List

**CORE (the spine):** *Must* — project hub · 8-stage tracker with gates · central typed link hub · asset library (private support) · native docs · tasks & milestones tied to stages · global command-bar search · encrypted role-gated credentials vault. *Should* — clients/contacts directory, tags & custom fields, project templates, saved views. *Nice* — cross-project relationships (retainers ↔ parent).

**COLLABORATION:** *Must* — RBAC (org + per-project) · client portal · approvals/sign-off tied to gates · comments with @mentions and internal-vs-client visibility · notifications (in-app + email) · activity/audit log. *Should* — scoped expiring share links. *Nice* — design proofing annotations, real-time presence.

**PRODUCTIVITY:** *Must* — doc/checklist templates · calendar & deadlines. *Should* — recurring checklists, time tracking (billable), Google Calendar sync, automations, invoicing/payment-status. *Nice* — email-to-project capture.

**INSIGHT:** *Must* — global dashboard · computed project health (on-track/at-risk/blocked). *Should* — reporting (throughput, stage duration, revenue), client-shareable status PDF. *Nice* — capacity/workload view, lead pipeline.

**Key screens:** Global dashboard (command center) · Single-project hub (pinned link bar + tabs) · Kanban stage board (drag-to-advance → gate checklist) · Client portal · Asset/link library · Calendar.

---

## 6. Integrations Plan

**Phase 2 rule:** the frontend never talks to provider APIs directly. One integration service layer owns OAuth tokens, normalizes each provider into common shapes, caches in Neon, rate-limit-buffers via Upstash. **Webhooks write to Neon; the UI reads from Neon, never live on page load.**

| Rank | Integration | Phase 1 (now) | Phase 2 (custom) |
|---|---|---|---|
| **1** | **Vercel / Netlify** | Paste Prod + Preview URLs + embed deploy-status badge | Webhook-driven (`deployment.ready`/`promoted`), verify signatures |
| **2** | **GitHub / GitLab** | Repo URL + one Make/Zapier scenario for last commit / open PRs / CI | GitHub App (fine-grained PATs can't call Checks API) + webhooks |
| **3** | **Figma** | Link + live `/embed` iframe (needs `embed_host`) | OAuth granular scopes + webhooks (`FILE_UPDATE`), batch `/images` |
| **4** | **Google Drive / Dropbox** | Folder link + native embed | On-demand fetch + 5–15 min cache; scope `drive.file` only |

**Rule of thumb:** *embed* what's better seen live (Figma, Drive docs, deploy badges); *link* what's just a destination or needs auth (repos, folders, dashboards, credentials).

---

## 7. Concrete Next Steps — This Week

- [ ] Upgrade Notion to the **Plus plan**.
- [ ] Create **"Artist Hub HQ"** page + a separate restricted **Credentials** teamspace.
- [ ] Build the **6 databases** with typed link fields; wire relations from Projects; add rollups.
- [ ] Set up **views** (Board by Stage, Gallery, Timeline, Table; Tasks Calendar + Board; "Client View").
- [ ] Create the **"🚀 New Project" template** + the 8-stage generate button.
- [ ] Connect Google Drive; build a **test project** with real embedded Figma + Drive doc + Vercel badge + Repo/Staging/Live URLs.
- [ ] Move secrets into **1Password/Bitwarden**; keep only vault links in Notion.
- [ ] Invite team as Members; lock Credentials; test a "client" guest for isolation.
- [ ] Migrate the first **1–2 real projects** to pressure-test.

**Three things to get right from day one:** canonical entity names + enums in Notion (migration = copy, not redesign); typed Links instead of per-type URL columns; Credentials physically separated + access-gated.
