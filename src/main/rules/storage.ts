import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildRuleMarkdown,
  slugifyRuleName,
  type Rule,
  type RuleSummary
} from '../../shared/rule-metadata'
import { listRules, readRuleBySlug, RULE_FILE_NAME } from './discovery'

export type RuleInput = {
  name: string
  description?: string | null
  body: string
}

export type WriteRuleResult = {
  rule: Rule
  rules: RuleSummary[]
}

async function ensureUniqueSlug(
  rootDir: string,
  base: string,
  ignoreSlug?: string
): Promise<string> {
  const existing = new Set((await listRules(rootDir)).map((rule) => rule.slug))
  if (ignoreSlug) {
    existing.delete(ignoreSlug)
  }
  if (!existing.has(base)) {
    return base
  }
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`
    if (!existing.has(candidate)) {
      return candidate
    }
  }
  throw new Error('Could not allocate a unique slug for rule')
}

export async function createRule(rootDir: string, input: RuleInput): Promise<WriteRuleResult> {
  const trimmedName = input.name.trim()
  if (!trimmedName) {
    throw new Error('Rule name is required')
  }
  if (!input.body.trim()) {
    throw new Error('Rule body is required')
  }
  const baseSlug = slugifyRuleName(trimmedName)
  const slug = await ensureUniqueSlug(rootDir, baseSlug)
  const now = Date.now()
  const markdown = buildRuleMarkdown({
    name: trimmedName,
    description: input.description ?? null,
    body: input.body,
    createdAt: now
  })
  const directoryPath = join(rootDir, slug)
  await mkdir(directoryPath, { recursive: true })
  await writeFile(join(directoryPath, RULE_FILE_NAME), markdown, 'utf8')
  const rule = await readRuleBySlug(rootDir, slug)
  if (!rule) {
    throw new Error('Failed to read back newly created rule')
  }
  return { rule, rules: await listRules(rootDir) }
}

export async function updateRule(
  rootDir: string,
  slug: string,
  input: RuleInput
): Promise<WriteRuleResult> {
  const existing = await readRuleBySlug(rootDir, slug)
  if (!existing) {
    throw new Error(`Rule not found: ${slug}`)
  }
  const trimmedName = input.name.trim()
  if (!trimmedName) {
    throw new Error('Rule name is required')
  }
  if (!input.body.trim()) {
    throw new Error('Rule body is required')
  }
  const markdown = buildRuleMarkdown({
    name: trimmedName,
    description: input.description ?? null,
    body: input.body,
    createdAt: existing.createdAt ?? Date.now()
  })
  const directoryPath = join(rootDir, slug)
  await mkdir(directoryPath, { recursive: true })
  await writeFile(join(directoryPath, RULE_FILE_NAME), markdown, 'utf8')
  const rule = await readRuleBySlug(rootDir, slug)
  if (!rule) {
    throw new Error('Failed to read back updated rule')
  }
  return { rule, rules: await listRules(rootDir) }
}

export async function deleteRule(rootDir: string, slug: string): Promise<RuleSummary[]> {
  const directoryPath = join(rootDir, slug)
  await rm(directoryPath, { recursive: true, force: true })
  return listRules(rootDir)
}
