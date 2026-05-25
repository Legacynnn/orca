import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TriggerInvokePopover } from './TriggerInvokePopover'
import type { TriggerContext } from '@/lib/triggers/trigger-context'
import type { TriggerId } from '../../../../shared/triggers/types'

type TriggerActionButtonProps = {
  triggerId: TriggerId
  context: TriggerContext
  label: string
  contextSummary?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

// Why: every trigger entry point (Git tab, PR tab, plan editor) shares this
// outline + Sparkles chip so the AI-action affordance reads the same wherever
// it appears. Restyling here updates every surface in one place.
export function TriggerActionButton({
  triggerId,
  context,
  label,
  contextSummary,
  side,
  align,
  className
}: TriggerActionButtonProps): React.JSX.Element {
  return (
    <TriggerInvokePopover
      triggerId={triggerId}
      context={context}
      {...(contextSummary ? { contextSummary } : {})}
      {...(side ? { side } : {})}
      {...(align ? { align } : {})}
    >
      <Button
        type="button"
        variant="outline"
        size="xs"
        className={cn(
          'gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground',
          className
        )}
      >
        <Sparkles className="size-3 text-primary/70" />
        {label}
      </Button>
    </TriggerInvokePopover>
  )
}
