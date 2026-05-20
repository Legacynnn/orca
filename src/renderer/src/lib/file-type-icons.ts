/* eslint-disable max-lines -- Why: this module is intentionally a compact filename/extension icon table. */
import {
  Database,
  File,
  FileArchive,
  FileAxis3D,
  FileBox,
  FileBraces,
  FileChartColumn,
  FileCode,
  FileCog,
  FileDiff,
  FileImage,
  FileJson,
  FileKey,
  FileLock,
  FileMusic,
  FileSliders,
  FileSpreadsheet,
  FileTerminal,
  FileText,
  FileType,
  FileVideo,
  type LucideIcon
} from 'lucide-react'
import {
  SiAstro,
  SiC,
  SiCplusplus,
  SiDart,
  SiDotnet,
  SiGo,
  SiJavascript,
  SiKotlin,
  SiLua,
  SiOpenjdk,
  SiPhp,
  SiPython,
  SiReact,
  SiRuby,
  SiRust,
  SiSvelte,
  SiSwift,
  SiTypescript,
  SiVuedotjs
} from 'react-icons/si'
import type { IconType } from 'react-icons'

const FILE_ICON_BY_NAME: Record<string, LucideIcon> = {
  '.babelrc': FileSliders,
  '.dockerignore': FileSliders,
  '.editorconfig': FileSliders,
  '.eslintrc': FileSliders,
  '.eslintrc.cjs': FileSliders,
  '.eslintrc.js': FileSliders,
  '.eslintrc.json': FileJson,
  '.eslintrc.yaml': FileSliders,
  '.eslintrc.yml': FileSliders,
  '.gitattributes': FileSliders,
  '.gitignore': FileSliders,
  '.npmrc': FileSliders,
  '.prettierrc': FileSliders,
  '.prettierrc.json': FileJson,
  '.prettierrc.yaml': FileSliders,
  '.prettierrc.yml': FileSliders,
  'agents.md': FileText,
  authors: FileText,
  'bun.lock': FileBox,
  'bun.lockb': FileBox,
  'cargo.lock': FileBox,
  'cargo.toml': FileBox,
  changelog: FileText,
  'changelog.md': FileText,
  'cmakelists.txt': FileCog,
  codeowners: FileKey,
  'components.json': FileSliders,
  'composer.json': FileBox,
  'composer.lock': FileBox,
  contributing: FileText,
  'contributing.md': FileText,
  copying: FileKey,
  dockerfile: FileCog,
  gemfile: FileBox,
  'go.mod': FileBox,
  'go.sum': FileBox,
  license: FileKey,
  makefile: FileTerminal,
  'meson.build': FileCog,
  notice: FileKey,
  'package-lock.json': FileBox,
  'package.json': FileBox,
  pipfile: FileBox,
  'pnpm-lock.yaml': FileBox,
  'pnpm-workspace.yaml': FileBox,
  'poetry.lock': FileBox,
  'pom.xml': FileBox,
  'postcss.config.cjs': FileSliders,
  'postcss.config.js': FileSliders,
  'postcss.config.mjs': FileSliders,
  'postcss.config.ts': FileSliders,
  'pyproject.toml': FileBox,
  readme: FileText,
  'readme.md': FileText,
  'requirements-dev.txt': FileBox,
  'requirements.txt': FileBox,
  security: FileLock,
  'security.md': FileLock,
  'settings.gradle': FileCog,
  'settings.gradle.kts': FileCog,
  'tailwind.config.cjs': FileSliders,
  'tailwind.config.js': FileSliders,
  'tailwind.config.mjs': FileSliders,
  'tailwind.config.ts': FileSliders,
  todo: FileText,
  'tsconfig.json': FileSliders,
  'vite.config.js': FileSliders,
  'vite.config.mjs': FileSliders,
  'vite.config.ts': FileSliders,
  'vitest.config.js': FileSliders,
  'vitest.config.mjs': FileSliders,
  'vitest.config.ts': FileSliders,
  'yarn.lock': FileBox
}

