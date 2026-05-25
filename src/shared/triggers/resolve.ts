import { TRIGGER_DEFINITIONS } from './default-prompts'
import type { TriggerId } from './types'

export type TriggerOverridesShape = Record<string, { promptOverride: string | null } | undefined>

export function resolveTriggerPrompt(
  triggerId: TriggerId,
  overrides: TriggerOverridesShape | null | undefined
): string {
  const override = overrides?.[triggerId]?.promptOverride
  if (typeof override === 'string' && override.trim()) {
    return override
  }
  return TRIGGER_DEFINITIONS[triggerId].defaultPrompt
}

export function isTriggerOverridden(
  triggerId: TriggerId,
  overrides: TriggerOverridesShape | null | undefined
): boolean {
  const override = overrides?.[triggerId]?.promptOverride
  return typeof override === 'string' && override.trim().length > 0
}
