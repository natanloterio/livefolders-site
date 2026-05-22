# Multi-Page Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split `index.html` into 5 focused pages (Home, Usage, Features, Compare, Install), update the sidebar to page-level navigation on all pages including `findings.html`.

**Architecture:** Pure static HTML. Each page shares the same `<head>` structure, marquee, top nav, sidebar, footer, and script block. Content sections are cut from `index.html` and pasted into the appropriate new file. No build step.

**Tech Stack:** HTML, CSS, vanilla JS

---

### Shared snippets (reference for all tasks)

Every new page uses these verbatim blocks. Tasks below reference them as **[SIDEBAR]**, **[TOP-NAV]**, **[MARQUEE]**, **[FOOTER]**, **[SCRIPT]**.

#### [MARQUEE]
```html
  <div style="background: #000080; color: #FFD700; padding: 0.3rem 0; overflow: hidden; white-space: nowrap; font-family: 'Courier New', monospace; font-size: 0.85rem;">
    <marquee>🗂️ LiveFolders v0.11.0 &mdash; Now with sandbox isolation &mdash; Landlock (Linux) + sandbox-exec (macOS) &mdash; network blocked by default, strict mode supported &mdash; Apache 2.0 &mdash; Star us on GitHub! &#x2605;</marquee>
  </div>
```

#### [SIDEBAR]
```html
  <nav id="sidebar">
    <div class="sidebar-header">&#x1f5c2;&#xfe0f; LIVEFOLDERS</div>
    <ul>
      <li><a href="/">&#x25ba; Home</a></li>
      <li><a href="/usage.html">&#x25ba; Usage</a></li>
      <li><a href="/features.html">&#x25ba; Features</a></li>
      <li><a href="/compare.html">&#x25ba; Compare</a></li>
      <li><a href="/install.html">&#x25ba; Install</a></li>
    </ul>
    <div style="border-top: 2px solid #888; margin: 0.25rem 0;"></div>
    <ul>
      <li><a href="/findings.html">&#x25ba; Findings</a></li>
      <li><a href="https://github.com/natanloterio/LiveFolders" target="_blank" rel="noopener">&#x25ba; GitHub</a></li>
    </ul>
  </nav>
```

#### [TOP-NAV]
```html
  <nav style="background: #C0C0C0; border-bottom: 3px solid #111; border-top: 3px solid #111; padding: 0.4rem 0;">
    <div class="container" style="display: flex; gap: 1.5rem; font-size: 0.9rem; font-weight: bold; flex-wrap: wrap;">
      <a href="/" style="color: #000080;">Home</a>
      <a href="/install.html" style="color: #000080;">Install</a>
      <a href="https://github.com/natanloterio/LiveFolders" style="color: #000080;" target="_blank" rel="noopener">GitHub</a>
      <a href="https://github.com/natanloterio/LiveFolders/blob/master/README.md" style="color: #000080;" target="_blank" rel="noopener">Docs</a>
      <a href="/findings.html" style="color: #800000;">Findings</a>
      <a href="https://natanloterio.substack.com" style="color: #000080;" target="_blank" rel="noopener">Blog</a>
    </div>
  </nav>
```

#### [FOOTER]
```html
  <footer style="background: #000080; color: #FFFFFF; padding: 2rem 0; border-top: 6px solid #111;">
    <div class="container">
      <table role="presentation" style="border: none; width: 100%;">
        <tr>
          <td style="border: none; width: 33%; vertical-align: top;">
            <strong style="font-size: 1.1rem;">LiveFolders</strong><br>
            <span style="font-size: 0.85rem; color: #CCC;">Apache 2.0 License</span>
          </td>
          <td style="border: none; width: 34%; vertical-align: top; text-align: center;">
            <a href="https://github.com/natanloterio/LiveFolders" style="color: #FFD700;" target="_blank" rel="noopener">GitHub</a>
            &nbsp;&middot;&nbsp;
            <a href="https://github.com/natanloterio/LiveFolders/blob/master/README.md" style="color: #FFD700;" target="_blank" rel="noopener">README</a>
            &nbsp;&middot;&nbsp;
            <a href="https://github.com/natanloterio/LiveFolders/blob/master/docs/livefoldersfs-vs-mcp.md" style="color: #FFD700;" target="_blank" rel="noopener">vs MCP</a>
            &nbsp;&middot;&nbsp;
            <a href="https://github.com/natanloterio/LiveFolders/tree/master/paper" style="color: #FFD700;" target="_blank" rel="noopener">Paper</a>
          </td>
          <td style="border: none; width: 33%; vertical-align: top; text-align: right; font-size: 0.85rem; color: #CCC;">
            Made with &#x2665; and Rust &#x1f980;<br>
            <span style="font-family: 'Courier New', monospace; color: #0F0;">[Visitors: 001337]</span>
          </td>
        </tr>
      </table>
    </div>
  </footer>
```

