import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security — LiveFolders Registry',
}

export default function SecurityPage() {
  return (
    <div className="container">
      <p><a href="/">← Registry</a></p>

      <h1 style={{ color: '#000080', borderBottom: '6px solid #000', paddingBottom: 8 }}>
        Security
      </h1>

      <h2>Reporting a Vulnerability</h2>
      <p>
        If you discover a security vulnerability in the LiveFolders Registry or CLI, please
        report it responsibly:
      </p>
      <ol>
        <li>
          <strong>Do not</strong> open a public GitHub issue for security vulnerabilities.
        </li>
        <li>
          Email <strong>natan@gaiahub.ai</strong> with subject line{' '}
          <code>[SECURITY] LiveFolders — &lt;brief summary&gt;</code>.
        </li>
        <li>
          Include a description of the issue, reproduction steps, and potential impact.
        </li>
      </ol>
      <p>
        We aim to acknowledge reports within <strong>2 business days</strong> and provide
        a resolution timeline within <strong>7 business days</strong>.
      </p>

      <h2>Incident Management</h2>
      <p>
        The LiveFolders Registry uses the following controls to protect the service and
        its users:
      </p>
      <ul>
        <li>
          <strong>Rate limiting</strong> — All API endpoints enforce per-IP rate limits
          via Upstash Redis to prevent abuse.
        </li>
        <li>
          <strong>Input validation</strong> — Publish requests validate GitHub token
          ownership before any write occurs. YAML payloads are parsed and rejected on
          malformed input.
        </li>
        <li>
          <strong>No secret storage</strong> — GitHub tokens are never persisted; they
          are used only in-flight to verify ownership.
        </li>
        <li>
          <strong>Parameterized queries</strong> — All database access uses parameterized
          SQL to prevent injection.
        </li>
        <li>
          <strong>Dependency scanning</strong> — Dependencies are reviewed on each
          deployment; critical CVEs trigger immediate patch releases.
        </li>
      </ul>

      <h2>Known Limitations</h2>
      <ul>
        <li>
          The Registry does not scan or vet the <em>contents</em> of published tool
          repositories. Users should review source code before installing any third-party
          tool.
        </li>
        <li>
          Tool installs execute on the user&rsquo;s machine. The CLI does not sandbox execution;
          treat all tools as untrusted code unless you have audited the source.
        </li>
      </ul>

      <h2>Scope</h2>
      <p>The following are in scope for responsible disclosure:</p>
      <ul>
        <li>Authentication or authorization bypass on the publish API</li>
        <li>SQL injection or data exfiltration from the registry database</li>
        <li>Rate-limit bypass allowing registry spam</li>
        <li>Malicious package injection / namespace squatting</li>
      </ul>

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="/">Registry home</a>
        {' · '}
        <a href="/privacy">Privacy Policy</a>
        {' · '}
        <a href="/terms">Terms of Service</a>
      </p>
    </div>
  )
}
