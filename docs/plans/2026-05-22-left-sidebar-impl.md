# Left Sidebar Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fixed 90s-style left sidebar to `index.html` that shows all 10 sections and highlights the active one as the user scrolls.

**Architecture:** Pure HTML/CSS/JS — no build step, no framework. Sidebar is injected as a `<nav>` element before the marquee, styles go in `style.css`, and an `IntersectionObserver` in the existing `<script>` block tracks the active section.

**Tech Stack:** HTML, CSS, vanilla JS (`IntersectionObserver`)

---

### Task 1: Add IDs to each section

**Files:**
- Modify: `index.html` — each `<section>` element

Each `<section>` needs an `id` so sidebar links can target it. Match the IDs below exactly — later tasks depend on them.

**Step 1: Edit `index.html` — add IDs**

Find each `<section` opening tag and add the corresponding `id`:

| Current tag | Add `id=` |
|---|---|
| `<section>` (What Is It?) | `id="what"` |
| `<section>` (Quick Start) | `id="quickstart"` |
| `<section>` (Giving Tools to Your Agent) | `id="agent"` |
| `<section>` (How It Works) | `id="how"` |
| `<section>` (10 Lines vs 18 Lines) | `id="comparison"` |
| `<section>` (Key Features) | `id="features"` |
| `<section>` (LiveFolders vs MCP) | `id="vsmcp"` |
| `<section>` (7-System Comparison Matrix) | `id="matrix"` |
| `<section>` (Three Design Principles) | `id="principles"` |
| `<section id="install">` (Get Started) | already has `id="install"` — leave as-is |

**Step 2: Verify**

Open `index.html` in a browser (or `grep 'id="' index.html`). Confirm 10 section IDs exist.

**Step 3: Commit**

```bash
git add index.html
git commit -m "chore: add section IDs for sidebar navigation"
```

---

### Task 2: Add sidebar HTML

**Files:**
- Modify: `index.html` — insert `<nav id="sidebar">` as first child of `<body>`

**Step 1: Insert sidebar HTML**

Insert the following block immediately after `<body>` (before the marquee `<div>`):

```html
<nav id="sidebar">
  <div class="sidebar-header">&#x1f5c2;&#xfe0f; CONTENTS</div>
  <ul>
    <li><a href="#what">&#x25ba; What Is It?</a></li>
    <li><a href="#quickstart">&#x25ba; Quick Start</a></li>
    <li><a href="#agent">&#x25ba; Agent Setup</a></li>
    <li><a href="#how">&#x25ba; How It Works</a></li>
    <li><a href="#comparison">&#x25ba; 10 vs 18 Lines</a></li>
    <li><a href="#features">&#x25ba; Key Features</a></li>
    <li><a href="#vsmcp">&#x25ba; vs MCP</a></li>
    <li><a href="#matrix">&#x25ba; 7-System Matrix</a></li>
    <li><a href="#principles">&#x25ba; Design Principles</a></li>
    <li><a href="#install">&#x25ba; Get Started</a></li>
  </ul>
</nav>
```

**Step 2: Verify**

Open `index.html` in a browser. The sidebar HTML should be present in the DOM (even if unstyled). DevTools > Elements should show `<nav id="sidebar">` as first body child.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add sidebar HTML structure"
```

---

### Task 3: Add sidebar CSS

**Files:**
- Modify: `style.css` — append new `.sidebar` block and update body + mobile query

**Step 1: Add `margin-left` to body**

In `style.css`, find the `body { ... }` rule and add `margin-left: 190px;` to it:

```css
body {
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  line-height: 1.6;
  background-color: #FFFAF0;
  color: #111111;
  margin-left: 190px;
}
```

**Step 2: Append sidebar styles**

Add the following block at the end of `style.css` (before the `@media` block):

```css
/* === Sidebar === */
#sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 190px;
  height: 100vh;
  overflow-y: auto;
  background: #C0C0C0;
  border-right: 4px outset #888;
  z-index: 1000;
  font-family: "Times New Roman", Times, serif;
  font-size: 0.88rem;
}

.sidebar-header {
  background: #000080;
  color: #FFD700;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0.5rem 0.6rem;
  border-bottom: 3px solid #111;
  letter-spacing: 0.05em;
}

#sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}

#sidebar ul li a {
  display: block;
  padding: 0.35rem 0.6rem;
  color: #000080;
  text-decoration: none;
  border-bottom: 1px solid #AAAAAA;
  line-height: 1.35;
}

#sidebar ul li a:visited {
  color: #000080;
}

#sidebar ul li a:hover {
  color: #FF0000;
  background: #D0D0D0;
}

#sidebar ul li a.active {
  background: #000080;
  color: #FFD700;
}
```

**Step 3: Update the existing mobile `@media` block**

Find the `@media (max-width: 640px)` block in `style.css` and add these two rules inside it:

```css
  /* Sidebar — hide on mobile, reset body margin */
  #sidebar { display: none; }
  body { margin-left: 0; }
```

**Step 4: Verify visually**

Open `index.html` in a browser at desktop width (≥ 800px). You should see:
- A silver sidebar fixed on the left with a navy header and 10 links
- Page content shifted right so nothing is hidden behind the sidebar
- Links highlight red on hover
- At ≤ 640px viewport width, sidebar disappears and margin resets

**Step 5: Commit**

```bash
git add style.css
git commit -m "feat: add sidebar CSS with mobile hide"
```

---

### Task 4: Add IntersectionObserver for active section highlighting

**Files:**
- Modify: `index.html` — add JS inside the existing `<script>` block

**Step 1: Add observer code**

Inside the existing `<script>` block (after the `DOMContentLoaded` listener for the copy buttons, still inside the `DOMContentLoaded` callback), add:

```js
// Sidebar active section highlight
const sidebarLinks = document.querySelectorAll('#sidebar a');
const sections = document.querySelectorAll('section[id]');

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      sidebarLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.classList.add('active');
        }
      });
    }
  });
}, { threshold: 0.25 });

sections.forEach(function(section) { observer.observe(section); });
```

**Step 2: Verify**

Open `index.html` in a browser. Scroll down slowly — the corresponding sidebar link should turn navy/gold as each section enters the viewport. Only one link should be active at a time.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add IntersectionObserver for sidebar active state"
```

---

### Task 5: Final verification

**Step 1: Desktop**
- All 10 sidebar links visible, no overflow
- Clicking each link scrolls to the correct section
- Active link updates as you scroll
- No content is hidden behind the sidebar

**Step 2: Mobile (≤ 640px)**
- Sidebar is gone
- `body` has no left margin
- Top `<nav>` is still present and functional

**Step 3: Commit design doc**

```bash
git add docs/plans/2026-05-22-left-sidebar-design.md docs/plans/2026-05-22-left-sidebar-impl.md
git commit -m "docs: add left sidebar design and implementation plan"
```
