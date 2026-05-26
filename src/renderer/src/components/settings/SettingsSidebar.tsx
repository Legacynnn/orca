import { useCallback, type RefObject } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Server,
  type LucideIcon,
  type LucideProps
} from 'lucide-react'
import { isMacUserAgent } from '@/components/terminal-pane/pane-helpers'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const SEARCH_SHORTCUT_HINT = isMacUserAgent() ? '⌘F' : 'Ctrl+F'

type NavSection = {
  id: string
  title: string
  icon: LucideIcon | ((props: LucideProps) => React.JSX.Element)
  badge?: string
}

type NavGroup = {
  id: string
  title: string
  sections: NavSection[]
}

type RepoNavSection = NavSection & {
  badgeColor?: string
  isRemote?: boolean
}

type SettingsSidebarProps = {
  activeGroupId: string
  activeSectionId: string
  generalGroups: NavGroup[]
  repoSections: RepoNavSection[]
  hasRepos: boolean
  searchQuery: string
  searchInputRef?: RefObject<HTMLInputElement | null>
  onBack: () => void
  onSearchChange: (query: string) => void
  onSelectGroup: (groupId: string) => void
  onSelectSection: (sectionId: string, event?: React.MouseEvent) => void
}

export function SettingsSidebar({
  activeGroupId,
  activeSectionId,
  generalGroups,
  repoSections,
  hasRepos,
  searchQuery,
  searchInputRef,
  onBack,
  onSearchChange,
  onSelectGroup,
  onSelectSection
}: SettingsSidebarProps): React.JSX.Element {
  const handleGroupClick = useCallback(
    (groupId: string, firstSectionId: string | undefined) => {
      if (activeGroupId === groupId) {
        return
      }
      onSelectGroup(groupId)
      if (firstSectionId) {
        onSelectSection(firstSectionId)
      }
    },
    [activeGroupId, onSelectGroup, onSelectSection]
  )

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-border/50 bg-card/30">
      <div className="border-b border-border/50 px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to app
        </Button>
      </div>

      <div className="border-b border-border/50 px-3 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search settings"
            className="h-8 pl-8 pr-12 text-xs"
          />
          {searchQuery === '' ? (
            <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center rounded border border-border/60 bg-background/40 px-1.5 py-px font-mono text-[10px] font-medium text-muted-foreground">
              {SEARCH_SHORTCUT_HINT}
            </kbd>
          ) : null}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto scrollbar-sleek py-2">
        <div className="space-y-0.5 px-2">
          {generalGroups.map((group) => {
            const isExpanded = activeGroupId === group.id
            return (
              <div key={group.id}>
                <button
                  onClick={() => handleGroupClick(group.id, group.sections[0]?.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors ${
                    isExpanded ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ChevronRight
                    className={`size-3 shrink-0 transition-transform duration-150 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                  <span className="uppercase tracking-[0.08em]">{group.title}</span>
                </button>

                {isExpanded && group.sections.length > 0 ? (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                    {group.sections.map((section) => {
                      const Icon = section.icon
                      const isActive = activeSectionId === section.id
                      return (
                        <button
                          key={section.id}
                          onClick={(e) => onSelectSection(section.id, e)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                            isActive
                              ? 'bg-accent font-medium text-accent-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }`}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{section.title}</span>
                          {section.badge ? (
                            <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                              {section.badge}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}

          {repoSections.length > 0 || hasRepos ? (
            <div>
              <button
                onClick={() => handleGroupClick('repositories', repoSections[0]?.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors ${
                  activeGroupId === 'repositories'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChevronRight
                  className={`size-3 shrink-0 transition-transform duration-150 ${
                    activeGroupId === 'repositories' ? 'rotate-90' : ''
                  }`}
                />
                <span className="uppercase tracking-[0.08em]">Repositories</span>
              </button>

              {activeGroupId === 'repositories' ? (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                  {repoSections.length > 0 ? (
                    repoSections.map((section) => {
                      const isActive = activeSectionId === section.id
                      return (
                        <button
                          key={section.id}
                          onClick={() => onSelectSection(section.id)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                            isActive
                              ? 'bg-accent font-medium text-accent-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }`}
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: section.badgeColor ?? '#6b7280' }}
                          />
                          <span className="truncate">{section.title}</span>
                          {section.isRemote && (
                            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                              <Server className="size-3" />
                            </span>
                          )}
                        </button>
                      )
                    })
                  ) : (
                    <p className="px-2 py-2 text-[11px] text-muted-foreground">
                      {hasRepos ? 'No matching repositories.' : 'No repositories added yet.'}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </nav>
    </aside>
  )
}
