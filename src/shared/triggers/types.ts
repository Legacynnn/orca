export type TriggerId =
  | 'diff-review'
  | 'branch-summarize'
  | 'pr-creation'
  | 'pr-review'
  | 'plan-review'
  | 'apply-plan-comments'

export const ALL_TRIGGER_IDS: readonly TriggerId[] = [
  'diff-review',
  'branch-summarize',
  'pr-creation',
  'pr-review',
  'plan-review',
  'apply-plan-comments'
] as const

export type TriggerOutput = 'chat' | 'structured-comments'

export type TriggerVariable =
  | 'diff'
  | 'branchName'
  | 'baseBranch'
  | 'prTitle'
  | 'prBody'
  | 'prNumber'
  | 'prUrl'
  | 'prFilesSummary'
  | 'planContent'
  | 'planPath'
  | 'comments'

export type TriggerDefinition = {
  id: TriggerId
  name: string
  description: string
  /** Human-readable description of where the user finds the button for this
   *  trigger — shown in the settings pane so users can locate the surface. */
  surfaceLabel: string
  defaultPrompt: string
  /** Variables this trigger's renderer will populate. Used by the settings
   *  pane to surface the available `{{var}}` tokens next to the prompt
   *  editor. */
  variables: TriggerVariable[]
  output: TriggerOutput
}

/** User-overridden prompt for a single trigger. Stored keyed by `TriggerId`.
 *  When `promptOverride` is null or absent, the bundled default prompt is
 *  rendered. */
export type TriggerOverride = {
  promptOverride: string | null
}

export type TriggerOverrideMap = Partial<Record<TriggerId, TriggerOverride>>
