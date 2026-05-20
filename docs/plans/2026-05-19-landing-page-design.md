# LiveFolders Landing Page — Design Document

**Date:** 2026-05-19
**Goal:** Marketing landing page for the LiveFolders open source project

---

## Overview

A single-page marketing site for LiveFolders (https://github.com/natanloterio/LiveFolders). The primary goals are equal-weight: drive installs (curl command) and GitHub stars. No framework — plain HTML/CSS only. Visual style: 90s web (thick pixel borders, serif body font, bold uppercase headers, colorful section boxes, classic table layouts).

---

## Tech Stack

- Plain HTML + CSS (no framework, no JS build step)
- Hosted on Vercel (static deploy)
- One `index.html` + one `style.css`

---

## Section Design

### 1. Hero

- Tiled or subtle patterned background (classic 90s)
- Project name in large bold serif (Times New Roman, navy)
- Tagline: *"Expose any tool to an LLM as plain files. No JSON. No SDK. Just `cat` and `echo`."*
- Blinking cursor after tagline (CSS animation)
- Two co-equal CTA buttons side by side:
  - `[★ Star on GitHub]` — gold background, pixel border
  - `[▼ Install Now]` — teal background, pixel border
  - Install button anchors to the Install section

### 2. What Is It?

- Header: "WHAT IS IT?" — bold uppercase serif, thick bottom border
- One short paragraph explaining the concept
- Terminal-style code box (dark background, monospace) showing:
  ```
  cat .livefolders/tools/users/list
  # → # Users
  # → ## Mr. Rudolph Robel-Fay
  # → ID: 1
  ```
- Bold callout: *"The write blocks until the tool finishes — by the time `cat` runs, the result is ready."*

### 3. How It Works

- Header: "HOW IT WORKS" — bold uppercase serif, thick divider
- Two-column layout (HTML table):
  - Left: directory tree in monospace box
    ```
    .livefolders/tools/
    ├── index.md
    ├── demo/
    │   ├── how_to.md
    │   └── shout
    └── users/
        ├── how_to.md
        └── list
    ```
  - Right: 3 numbered steps, each in a small pixel-border box:
    1. Mount the filesystem (`livefolders mount`)
    2. LLM reads or writes a file (`cat` / `echo`)
    3. Handler runs, result returns immediately
- "★ NEW!" badge-style callout on hot-reload

### 4. Key Features

- Header: "KEY FEATURES" — bold uppercase serif
- 2×2 grid of feature boxes, pixel borders, alternating accent colors (teal, gold, maroon, navy backgrounds):
  - **Hot-Reload** (teal) — Edit `folder.yaml`, changes take effect in ~1 second. No restart needed.
  - **Handler Timeouts** (gold) — Hung tools are killed after configurable timeout. Filesystem never freezes.
  - **Secret Management** (maroon) — Secrets declared in `folder.yaml`, prompted at install, stored in `secrets.env`.
  - **`livefolders doctor`** (navy) — Built-in diagnostic command checks FUSE, config, and every installed tool.

### 5. LiveFolders vs MCP

- Header: "LIVEFOLDERS vs MCP" — bold uppercase serif, thick divider
- Classic HTML table with visible cell borders:

| Criterion | LiveFolders | MCP |
|---|---|---|
| Setup | 6-line YAML, no runtime | Python + package install |
| Hot-Reload | ~1s, no restart | Server restart + reconnect |
| Publishing | One GitHub URL | No official registry |
| LLM Compatibility | Shell-capable agents | MCP-native hosts |
| Security | Shell injection risk without care | Schema validation layer |

- Winners bolded in each row
- Footer note: *"Neither is universally better —"* linked to the full comparison doc on GitHub

### 6. Get Started (Install)

- Header: "GET STARTED" — bold uppercase serif, anchor id `install`
- Curl command in dark monospace box with `[COPY]` text button (clipboard API, degrades gracefully)
- Prerequisites table:
  | Platform | Requirement |
  |---|---|
  | Linux | `sudo apt-get install fuse3` |
  | macOS | macFUSE (link to osxfuse.github.io) |
- 5-step Quick Start in numbered code blocks (from README)
- `<details>` / `<summary>` for manual install and from-source instructions

### 7. Footer

- Thick top border divider
- Dark navy background, white text
- Three columns (table layout):
  - Left: "LiveFolders" + "Apache 2.0 License"
  - Center: links — GitHub, README, MCP Comparison
  - Right: "Made with ♥ and Rust 🦀" + fake visitor counter `[Visitors: 001337]`

---

## Style Guide

- **Body font:** Times New Roman (serif) — very 90s
- **Code font:** Courier New (monospace)
- **Borders:** 3–6px solid black for section boxes; 8px for major dividers
- **Colors:**
  - Navy: `#000080`
  - Teal: `#008080`
  - Gold: `#FFD700`
  - Maroon: `#800000`
  - Off-white background: `#FFFAF0`
- **Links:** underlined, classic blue `#0000EE` / visited purple `#551A8B`
- **Buttons:** raised 3D border effect (`border-style: outset`)
- **Section spacing:** generous horizontal rule (`<hr>`) separators between sections

---

## File Structure

```
livefolders.org/
├── index.html
├── style.css
└── (no build step — deploy directly to Vercel)
```

---

## Success Criteria

- Loads without JavaScript (pure HTML/CSS)
- Copy button works (progressive enhancement — JS optional)
- Both CTAs (install + GitHub) visible above the fold on desktop
- Renders correctly on mobile (single-column fallback for two-column sections)
- Deploys to Vercel as a static site
