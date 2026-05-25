import { useEffect, useMemo, useState } from 'react'
import { Play, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import AgentCombobox from '@/components/agent/AgentCombobox'
import { AGENT_CATALOG } from '@/lib/agent-catalog'
import { useAppStore } from '@/store'
import { useDetectedAgents } from '@/hooks/useDetectedAgents'
import { TRIGGER_DEFINITIONS } from '../../../../shared/triggers/default-prompts'
import { resolveTriggerPrompt } from '../../../../shared/triggers/resolve'
import { renderTemplate } from '../../../../shared/prompt-template/render'
import type { TriggerId } from '../../../../shared/triggers/types'
import type { TuiAgent } from '../../../../shared/types'
import { launchTriggerInNewSession } from '@/lib/triggers/invoke-trigger'
import type { TriggerContext } from '@/lib/triggers/trigger-context'

type TriggerInvokePopoverProps = {
  triggerId: TriggerId
  context: TriggerContext
  /** The element that opens the popover (e.g. a Button). */
  children: React.ReactNode
  /** Optional surface-specific note rendered above the prompt preview. */
  contextSummary?: string
  /** Optional override for the worktree the agent launches into. Defaults to
   *  the active workspace. */
  worktreeId?: string | null
  /** Side prop forwarded to PopoverContent. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export function TriggerInvokePopover({
  triggerId,
  context,
  children,
  contextSummary,
  worktreeId,
  side = 'bottom',
  align = 'end'
}: TriggerInvokePopoverProps): React.JSX.Element {
  const definition = TRIGGER_DEFINITIONS[triggerId]
  const triggerOverrides = useAppStore((s) => s.settings?.triggerOverrides)
  const defaultTuiAgent = useAppStore((s) => s.settings?.defaultTuiAgent)
  useDetectedAgents()
  const detectedAgents = useAppStore((s) => s.detectedAgentIds)

  const [open, setOpen] = useState(false)
  const initialAgent: TuiAgent = useMemo(() => {
    if (defaultTuiAgent && defaultTuiAgent !== 'blank') {
      return defaultTuiAgent
    }
    const detectedSet = detectedAgents ? new Set(detectedAgents) : null
    const detected = AGENT_CATALOG.find(
      (entry) => detectedSet === null || detectedSet.has(entry.id)
    )
    return detected?.id ?? 'claude'
  }, [defaultTuiAgent, detectedAgents])
  const [agent, setAgent] = useState<TuiAgent>(initialAgent)
  // Why: when the popover re-opens with a different default we want the
  // picker to track that, but a manual choice inside the popover must
  // persist as long as it stays open.
  useEffect(() => {
    if (!open) {
      setAgent(initialAgent)
    }
  }, [initialAgent, open])

  const basePrompt = useMemo(
    () => resolveTriggerPrompt(triggerId, triggerOverrides),
    [triggerId, triggerOverrides]
  )

  const renderResult = useMemo(
    () => renderTemplate(basePrompt, context as Record<string, string | number | null>),
    [basePrompt, context]
  )

  const [draft, setDraft] = useState<string>(renderResult.text)
  useEffect(() => {
    if (open) {
      setDraft(renderResult.text)
    }
  }, [open, renderResult.text])

  const [launching, setLaunching] = useState(false)

  const handleLaunch = async (): Promise<void> => {
    setLaunching(true)
    try {
      const result = await launchTriggerInNewSession({
        agent,
        prompt: draft.trim() || basePrompt,
        ...(worktreeId !== undefined ? { worktreeId } : {})
      })
      if (!result.ok) {
        switch (result.reason) {
          case 'no-active-workspace':
            toast.error('Open a workspace before invoking a trigger')
            break
          case 'no-plan':
            toast.error('Could not build a launch command for that agent')
            break
          case 'no-pty':
            toast.error('Could not open a new terminal for the trigger')
            break
        }
        return
      }
      toast.success(`Sent to ${agent}`)
      setOpen(false)
    } finally {
      setLaunching(false)
    }
  }

  const visibleAgents = useMemo(() => {
    if (!detectedAgents) {
      return AGENT_CATALOG
    }
    const detectedSet = new Set(detectedAgents)
    const installed = AGENT_CATALOG.filter((entry) => detectedSet.has(entry.id))
    return installed.length > 0 ? installed : AGENT_CATALOG
  }, [detectedAgents])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-[420px] space-y-3 p-3"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Play className="size-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{definition.name}</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {contextSummary ?? definition.surfaceLabel}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Send to</label>
          <AgentCombobox
            agents={visibleAgents}
            value={agent}
            onValueChange={(next) => {
              if (next) {
                setAgent(next)
              }
            }}
            triggerClassName="h-8 w-full border-input text-xs focus:border-ring focus:ring-[3px] focus:ring-ring/50"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`trigger-${triggerId}-prompt`}
              className="text-[11px] font-medium text-muted-foreground"
            >
              Prompt
            </label>
            {renderResult.missing.length > 0 ? (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                Missing: {renderResult.missing.join(', ')}
              </span>
            ) : null}
          </div>
          <textarea
            id={`trigger-${triggerId}-prompt`}
            rows={10}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Spawns a fresh agent session in this workspace.
          </p>
          <Button type="button" size="sm" onClick={() => void handleLaunch()} disabled={launching}>
            <Send className="size-3" />
            {launching ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
