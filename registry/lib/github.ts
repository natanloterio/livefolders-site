export type RepoMeta = {
  owner: string
  name: string
  description: string | null
  repoUrl: string
  folderYaml: string
  subdir?: string
}

export async function verifyRepoOwnership(
  token: string,
  repoSlug: string
): Promise<{ login: string }> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'livefolders-registry' },
  })
  if (!res.ok) throw new Error('invalid_token')
  return res.json()
}

export async function fetchRepoMeta(
  token: string,
  owner: string,
  repo: string,
  subdir?: string
): Promise<RepoMeta> {
  const yamlPath = subdir ? `${subdir}/folder.yaml` : 'folder.yaml'
  const [repoRes, fileRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'livefolders-registry' },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${yamlPath}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'livefolders-registry' },
    }),
  ])

  if (!repoRes.ok) throw new Error('repo_not_found')
  if (!fileRes.ok) throw new Error('folder_yaml_missing')

  const repoData = await repoRes.json()
  const fileData = await fileRes.json()
  const folderYaml = Buffer.from(fileData.content, 'base64').toString('utf8')

  return {
    owner,
    name: repo,
    description: repoData.description ?? null,
    repoUrl: repoData.html_url,
    folderYaml,
    ...(subdir ? { subdir } : {}),
  }
}
