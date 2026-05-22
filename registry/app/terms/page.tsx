import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — LiveFolders Registry',
}

export default function TermsPage() {
  return (
    <div className="container">
      <p><a href="/">← Registry</a></p>

      <h1 style={{ color: '#000080', borderBottom: '6px solid #000', paddingBottom: 8 }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: '0.85rem' }}>Effective date: 2026-05-22</p>

      <h2>1. Acceptance</h2>
      <p>
        By using the LiveFolders Registry (the &ldquo;Service&rdquo;), you agree to these terms.
        If you do not agree, do not use the Service.
      </p>

      <h2>2. The Service</h2>
      <p>
        The LiveFolders Registry is a public package index that allows developers to publish
        and distribute LiveFolders tools — filesystem-automation scripts described by a
        <code>folder.yaml</code> manifest. The CLI client (<code>livefolders</code>) resolves
        tool metadata from this registry.
      </p>

      <h2>3. Publishing Tools</h2>
      <p>By publishing a tool to the Registry, you represent that:</p>
      <ul>
        <li>You own or have the rights to publish the tool&rsquo;s source code.</li>
        <li>The tool does not contain malware, destructive payloads, or content that violates applicable law.</li>
        <li>The repository is publicly accessible on GitHub (or will be marked private in your listing).</li>
        <li>The <code>folder.yaml</code> manifest accurately describes the tool&rsquo;s behavior.</li>
      </ul>

      <h2>4. Prohibited Use</h2>
      <p>You may not use the Service to:</p>
      <ul>
        <li>Distribute malicious or deceptive software.</li>
        <li>Abuse the API (automated scraping, credential stuffing, DoS attacks).</li>
        <li>Impersonate other GitHub users or projects.</li>
        <li>Violate the GitHub Terms of Service as they relate to the underlying repositories.</li>
      </ul>

      <h2>5. Availability</h2>
      <p>
        The Service is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis.
        We make no guarantee of uptime, availability, or continuity. We may remove listings
        that violate these terms without prior notice.
      </p>

      <h2>6. Liability</h2>
      <p>
        To the maximum extent permitted by law, the LiveFolders Registry and its operators
        are not liable for damages resulting from use of tools published by third parties.
        You install and run third-party tools at your own risk; always review source code
        before execution.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        Tool source code remains the property of its respective authors under whatever license
        they choose. The Registry does not claim ownership of published tools. Registry
        infrastructure, branding, and UI are owned by the LiveFolders project.
      </p>

      <h2>8. Removal Requests</h2>
      <p>
        To remove a listing, open an issue on the{' '}
        <a href="https://github.com/natanloterio/LiveFolders" target="_blank" rel="noreferrer">
          LiveFolders GitHub repository
        </a>{' '}
        or email <strong>natan@gaiahub.ai</strong>. We will process valid requests within
        14 business days.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms at any time. Continued use after changes constitutes
        acceptance. Material changes will be announced via the GitHub repository.
      </p>

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="/">Registry home</a>
        {' · '}
        <a href="/privacy">Privacy Policy</a>
        {' · '}
        <a href="/security">Security</a>
      </p>
    </div>
  )
}
