# LiveFolders Marketplace — Design Document

**Date:** 2026-05-21
**Goal:** A package registry (registry.livefolders.org) where tool authors publish LiveFolders tools and users install them via CLI.

---

## Overview

A central registry that maps `owner/name` to GitHub-hosted tool repositories. Tools live on GitHub; the registry stores metadata and resolves install requests. Publishing is CLI-driven with GitHub OAuth. No user accounts beyond GitHub identity.

---

## Architecture

```
registry.livefolders.org
├── Next.js App Router (Vercel)
│   ├── /api/publish      — POST: GitHub OAuth token → validate → store
│   ├── /api/resolve      — GET: owner/name[@version] → returns tarball URL
│   ├── /api/search       — GET: ?q=weather → returns matching tools
│   ├── /api/tools/:owner/:name            — Full tool metadata
│   ├── /api/tools/:owner/:name/downloads  — Increment download counter
│   └── /                 — Web UI: browse, search, tool detail pages
│
└── Neon (Postgres, free tier)
    └── tools table
```

**Install data flow:**
1. `livefolders install natanloterio/weather@1.0.0`
2. CLI calls `GET /api/resolve/natanloterio/weather?version=1.0.0`
3. Registry returns `{ tarball_url: "github.com/.../archive/v1.0.0.tar.gz" }`
4. CLI fetches tarball directly from GitHub (no bandwidth through registry server)
5. CLI unpacks to `~/.livefolders/tools/natanloterio/weather/`
6. CLI calls `POST /api/tools/natanloterio/weather/downloads` to increment counter

**Publish data flow:**
1. `livefolders publish` opens browser to GitHub OAuth
2. CLI receives token, calls `POST /api/publish` with `{ repo, token }`
3. API verifies token owns the repo and `folder.yaml` exists at root
4. API parses `folder.yaml` for `name` and `description`
5. Upserts row in `tools` table, returns registry URL

---

## Database Schema

```sql
CREATE TABLE tools (
  id           SERIAL PRIMARY KEY,
  owner        TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  repo_url     TEXT NOT NULL,
  tags         TEXT[],
  downloads    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner, name)
);
```

---

## API Surface

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/publish` | Register or update a tool (requires GitHub token) |
| `GET` | `/api/resolve/:owner/:name` | Returns tarball URL; `?version=1.0.0` or latest tag |
| `GET` | `/api/search` | `?q=weather` full-text search on name + description + tags |
| `GET` | `/api/tools/:owner/:name` | Full metadata for one tool |
| `POST` | `/api/tools/:owner/:name/downloads` | Increment download counter after successful install |

---

## CLI Commands

```bash
# Discover tools
livefolders search weather

# Install latest
livefolders install natanloterio/weather

# Install specific version (git tag)
livefolders install natanloterio/weather@1.0.0

# Show tool details
livefolders info natanloterio/weather

# Publish current repo
livefolders publish
```

**Install behavior:**
- Tools land at `~/.livefolders/tools/natanloterio/weather/`
- Lockfile `~/.livefolders/installed.json` tracks `owner/name → version + tarball SHA`
- Idempotent — re-running upgrades to latest if already installed
- Reads repo `origin` remote to determine `owner/repo` automatically

**Publish behavior:**
- Reads latest git tag as version; warns if no tags exist
- Fails fast if `folder.yaml` is missing or malformed

---

## Web UI

Three server-rendered pages (Next.js App Router, no client-side JS required):

- **`/`** — Search bar + recently published + most downloaded tools
- **`/?q=weather`** — Search results
- **`/natanloterio/weather`** — Tool detail: name, description, install command, available versions (from GitHub API), download count, link to repo

Read-only for browsers; write-only (publish) for CLI. No user account system on the web.

Styling matches livefolders.org — 90s aesthetic, plain HTML/CSS, pixel borders, serif headers.

---

## Security

- GitHub OAuth token used only to verify ownership at publish time, never stored
- `owner` is always derived from the GitHub token's authenticated user — not from user input
- `folder.yaml` parsed server-side with strict YAML parser; malformed files rejected
- Rate limiting: max 10 publishes per GitHub user per hour
- No user accounts, no passwords, no sessions

**CLI error messages** (follow existing `[ERROR:CODE] message` format):
```
Error: tool not found in registry
Error: version v9.9.9 does not exist (available: v1.0.0, v1.1.0)
Error: folder.yaml missing from repo root
Error: checksum mismatch — download may be corrupted
```

---

## Out of Scope (v1)

- Unpublishing / takedowns (handled manually)
- Private or scoped registries
- Tool dependencies
- Verified/official badges
- Web-based publishing

---

## Success Criteria

- `livefolders install natanloterio/weather` installs a tool end-to-end
- `livefolders publish` registers a tool with no manual steps beyond GitHub OAuth
- `livefolders search weather` returns relevant results
- registry.livefolders.org is browsable without JavaScript
- Registry server handles publish without storing GitHub tokens
