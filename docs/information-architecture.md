# Artist Hub — Information Architecture & Data Model

> The schema foundation. Designed to map 1:1 onto **both** a Notion workspace (Phase 1) and a relational SQL database (Phase 2), so migration is a column-map copy, not a redesign.
> Companion to [`master-plan.md`](master-plan.md).

---

## Core principle

**`Project` is the center of gravity.** Almost everything foreign-keys to it. A single `Project` row is the spine from which everything is reachable in one hop.

```
Workspace
 └─ Project ★ ──┬─ Client ─ Contact
                ├─ Stage (×8 lifecycle phases)
                ├─ Task / Milestone / Deliverable
                ├─ Link (typed: figma | repo | dev | staging | live | doc | drive | deploy)
                ├─ Asset (files in Blob)
                ├─ Document (native rich text)
                ├─ Credential 🔒 (encrypted, gated)
                ├─ Deployment (history)
                ├─ ProjectMember (who's on this project)
                ├─ Comment / Activity (polymorphic)
                └─ Tag
```

---

## Entities & key fields

### Workspace
The studio / tenant root. Everything lives inside it.
`id · name · slug · plan · settings (jsonb) · created_at`

### User
`id · name · email · avatar_url · created_at`

### Membership  *(User ⇄ Workspace, many-to-many)*
`id · workspace_id · user_id · org_role (enum) · status · invited_at`

### Role / Permission
Named permission sets. In Phase 2, org roles come from Clerk; project roles live in `project_members`.
`org_role: owner | admin | member | client | guest`

### Client
The customer organization.
`id · workspace_id · name · logo_url · website · status · primary_contact_id · created_at`

### Contact
A person at a client.
`id · client_id · name · email · phone · role · is_primary`

### Project ★
The hub.
`id · workspace_id · client_id · name · slug · summary · current_stage_id · status (enum) · health (enum) · start_date · target_launch_date · launched_at · budget · visibility (enum) · cover_url · created_at · archived`

### Stage
The 8 lifecycle phases, instantiated per project from a reusable template.
`id · project_id · phase (enum) · name · status (enum) · owner_id · target_date · completed_at · order`

### Task
`id · project_id · stage_id · title · description · status (enum) · priority (enum) · type · assignee_id · due_date · client_visible (bool) · created_at`

### Milestone
A dated checkpoint.
`id · project_id · name · due_date · status · completed_at`

### Deliverable
A client-facing output that gets approved.
`id · project_id · stage_id · name · description · status (enum) · approved_by · approved_at · asset_id`

### Link ★  *(the glue — typed external references)*
`id · project_id · type (enum) · url · label · is_primary (bool) · environment · added_by · created_at`
`type: figma | repo | dev | staging | live | doc | drive | deploy | other`

### Asset
Stored files (Vercel Blob in Phase 2).
`id · project_id · stage_id · name · type · blob_url · thumbnail_url · size · version · replaces_asset_id · approved (bool) · uploaded_by · created_at`

### Document
Native rich-text docs / notes (e.g. requirements).
`id · project_id · title · body (rich text) · doc_type · client_visible (bool) · created_by · updated_at`

### Credential 🔒
Encrypted, access-gated secrets. **Team-only, never client-visible.**
`id · project_id · label · type · encrypted_value (AES-256-GCM) · vault_link · created_by · last_accessed_at`

### IntegrationConnection
OAuth tokens / connection config per provider.
`id · workspace_id · provider (enum) · access_token (encrypted) · refresh_token · scopes · connected_by · expires_at`
`provider: figma | github | gitlab | google_drive | dropbox | vercel | netlify`

### Deployment
Deploy history (from Vercel/Netlify webhooks).
`id · project_id · provider · environment (enum) · status (enum) · url · commit_sha · deployed_at`
`environment: preview | staging | production`

