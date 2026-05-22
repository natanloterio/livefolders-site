import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transparency — LiveFolders Registry',
}

export default function TransparencyPage() {
  return (
    <div className="container">
      <p><a href="/">← Registry</a></p>

      <h1 style={{ color: '#000080', borderBottom: '6px solid #000', paddingBottom: 8 }}>
        Transparency &amp; Disclosure
      </h1>

      <h2>What the App Does</h2>
      <p>
        The <strong>LiveFolders Registry GitHub App</strong> is a read-only integration
        that allows the registry to verify repository ownership during the publish flow.
        When a publisher calls <code>POST /api/publish</code> with a GitHub token and repo
        slug, the app authenticates the request by confirming the token belongs to the
        repository owner. No automated actions are taken on the repository.
      </p>

      <h2>Permissions Requested</h2>
      <table style={{ width: 'auto' }}>
        <thead>
          <tr><th>Permission</th><th>Access Level</th><th>Reason</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Repository metadata</td>
            <td>Read-only</td>
            <td>Fetch description, URL, and tags for the listing</td>
          </tr>
          <tr>
            <td>Repository contents</td>
            <td>Read-only</td>
            <td>Read <code>folder.yaml</code> from the repository root</td>
          </tr>
          <tr>
            <td>Repository tags</td>
            <td>Read-only</td>
            <td>Display available versions on the tool detail page</td>
          </tr>
        </tbody>
      </table>

      <h2>Data Collected and Stored</h2>
      <ul>
        <li>GitHub username (owner) and repository name</li>
        <li>Repository description (from GitHub API)</li>
        <li>Public repository URL</li>
        <li>Tags declared in <code>folder.yaml</code></li>
        <li>Download count (incremented per <code>livefolders install</code>)</li>
        <li>Publish and update timestamps</li>
      </ul>
      <p>
        No user PII beyond GitHub username is stored. GitHub OAuth tokens are used
        in-flight only and are never persisted.
      </p>

      <h2>Third-Party Services</h2>
      <ul>
        <li><strong>Neon PostgreSQL</strong> — persistent storage of tool metadata</li>
        <li><strong>Upstash Redis</strong> — ephemeral rate-limit counters (IP-keyed, short TTL)</li>
        <li><strong>GitHub REST API</strong> — repo verification, metadata, and tag enumeration</li>
        <li><strong>Vercel</strong> — compute and edge CDN hosting</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        All tool metadata stored in the registry is publicly accessible via the registry
        website and API (intentionally — this is a public package index). No private
        repository data, user credentials, or analytics are shared with any party.
      </p>

      <h2>Limited Use Policy</h2>
      <p>
        Data obtained through the GitHub API is used exclusively to populate and maintain
        registry listings. It is not used for advertising, sold to third parties, or
        processed for purposes beyond what is described on this page.
      </p>

      <h2>Open Source</h2>
      <p>
        The registry source code is publicly available at{' '}
        <a href="https://github.com/natanloterio/LiveFolders" target="_blank" rel="noreferrer">
          github.com/natanloterio/LiveFolders
        </a>
        . Anyone can audit exactly how data is handled.
      </p>

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="/">Registry home</a>
        {' · '}
        <a href="/privacy">Privacy Policy</a>
        {' · '}
        <a href="/terms">Terms of Service</a>
        {' · '}
        <a href="/security">Security</a>
      </p>
    </div>
  )
}