#### [SCRIPT]
```html
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.code-box').forEach(function (box) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative;';
        box.parentNode.insertBefore(wrapper, box);
        wrapper.appendChild(box);

        const btn = document.createElement('button');
        btn.textContent = '[COPY]';
        btn.style.cssText = [
          'position:absolute', 'top:0.4rem', 'right:0.4rem',
          'font-family:"Courier New",monospace', 'font-size:0.75rem',
          'background:#222', 'color:#0F0', 'border:1px solid #0F0',
          'padding:0.15rem 0.4rem', 'cursor:pointer', 'opacity:0',
          'transition:opacity 0.15s'
        ].join(';');

        wrapper.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
        wrapper.addEventListener('mouseleave', function () { btn.style.opacity = '0'; });

        btn.addEventListener('click', function () {
          navigator.clipboard.writeText(box.textContent).then(function () {
            btn.textContent = '[COPIED!]';
            setTimeout(function () { btn.textContent = '[COPY]'; }, 2000);
          }).catch(function () {
            btn.textContent = '[FAILED]';
            setTimeout(function () { btn.textContent = '[COPY]'; }, 2000);
          });
        });

        wrapper.appendChild(btn);
      });

      // Sidebar active page highlight
      const path = window.location.pathname;
      document.querySelectorAll('#sidebar a').forEach(function(link) {
        const href = link.getAttribute('href');
        if (href === path || (path === '/' && href === '/') || path.endsWith(href)) {
          link.classList.add('active');
        }
      });
    });
  </script>
```

---

### Task 1: Add `.page-header` CSS to style.css

**Files:**
- Modify: `style.css`

**Step 1: Append to style.css** (before the `@media` block)

Add this block:

