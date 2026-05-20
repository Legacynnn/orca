// Why: workspace icons are read from the main process (a filesystem read or
// a GitHub avatar URL lookup) so the renderer can't compute them
// synchronously. Co-locating the fetch + cache here means every consumer
// (canvas header, sidebar card, future settings preview) shares the same
// keyed cache and there is no fan-out of `useEffect` + IPC across the tree.
import { useEffect, useMemo, useState } from 'react'
import { Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRepoById } from '@/store/selectors'
import type { Repo } from '../../../../shared/types'

type IconResolution =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'resolved'; src: string }
  | { status: 'missing' }

// Why: module-scoped cache so two adjacent <WorkspaceIcon /> instances
// pointing at the same repo (e.g. canvas header + sidebar card) only trigger
// one IPC round-trip. Keyed by the full source signature — if the user
// switches from auto to manual, the cache key changes and we re-fetch.
type CacheEntry = { resolution: IconResolution; subscribers: Set<() => void> }
const iconCache = new Map<string, CacheEntry>()

function buildCacheKey(repo: Repo): string {
  const source = repo.iconSource ?? 'auto'
  // Why: include the version of every field the resolver reads so a manual
  // path swap, a github-owner URL refresh, or a "none" toggle all break the
  // cache key — otherwise the renderer would keep showing the stale image.
  return `${repo.id}::${source}::${repo.iconPath ?? ''}::${repo.iconUrl ?? ''}`
}

function notify(entry: CacheEntry): void {
  for (const subscriber of entry.subscribers) {
    subscriber()
  }
}

async function fetchResolution(repo: Repo): Promise<IconResolution> {
  const source = repo.iconSource ?? 'auto'
  if (source === 'none') {
    return { status: 'missing' }
  }
  // Why: github-owner is a remote URL — pass it straight to <img src>
  // instead of base64-encoding bytes through IPC. We still call
  // resolveIcon for parity with the other sources so the renderer logic
  // doesn't have to branch.
  const src = await window.api.repos.resolveIcon({ repoId: repo.id })
  if (!src) {
    return { status: 'missing' }
  }
  return { status: 'resolved', src }
}

function useIconResolution(repo: Repo | null): IconResolution {
  const cacheKey = repo ? buildCacheKey(repo) : null
  const [, force] = useState(0)

  useEffect(() => {
    if (!cacheKey || !repo) {
      return
    }
    let entry = iconCache.get(cacheKey)
    if (!entry) {
      entry = { resolution: { status: 'loading' }, subscribers: new Set() }
      iconCache.set(cacheKey, entry)
      void fetchResolution(repo).then((resolution) => {
        const current = iconCache.get(cacheKey)
        if (!current) {
          return
        }
        current.resolution = resolution
        notify(current)
      })
    }
    const subscriber = (): void => force((n) => n + 1)
    entry.subscribers.add(subscriber)
    return () => {
      const current = iconCache.get(cacheKey)
      if (!current) {
        return
      }
      current.subscribers.delete(subscriber)
    }
  }, [cacheKey, repo])

  if (!cacheKey) {
    return { status: 'idle' }
  }
  return iconCache.get(cacheKey)?.resolution ?? { status: 'loading' }
}

/** Public hook for non-rendering callers (e.g. tab badges that need the
 *  raw URL but render their own `<img>`). */
export function useWorkspaceIconSrc(repoId: string | null): string | null {
  const repo = useRepoById(repoId)
  const resolution = useIconResolution(repo)
  return resolution.status === 'resolved' ? resolution.src : null
}

type WorkspaceIconProps = {
  repoId: string | null
  className?: string
  /** Pixel size used both for the glyph fallback and the inline `<img>`. */
  sizePx: number
  /** Optional accessible label. Default is decorative (`aria-hidden`). */
  alt?: string
  /** Class names applied to the image/glyph itself (rounded corners, etc.). */
  imageClassName?: string
}

/** Shows a per-workspace icon resolved from disk or GitHub, with a
 *  decorative folder glyph as the fallback while loading or when no icon is
 *  available. The component is sized by the consumer through `sizePx` so the
 *  canvas header and the smaller sidebar badge stay pixel-aligned with their
 *  neighbours instead of forcing a single fixed size. */
export function WorkspaceIcon({
  repoId,
  className,
  sizePx,
  alt,
  imageClassName
}: WorkspaceIconProps): React.JSX.Element {
  const repo = useRepoById(repoId)
  const resolution = useIconResolution(repo)
  const style = useMemo(() => ({ width: sizePx, height: sizePx }), [sizePx])
  const ariaHidden = alt === undefined
  // Why: a resolved data URL can still fail to render if the underlying
  // bytes are corrupt, or a GitHub avatar URL can fail to load when offline.
  // Track image errors so we fall back to the folder glyph instead of
  // leaving a broken-image affordance in the UI. Resetting on src change
  // gives the image a fresh chance after the user switches sources.
  const [imageBroken, setImageBroken] = useState(false)
  const resolvedSrc = resolution.status === 'resolved' ? resolution.src : null
  useEffect(() => {
    setImageBroken(false)
  }, [resolvedSrc])

  if (resolvedSrc && !imageBroken) {
    return (
      <span
        aria-hidden={ariaHidden}
        className={cn('inline-flex shrink-0 items-center justify-center', className)}
        style={style}
      >
        <img
          src={resolvedSrc}
          alt={alt ?? ''}
          // Why: `object-contain` keeps wide brand marks readable inside the
          // square slot; `rounded-[2px]` matches the radius of the
          // surrounding chip on the worktree card so a square favicon
          // doesn't look bolted on top.
          className={cn('size-full object-contain rounded-[3px]', imageClassName)}
          draggable={false}
          onError={() => setImageBroken(true)}
        />
      </span>
    )
  }

  // Why: every non-resolved state collapses to the folder glyph. While
  // loading we'd flash the resolved image in moments; flashing a spinner
  // first would be more visually noisy than a brief Folder→logo swap.
  return (
    <span
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : alt}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-muted-foreground',
        className
      )}
      style={style}
    >
      <Folder
        style={{ width: Math.round(sizePx * 0.7), height: Math.round(sizePx * 0.7) }}
        className={imageClassName}
      />
    </span>
  )
}
