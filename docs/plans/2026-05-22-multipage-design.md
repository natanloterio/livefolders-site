# Multi-Page Split — Design

**Date:** 2026-05-22  
**Status:** Approved

## Problem

`index.html` has 10 sections that are better organized as separate pages. Users shouldn't have to scroll through everything to find installation instructions or the comparison table.

## Page Map

| File | Title | Sections |
|---|---|---|
| `index.html` | Home | Hero · What Is It? |
| `usage.html` | Usage | Quick Start · Giving Tools to Your Agent · How It Works |
| `features.html` | Features | 10 Lines vs 18 Lines · Key Features |
| `compare.html` | Compare | LiveFolders vs MCP · 7-System Matrix · Three Design Principles |
| `install.html` | Install | Get Started |
| `findings.html` | Findings | unchanged content, sidebar added |

## Sidebar

Replaced from section anchors to page links. Same 90s silver style, same CSS.

Links:
- ► Home (`/`)
- ► Usage (`/usage.html`)
- ► Features (`/features.html`)
- ► Compare (`/compare.html`)
- ► Install (`/install.html`)
- (divider)
- ► Findings (`/findings.html`)
- ► GitHub (external)

Active page detected via `window.location.pathname` in JS — adds `active` class to the matching link.

## Shared Structure (all pages)

- Marquee (identical)
- Top `<nav>` bar (kept — has GitHub, Docs, Blog links)
- Left sidebar (page-level links)
- Page header:
  - `index.html`: existing large hero
  - All other pages: slim `.page-header` bar (navy background, white title, smaller padding)
- Footer (identical)
- Copy-button + sidebar active-state script (identical)

## CSS Changes

One new rule added to `style.css`:

```css
.page-header {
  background: #000080;
  color: #FFFFFF;
  padding: 1.25rem 0;
  border-bottom: 6px solid #111;
}
.page-header h1 {
  font-size: 1.6rem;
  margin: 0;
  letter-spacing: -0.5px;
}
```

## What Stays Unchanged

- `style.css` sidebar rules (already correct)
- `findings.html` content (only sidebar is added)
- Top `<nav>` links
- Footer
- All section content (cut and pasted, not rewritten)