### ProjectMember  *(User ⇄ Project, many-to-many — scopes access)*
`id · project_id · user_id · project_role (enum) · added_at`
`project_role: lead | contributor | viewer | client`

### Comment
Polymorphic discussion.
`id · target_type · target_id · author_id · body · internal_only (bool) · created_at`

### Activity
Append-only audit log.
`id · project_id · actor_id · verb · target_type · target_id · metadata (jsonb) · created_at`

### Tag / TagAssignment  *(Tag ⇄ anything, many-to-many)*
`Tag: id · workspace_id · name · color`
`TagAssignment: id · tag_id · target_type · target_id`

---

## Relationships at a glance

| From | To | Type |
|---|---|---|
| Workspace | Project, Client, User(via Membership) | one-to-many / m2m |
| Project | Stage, Task, Link, Asset, Document, Credential, Deployment, Milestone, Deliverable | one-to-many |
| Project | Client | many-to-one |
| Project | User | many-to-many (ProjectMember) |
| Client | Contact | one-to-many |
| Stage | Task, Deliverable | one-to-many |
| Tag | anything | many-to-many (TagAssignment) |
| Comment / Activity | anything | polymorphic `(target_type, target_id)` |

**Only true many-to-many joins:** User⇄Workspace (`Membership`), User⇄Project (`ProjectMember`), Tag⇄anything (`TagAssignment`). Everything else is a plain foreign key.

---

## Enums

- **project.status:** `lead · planning · proposal · design · development · qa · launch · maintenance · archived`
- **project.health:** `on_track · at_risk · blocked`
- **project.visibility:** `internal · client_shared`
- **stage.phase:** `lead · planning · proposal · design · development · qa · launch · maintenance`
- **stage.status / task.status:** `not_started · in_progress · blocked · in_review · done`
- **task.priority:** `low · medium · high · urgent`
- **deliverable.status:** `draft · in_review · approved · rejected`
- **link.type:** `figma · repo · dev · staging · live · doc · drive · deploy · other`
- **deployment.environment:** `preview · staging · production`
- **deployment.status:** `building · ready · error · canceled`
- **provider:** `figma · github · gitlab · google_drive · dropbox · vercel · netlify`
- **org_role:** `owner · admin · member · client · guest`
- **project_role:** `lead · contributor · viewer · client`

---

## How ONE project ties it all together

From a single `Project` row, in one hop each:

| Want | Query |
|---|---|
| Client + Contacts | `Project.client_id → Client → Contact` |
| Requirement docs & notes | `Document WHERE project_id` |
| Figma files | `Link WHERE project_id AND type='figma'` |
| Code repo(s) | `Link WHERE project_id AND type='repo'` |
| Dev / staging links | `Link WHERE project_id AND type IN ('dev','staging')` |
| Live site | `Link WHERE project_id AND type='live' AND is_primary` |
| Assets / files | `Asset WHERE project_id` |
| Tasks / Milestones / Deliverables | each `WHERE project_id` |
| Credentials | `Credential WHERE project_id` (permission-gated) |
| Deploy status | latest `Deployment WHERE project_id AND environment='production'` |
| Full history | `Activity WHERE project_id ORDER BY created_at` |

That single-row → everything reachability **is** the single-source-of-truth guarantee.

---

## Phase 1 ↔ Phase 2 mapping

| Concept | Notion (Phase 1) | SQL (Phase 2) |
|---|---|---|
| Entity | Database | Table |
| Field | Property | Column |
| Relationship | Relation property | Foreign key / join table |
| Enum | Select / Status property | Postgres native enum |
| Rollup | Rollup property | Aggregate query / view |
| Polymorphic comment | Scope to Tasks/Deliverables only | `(target_type, target_id)` |
| Encrypted credential | Vault link only (use 1Password) | `encrypted_value` AES-256-GCM |

**Migration aids to set up now:** keep identical names/enums; pre-generate a UUID text property per Notion row; add a `legacy_id` column on every target table for idempotent upserts.
