// Why: workspace-icon configuration is a self-contained block (source radio
// + manual file picker + re-detect button + preview) that would otherwise
// inflate RepositoryPane.tsx. Keeping it here keeps the section reviewable
// in one screen and lets the preview share the same WorkspaceIcon component
// the sidebar/canvas header use, so what the user sees here is what ships.
import { useCallback, useEffect, useState } from 'react'
import type { Repo } from '../../../../shared/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Folder, Wand2, ExternalLink } from 'lucide-react'
import { SearchableSetting } from './SearchableSetting'
import { WorkspaceIcon } from '../workspace-icon/WorkspaceIcon'
import { cn } from '@/lib/utils'

type Source = NonNullable<Repo['iconSource']> | 'auto'

// Why: mirror the main-process SUPPORTED_ICON_EXTENSIONS so the renderer can
// flag a path whose extension we know the resolver will refuse, without
// having to round-trip to main just to validate. Keep this in sync with
// `iconMimeType` in src/main/repo-icon/detect.ts.
const SUPPORTED_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']

function getExtension(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) {
    return ''
  }
  const dot = trimmed.lastIndexOf('.')
  if (dot < 0 || dot === trimmed.length - 1) {
    return ''
  }
  return trimmed.slice(dot).toLowerCase()
}

function isUnsupportedExtension(path: string): boolean {
  const ext = getExtension(path)
  return Boolean(ext) && !SUPPORTED_EXTENSIONS.includes(ext)
}

const SOURCE_OPTIONS: { value: Source; label: string; description: string }[] = [
  {
    value: 'auto',
    label: 'Auto-detect',
    description:
      'Scan well-known locations (public/, app/, static/, root logo files) for a brand mark.'
  },
  {
    value: 'manual',
    label: 'Choose file',
    description: 'Pick any image file. The icon is read directly from disk on every load.'
  },
  {
    value: 'github-owner',
    label: 'GitHub owner avatar',
    description: 'Use the avatar of the GitHub user or organization that owns the origin remote.'
  },
  {
    value: 'none',
    label: 'No icon',
    description: 'Always show the default folder glyph.'
  }
]

type Props = {
  repo: Repo
  updateRepo: (repoId: string, updates: Partial<Repo>) => void
}

// Why: the new IPC methods (pickIconFile, detectIcon, resolveGithubOwnerAvatar)
// live on `window.api.repos` and are exposed by the preload script. In dev,
// preload changes need an Electron process restart — the renderer hot-reloads
// to the new code but talks to the previous preload, which doesn't have the
// methods. We probe at call time and surface a clear message so the user
// doesn't watch buttons silently fail. The probe is `typeof ... === 'function'`
// rather than truthiness so a TypeScript declaration that wasn't deployed at
// runtime is treated as missing.
function checkIconApi(): { ok: true } | { ok: false; reason: string } {
  const reposApi = window.api?.repos as Partial<{
    pickIconFile: unknown
    detectIcon: unknown
    resolveGithubOwnerAvatar: unknown
    resolveIcon: unknown
  }>
  const missing: string[] = []
  if (typeof reposApi?.pickIconFile !== 'function') {
    missing.push('pickIconFile')
  }
  if (typeof reposApi?.detectIcon !== 'function') {
    missing.push('detectIcon')
  }
  if (typeof reposApi?.resolveGithubOwnerAvatar !== 'function') {
    missing.push('resolveGithubOwnerAvatar')
  }
  if (typeof reposApi?.resolveIcon !== 'function') {
    missing.push('resolveIcon')
  }
  if (missing.length === 0) {
    return { ok: true }
  }
  return {
    ok: false,
    reason: `Workspace icon IPC is unavailable on this window (missing: ${missing.join(', ')}). The Electron preload needs a restart — quit and re-run \`pnpm dev\`.`
  }
}

