// Why: a workspace icon comes from one of three orthogonal sources (filesystem
// scan, manual path, GitHub owner avatar). Centralizing the well-known
// candidate paths and extension precedence here keeps the rules in one place,
// instead of inlining them inside the IPC handler.
import { access, readdir, stat } from 'fs/promises'
import { join, isAbsolute, extname, sep } from 'path'

// Why: directories searched, in priority order. Empty string = repo root.
// Earlier entries beat later ones, so a root-level `logo.svg` wins over a
// `public/logo.svg`. Ordering aims to surface the file the author put the
// most thought into first.
const LOOKUP_DIRS: readonly string[] = [
  '',
  'public',
  'app',
  'static',
  'assets',
  'src/assets',
  'web',
  'resources'
]

// Why: name stems we accept. A file matches if its basename (sans extension)
// equals one of these OR starts with one followed by a `-`, `_`, `.`, or a
// digit. That picks up `logo`, `logo-dark`, `logo_white`, `logo.2x`, `icon-512`
// — but does NOT match `logout.svg`, `iconography.png`, `faviconize.svg`,
// which would all be false positives. Ordered by intent: a project that ships
// both `logo.svg` and `favicon.svg` almost always wants the logo shown in
// the header.
const NAME_STEMS: readonly string[] = ['logo', 'icon', 'favicon', 'apple-touch-icon']

// Why: extension priority. SVG renders crisply at the small sizes used in
// the canvas header and sidebar; PNG/WEBP are the modern raster defaults;
// JPG and GIF are rare-but-possible; ICO is the legacy fallback.
const EXT_PRIORITY: readonly string[] = ['.svg', '.png', '.webp', '.jpg', '.jpeg', '.gif', '.ico']

export const SUPPORTED_ICON_EXTENSIONS: readonly string[] = EXT_PRIORITY

const STEM_BOUNDARY_REGEX = /^[-_.\d]/

function matchStem(filename: string): { stemIndex: number; ext: string; exact: boolean } | null {
  const ext = extname(filename).toLowerCase()
  if (!EXT_PRIORITY.includes(ext)) {
    return null
  }
  const stem = filename.slice(0, filename.length - ext.length).toLowerCase()
  for (let i = 0; i < NAME_STEMS.length; i++) {
    const candidate = NAME_STEMS[i]
    if (candidate === undefined) {
      continue
    }
    if (stem === candidate) {
      return { stemIndex: i, ext, exact: true }
    }
    if (stem.startsWith(candidate) && STEM_BOUNDARY_REGEX.test(stem.slice(candidate.length))) {
      return { stemIndex: i, ext, exact: false }
    }
  }
  return null
}

// Why: cap before we read into memory and stringify as base64 — a 1MB raster
// becomes ~1.4MB across IPC, and the workspace icon is rendered at 14–20px
// anyway, so an oversized source is a footgun rather than a feature.
export const MAX_ICON_BYTES = 512 * 1024

export type DetectedIcon = {
  /** Repo-relative path to the discovered icon. Stored relative so moving the
   *  repo root (rare but possible on macOS/Windows reorganizations) doesn't
   *  silently invalidate the cached value. */
  relativePath: string
}

type Candidate = {
  relativePath: string
  dirIndex: number
  stemIndex: number
  extIndex: number
  exact: boolean
  size: number
}

function scoreCandidate(c: Candidate): number {
  // Why: dirIndex dominates so root logos beat any nested file; stemIndex
  // breaks ties within a dir (logo > icon > favicon > apple-touch-icon);
  // exactness is next so `logo.svg` beats `logo-dark.svg` deterministically;
  // extIndex is the finest tie-breaker so we prefer SVG over PNG for the
  // same name.
  return c.dirIndex * 100_000 + c.stemIndex * 1_000 + (c.exact ? 0 : 100) + c.extIndex
}

/** Scans well-known directories under `repoPath` for files whose names match
 *  brand stems (logo, icon, favicon) and supported image extensions. Returns
 *  the highest-priority match, or `null` if nothing qualifies.
 *
 *  Why glob-style instead of an exact path list: real projects ship files
 *  like `public/logo-dark.svg` or `assets/icon-512.png`. An exact list would
 *  miss them and surface the folder glyph for repos that have a perfectly
 *  good brand mark a hyphen away from the expected name. */
export async function detectWorkspaceIcon(repoPath: string): Promise<DetectedIcon | null> {
  let best: Candidate | null = null
  for (let dirIndex = 0; dirIndex < LOOKUP_DIRS.length; dirIndex++) {
    const dir = LOOKUP_DIRS[dirIndex]
    if (dir === undefined) {
      continue
    }
    const absoluteDir = dir ? join(repoPath, dir) : repoPath
    let entries: string[]
    try {
      entries = await readdir(absoluteDir)
    } catch {
      // Missing/inaccessible directory is the expected case for most
      // candidates. Move on silently instead of accumulating noise.
      continue
    }
    for (const entry of entries) {
      const match = matchStem(entry)
      if (!match) {
        continue
      }
      const extIndex = EXT_PRIORITY.indexOf(match.ext)
      const absolute = join(absoluteDir, entry)
      let size: number
      try {
        const info = await stat(absolute)
        if (!info.isFile() || info.size <= 0 || info.size > MAX_ICON_BYTES) {
          continue
        }
        size = info.size
      } catch {
        continue
      }
      // Why: store the path relative to the repo with forward slashes so it
      // round-trips cleanly through JSON/IPC and is portable across OSes.
      const relativePath = dir ? `${dir}/${entry}` : entry
      const candidate: Candidate = {
        relativePath: relativePath.split(sep).join('/'),
        dirIndex,
        stemIndex: match.stemIndex,
        extIndex,
        exact: match.exact,
        size
      }
      if (!best || scoreCandidate(candidate) < scoreCandidate(best)) {
        best = candidate
      }
    }
  }
  return best ? { relativePath: best.relativePath } : null
}

/** Legacy exact-path probe kept for callers that want to verify a manually
 *  configured `iconPath` still resolves to a readable file. The renderer uses
 *  `resolveIcon` for the same purpose; this helper is exported so future
 *  diagnostics or migrations can run without re-implementing the size guard. */
export async function probeIconAtPath(absolutePath: string): Promise<boolean> {
  try {
    await access(absolutePath)
    const info = await stat(absolutePath)
    return info.isFile() && info.size > 0 && info.size <= MAX_ICON_BYTES
  } catch {
    return false
  }
}

/** Resolves an `iconPath` value (which may be absolute or relative) against a
 *  repo's root. Centralized so the renderer never has to know whether the
 *  stored path is anchored to the repo or to the filesystem. */
export function resolveIconAbsolutePath(repoPath: string, iconPath: string): string {
  return isAbsolute(iconPath) ? iconPath : join(repoPath, iconPath)
}

/** Maps a file extension to a MIME type for the `data:` URL the renderer
 *  consumes. Returns `null` for extensions outside the supported allowlist so
 *  callers can refuse to inline arbitrary blobs. */
export function iconMimeType(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase()
  switch (ext) {
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.ico':
      return 'image/x-icon'
    default:
      return null
  }
}
