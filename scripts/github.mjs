// Reuse the user's existing Git credential manager. Credentials stay in process memory.
import { execFileSync } from 'node:child_process'

const repo = 'oyueo-mm/MJUTime'
const mode = process.argv[2] ?? 'status'
let credential
try {
  credential = execFileSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
} catch {
  console.error('No existing GitHub credential is available. Sign in to GitHub using Git Credential Manager, then retry.')
  process.exit(1)
}
const token = credential.split(/\r?\n/).find(line => line.startsWith('password='))?.slice(9)
if (!token) throw new Error('Git credential manager returned no token')
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = response.status === 204 ? {} : await response.json()
  if (!response.ok) throw new Error(`GitHub ${method} ${path}: ${response.status} ${result.message ?? ''}`)
  return result
}
if (mode === 'configure') {
  await api('', 'PATCH', { description: '명지대학교의 역사를 3D 캠퍼스와 인터랙티브 타임라인으로 탐험하는 디지털 타임머신', homepage: 'https://oyueo-mm.github.io/MJUTime/' })
  await api('/topics', 'PUT', { names: ['myongji-university', 'interactive-history', 'threejs', 'react-three-fiber', '3d-visualization', 'timeline', 'digital-heritage', 'typescript'] })
  try { await api('/pages', 'PUT', { build_type: 'workflow' }) }
  catch (error) {
    if (!String(error.message).includes('404')) throw error
    await api('/pages', 'POST', { build_type: 'workflow' })
  }
  console.log('Repository metadata and GitHub Actions Pages source configured.')
} else if (mode === 'status') {
  const repository = await api('')
  const runs = await api('/actions/runs?per_page=3')
  console.log(JSON.stringify({ repository: repository.html_url, description: repository.description, topics: repository.topics, permissions: repository.permissions, runs: runs.workflow_runs.map(run => ({ id: run.id, sha: run.head_sha, status: run.status, conclusion: run.conclusion, url: run.html_url })) }, null, 2))
  try { const pages = await api('/pages'); console.log(JSON.stringify({ pages: { url: pages.html_url, status: pages.status, build_type: pages.build_type } }, null, 2)) } catch (error) { console.log(error.message) }
} else if (mode === 'jobs') {
  const runId = process.argv[3]
  if (!/^\d+$/.test(runId ?? '')) throw new Error('Numeric run ID required')
  const jobs = await api(`/actions/runs/${runId}/jobs`)
  console.log(JSON.stringify(jobs.jobs.map(job => ({ name: job.name, status: job.status, conclusion: job.conclusion, steps: job.steps?.map(step => ({ name: step.name, conclusion: step.conclusion, status: step.status })) })), null, 2))
}
