import React from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isGitRepoKind } from '../../../../shared/repo-kind'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'
import type { WorktreeCardProperty } from '../../../../shared/types'
import SidebarFilter from './SidebarFilter'

const GROUP_BY_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'workspace-status', label: 'Status' },
  { id: 'pr-status', label: 'PR' },
  { id: 'repo', label: 'Repo' }
] as const

const PROPERTY_OPTIONS: { id: WorktreeCardProperty; label: string }[] = [
  // Why: toggles the inline "Agent activity" list rendered below each
  // workspace card body (see WorktreeCard -> WorktreeCardAgents). Off hides
  // the list; there is no alternate surface.
  { id: 'inline-agents', label: 'Agent activity' }
]

const SORT_OPTIONS = [
  { id: 'name', label: 'Name', description: null },
  {
    id: 'smart',
    label: 'Smart',
    description: 'Agents that need attention, then most recent activity.'
  },
  { id: 'recent', label: 'Recent', description: null },
  { id: 'repo', label: 'Repo', description: null }
] as const

const isMac = navigator.userAgent.includes('Mac')
const newWorktreeShortcutLabel = isMac ? '⌘N' : 'Ctrl+N'
// Why: the sidebar resize handle intentionally has a wide hit target at the
// right edge, but header actions overlapping it should remain clickable.
const HEADER_ACTION_HIT_TARGET_CLASS = 'relative z-20'

const SidebarHeader = React.memo(function SidebarHeader() {
  const openModal = useAppStore((s) => s.openModal)
  const repos = useAppStore((s) => s.repos)
  const canCreateWorktree = repos.some((repo) => isGitRepoKind(repo))

  const worktreeCardProperties = useAppStore((s) => s.worktreeCardProperties)
  const toggleWorktreeCardProperty = useAppStore((s) => s.toggleWorktreeCardProperty)
  const sortBy = useAppStore((s) => s.sortBy)
  const setSortBy = useAppStore((s) => s.setSortBy)
  const groupBy = useAppStore((s) => s.groupBy)
  const setGroupBy = useAppStore((s) => s.setGroupBy)

  return (
    <div
      // Why: the empty middle of this header (everything `justify-between`
      // pushes out of) drags the window so the "Workspaces" strip behaves
      // like an extension of the titlebar. The two flex children below
      // override with `no-drag` so the filter, sort menu and `+` button
      // stay clickable and Radix's outside-click dismissal still fires when
      // their popovers are open.
      className="mt-2 flex h-8 items-center justify-between px-2 gap-2"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex min-w-0 items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="pl-2 pr-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80 select-none">
          Workspaces
        </span>
      </div>
      <div
        className="flex items-center gap-1.5 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <SidebarFilter />
        <DropdownMenu modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className={`${HEADER_ACTION_HIT_TARGET_CLASS} text-muted-foreground`}
                  aria-label="View options"
                >
                  <SlidersHorizontal className="size-3.5" strokeWidth={2.25} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              View options
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-56 pb-2">
            <DropdownMenuLabel>Group by</DropdownMenuLabel>
            <div className="px-2 pt-0.5 pb-1">
              <ToggleGroup
                type="single"
                value={groupBy}
                onValueChange={(v) => {
                  if (v) {
                    setGroupBy(v as typeof groupBy)
                  }
                }}
                variant="outline"
                size="sm"
                className="h-6 w-full justify-start"
              >
                {GROUP_BY_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt.id}
                    value={opt.id}
                    className="h-6 px-2 text-[10px] data-[state=on]:bg-foreground/10 data-[state=on]:font-semibold data-[state=on]:text-foreground"
                  >
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as typeof sortBy)}
            >
              {SORT_OPTIONS.map((opt) => {
                const radioItem = (
                  <DropdownMenuRadioItem
                    key={opt.id}
                    value={opt.id}
                    // Keep the menu open so people can compare sort modes and
                    // toggle card properties without reopening the same panel.
                    onSelect={(e) => e.preventDefault()}
                  >
                    {opt.label}
                  </DropdownMenuRadioItem>
                )
                if (!opt.description) {
                  return radioItem
                }
                return (
                  <Tooltip key={opt.id}>
                    <TooltipTrigger asChild>{radioItem}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={6}>
                      {opt.description}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Show properties</DropdownMenuLabel>
            {PROPERTY_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.id}
                checked={worktreeCardProperties.includes(opt.id)}
                onCheckedChange={() => toggleWorktreeCardProperty(opt.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={HEADER_ACTION_HIT_TARGET_CLASS}
              onClick={() => {
                if (!canCreateWorktree) {
                  return
                }
                openModal('new-workspace-composer', { telemetrySource: 'sidebar' })
              }}
              aria-label="New workspace"
              disabled={!canCreateWorktree}
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={6}>
            {canCreateWorktree
              ? `New workspace (${newWorktreeShortcutLabel})`
              : 'Add a Git project to create worktrees'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
})

export default SidebarHeader