const FILE_ICON_BY_EXTENSION: Record<string, LucideIcon> = {
  '7z': FileArchive,
  aac: FileMusic,
  adoc: FileText,
  ai: FileImage,
  asc: FileKey,
  astro: FileCode,
  avi: FileVideo,
  avif: FileImage,
  bash: FileTerminal,
  bat: FileTerminal,
  blend: FileAxis3D,
  bmp: FileImage,
  br: FileArchive,
  bz2: FileArchive,
  c: FileCode,
  cc: FileCode,
  cer: FileKey,
  cfg: FileSliders,
  cjs: FileCode,
  clj: FileCode,
  cmd: FileTerminal,
  conf: FileSliders,
  cpp: FileCode,
  crt: FileKey,
  cs: FileCode,
  css: FileType,
  csv: FileSpreadsheet,
  cts: FileCode,
  cxx: FileCode,
  dart: FileCode,
  db: Database,
  diff: FileDiff,
  dmg: FileArchive,
  doc: FileText,
  docx: FileText,
  duckdb: Database,
  eot: FileType,
  eps: FileImage,
  erl: FileCode,
  ex: FileCode,
  exs: FileCode,
  fbx: FileAxis3D,
  fish: FileTerminal,
  flac: FileMusic,
  fs: FileCode,
  fsx: FileCode,
  gif: FileImage,
  glb: FileAxis3D,
  gltf: FileAxis3D,
  go: FileCode,
  gpg: FileKey,
  gql: FileBraces,
  gradle: FileCog,
  graphql: FileBraces,
  gz: FileArchive,
  h: FileCode,
  hcl: FileSliders,
  heic: FileImage,
  hpp: FileCode,
  hrl: FileCode,
  hs: FileCode,
  htm: FileCode,
  html: FileCode,
  ico: FileImage,
  ini: FileSliders,
  ipynb: FileChartColumn,
  iso: FileArchive,
  java: FileCode,
  jpeg: FileImage,
  jpg: FileImage,
  js: FileCode,
  json: FileJson,
  json5: FileJson,
  jsonc: FileJson,
  jsx: FileCode,
  key: FileKey,
  kt: FileCode,
  kts: FileCode,
  less: FileType,
  lock: FileLock,
  log: FileText,
  lua: FileCode,
  m4a: FileMusic,
  m4v: FileVideo,
  md: FileText,
  mdx: FileText,
  mjs: FileCode,
  mkv: FileVideo,
  mmd: FileChartColumn,
  mov: FileVideo,
  mp3: FileMusic,
  mp4: FileVideo,
  mpeg: FileVideo,
  mpg: FileVideo,
  mts: FileCode,
  nim: FileCode,
  nu: FileTerminal,
  obj: FileAxis3D,
  ods: FileSpreadsheet,
  ogg: FileMusic,
  opus: FileMusic,
  otf: FileType,
  p12: FileLock,
  patch: FileDiff,
  pdf: FileText,
  pem: FileKey,
  pfx: FileLock,
  php: FileCode,
  pl: FileCode,
  pm: FileCode,
  png: FileImage,
  ppt: FileChartColumn,
  pptx: FileChartColumn,
  prisma: Database,
  properties: FileSliders,
  proto: FileBraces,
  ps1: FileTerminal,
  psd: FileImage,
  pub: FileKey,
  py: FileCode,
  r: FileCode,
  rar: FileArchive,
  rb: FileCode,
  rst: FileText,
  rs: FileCode,
  rtf: FileText,
  sass: FileType,
  scala: FileCode,
  scss: FileType,
  sh: FileTerminal,
  sol: FileCode,
  sqlite: Database,
  sqlite3: Database,
  sql: Database,
  stl: FileAxis3D,
  svelte: FileCode,
  svg: FileImage,
  swift: FileCode,
  tar: FileArchive,
  'tar.bz2': FileArchive,
  'tar.gz': FileArchive,
  'tar.xz': FileArchive,
  tbz2: FileArchive,
  tex: FileText,
  tf: FileSliders,
  tfvars: FileSliders,
  tgz: FileArchive,
  tif: FileImage,
  tiff: FileImage,
  toml: FileSliders,
  ts: FileCode,
  tsx: FileCode,
  tsv: FileSpreadsheet,
  ttf: FileType,
  txt: FileText,
  txz: FileArchive,
  vb: FileCode,
  vue: FileCode,
  wav: FileMusic,
  webm: FileVideo,
  webp: FileImage,
  woff: FileType,
  woff2: FileType,
  xhtml: FileCode,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  xml: FileCode,
  xz: FileArchive,
  yaml: FileSliders,
  yml: FileSliders,
  zig: FileCode,
  zip: FileArchive,
  zsh: FileTerminal
}

