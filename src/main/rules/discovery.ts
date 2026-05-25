import type { Dirent } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { extractCreatedAt, parseRuleMarkdown } from '../../shared/rule-metadata'
import type { Rule, RuleSummary } from '../../shared/rule-metadata'

export const RULE_FILE_NAME = 'RULE.md'
const MAX_RULE_BYTES = 256 * 1024

async function pathExists(pathValue: string): Promise<boolean> {
  try {
    await stat(pathValue)
    return true
  } catch {
    return false
  }
}

export async function readRuleBySlug(rootDir: string, slug: string): Promise<Rule | null> {
  const directoryPath = join(rootDir, slug)
  const filePath = join(directoryPath, RULE_FILE_NAME)
  try {
    const fileStat = await stat(filePath)
    if (fileStat.size > MAX_RULE_BYTES) {
      return null
    }
    const raw = await readFile(filePath, 'utf8')
    const parsed = parseRuleMarkdown(raw)
    return {
      id: slug,
      slug,
      name: parsed.name?.trim() || slug,
      description: parsed.description,
      body: parsed.body,
      filePath,
      createdAt: extractCreatedAt(raw),
      updatedAt: fileStat.mtimeMs
    }
  } catch {
    return null
  }
}

export async function listRules(rootDir: string): Promise<RuleSummary[]> {
  if (!(await pathExists(rootDir))) {
    return []
  }
  let entries: Dirent[]
  try {
    entries = await readdir(rootDir, { withFileTypes: true })
  } catch {
    return []
  }
  const rules: RuleSummary[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const rule = await readRuleBySlug(rootDir, entry.name)
    if (!rule) {
      continue
    }
    const { body: _body, ...summary } = rule
    rules.push(summary)
  }
  rules.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return rules
}
