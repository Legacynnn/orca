import { summarizeSkillMarkdown } from './skill-metadata'

export type Rule = {
  id: string
  slug: string
  name: string
  description: string | null
  body: string
  filePath: string
  createdAt: number | null
  updatedAt: number | null
}

export type RuleSummary = Omit<Rule, 'body'>

export type ParsedRule = {
  name: string | null
  description: string | null
  body: string
}

export function parseRuleMarkdown(markdown: string): ParsedRule {
  const normalized = markdown.replace(/^﻿/, '')
  const frontmatterMatch = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(normalized)
  const body = frontmatterMatch ? normalized.slice(frontmatterMatch[0].length) : normalized
  const summary = summarizeSkillMarkdown(normalized)
  return {
    name: summary.name,
    description: summary.description,
    body: body.replace(/^\n+/, '').replace(/\s+$/, '')
  }
}

// Why: we hand-roll YAML here instead of pulling a dep — frontmatter has only
// `name`/`description`/optional `createdAt`, all single-line strings. A JSON
// fallback covers values that need quoting.
function yamlScalar(value: string): string {
  if (value === '' || /[:#&*!|>%@`{}[\],"'\n\r]/.test(value) || value !== value.trim()) {
    return JSON.stringify(value)
  }
  return value
}

export function buildRuleMarkdown(args: {
  name: string
  description?: string | null
  body: string
  createdAt?: number | null
}): string {
  const lines: string[] = ['---']
  lines.push(`name: ${yamlScalar(args.name.trim())}`)
  if (args.description && args.description.trim()) {
    lines.push(`description: ${yamlScalar(args.description.trim())}`)
  }
  if (args.createdAt) {
    lines.push(`createdAt: ${args.createdAt}`)
  }
  lines.push('---', '', args.body.trim(), '')
  return lines.join('\n')
}

export function slugifyRuleName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'rule'
}

const FRONTMATTER_CREATED_AT = /^createdAt:\s*(\d+)\s*$/m

export function extractCreatedAt(markdown: string): number | null {
  const normalized = markdown.replace(/^﻿/, '')
  const frontmatterMatch = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(normalized)
  if (!frontmatterMatch) {
    return null
  }
  const match = FRONTMATTER_CREATED_AT.exec(frontmatterMatch[1])
  if (!match) {
    return null
  }
  const value = Number.parseInt(match[1], 10)
  return Number.isFinite(value) ? value : null
}