/**
 * Both Lucide and react-icons components accept `className` + render with
 * `currentColor` by default, so callers can style them identically.
 */
export type FileIconComponent = LucideIcon | IconType

export type FileIconSpec = {
  Icon: FileIconComponent
  isTest: boolean
}

const LANGUAGE_ICON_BY_EXTENSION: Record<string, FileIconComponent> = {
  astro: SiAstro,
  c: SiC,
  cc: SiCplusplus,
  cjs: SiJavascript,
  cpp: SiCplusplus,
  cs: SiDotnet,
  cts: SiTypescript,
  cxx: SiCplusplus,
  dart: SiDart,
  go: SiGo,
  h: SiC,
  hpp: SiCplusplus,
  hxx: SiCplusplus,
  java: SiOpenjdk,
  js: SiJavascript,
  jsx: SiReact,
  kt: SiKotlin,
  kts: SiKotlin,
  lua: SiLua,
  mjs: SiJavascript,
  mts: SiTypescript,
  php: SiPhp,
  py: SiPython,
  rb: SiRuby,
  rs: SiRust,
  svelte: SiSvelte,
  swift: SiSwift,
  ts: SiTypescript,
  tsx: SiTypescript,
  vue: SiVuedotjs
}

const COMPOUND_EXTENSIONS = ['tar.bz2', 'tar.gz', 'tar.xz']

function getFilename(filePath: string): string {
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath
}

const TEST_PATTERNS: RegExp[] = [
  // JS/TS: foo.test.ts, foo.spec.tsx, etc.
  /\.(test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/i,
  // Go: handler_test.go
  /_test\.go$/i,
  // Rust: foo_test.rs
  /_test\.rs$/i,
  // Python: test_foo.py or foo_test.py
  /(?:^|\/|\\)test_[^/\\]+\.py$/i,
  /_test\.py$/i,
  // Ruby: foo_test.rb or foo_spec.rb
  /_(?:test|spec)\.rb$/i,
  // Java: HandlerTest.java / HandlerTests.java / HandlerTestCase.java
  /(?:Test|Tests|TestCase)\.java$/
]

export function isTestFile(filePath: string): boolean {
  const filename = getFilename(filePath)
  return TEST_PATTERNS.some((pattern) => pattern.test(filename))
}

function getExtension(filename: string): string {
  const lowerName = filename.toLowerCase()
  const compoundExtension = COMPOUND_EXTENSIONS.find((ext) => lowerName.endsWith(`.${ext}`))
  if (compoundExtension) {
    return compoundExtension
  }

  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return ''
  }

  return filename.slice(lastDot + 1).toLowerCase()
}

function resolveIconComponent(filePath: string): FileIconComponent {
  const filename = getFilename(filePath)
  const lowerName = filename.toLowerCase()

  const exactMatch = FILE_ICON_BY_NAME[lowerName]
  if (exactMatch) {
    return exactMatch
  }

  if (lowerName === '.env' || lowerName.startsWith('.env.')) {
    return FileLock
  }

  if (lowerName === 'dockerfile' || lowerName.startsWith('dockerfile.')) {
    return FileCog
  }

  if (lowerName === 'makefile' || lowerName.startsWith('makefile.')) {
    return FileTerminal
  }

  const extension = getExtension(filename)
  // Language brand marks beat the generic FileCode when both apply.
  // Why: filename/extension matching keeps icons deterministic for SSH worktrees
  // where OS-native file associations are not available.
  return LANGUAGE_ICON_BY_EXTENSION[extension] ?? FILE_ICON_BY_EXTENSION[extension] ?? File
}

export function getFileIconSpec(filePath: string): FileIconSpec {
  return {
    Icon: resolveIconComponent(filePath),
    isTest: isTestFile(filePath)
  }
}

/**
 * Returns just the icon component for callers that don't need the test-file
 * flag. New code should prefer getFileIconSpec.
 */
export function getFileTypeIcon(filePath: string): FileIconComponent {
  return resolveIconComponent(filePath)
}
