import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — LiveFolders Registry',
}

export default function PrivacyPage() {
  return (
    <div className="container">
      <p><a href="/">← Registry</a></p>

      <h1 style={{ color: '#000080', borderBottom: '6px solid #000', paddingBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '0.85rem' }}>Effective date: 2026-05-22</p>

      <h2>1. What We Collect</h2>
      <p>
        When a tool is published to the LiveFolders Registry, we store:
      </p>
      <ul>
        <li>GitHub username (owner) and repository name</li>
        <li>Repository description and public URL</li>
        <li>Download count (incremented on each <code>livefolders install</code>)</li>
        <li>Timestamps for creation and last update</li>
        <li>Tags declared in <code>folder.yaml</code></li>
      </ul>
      <p>
        We do <strong>not</strong> collect email addresses, IP addresses beyond rate-limiting,
        personal profiles, or any data from end-users who install tools.
      </p>

      <h2>2. How We Use It</h2>
      <ul>
        <li>Display tool listings on this registry website</li>
        <li>Serve install metadata to the <code>livefolders</code> CLI</li>
        <li>Show download statistics to publishers and users</li>
      </ul>
      <p>We do not sell or share data with third parties for advertising purposes.</p>

      <h2>3. GitHub OAuth Tokens</h2>
      <p>
        Publishing a tool requires a GitHub personal access token to verify repo ownership.
        Tokens are used only to authenticate the publish request against the GitHub API and
        are <strong>never stored</strong> in our database.
      </p>

      <h2>4. Rate-Limiting</h2>
      <p>
        IP addresses are passed to Upstash Redis solely to enforce rate limits
        (10 publishes per hour, 60 searches per minute). They are not logged or retained
        beyond the rate-limit window.
      </p>

      <h2>5. Third-Party Services</h2>
      <ul>
        <li><strong>Neon / PostgreSQL</strong> — tool metadata storage</li>
        <li><strong>Upstash Redis</strong> — ephemeral rate-limit counters</li>
        <li><strong>GitHub API</strong> — repo ownership verification and tag lookups</li>
        <li><strong>Vercel</strong> — hosting and edge CDN</li>
      </ul>
      <p>
        Each provider operates under its own privacy policy. No personally identifiable
        information beyond what is described above is shared with them.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        Registry entries persist until a publisher requests removal or deletes their
        GitHub repository. Contact us (see below) to request deletion of your listing.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        You may request access to or deletion of your tool&rsquo;s registry entry at any time
        by opening an issue on the{' '}
        <a href="https://github.com/natanloterio/LiveFolders" target="_blank" rel="noreferrer">
          LiveFolders GitHub repository
        </a>{' '}
        or emailing <strong>natan@gaiahub.ai</strong>.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        Material changes will be announced via the LiveFolders GitHub repository.
        Continued use of the registry after changes constitutes acceptance.
      </p>

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="/">Registry home</a>
        {' · '}
        <a href="/terms">Terms of Service</a>
        {' · '}
        <a href="/security">Security</a>
      </p>
    </div>
  )
}
