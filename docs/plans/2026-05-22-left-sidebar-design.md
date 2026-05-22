# Left Sidebar Navigation — Design

**Date:** 2026-05-22  
**Page:** `index.html`  
**Status:** Approved

## Problem

`index.html` has 10 sections and is growing too long to navigate comfortably. A left-side navigation menu will let users jump to any section without scrolling.

## Chosen Approach: Fixed Left Sidebar (Windows 95 Help style)

A `position: fixed` panel on the left, always visible as the user scrolls.

## Layout

- `body` gains `margin-left: 190px` to make room for the sidebar
- Sidebar: `position: fixed; top: 0; left: 0; width: 190px; height: 100vh; overflow-y: auto`
- All existing content (marquee, hero, nav, sections, footer) remains in the shifted content area — no structural changes to existing HTML

## Visual Style

- Background: `#C0C0C0` (site's existing silver)
- Top label: `📁 CONTENTS` — bold, navy (`#000080`), thick border at bottom (inset style matching existing buttons)
- 10 section links, each prefixed with `►`
- Active link: `background: #000080; color: #FFD700` (navy + gold — matches marquee)
- Inactive links: `color: #000080`, no underline
- Hover: `color: #FF0000` (matches global `a:hover` in style.css)
- Sidebar has a raised `outset` border on the right edge

## Sections (10 links)

1. What Is It?
2. Quick Start
3. Giving Tools to Your Agent
4. How It Works
5. 10 Lines vs 18 Lines
6. Key Features
7. LiveFolders vs MCP
8. 7-System Comparison Matrix
9. Three Design Principles
10. Get Started

## Behavior

- `IntersectionObserver` watches each `<section>` element and updates the active sidebar link as the user scrolls
- Clicking a sidebar link scrolls to the corresponding section
- On mobile (`≤ 768px`): sidebar is hidden (`display: none`), `body` margin-left resets to 0, existing top nav serves as navigation

## Implementation Notes

- Sidebar HTML added directly in `index.html` before the marquee
- Styles added to `style.css` (new `.sidebar` block + media query)
- Section IDs added to each `<section>` element in `index.html`
- JS `IntersectionObserver` added in the existing `<script>` block
