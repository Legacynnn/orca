import { Code } from 'lucide-react'

// Why: brand-accurate glyphs are used for editors users recognize by their
// logo (VS Code blue silhouette, Xcode hammer-monogram, Kiro purple tile).
// Outline-style marks (Cursor, Zed) render in `currentColor` so they adapt to
// light/dark mode — their official assets are designed for dark backgrounds
// and would disappear against a light-mode `bg-card`. The remaining
// silhouettes for less-iconic editors stay monochrome to avoid pulling the
// eye away from the primary action.

type IconProps = {
  className?: string
}

function VSCodeIcon({ className }: IconProps): React.JSX.Element {
  // Why: the full VS Code mark layers four blue paths plus filters and a
  // gradient. At 14px those layers collapse into a flat blue silhouette, so
  // render the silhouette directly in the brand mid-blue (#007ACC). Avoids
  // SVG id collisions when the icon appears more than once on screen
  // (selected button + dropdown items).
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        fill="#007ACC"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M70.912 99.317a6.223 6.223 0 0 0 4.96-.19l20.589-9.907A6.25 6.25 0 0 0 100 83.587V16.413a6.25 6.25 0 0 0-3.54-5.632L75.874.874a6.226 6.226 0 0 0-7.104 1.21L29.355 38.04 12.187 25.01a4.162 4.162 0 0 0-5.318.236l-5.506 5.009a4.168 4.168 0 0 0-.004 6.162L16.247 50 1.36 63.583a4.168 4.168 0 0 0 .004 6.162l5.506 5.01a4.162 4.162 0 0 0 5.318.236l17.168-13.032L68.77 97.917a6.217 6.217 0 0 0 2.143 1.4ZM75.015 27.3 45.11 50l29.906 22.701V27.3Z"
      />
    </svg>
  )
}

function CursorIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 466.73 532.09" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"
      />
    </svg>
  )
}

function ZedIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 6a3 3 0 0 0-3 3v66H0V9a9 9 0 0 1 9-9h80.379c4.009 0 6.016 4.847 3.182 7.682L43.055 57.187H57V51h6v7.688a4.5 4.5 0 0 1-4.5 4.5H37.055L26.743 73.5H73.5V36h6v37.5a6 6 0 0 1-6 6H20.743L10.243 90H87a3 3 0 0 0 3-3V21h6v66a9 9 0 0 1-9 9H6.621c-4.009 0-6.016-4.847-3.182-7.682L52.757 39H39v6h-6v-7.5a4.5 4.5 0 0 1 4.5-4.5h21.257l10.5-10.5H22.5V60h-6V22.5a6 6 0 0 1 6-6h52.757L85.757 6H9Z"
      />
    </svg>
  )
}

function XcodeIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#147EFB"
        d="M19.06 5.3327c.4517-.1936.7744-.2581 1.097-.1936.5163.1291.7744.5163.968.7098.1936.3872.9034.7744 1.2261.8389.2581.0645.7098-.6453 1.0325-1.2906.3227-.5808.5163-1.3552.4517-1.5488-.0645-.1936-.968-.5808-1.1616-.5808-.1291 0-.3872.1291-.8389.0645-.4517-.0645-.9034-.5808-1.1616-.968-.4517-.6453-1.097-1.0325-1.6778-1.3552-.6453-.3227-1.3552-.5163-2.065-.6453-1.0325-.2581-2.065-.4517-3.0975-.3227-.5808.0645-1.2906.1291-1.8069.3227-.0645 0-.1936.1936-.0645.1936s.5808.0645.5808.0645-.5807.1292-.5807.2583c0 .1291.0645.1291.1291.1291.0645 0 1.4842-.0645 2.065 0 .6453.1291 1.3552.4517 1.8069 1.2261.7744 1.4197.4517 2.7749.2581 3.2266-.968 2.1295-8.6472 15.2294-9.0344 16.1328-.3873.9034-.5163 1.4842.5807 2.065s1.6778.3227 2.0005-.0645c.3872-.5163 7.0339-17.1654 9.2925-18.2624zm-3.6138 8.7117h1.5488c1.0325 0 1.2261.5163 1.2261.7098.0645.5163-.1936 1.1616-1.2261 1.1616h-.968l.7744 1.2906c.4517.7744.2581 1.1616 0 1.4197-.3872.3872-1.2261.3872-1.6778-.4517l-.9034-1.5488c-.6453 1.4197-1.2906 2.9684-2.065 4.7753h4.0009c1.9359 0 3.5492-1.6133 3.5492-3.5492V6.5588c-.0645-.1291-.1936-.0645-.2581 0-.3872.4517-1.4842 2.0004-4.001 7.4856zm-9.8087 8.0019h-.3227c-2.3231 0-4.1945-1.8714-4.1945-4.1945V7.0105c0-2.3231 1.8714-4.1945 4.1945-4.1945h9.3571c-.1936-.1936-.968-.5163-1.7423-.4517-.3227 0-.968.1291-1.3552-.1291-.3872-.3227-.3227-.5163-.9034-.5163H4.9277c-2.6458 0-4.7753 2.1295-4.7753 4.7753v11.7447c0 2.6458 2.1295 4.7753 4.4527 4.7108.6452 0 .8388-.5162 1.0324-.9034zM20.4152 6.9459v10.9058c0 2.3231-1.8714 4.1945-4.1945 4.1945H11.897s-.3872 1.0325.8389 1.0325h3.8719c2.6458 0 4.7753-2.1295 4.7753-4.7753V8.8173c.0646-.9034-.7098-1.4842-.9679-1.8714zm-18.5851.0646v10.8413c0 1.9359 1.6133 3.5492 3.5492 3.5492h.5808c0-.0645.7744-1.4197 2.4522-4.2591.1936-.3872.4517-.7744.7098-1.2261H4.4114c-.5808 0-.9034-.3872-.968-.7098-.1291-.5163.1936-1.1616.9034-1.1616h2.3877l3.033-5.2916s-.7098-1.2906-.9034-1.6133c-.2582-.4517-.1291-.9034.129-1.1615.3872-.3872 1.0325-.5808 1.6778.4517l.2581.3872.2581-.3872c.5808-.8389.968-.7744 1.2906-.7098.5163.1291.8389.7098.3872 1.6133L8.864 14.0444h1.3552c.4517-.7744.9034-1.5488 1.3552-2.3877-.0645-.3227-.1291-.7098-.0645-1.0325.0645-.5163.3227-.968.6453-1.3552l.3872.6453c1.2261-2.1295 2.1295-3.9364 2.3877-4.6463.1291-.3872.3227-1.1616.1291-1.8069H5.3794c-2.0005.0001-3.5493 1.6134-3.5493 3.5494zM4.605 17.7872c0-.0645.7744-1.4197.7744-1.4197 1.2261-.3227 1.8069.4517 1.8714.5163 0 0-.8389 1.4842-1.097 1.7423s-.5808.3227-.9034.2581c-.5164-.129-.839-.6453-.6454-1.097z"
      />
    </svg>
  )
}

function KiroIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden>
      <path
        fill="#993FF5"
        d="m200.1 0h-144.2c-30.77 0-55.81 26.13-55.81 55.81v144.1c0 30.84 25.08 56 55.81 56h144.1c30.92 0 56-25.08 56-55.93v-144.2c0-29.68-24.42-55.81-55.87-55.81z"
      />
      <path
        fill="#FEFFFE"
        d="m195.9 107.8c-2.84-27.64-18.85-62.98-60.73-64.4h-3.09c-29.9 0-52.18 21.88-56.84 52.31-2.68 9.26-2.46 20.79-4.86 35.12-2.48 14.9-7.38 20.23-10.77 28.96-1.88 5.11-1.19 17.58 10.84 18.65 6.63 0.59 14.92-2.78 15.03-3.96-2.25 4.59-5.08 12.84-4.78 19.82 0.6 11.64 8.71 17.78 21.25 17.78 14.07 0 24.1-8.4 30.32-12.14 3.01 7.78 6.93 12.14 14.41 12.14 13.02 0 27.47-13.13 33.84-23.58 11.19-19.55 18.26-42.4 16.17-71.32-0.08-2.87-0.35-6.08-0.79-9.38z"
      />
      <path
        fill="#010202"
        d="m135.1 90.55c-7.28-0.54-7.85 8.36-7.85 14.05 0 6.08 1.6 13.14 7.96 13.14 6.6 0 8.92-8.08 8.92-13.14 0-5.56-1.59-14.05-9.03-14.05z"
      />
      <path
        fill="#010202"
        d="m164.4 90.55c-7.27-0.54-8.66 7.59-8.66 14.05 0 5.82 1.51 13.14 8.07 13.14 7.38 0 8.83-9.57 8.83-13.14 0-5.89-2.01-14.05-8.24-14.05z"
      />
    </svg>
  )
}

function SublimeIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.5 3.6 12 6v3.6l7.5-2.4V3.6ZM4.5 10.4v3.6L12 16.4v-3.6L4.5 10.4Zm0 6.4 7.5 2.4v-3.6L4.5 13.2v3.6ZM12 12.8l7.5 2.4v-3.6L12 9.2v3.6Z" />
    </svg>
  )
}

function WindsurfIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M2 13.5c3.5-5 7-5.5 10.5-1.5C15 8.5 18 7.5 22 9.5v3c-4-2-7-1-9 2-2.5-3.5-6-3-11 1v-2Zm0 5.5c3.5-5 7-5.5 10.5-1.5C15 14 18 13 22 15v3c-4-2-7-1-9 2-2.5-3.5-6-3-11 1v-2Z" />
    </svg>
  )
}

function FleetIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2 22 12 12 22 2 12 12 2Zm0 3.4L5.4 12 12 18.6 18.6 12 12 5.4Z" />
    </svg>
  )
}

function JetBrainsIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 3h18v18H3V3Zm2 2v14h14V5H5Zm2 12h7v1.5H7V17Zm.5-9.5h3v1.4H9v5.6H7.5V7.5Z" />
    </svg>
  )
}

function NeovimIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 6 9 2v20l-6-4V6Zm12 16-6-4V2l6 4v16Z" />
    </svg>
  )
}

function AtlasIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2 2 21h4l1.6-3h8.8L18 21h4L12 2Zm-2.7 12L12 7.8 14.7 14H9.3Z" />
    </svg>
  )
}

type EditorIconKey =
  | 'vscode'
  | 'cursor'
  | 'zed'
  | 'xcode'
  | 'kiro'
  | 'sublime'
  | 'windsurf'
  | 'fleet'
  | 'jetbrains'
  | 'neovim'
  | 'atlas'

// Why: matches the renderer-side preferred id (e.g. our hardcoded 'vscode')
// AND the user-supplied shell command, so an entry like
// `{ id: 'editor-7', command: '/usr/local/bin/zed' }` still resolves to the
// Zed glyph. Patterns are word-bounded to avoid partial matches like
// 'sublime' inside an unrelated path segment. Cursor is listed before VS Code
// because `cursor` is a Cursor-fork CLI; the VS Code pattern would also catch
// `code` which Cursor doesn't ship.
const EDITOR_PATTERNS: { key: EditorIconKey; pattern: RegExp }[] = [
  { key: 'cursor', pattern: /\bcursor\b/ },
  { key: 'vscode', pattern: /\b(vscode|vs-code|code|code-insiders)\b/ },
  { key: 'zed', pattern: /\bzed\b/ },
  { key: 'xcode', pattern: /\bxcode\b/ },
  { key: 'kiro', pattern: /\bkiro\b/ },
  { key: 'sublime', pattern: /\bsubl(ime)?\b/ },
  { key: 'windsurf', pattern: /\bwindsurf\b/ },
  { key: 'fleet', pattern: /\bfleet\b/ },
  { key: 'atlas', pattern: /\batlas\b/ },
  { key: 'neovim', pattern: /\b(nvim|neovim|vim)\b/ },
  {
    key: 'jetbrains',
    pattern: /\b(webstorm|pycharm|idea|phpstorm|rubymine|goland|clion|rider|datagrip|jetbrains)\b/
  }
]

export function resolveEditorIconKey(id: string, command?: string): EditorIconKey | null {
  const haystack = `${id} ${command ?? ''}`.toLowerCase()
  for (const { key, pattern } of EDITOR_PATTERNS) {
    if (pattern.test(haystack)) {
      return key
    }
  }
  return null
}

const ICON_BY_KEY: Record<EditorIconKey, (props: IconProps) => React.JSX.Element> = {
  vscode: VSCodeIcon,
  cursor: CursorIcon,
  zed: ZedIcon,
  xcode: XcodeIcon,
  kiro: KiroIcon,
  sublime: SublimeIcon,
  windsurf: WindsurfIcon,
  fleet: FleetIcon,
  jetbrains: JetBrainsIcon,
  neovim: NeovimIcon,
  atlas: AtlasIcon
}

export function EditorIcon({
  id,
  command,
  className
}: {
  id: string
  command?: string
  className?: string
}): React.JSX.Element {
  const key = resolveEditorIconKey(id, command)
  if (!key) {
    return <Code className={className} aria-hidden />
  }
  const Component = ICON_BY_KEY[key]
  return <Component className={className} />
}
