import { useAppStore } from '@/store'
import { buildAgentStartupPlan } from '@/lib/tui-agent-startup'
import { CLIENT_PLATFORM } from '@/lib/new-workspace'
import { sendRuntimePtyInput } from '@/runtime/runtime-terminal-inspection'
import { createNewTerminalTab } from '@/components/terminal/terminal-tab-actions'
import type { TuiAgent } from '../../../../shared/types'

export type LaunchTriggerArgs = {
  agent: TuiAgent
  prompt: string
  /** Override the active worktree explicitly. When null/undefined the active
   *  worktree at call time is used. */
  worktreeId?: string | null
}

export type LaunchTriggerResult =
  | { ok: true; tabId: string; ptyId: string }
  | { ok: false; reason: 'no-active-workspace' | 'no-pty' | 'no-plan' }

const PTY_WAIT_MAX_ATTEMPTS = 30
const PTY_WAIT_INTERVAL_MS = 150

async function waitForTabPty(worktreeId: string, createdTabId: string): Promise<string | null> {
  for (let attempt = 0; attempt < PTY_WAIT_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, PTY_WAIT_INTERVAL_MS))
    }
    const state = useAppStore.getState()
    const ptyId = state.ptyIdsByTabId[createdTabId]?.[0] ?? null
    if (ptyId) {
      return ptyId
    }
    // Why: if the tab was closed during the wait, abort rather than spinning
    // for the rest of the budget.
    const tabs = state.tabsByWorktree[worktreeId] ?? []
    if (!tabs.some((tab) => tab.id === createdTabId)) {
      return null
    }
  }
  return null
}

export async function launchTriggerInNewSession(
  args: LaunchTriggerArgs
): Promise<LaunchTriggerResult> {
  const state = useAppStore.getState()
  const targetWorktreeId = args.worktreeId ?? state.activeWorktreeId
  if (!targetWorktreeId) {
    return { ok: false, reason: 'no-active-workspace' }
  }

  const settings = state.settings
  const startupPlan = buildAgentStartupPlan({
    agent: args.agent,
    prompt: args.prompt,
    cmdOverrides: settings?.agentCmdOverrides ?? {},
    platform: CLIENT_PLATFORM
  })
  if (!startupPlan) {
    return { ok: false, reason: 'no-plan' }
  }

  const tabsBefore = state.tabsByWorktree[targetWorktreeId] ?? []
  const tabIdsBefore = new Set(tabsBefore.map((tab) => tab.id))

  createNewTerminalTab(targetWorktreeId)

  // Why: createNewTerminalTab synchronously updates the store but the PTY
  // spawn is async. Find the freshly-added tab id by diffing against the
  // pre-create set, then poll for its PTY.
  const tabsAfter = useAppStore.getState().tabsByWorktree[targetWorktreeId] ?? []
  const newTab = tabsAfter.find((tab) => !tabIdsBefore.has(tab.id))
  if (!newTab) {
    return { ok: false, reason: 'no-pty' }
  }

  const ptyId = await waitForTabPty(targetWorktreeId, newTab.id)
  if (!ptyId) {
    return { ok: false, reason: 'no-pty' }
  }

  // Why: types and submits the agent launch command in the freshly-spawned
  // shell. The agent's own --prompt / --prompt-interactive / argv mode (set
  // by buildAgentStartupPlan based on TUI_AGENT_CONFIG) ensures the prompt
  // string lands as the kickoff message; for stdin-after-start agents the
  // plan returns followupPrompt instead, but those are exclusive to legacy
  // launchers and don't apply here since we type the full launchCommand.
  sendRuntimePtyInput(settings, ptyId, `${startupPlan.launchCommand}\r`)

  return { ok: true, tabId: newTab.id, ptyId }
}