```css
/* === Page Header (inner pages) === */
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

**Step 2: Verify**

```bash
grep -n 'page-header' style.css
```
Expected: 2 lines (`.page-header {` and `.page-header h1 {`)

**Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add page-header style for inner pages"
```

---

### Task 2: Create usage.html

**Files:**
- Create: `usage.html`
- Reference: current `index.html` lines for Quick Start (~107), Giving Tools to Your Agent (~132), How It Works (~202) sections

**Step 1: Read index.html** to extract the three section blocks:
- `<section id="quickstart">` … `</section>`
- `<section id="agent">` … `</section>`
- `<section id="how">` … `</section>`
- The `<hr>` tags between them

**Step 2: Create usage.html** with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Usage — LiveFolders</title>
  <meta name="description" content="How to install, configure, and use LiveFolders with Claude Code, Cursor, and other AI agents.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗂️</text></svg>">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  [SIDEBAR]
  [MARQUEE]
  <header class="page-header">
    <div class="container">
      <h1>&#x1f5c2;&#xfe0f; Usage</h1>
    </div>
  </header>
  [TOP-NAV]

  [paste <section id="quickstart"> block here]
  <hr>
  [paste <section id="agent"> block here]
  <hr>
  [paste <section id="how"> block here]
  <hr>

  [FOOTER]
  [SCRIPT]
</body>
</html>
```

Replace `[SIDEBAR]`, `[TOP-NAV]`, `[MARQUEE]`, `[FOOTER]`, `[SCRIPT]` with the exact shared snippets from the plan header.

**Step 3: Verify**

```bash
grep -c '<section' usage.html
```
Expected: 3

**Step 4: Commit**

```bash
git add usage.html
git commit -m "feat: add usage.html (Quick Start, Agent Setup, How It Works)"
```

---

### Task 3: Create features.html

**Files:**
- Create: `features.html`
- Reference: current `index.html` sections for 10 Lines vs 18 Lines (~245) and Key Features (~308)

**Step 1: Read index.html** to extract:
- `<section id="comparison">` … `</section>`
- `<section id="features">` … `</section>`

**Step 2: Create features.html** with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Features — LiveFolders</title>
  <meta name="description" content="LiveFolders features: hot-reload, input validation, sandbox isolation, stateful tools, native tool schemas, and more.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗂️</text></svg>">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  [SIDEBAR]
  [MARQUEE]
  <header class="page-header">
    <div class="container">
      <h1>&#x26a1; Features</h1>
    </div>
  </header>
  [TOP-NAV]

  [paste <section id="comparison"> block here]
  <hr>
  [paste <section id="features"> block here]
  <hr>

  [FOOTER]
  [SCRIPT]
</body>
</html>
```

**Step 3: Verify**

```bash
grep -c '<section' features.html
```
Expected: 2

**Step 4: Commit**

```bash
git add features.html
git commit -m "feat: add features.html (10 vs 18 Lines, Key Features)"
```

---

### Task 4: Create compare.html

**Files:**
- Create: `compare.html`
- Reference: current `index.html` sections for LiveFolders vs MCP (~385), 7-System Matrix (~489), Three Design Principles (~544)

**Step 1: Read index.html** to extract:
- `<section id="vsmcp">` … `</section>`
- `<section id="matrix">` … `</section>`
- `<section id="principles">` … `</section>`

**Step 2: Create compare.html** with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compare — LiveFolders</title>
  <meta name="description" content="LiveFolders vs MCP: detailed comparison, 7-system matrix, and three design principles from the research paper.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗂️</text></svg>">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  [SIDEBAR]
  [MARQUEE]
  <header class="page-header">
    <div class="container">
      <h1>&#x1f4ca; Compare</h1>
    </div>
  </header>
  [TOP-NAV]

  [paste <section id="vsmcp"> block here]
  <hr>
  [paste <section id="matrix"> block here]
  <hr>
  [paste <section id="principles"> block here]
  <hr>

  [FOOTER]
  [SCRIPT]
</body>
</html>
```

**Step 3: Verify**

```bash
grep -c '<section' compare.html
```
Expected: 3

**Step 4: Commit**

```bash
git add compare.html
git commit -m "feat: add compare.html (vs MCP, 7-System Matrix, Design Principles)"
```

---

### Task 5: Create install.html

**Files:**
- Create: `install.html`
- Reference: current `index.html` `<section id="install">` block (~580)

**Step 1: Read index.html** to extract:
- `<section id="install">` … `</section>`

**Step 2: Create install.html** with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Install — LiveFolders</title>
  <meta name="description" content="Install LiveFolders — one curl command, FUSE prerequisite, quick start guide.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗂️</text></svg>">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  [SIDEBAR]
  [MARQUEE]
  <header class="page-header">
    <div class="container">
      <h1>&#x25bc; Install</h1>
    </div>
  </header>
  [TOP-NAV]

  [paste <section id="install"> block here]
  <hr>

  [FOOTER]
  [SCRIPT]
</body>
</html>
```

**Step 3: Verify**

```bash
grep -c '<section' install.html
```
Expected: 1

**Step 4: Commit**

```bash
git add install.html
git commit -m "feat: add install.html (Get Started)"
```

---

### Task 6: Rewrite index.html to Home only

**Files:**
- Modify: `index.html` — strip to Hero + What Is It? only, update sidebar to page links

**Step 1:** Read the current `index.html` to get the exact Hero (`<header>`) block and the `<section id="what">` block.

**Step 2:** Rewrite `index.html` to:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiveFolders — Expose tools to LLMs as plain files</title>
  <meta name="description" content="A virtual filesystem that exposes any tool to an LLM via cat and echo. No JSON. No SDK. No protocol. 10 lines of YAML vs 18 lines of Python.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🗂️</text></svg>">
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.livefoldersfs.org">
  <meta property="og:title" content="🗂️ LiveFolders — Expose tools to LLMs as plain files">
  <meta property="og:description" content="A virtual filesystem alternative to MCP. Expose any tool to an LLM via cat and echo — no JSON, no SDK, no protocol. 10 lines of YAML vs 18 lines of Python.">
  <meta property="og:site_name" content="LiveFolders">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="🗂️ LiveFolders — Expose tools to LLMs as plain files">
  <meta name="twitter:description" content="A virtual filesystem alternative to MCP. Expose any tool to an LLM via cat and echo — no JSON, no SDK, no protocol.">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  [SIDEBAR]
  [MARQUEE]

  <!-- HERO -->
  [paste existing <header> hero block here — the big 3rem h1 hero, unchanged]

  [TOP-NAV]
  [paste the copy-markdown button + toast + copyMarkdown script inline block here — keep it from current index.html]

  [paste <section id="what"> block here]
  <hr>

  [FOOTER]
  [SCRIPT]
</body>
</html>
```

**Important:** The copy-markdown button (`[copy as markdown]`) lives inside the old `<nav>` block. Keep the button, toast div, and its inline `<script>` — paste them after [TOP-NAV] and before the first section.

**Step 3: Verify**

```bash
grep -c '<section' index.html
```
Expected: 1

```bash
grep 'copy-md-btn\|copyMarkdown' index.html
```
Expected: present (copy-markdown feature preserved)

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: strip index.html to Home page (hero + What Is It?)"
```

---

### Task 7: Add sidebar to findings.html

**Files:**
- Modify: `findings.html`

**Step 1:** Read `findings.html` to understand its current structure (it has its own nav and no sidebar).

**Step 2:** Insert [SIDEBAR] as first child of `<body>`.

**Step 3:** Add `margin-left: 190px` is already handled by `style.css` body rule — no CSS change needed.

**Step 4:** Replace the existing `<nav>` in findings.html with [TOP-NAV] so links point to the new page structure (e.g., `Install` should go to `/install.html`).

**Step 5:** Add [SCRIPT] (with sidebar active-state JS) before `</body>`, replacing the existing `<script>` block (keep copy-button code, add sidebar active highlight).

**Step 6: Verify**

```bash
grep -n 'id="sidebar"\|page-header\|sidebar-header' findings.html
```
Expected: sidebar present

**Step 7: Commit**

```bash
git add findings.html
git commit -m "feat: add sidebar to findings.html"
```

---

### Task 8: Commit design docs

```bash
git add docs/plans/2026-05-22-multipage-design.md docs/plans/2026-05-22-multipage-impl.md
git commit -m "docs: add multipage split design and implementation plan"
```
