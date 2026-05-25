import type { TriggerId, TriggerVariable } from '../../../../shared/triggers/types'

export type TriggerContext = Partial<Record<TriggerVariable, string | number | null>>

export type TriggerInvocation = {
  triggerId: TriggerId
  context: TriggerContext
  /** Display label shown next to the popover title, e.g. "Branch view" or
   *  "Plan: docs/plan.md". Mostly for surface attribution. */
  surfaceLabel?: string
}

export function emptyTriggerContext(): TriggerContext {
  return {}
}