export function WorkspaceIconSetting({ repo, updateRepo }: Props): React.JSX.Element {
  const currentSource: Source = repo.iconSource ?? 'auto'
  const [detecting, setDetecting] = useState(false)
  const [resolvingAvatar, setResolvingAvatar] = useState(false)
  // Why: surface the last detect/resolve outcome so the user gets feedback
  // when they click "Re-detect" and nothing visibly changes — otherwise a
  // miss looks like a broken button.
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [apiCheck] = useState(() => checkIconApi())

  // Why: the manual path input is committed on blur/Enter rather than per
  // keystroke. Per-keystroke updates were sending one IPC update + one
  // resolveIcon round-trip for every character, with the preview flashing
  // between Folder and the resolved image as the path became valid/invalid.
  // Local draft state isolates the typing from the persisted value.
  const [pathDraft, setPathDraft] = useState<string>(repo.iconPath ?? '')
  const [pathFocused, setPathFocused] = useState(false)
  useEffect(() => {
    // Why: keep the input in sync when the persisted path changes from
    // elsewhere (e.g. a Browse pick or a Re-detect run), but never overwrite
    // what the user is actively typing — that would clobber mid-edit.
    if (!pathFocused) {
      setPathDraft(repo.iconPath ?? '')
    }
  }, [repo.iconPath, pathFocused])

  const handlePickFile = useCallback(async () => {
    if (!apiCheck.ok) {
      setStatusMessage(apiCheck.reason)
      return
    }
    try {
      const filePath = await window.api.repos.pickIconFile({ repoId: repo.id })
      if (!filePath) {
        return
      }
      updateRepo(repo.id, { iconSource: 'manual', iconPath: filePath })
      setStatusMessage(null)
    } catch (err) {
      console.error('[WorkspaceIconSetting] pickIconFile failed:', err)
      setStatusMessage(
        `Failed to open file picker: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }, [repo.id, updateRepo, apiCheck])

  const handleSelectSource = useCallback(
    async (next: Source) => {
      setStatusMessage(null)
      if (!apiCheck.ok && next !== 'none') {
        // Why: 'none' only writes iconSource locally, no new IPC. Let the user
        // toggle to 'none' even when the new preload methods are missing so
        // they can disable an icon they don't want.
        setStatusMessage(apiCheck.reason)
        return
      }
      try {
        if (next === 'github-owner') {
          // Why: the GitHub avatar URL is resolved once at selection time and
          // cached on the repo. resolveIcon then just returns the cached URL.
          setResolvingAvatar(true)
          try {
            const url = await window.api.repos.resolveGithubOwnerAvatar({ repoId: repo.id })
            if (!url) {
              setStatusMessage(
                'Could not resolve a GitHub owner — this repo has no GitHub origin remote.'
              )
              return
            }
            updateRepo(repo.id, { iconSource: 'github-owner', iconUrl: url })
          } finally {
            setResolvingAvatar(false)
          }
          return
        }
        // Why: switching to 'auto' is also when we re-run detection in case
        // the user just dropped a logo into the repo since the initial scan.
        if (next === 'auto') {
          setDetecting(true)
          try {
            const detected = await window.api.repos.detectIcon({ repoId: repo.id })
            if (detected) {
              updateRepo(repo.id, { iconSource: 'auto', iconPath: detected.relativePath })
              setStatusMessage(`Found ${detected.relativePath}`)
            } else {
              updateRepo(repo.id, { iconSource: 'auto', iconPath: undefined })
              setStatusMessage(
                'No icon found in the usual locations. Drop a logo into public/ or assets/, then re-detect.'
              )
            }
          } finally {
            setDetecting(false)
          }
          return
        }
        if (next === 'manual') {
          // Why: clicking "Choose file" is a single intent — pick a file. Open
          // the picker right away rather than making the user perform a
          // second click on Browse. If they cancel, fall back to flipping the
          // source so the input/Browse affordances become visible.
          if (currentSource !== 'manual') {
            const filePath = await window.api.repos.pickIconFile({ repoId: repo.id })
            if (filePath) {
              updateRepo(repo.id, { iconSource: 'manual', iconPath: filePath })
              return
            }
            updateRepo(repo.id, { iconSource: 'manual' })
          }
          return
        }
        updateRepo(repo.id, { iconSource: next })
      } catch (err) {
        console.error('[WorkspaceIconSetting] handleSelectSource failed:', err)
        setStatusMessage(
          `Could not switch source: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    },
    [repo.id, updateRepo, currentSource, apiCheck]
  )

  const commitPathDraft = useCallback(() => {
    const trimmed = pathDraft.trim()
    const next = trimmed || undefined
    if (next === (repo.iconPath ?? undefined)) {
      return
    }
    updateRepo(repo.id, { iconPath: next })
  }, [pathDraft, repo.id, repo.iconPath, updateRepo])

  return (
    <SearchableSetting
      title="Workspace Icon"
      description="Icon shown in the workspace header and sidebar for this repo."
      keywords={[repo.displayName, 'icon', 'logo', 'favicon', 'avatar', 'github', 'image', 'brand']}
      className="space-y-3"
    >
      <Label className="text-sm font-semibold">Workspace Icon</Label>
      {!apiCheck.ok ? (
        // Why: visible diagnostic for the common dev-mode pitfall where the
        // preload bundle wasn't reloaded — without this, every button in the
        // panel silently fails to act.
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
          {apiCheck.reason}
        </div>
      ) : null}
      <div className="flex items-start gap-4">
        {/* Why: live preview at the same size as the canvas header slot so
            the user judges the result in the actual rendering context. */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="flex size-14 items-center justify-center rounded-md border border-border bg-muted/40">
            <WorkspaceIcon repoId={repo.id} sizePx={40} />
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Preview</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SOURCE_OPTIONS.map((option) => {
              const selected = currentSource === option.value
              const isLoading =
                (option.value === 'auto' && detecting) ||
                (option.value === 'github-owner' && resolvingAvatar)
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleSelectSource(option.value)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition-colors',
                    selected
                      ? 'border-foreground/40 bg-accent'
                      : 'border-border bg-background hover:bg-accent/40',
                    isLoading && 'opacity-60'
                  )}
                >
                  <span className="text-xs font-semibold text-foreground">
                    {option.label}
                    {isLoading ? '…' : ''}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {option.description}
                  </span>
                </button>
              )
            })}
          </div>

          {currentSource === 'manual' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Icon file</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={pathDraft}
                  // Why: keep edits in local state so the preview/IPC don't
                  // churn per keystroke. Commit on blur or Enter.
                  onChange={(e) => setPathDraft(e.target.value)}
                  onFocus={() => setPathFocused(true)}
                  onBlur={() => {
                    setPathFocused(false)
                    commitPathDraft()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitPathDraft()
                      ;(e.currentTarget as HTMLInputElement).blur()
                    } else if (e.key === 'Escape') {
                      // Why: Escape discards the in-progress edit so users
                      // can back out of a typo without saving it.
                      setPathDraft(repo.iconPath ?? '')
                      ;(e.currentTarget as HTMLInputElement).blur()
                    }
                  }}
                  placeholder="/absolute/path/to/icon.png or public/logo.svg"
                  className="h-8 text-xs"
                />
                <Button variant="outline" size="sm" onClick={() => void handlePickFile()}>
                  <Folder className="size-3.5" />
                  Browse
                </Button>
              </div>
              {isUnsupportedExtension(pathDraft) ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Unsupported file type. Use{' '}
                  {SUPPORTED_EXTENSIONS.map((ext) => ext.replace(/^\./, '').toUpperCase()).join(
                    ', '
                  )}
                  .
                </p>
              ) : null}
            </div>
          )}

          {currentSource === 'auto' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={detecting}
                onClick={() => void handleSelectSource('auto')}
              >
                <Wand2 className="size-3.5" />
                {detecting ? 'Detecting…' : 'Re-detect'}
              </Button>
              {repo.iconPath ? (
                <span className="text-[11px] text-muted-foreground truncate">
                  Using <span className="text-foreground">{repo.iconPath}</span>
                </span>
              ) : null}
            </div>
          )}

          {currentSource === 'github-owner' && repo.iconUrl ? (
            <a
              href={repo.iconUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" />
              Open avatar source
            </a>
          ) : null}

          {statusMessage ? (
            <p className="text-[11px] text-muted-foreground">{statusMessage}</p>
          ) : null}
        </div>
      </div>
    </SearchableSetting>
  )
}
