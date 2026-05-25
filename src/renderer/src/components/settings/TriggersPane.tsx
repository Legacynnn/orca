import { useCallback, useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import type { GlobalSettings } from '../../../../shared/types'
import { ALL_TRIGGER_IDS, type TriggerId } from '../../../../shared/triggers/types'
import { TRIGGER_DEFINITIONS } from '../../../../shared/triggers/default-prompts'
import { isTriggerOverridden, resolveTriggerPrompt } from '../../../../shared/triggers/resolve'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

export { TRIGGERS_PANE_SEARCH_ENTRIES } from './triggers-search'

type TriggersPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function TriggersPane({ settings, updateSettings }: TriggersPaneProps): React.JSX.Element {
  const overrides = settings.triggerOverrides
  const [expanded, setExpanded] = useState<Set<TriggerId>>(new Set())
  const [editing, setEditing] = useState<Record<TriggerId, string | null>>(
    {} as Record<TriggerId, string | null>
  )

  const toggleExpand = useCallback((triggerId: TriggerId) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(triggerId)) {
        next.delete(triggerId)
      } else {
        next.add(triggerId)
      }
      return next
    })
  }, [])

  const writeOverride = useCallback(
    (triggerId: TriggerId, promptOverride: string | null) => {
      const nextOverrides = { ...overrides }
      if (promptOverride === null) {
        delete nextOverrides[triggerId]
      } else {
        nextOverrides[triggerId] = { promptOverride }
      }
      updateSettings({ triggerOverrides: nextOverrides })
    },
    [overrides, updateSettings]
  )

  return (
    <section className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Triggers are app-defined buttons in diff views, PR dialogs, and the plan editor. Clicking
        one spawns a fresh agent session with the rendered prompt as the kickoff message. You can
        only edit each trigger&apos;s prompt — there is no way to add or remove triggers.
      </p>

      <ul className="space-y-2">
        {ALL_TRIGGER_IDS.map((triggerId) => {
          const definition = TRIGGER_DEFINITIONS[triggerId]
          const overridden = isTriggerOverridden(triggerId, overrides)
          const isExpanded = expanded.has(triggerId)
          const liveDraft =
            editing[triggerId] ?? overrides?.[triggerId]?.promptOverride ?? definition.defaultPrompt
          const dirty =
            editing[triggerId] !== undefined &&
            editing[triggerId] !==
              (overrides?.[triggerId]?.promptOverride ?? definition.defaultPrompt)

          return (
            <li key={triggerId} className="rounded-md border border-border bg-background">
              <button
                type="button"
                onClick={() => toggleExpand(triggerId)}
                className="flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/40"
              >
                <ChevronDown
                  className={cn(
                    'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{definition.name}</span>
                    {overridden ? (
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        custom
                      </span>
                    ) : null}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {definition.output === 'structured-comments' ? 'plan comments' : 'chat'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{definition.description}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {definition.surfaceLabel}
                  </p>
                </div>
              </button>

              {isExpanded ? (
                <div className="space-y-2 border-t border-border/60 px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {definition.variables.map((variable) => (
                      <span
                        key={variable}
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>

                  <textarea
                    rows={10}
                    spellCheck={false}
                    value={liveDraft}
                    onChange={(event) =>
                      setEditing((current) => ({ ...current, [triggerId]: event.target.value }))
                    }
                    className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[11px] text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {overridden ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            writeOverride(triggerId, null)
                            setEditing((current) => {
                              const next = { ...current }
                              delete next[triggerId]
                              return next
                            })
                          }}
                          className="gap-1"
                        >
                          <RotateCcw className="size-3" />
                          Reset to default
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {dirty ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setEditing((current) => {
                              const next = { ...current }
                              delete next[triggerId]
                              return next
                            })
                          }
                        >
                          Discard
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="xs"
                        disabled={!dirty}
                        onClick={() => {
                          const value = liveDraft.trim()
                          if (!value) {
                            writeOverride(triggerId, null)
                          } else if (value === definition.defaultPrompt.trim()) {
                            writeOverride(triggerId, null)
                          } else {
                            writeOverride(triggerId, liveDraft)
                          }
                          setEditing((current) => {
                            const next = { ...current }
                            delete next[triggerId]
                            return next
                          })
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  <details className="rounded border border-dashed border-border/60 px-2 py-1.5 text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer select-none text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      Resolved (preview)
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[10px]">
                      {resolveTriggerPrompt(triggerId, overrides)}
                    </pre>
                  </details>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
