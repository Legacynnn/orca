import type { Dirent } from 'node:fs'
import { app } from 'electron'
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SEED_MARKER_FILENAME = '.serper-rules-seeded'

async function pathExists(pathValue: string): Promise<boolean> {
  try {
    await stat(pathValue)
    return true
  } catch {
    return false
  }
}

function resolveBundledRulesDir(): string[] {
  // Why: in production the resources tree is at `process.resourcesPath`
  // because electron-builder unpacks resources/** outside app.asar. In dev
  // (electron-vite) `app.getAppPath()` points at the project root. Try the
  // packaged path first, then fall back to the repo path so the seed works
  // in both environments.
  const candidates = [
    join(process.resourcesPath, 'rules'),
    join(app.getAppPath(), 'resources', 'rules')
  ]
  return candidates
}

async function findFirstExistingDir(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }
  return null
}

async function copyRuleFolder(sourceDir: string, destDir: string): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true })
  await mkdir(destDir, { recursive: true })
  for (const entry of entries) {
    if (entry.isFile()) {
      const sourcePath = join(sourceDir, entry.name)
      const destPath = join(destDir, entry.name)
      // Why: do not overwrite if the user already edited a same-named rule
      // file in this folder.
      if (await pathExists(destPath)) {
        continue
      }
      await copyFile(sourcePath, destPath)
    }
  }
}

export async function seedDefaultRulesIfNeeded(rulesRoot: string): Promise<void> {
  const markerPath = join(rulesRoot, SEED_MARKER_FILENAME)
  if (await pathExists(markerPath)) {
    return
  }
  await mkdir(rulesRoot, { recursive: true })

  const bundledRoot = await findFirstExistingDir(resolveBundledRulesDir())
  if (!bundledRoot) {
    await writeFile(markerPath, '', 'utf8')
    return
  }

  let entries: Dirent[]
  try {
    entries = await readdir(bundledRoot, { withFileTypes: true })
  } catch {
    await writeFile(markerPath, '', 'utf8')
    return
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const sourceDir = join(bundledRoot, entry.name)
    const destDir = join(rulesRoot, entry.name)
    if (await pathExists(destDir)) {
      continue
    }
    try {
      await copyRuleFolder(sourceDir, destDir)
    } catch {
      // Best-effort: one failed copy should not block the rest of the seed.
    }
  }

  await writeFile(markerPath, '', 'utf8')
}
