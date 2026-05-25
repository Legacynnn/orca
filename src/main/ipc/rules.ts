import { app, ipcMain } from 'electron'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { listRules, readRuleBySlug } from '../rules/discovery'
import {
  createRule,
  deleteRule,
  updateRule,
  type RuleInput,
  type WriteRuleResult
} from '../rules/storage'
import { seedDefaultRulesIfNeeded } from '../rules/seed'
import type { Rule, RuleSummary } from '../../shared/rule-metadata'

function rulesRootDir(): string {
  return join(app.getPath('userData'), 'rules')
}

let seeded = false

async function ensureRoot(): Promise<string> {
  const root = rulesRootDir()
  await mkdir(root, { recursive: true })
  if (!seeded) {
    seeded = true
    try {
      await seedDefaultRulesIfNeeded(root)
    } catch {
      // Best-effort: never block IPC handlers on the seed.
    }
  }
  return root
}

export function registerRulesHandlers(): void {
  ipcMain.handle('rules:list', async (): Promise<RuleSummary[]> => {
    const root = await ensureRoot()
    return listRules(root)
  })

  ipcMain.handle('rules:read', async (_event, slug: string): Promise<Rule | null> => {
    const root = await ensureRoot()
    return readRuleBySlug(root, slug)
  })

  ipcMain.handle('rules:create', async (_event, input: RuleInput): Promise<WriteRuleResult> => {
    const root = await ensureRoot()
    return createRule(root, input)
  })

  ipcMain.handle(
    'rules:update',
    async (_event, args: { slug: string; input: RuleInput }): Promise<WriteRuleResult> => {
      const root = await ensureRoot()
      return updateRule(root, args.slug, args.input)
    }
  )

  ipcMain.handle('rules:delete', async (_event, slug: string): Promise<RuleSummary[]> => {
    const root = await ensureRoot()
    return deleteRule(root, slug)
  })
}
