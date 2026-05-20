# LiveFolders Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a plain HTML/CSS 90s-style marketing landing page for LiveFolders that drives installs and GitHub stars.

**Architecture:** Single `index.html` + `style.css` — no build step, no framework. Deployed as a static site on Vercel via `vercel.json`. Sections built top-to-bottom, committed after each section passes visual verification.

**Tech Stack:** HTML5, CSS3 (no preprocessors), Vercel static hosting, one small inline `<script>` for the copy-to-clipboard button.

---

### Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `vercel.json`

**Step 1: Create the project directory structure**

The working directory is `/media/loterio/workspace/workspace/research/livefolders.org`.

Run: `ls /media/loterio/workspace/workspace/research/livefolders.org`

Confirm the `docs/` directory already exists (created by the design doc). Proceed.

**Step 2: Create `vercel.json`**

```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

**Step 3: Create `style.css` — base styles only**

```css
/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  line-height: 1.6;
  background-color: #FFFAF0;
  color: #111111;
}

code, pre, .mono {
  font-family: "Courier New", Courier, monospace;
}

a { color: #0000EE; text-decoration: underline; }
a:visited { color: #551A8B; }
a:hover { color: #FF0000; }

hr {
  border: none;
  border-top: 6px solid #111111;
  margin: 2rem 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* === 90s Buttons === */
.btn {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  font-family: "Times New Roman", Times, serif;
  font-size: 1rem;
  font-weight: bold;
  text-decoration: none;
  border: 3px outset #888;
  cursor: pointer;
  background: #C0C0C0;
  color: #111;
}
.btn:visited { color: #111; }
.btn:hover { border-style: inset; }
.btn:active { border-style: inset; }

.btn-gold  { background: #FFD700; border-color: #B8860B; color: #111; }
.btn-teal  { background: #008080; border-color: #004444; color: #FFF; }
.btn-teal:visited { color: #FFF; }

/* === Pixel Boxes === */
.pixel-box {
  border: 4px solid #111;
  padding: 1rem;
  background: #FFF;
}

/* === Code Box === */
.code-box {
  background: #111;
  color: #00FF00;
  padding: 1rem;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9rem;
  overflow-x: auto;
  white-space: pre;
  border: 3px solid #333;
}

/* === Section Headers === */
.section-header {
  font-size: 1.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.25rem;
  border-bottom: 4px solid #111;
  padding-bottom: 0.5rem;
}

/* === Tables === */
table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 2px solid #111;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
th { background: #C0C0C0; font-weight: bold; text-transform: uppercase; }

/* === Sections === */
section { padding: 2.5rem 0; }

/* === Blink === */
@keyframes blink { 50% { opacity: 0; } }
.blink { animation: blink 1s step-start infinite; }

/* === Mobile === */
@media (max-width: 640px) {
  .two-col { display: block; }
  .two-col > * { width: 100% !important; }
  .feature-grid { grid-template-columns: 1fr !important; }
}
```

**Step 4: Create `index.html` skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiveFolders — Expose tools to LLMs as plain files</title>
  <meta name="description" content="A virtual filesystem that exposes any tool to an LLM via cat and echo. No JSON. No SDK. No protocol.">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- HERO -->

  <!-- WHAT IS IT -->

  <!-- HOW IT WORKS -->

  <!-- KEY FEATURES -->

  <!-- VS MCP -->

  <!-- INSTALL -->

  <!-- FOOTER -->

  <script>
    function copyInstall() {
      const cmd = 'curl -fsSL https://raw.githubusercontent.com/natanloterio/LiveFolders/master/install.sh | bash';
      navigator.clipboard.writeText(cmd).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = '[COPIED!]';
        setTimeout(() => btn.textContent = '[COPY]', 2000);
      });
    }
  </script>
</body>
</html>
```

**Step 5: Open in browser to confirm it renders as a blank page without errors**

Run: `python3 -m http.server 8080 --directory /media/loterio/workspace/workspace/research/livefolders.org`

Open `http://localhost:8080`. Expected: blank page, no console errors.

**Step 6: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org init
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html style.css vercel.json
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: scaffold static site with base styles"
```

---

### Task 2: Hero Section

**Files:**
- Modify: `index.html` — replace `<!-- HERO -->` comment

**Step 1: Add hero HTML inside `index.html`**

Replace `  <!-- HERO -->` with:

```html
  <!-- HERO -->
  <header style="background: #FFFAF0; border-bottom: 6px solid #111; padding: 3rem 0 2.5rem;">
    <div class="container" style="text-align: center;">
      <h1 style="font-size: 3rem; color: #000080; margin-bottom: 0.5rem; letter-spacing: -1px;">
        LiveFolders
      </h1>
      <p style="font-size: 1.25rem; max-width: 600px; margin: 0 auto 0.5rem; font-style: italic;">
        Expose any tool to an LLM as plain files.<br>
        No JSON. No SDK. Just <code>cat</code> and <code>echo</code>.<span class="blink">▌</span>
      </p>
      <p style="font-size: 0.9rem; color: #555; margin-bottom: 1.75rem;">
        A virtual filesystem alternative to MCP — built in Rust, zero dependencies for tool authors.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="https://github.com/natanloterio/LiveFolders" class="btn btn-gold" target="_blank" rel="noopener">
          ★ Star on GitHub
        </a>
        <a href="#install" class="btn btn-teal">
          ▼ Install Now
        </a>
      </div>
    </div>
  </header>
```

**Step 2: Verify visually**

Reload `http://localhost:8080`. Expected: large navy "LiveFolders" heading, italic tagline with blinking cursor, gold + teal buttons side by side.

**Step 3: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add hero section"
```

---

### Task 3: What Is It Section

**Files:**
- Modify: `index.html` — replace `<!-- WHAT IS IT -->` comment

**Step 1: Add section HTML**

Replace `  <!-- WHAT IS IT -->` with:

```html
  <!-- WHAT IS IT -->
  <section>
    <div class="container">
      <h2 class="section-header">What Is It?</h2>
      <p style="margin-bottom: 1.25rem; font-size: 1.05rem;">
        LiveFolders mounts a virtual filesystem on your machine. Every tool you install appears as
        a directory of plain files. An LLM reads a file to call the tool — no JSON protocol,
        no SDK, no special client. Any agent that can run <code>cat</code> or <code>echo</code> can use it.
      </p>
      <div class="code-box" style="margin-bottom: 1rem;">cat .livefolders/tools/users/list
# → # Users
#
# → ## Mr. Rudolph Robel-Fay
# → ID: 1
# → Created: 2024-01-15
# → Avatar: https://cdn.example.com/avatars/1.jpg</div>
      <div class="pixel-box" style="border-color: #000080; background: #F0F0FF;">
        <strong>&#x2139;&#xfe0f; How the blocking works:</strong>
        The <em>write</em> call blocks until the tool finishes — by the time
        <code>cat</code> runs, the result is ready. The filesystem never returns stale data.
      </div>
    </div>
  </section>
  <hr>
```

**Step 2: Verify visually**

Reload browser. Expected: uppercase "WHAT IS IT?" header with border, paragraph, green-on-black code box, blue-bordered info box.

**Step 3: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add what-is-it section"
```

---

### Task 4: How It Works Section

**Files:**
- Modify: `index.html` — replace `<!-- HOW IT WORKS -->` comment

**Step 1: Add section HTML**

Replace `  <!-- HOW IT WORKS -->` with:

```html
  <!-- HOW IT WORKS -->
  <section>
    <div class="container">
      <h2 class="section-header">How It Works</h2>
      <table class="two-col" style="border: none;">
        <tr>
          <td style="border: none; width: 45%; vertical-align: top; padding-right: 1.5rem;">
            <div class="code-box" style="color: #FFFFFF; font-size: 0.85rem;">.livefolders/tools/
├── index.md          ← all tools listed here
├── demo/
│   ├── how_to.md     ← LLM reads this first
│   ├── shout         ← write text, read UPPERCASED
│   └── status        ← read-only status
└── users/
    ├── how_to.md
    └── list          ← reads from REST API</div>
          </td>
          <td style="border: none; width: 55%; vertical-align: top;">
            <div class="pixel-box" style="margin-bottom: 0.75rem; background: #F0FFF0;">
              <strong>1. Mount the filesystem</strong><br>
              <code>livefolders mount</code> — runs in background, returns to prompt immediately.
            </div>
            <div class="pixel-box" style="margin-bottom: 0.75rem; background: #FFF8E7;">
              <strong>2. LLM reads or writes a file</strong><br>
              <code>cat tools/users/list</code> fetches users.<br>
              <code>echo "London" &gt; tools/weather/forecast</code> sends a query.
            </div>
            <div class="pixel-box" style="background: #FFF0F0;">
              <strong>3. Handler runs, result returns</strong><br>
              Your shell command, Python script, or <code>curl</code> call executes.
              Output is returned as file content.
              <span style="color: #008080; font-weight: bold;">★ Changes hot-reload in ~1s</span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </section>
  <hr>
```

**Step 2: Verify visually**

Reload browser. Expected: two-column layout with directory tree on left, three step-boxes on right. On mobile (resize window), should stack vertically.

**Step 3: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add how-it-works section"
```

---

### Task 5: Key Features Section

**Files:**
- Modify: `index.html` — replace `<!-- KEY FEATURES -->` comment
- Modify: `style.css` — add feature grid styles

**Step 1: Add feature grid CSS to `style.css`**

Append to end of `style.css`:

```css
/* === Feature Grid === */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.feature-card {
  border: 4px solid #111;
  padding: 1rem 1.25rem;
}
.feature-card h3 {
  font-size: 1.1rem;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  border-bottom: 2px solid #111;
  padding-bottom: 0.3rem;
}
```

**Step 2: Add section HTML**

Replace `  <!-- KEY FEATURES -->` with:

```html
  <!-- KEY FEATURES -->
  <section>
    <div class="container">
      <h2 class="section-header">Key Features</h2>
      <div class="feature-grid">
        <div class="feature-card" style="background: #E0FFFF;">
          <h3>⚡ Hot-Reload</h3>
          <p>Edit <code>folder.yaml</code> or a handler script — changes take effect in ~1 second.
          No restart. No reconnect. The watcher picks it up automatically.</p>
        </div>
        <div class="feature-card" style="background: #FFFACD;">
          <h3>⏱ Handler Timeouts</h3>
          <p>A hung tool is killed after a configurable timeout (default: 30s).
          The endpoint returns an error string. The filesystem never freezes.</p>
        </div>
        <div class="feature-card" style="background: #FFE4E1;">
          <h3>🔑 Secret Management</h3>
          <p>Declare required env vars in <code>folder.yaml</code>. Users are prompted
          at install time. Secrets are stored in <code>secrets.env</code> and loaded on every mount.</p>
        </div>
        <div class="feature-card" style="background: #E6E6FA;">
          <h3>🩺 livefolders doctor</h3>
          <p>Built-in diagnostic command. Checks FUSE installation, your config file,
          and every installed tool's <code>folder.yaml</code>. Prints actionable fixes.</p>
        </div>
      </div>
    </div>
  </section>
  <hr>
```

**Step 3: Verify visually**

Reload browser. Expected: 2×2 grid of colored cards with uppercase bold headings.

**Step 4: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html style.css
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add key features section"
```

---

### Task 6: LiveFolders vs MCP Section

**Files:**
- Modify: `index.html` — replace `<!-- VS MCP -->` comment

**Step 1: Add section HTML**

Replace `  <!-- VS MCP -->` with:

```html
  <!-- VS MCP -->
  <section>
    <div class="container">
      <h2 class="section-header">LiveFolders vs MCP</h2>
      <p style="margin-bottom: 1rem;">
        MCP (Model Context Protocol) is the leading alternative. Both approaches are valid —
        the right choice depends on your environment.
      </p>
      <table>
        <thead>
          <tr>
            <th>Criterion</th>
            <th>LiveFolders</th>
            <th>MCP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Setup</td>
            <td style="background:#F0FFF0;"><strong>6-line YAML, no runtime</strong></td>
            <td>Python + package install required</td>
          </tr>
          <tr>
            <td>Hot-Reload</td>
            <td style="background:#F0FFF0;"><strong>~1s, no restart</strong></td>
            <td>Server restart + reconnect (~1–3s)</td>
          </tr>
          <tr>
            <td>Publishing</td>
            <td style="background:#F0FFF0;"><strong>One GitHub URL, no registry</strong></td>
            <td>No official registry; manual setup</td>
          </tr>
          <tr>
            <td>LLM Compatibility</td>
            <td>Shell-capable agents (Claude Code, etc.)</td>
            <td style="background:#F0FFF0;"><strong>Any MCP-native host client</strong></td>
          </tr>
          <tr>
            <td>Input Validation</td>
            <td>Handler must validate manually</td>
            <td style="background:#F0FFF0;"><strong>JSON schema enforced</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 0.75rem; font-style: italic; font-size: 0.9rem;">
        Neither is universally better.
        <a href="https://github.com/natanloterio/LiveFolders/blob/master/docs/livefoldersfs-vs-mcp.md" target="_blank" rel="noopener">
          Read the full comparison →
        </a>
      </p>
    </div>
  </section>
  <hr>
```

**Step 2: Verify visually**

Reload browser. Expected: bordered table with green-highlighted LiveFolders wins and blue-highlighted MCP wins, italic footnote with link.

**Step 3: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add vs-mcp comparison section"
```

---

### Task 7: Install / Get Started Section

**Files:**
- Modify: `index.html` — replace `<!-- INSTALL -->` comment

**Step 1: Add section HTML**

Replace `  <!-- INSTALL -->` with:

```html
  <!-- INSTALL -->
  <section id="install">
    <div class="container">
      <h2 class="section-header">Get Started</h2>

      <p style="margin-bottom: 0.75rem; font-weight: bold;">1. Install LiveFolders:</p>
      <div style="position: relative; margin-bottom: 1.5rem;">
        <div class="code-box" id="install-cmd">curl -fsSL https://raw.githubusercontent.com/natanloterio/LiveFolders/master/install.sh | bash</div>
        <button id="copy-btn" onclick="copyInstall()"
          style="position: absolute; top: 0.5rem; right: 0.5rem; font-family: 'Courier New', monospace;
                 font-size: 0.8rem; background: #333; color: #0F0; border: 1px solid #0F0;
                 padding: 0.2rem 0.5rem; cursor: pointer;">[COPY]</button>
      </div>

      <p style="margin-bottom: 0.5rem; font-weight: bold;">Prerequisites:</p>
      <table style="margin-bottom: 1.5rem; width: auto;">
        <thead><tr><th>Platform</th><th>Requirement</th></tr></thead>
        <tbody>
          <tr>
            <td>Linux</td>
            <td><code>sudo apt-get install fuse3</code></td>
          </tr>
          <tr>
            <td>macOS</td>
            <td><a href="https://osxfuse.github.io" target="_blank" rel="noopener">macFUSE</a> — install the .pkg from osxfuse.github.io</td>
          </tr>
        </tbody>
      </table>

      <p style="margin-bottom: 0.75rem; font-weight: bold;">2. Quick start:</p>
      <div class="code-box" style="margin-bottom: 1.5rem;"># Create config
livefolders init

# Install an example tool
livefolders install github.com/natanloterio/LiveFolders/tree/master/examples/users

# Mount (runs in background)
livefolders mount

# Use it
cat .livefolders/tools/users/list

# Stop
livefolders stop</div>

      <details style="border: 3px solid #111; padding: 0.75rem; background: #F5F5F5;">
        <summary style="cursor: pointer; font-weight: bold; font-family: 'Courier New', monospace;">
          Manual install / from source
        </summary>
        <div class="code-box" style="margin-top: 0.75rem;"># Linux x86_64
curl -L https://github.com/natanloterio/LiveFolders/releases/latest/download/livefolders-linux-x86_64 -o livefolders
chmod +x livefolders && sudo mv livefolders /usr/local/bin/

# From source (requires Rust)
cargo install --git https://github.com/natanloterio/LiveFolders</div>
      </details>
    </div>
  </section>
  <hr>
```

**Step 2: Verify visually**

Reload browser. Expected: curl command in green-on-black box with `[COPY]` button, prerequisites table, Quick Start code block, collapsible manual install section. Click `[COPY]` — button should flash `[COPIED!]` for 2 seconds.

**Step 3: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add install section"
```

---

### Task 8: Footer

**Files:**
- Modify: `index.html` — replace `<!-- FOOTER -->` comment

**Step 1: Add footer HTML**

Replace `  <!-- FOOTER -->` with:

```html
  <!-- FOOTER -->
  <footer style="background: #000080; color: #FFFFFF; padding: 2rem 0; border-top: 6px solid #111;">
    <div class="container">
      <table style="border: none; width: 100%;">
        <tr>
          <td style="border: none; width: 33%; vertical-align: top;">
            <strong style="font-size: 1.1rem;">LiveFolders</strong><br>
            <span style="font-size: 0.85rem; color: #CCC;">Apache 2.0 License</span>
          </td>
          <td style="border: none; width: 34%; vertical-align: top; text-align: center;">
            <a href="https://github.com/natanloterio/LiveFolders" style="color: #FFD700;" target="_blank" rel="noopener">GitHub</a>
            &nbsp;·&nbsp;
            <a href="https://github.com/natanloterio/LiveFolders/blob/master/README.md" style="color: #FFD700;" target="_blank" rel="noopener">README</a>
            &nbsp;·&nbsp;
            <a href="https://github.com/natanloterio/LiveFolders/blob/master/docs/livefoldersfs-vs-mcp.md" style="color: #FFD700;" target="_blank" rel="noopener">vs MCP</a>
          </td>
          <td style="border: none; width: 33%; vertical-align: top; text-align: right; font-size: 0.85rem; color: #CCC;">
            Made with ♥ and Rust 🦀<br>
            <span style="font-family: 'Courier New', monospace; color: #0F0;">[Visitors: 001337]</span>
          </td>
        </tr>
      </table>
    </div>
  </footer>
```

**Step 2: Verify visually**

Reload browser. Expected: dark navy footer with three columns — project name/license on left, links in center (gold), Rust credit + visitor counter on right. Scroll to bottom to confirm it reaches the bottom of the page.

**Step 3: Commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: add footer"
```

---

### Task 9: Polish Pass

**Files:**
- Modify: `style.css` — minor polish
- Modify: `index.html` — minor polish

**Step 1: Add a horizontal scrolling marquee at the very top (optional 90s touch)**

Add immediately after `<body>`:

```html
  <div style="background: #000080; color: #FFD700; padding: 0.3rem 0; overflow: hidden; white-space: nowrap; font-family: 'Courier New', monospace; font-size: 0.85rem;">
    <marquee>★ LiveFolders v0.5.1 — Expose tools to LLMs via plain files — No SDK required — Works with Claude Code — Apache 2.0 — Star us on GitHub! ★</marquee>
  </div>
```

Note: `<marquee>` is deprecated but universally supported and very 90s — perfect here.

**Step 2: Add a `<nav>` anchor bar below the hero**

Add after `</header>`:

```html
  <nav style="background: #C0C0C0; border-bottom: 3px solid #111; border-top: 3px solid #111; padding: 0.4rem 0;">
    <div class="container" style="display: flex; gap: 1.5rem; font-size: 0.9rem; font-weight: bold; flex-wrap: wrap;">
      <a href="#" style="color: #000080;">Home</a>
      <a href="#install" style="color: #000080;">Install</a>
      <a href="https://github.com/natanloterio/LiveFolders" style="color: #000080;" target="_blank" rel="noopener">GitHub</a>
      <a href="https://github.com/natanloterio/LiveFolders/blob/master/README.md" style="color: #000080;" target="_blank" rel="noopener">Docs</a>
    </div>
  </nav>
```

**Step 3: Verify full page visually**

Scroll through the entire page top-to-bottom. Check:
- [ ] Marquee scrolls at the top
- [ ] Nav bar with gray background and anchor links
- [ ] Hero: navy title, italic tagline, blinking cursor, gold + teal buttons
- [ ] "What Is It?" with code box and info box
- [ ] "How It Works" two columns (or stacked on mobile)
- [ ] "Key Features" 2×2 grid
- [ ] "vs MCP" table with green highlights
- [ ] "Get Started" with curl box, copy button, quick start, collapsible manual
- [ ] Footer: navy background, three columns

**Step 4: Test mobile layout**

Resize browser to ~375px wide. Expected: all two-column layouts stack vertically, feature grid becomes 1 column, buttons wrap.

**Step 5: Final commit**

```bash
git -C /media/loterio/workspace/workspace/research/livefolders.org add index.html style.css
git -C /media/loterio/workspace/workspace/research/livefolders.org commit -m "feat: polish pass — marquee, nav bar, mobile check"
```

---

### Task 10: Deploy to Vercel

**Step 1: Authenticate with Vercel (if not already)**

Run: `vercel whoami`

If not logged in: `vercel login`

**Step 2: Deploy as preview**

```bash
cd /media/loterio/workspace/workspace/research/livefolders.org
vercel
```

Accept defaults. Note the preview URL printed at the end.

**Step 3: Verify preview deployment**

Open the preview URL in a browser. Verify all sections render correctly, copy button works, links go to GitHub.

**Step 4: Deploy to production**

```bash
vercel --prod
```

**Step 5: Confirm production URL**

The production URL is printed. Share it.
