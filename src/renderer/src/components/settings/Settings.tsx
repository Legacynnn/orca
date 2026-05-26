/* eslint-disable max-lines -- Why: Settings is the single owner of all settings orchestration; splitting group/section routing, keyboard handling, and pane rendering across files would scatter tightly coupled state. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Bell,
  Bot,
  Cable,
  FlaskConical,
  GitBranch,
  Globe,
  Info,
  Keyboard,
  ListChecks,
  Lock,
  MousePointerClick,
  Network,
  ShieldCheck,
  Palette,
  ScrollText,
  Server,
  SlidersHorizontal,
  Smartphone,
  Blocks,
  Mic,
  SquareTerminal,
  TextCursorInput,
  UserCog,
  Zap
} from 'lucide-react'
import type { GlobalSettings, Repo, SerperHooks } from '../../../../shared/types'
import { getRepoKindLabel, isFolderRepo } from '../../../../shared/repo-kind'
import { useAppStore } from '../../store'
import { useSystemPrefersDark } from '@/components/terminal-pane/use-system-prefers-dark'
import { isMacUserAgent, isWindowsUserAgent } from '@/components/terminal-pane/pane-helpers'
import { applyDocumentTheme } from '@/lib/document-theme'
import { SCROLLBACK_PRESETS_MB, getFallbackTerminalFonts } from './SettingsConstants'
import { DEFAULT_APP_FONT_FAMILY } from '../../../../shared/constants'
import { GeneralPane, GENERAL_PANE_SEARCH_ENTRIES } from './GeneralPane'
import { BrowserPane, BROWSER_PANE_SEARCH_ENTRIES } from './BrowserPane'
import { AppearancePane, APPEARANCE_PANE_SEARCH_ENTRIES } from './AppearancePane'
import { InputPane, INPUT_PANE_SEARCH_ENTRIES } from './InputPane'
import { ShortcutsPane, SHORTCUTS_PANE_SEARCH_ENTRIES } from './ShortcutsPane'
import { TerminalPane } from './TerminalPane'
import { useGhosttyImport } from './useGhosttyImport'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import ghosttyIcon from '../../../../../resources/ghostty.svg'
import { RepositoryPane, getRepositoryPaneSearchEntries } from './RepositoryPane'
import { getTerminalPaneSearchEntries } from './terminal-search'
import { GitPane, GIT_PANE_SEARCH_ENTRIES } from './GitPane'
import { CommitMessageAiPane } from './CommitMessageAiPane'
import { COMMIT_MESSAGE_AI_PANE_SEARCH_ENTRIES } from './commit-message-ai-search'
import { NotificationsPane, NOTIFICATIONS_PANE_SEARCH_ENTRIES } from './NotificationsPane'
import { VoicePane } from './VoicePane'
import { VOICE_PANE_SEARCH_ENTRIES } from './voice-pane-search'
import { SshPane, SSH_PANE_SEARCH_ENTRIES } from './SshPane'
import { ExperimentalPane, EXPERIMENTAL_PANE_SEARCH_ENTRIES } from './ExperimentalPane'
import { AgentsPane, AGENTS_PANE_SEARCH_ENTRIES } from './AgentsPane'
import { OrchestrationPane } from './OrchestrationPane'
import { ORCHESTRATION_PANE_SEARCH_ENTRIES } from './orchestration-search'
import { AccountsPane, ACCOUNTS_PANE_SEARCH_ENTRIES } from './AccountsPane'
import { StatsPane, STATS_PANE_SEARCH_ENTRIES } from '../stats/StatsPane'
import { IntegrationsPane, INTEGRATIONS_PANE_SEARCH_ENTRIES } from './IntegrationsPane'
import { TasksPane } from './TasksPane'
import { TASKS_PANE_SEARCH_ENTRIES } from './tasks-search'
import { RulesPane, RULES_PANE_SEARCH_ENTRIES } from './RulesPane'
import { TriggersPane, TRIGGERS_PANE_SEARCH_ENTRIES } from './TriggersPane'
import {
  DeveloperPermissionsPane,
  DEVELOPER_PERMISSIONS_PANE_SEARCH_ENTRIES
} from './DeveloperPermissionsPane'
import { ComputerUsePane, COMPUTER_USE_PANE_SEARCH_ENTRIES } from './ComputerUsePane'
import { MobileSettingsPane, MOBILE_SETTINGS_PANE_SEARCH_ENTRIES } from './MobileSettingsPane'
import { RuntimeEnvironmentsPane } from './RuntimeEnvironmentsPane'
import {
  RUNTIME_ENVIRONMENTS_SEARCH_ENTRY,
  WEB_RUNTIME_ENVIRONMENTS_SEARCH_ENTRY
} from './runtime-environments-search'
import { PrivacyPane } from './PrivacyPane'
import { PRIVACY_PANE_SEARCH_ENTRIES } from './privacy-search'
import { SettingsSidebar } from './SettingsSidebar'
import { matchesSettingsSearch, type SettingsSearchEntry } from './settings-search'
import { checkRuntimeHooks } from '@/runtime/runtime-hooks-client'
import { getRuntimeTargetIdentity } from './settings-load-performance'

type SettingsNavTarget =
  | 'general'
  | 'integrations'
  | 'accounts'
  | 'browser'
  | 'git'
  | 'tasks'
  | 'appearance'
  | 'input'
  | 'terminal'
  | 'notifications'
  | 'computer-use'
  | 'developer-permissions'
  | 'privacy'
  | 'voice'
  | 'shortcuts'
  | 'stats'
  | 'ssh'
  | 'experimental'
  | 'agents'
  | 'rules'
  | 'triggers'
  | 'orchestration'
  | 'servers'
  | 'mobile'
  | 'repo'

type SettingsNavSection = {
  id: string
  title: string
  description: string
  icon: typeof SlidersHorizontal
  searchEntries: SettingsSearchEntry[]
  group: string
  badge?: string
}

type SettingsNavGroup = {
  id: string
  title: string
  sections: SettingsNavSection[]
}

const SETTINGS_NAV_GROUPS = [
  { id: 'setup', title: 'Set Up' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'interface', title: 'Interface' },
  { id: 'capabilities', title: 'AI Capabilities' },
  { id: 'remote', title: 'Remote Access' },
  { id: 'safety', title: 'Safety' },
  { id: 'experimental', title: 'Experimental' }
] as const

function getSettingsSectionId(pane: SettingsNavTarget, repoId: string | null): string {
  if (pane === 'repo' && repoId) {
    return `repo-${repoId}`
  }
  return pane
}

function computerUsePlatformLabel(args: { isWindows: boolean; isMac: boolean }): string {
  if (args.isWindows) {
    return 'Windows'
  }
  if (!args.isMac) {
    return 'Linux'
  }
  return 'This platform'
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  if (target.isContentEditable) {
    return true
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function isWebClientLocation(): boolean {
  return (
    Boolean((window as unknown as { __SERPER_WEB_CLIENT__?: boolean }).__SERPER_WEB_CLIENT__) ||
    window.location.pathname.endsWith('/web-index.html')
  )
}

function findGroupForSection(sectionId: string, groups: SettingsNavGroup[]): string {
  for (const group of groups) {
    if (group.sections.some((s) => s.id === sectionId)) {
      return group.id
    }
  }
  if (sectionId.startsWith('repo-')) {
    return 'repositories'
  }
  return groups[0]?.id ?? 'setup'
}

function Settings(): React.JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const switchRuntimeEnvironment = useAppStore((s) => s.switchRuntimeEnvironment)
  const fetchSettings = useAppStore((s) => s.fetchSettings)
  const closeSettingsPage = useAppStore((s) => s.closeSettingsPage)
  const repos = useAppStore((s) => s.repos)
  const updateRepo = useAppStore((s) => s.updateRepo)
  const removeRepo = useAppStore((s) => s.removeRepo)
  const settingsNavigationTarget = useAppStore((s) => s.settingsNavigationTarget)
  const clearSettingsTarget = useAppStore((s) => s.clearSettingsTarget)
  const settingsSearchInputQuery = useAppStore((s) => s.settingsSearchInputQuery)
  const settingsSearchQuery = useAppStore((s) => s.settingsSearchQuery)
  const setSettingsSearchQuery = useAppStore((s) => s.setSettingsSearchQuery)

  const [repoHooksMap, setRepoHooksMap] = useState<
    Record<string, { hasHooks: boolean; hooks: SerperHooks | null; mayNeedUpdate: boolean }>
  >({})
  const systemPrefersDark = useSystemPrefersDark()
  const isWindows = isWindowsUserAgent()
  const isMac = isMacUserAgent()
  const isWebClient = isWebClientLocation()
  const showDesktopOnlySettings = !isWebClient
  const showComputerUsePreviewTooltip = !isMac
  const computerUsePlatform = computerUsePlatformLabel({ isWindows, isMac })
  const terminalPaneSearchEntries = useMemo(
    () => getTerminalPaneSearchEntries({ isWindows, isMac }),
    [isWindows, isMac]
  )
  const [scrollbackMode, setScrollbackMode] = useState<'preset' | 'custom'>('preset')
  const [prevScrollbackBytes, setPrevScrollbackBytes] = useState(settings?.terminalScrollbackBytes)
  const ghostty = useGhosttyImport(updateSettings, settings)
  const [wslAvailable, setWslAvailable] = useState(false)
  const [pwshAvailable, setPwshAvailable] = useState(false)
  const [fontSuggestions, setFontSuggestions] = useState<string[]>(
    Array.from(new Set([DEFAULT_APP_FONT_FAMILY, ...getFallbackTerminalFonts()]))
  )
  const [activeGroupId, setActiveGroupId] = useState('setup')
  const [activeSectionId, setActiveSectionId] = useState('general')
  const [hasUnsavedCommitPromptChanges, setHasUnsavedCommitPromptChanges] = useState(false)
  const [commitPromptDiscardSignal, setCommitPromptDiscardSignal] = useState(0)
  const [hiddenExperimentalUnlocked, setHiddenExperimentalUnlocked] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const terminalFontsLoadedRef = useRef(false)
  const terminalCapabilitiesLoadedRef = useRef(false)
  const repoHooksRequestSeqRef = useRef(0)
  const repoHooksRuntimeIdentityRef = useRef<string>('local')

  const confirmDiscardCommitPromptChanges = useCallback((): boolean => {
    if (!hasUnsavedCommitPromptChanges) {
      return true
    }
    const shouldDiscard = window.confirm(
      'You have unsaved AI commit prompt changes. Leave without saving?'
    )
    if (shouldDiscard) {
      setCommitPromptDiscardSignal((signal) => signal + 1)
      setHasUnsavedCommitPromptChanges(false)
    }
    return shouldDiscard
  }, [hasUnsavedCommitPromptChanges])

  const closeSettingsPageWithPromptGuard = useCallback((): void => {
    if (!confirmDiscardCommitPromptChanges()) {
      return
    }
    closeSettingsPage()
  }, [closeSettingsPage, confirmDiscardCommitPromptChanges])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const runtimeTargetIdentity = getRuntimeTargetIdentity(settings)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return
      }
      if (isEditableTarget(event.target)) {
        return
      }
      closeSettingsPageWithPromptGuard()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeSettingsPageWithPromptGuard])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (!hasUnsavedCommitPromptChanges) {
        return
      }
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedCommitPromptChanges])

  useEffect(() => {
    const handleFindShortcut = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.altKey || event.shiftKey) {
        return
      }
      const mod = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
      if (!mod || event.key.toLowerCase() !== 'f') {
        return
      }
      const input = searchInputRef.current
      if (!input) {
        return
      }
      event.preventDefault()
      input.focus()
      input.select()
    }
    document.addEventListener('keydown', handleFindShortcut)
    return () => document.removeEventListener('keydown', handleFindShortcut)
  }, [isMac])

  useEffect(
    () => () => {
      setSettingsSearchQuery('')
    },
    [setSettingsSearchQuery]
  )

  if (settings?.terminalScrollbackBytes !== prevScrollbackBytes) {
    setPrevScrollbackBytes(settings?.terminalScrollbackBytes)
    if (settings) {
      const scrollbackMb = Math.max(1, Math.round(settings.terminalScrollbackBytes / 1_000_000))
      setScrollbackMode(
        SCROLLBACK_PRESETS_MB.includes(scrollbackMb as (typeof SCROLLBACK_PRESETS_MB)[number])
          ? 'preset'
          : 'custom'
      )
    }
  }

  const applyTheme = useCallback((theme: GlobalSettings['theme']) => {
    applyDocumentTheme(theme)
  }, [])

  const displayedGitUsername = repos[0]?.gitUsername ?? ''
  const runtimeEnvironmentsSearchEntry = isWebClient
    ? WEB_RUNTIME_ENVIRONMENTS_SEARCH_ENTRY
    : RUNTIME_ENVIRONMENTS_SEARCH_ENTRY

  const navSections = useMemo<SettingsNavSection[]>(
    () => [
      {
        id: 'general',
        title: 'General',
        description: 'Workspace defaults, app setup, and maintenance.',
        icon: SlidersHorizontal,
        searchEntries: GENERAL_PANE_SEARCH_ENTRIES,
        group: 'setup'
      },
      {
        id: 'agents',
        title: 'Agents',
        description: 'Manage AI agents, set a default, and customize commands.',
        icon: Bot,
        searchEntries: AGENTS_PANE_SEARCH_ENTRIES,
        group: 'setup'
      },
      {
        id: 'accounts',
        title: 'AI Provider Accounts',
        description: 'Optional account switching for Claude, Codex, Gemini, and OpenCode Go.',
        icon: UserCog,
        searchEntries: ACCOUNTS_PANE_SEARCH_ENTRIES,
        group: 'setup',
        badge: 'Optional'
      },
      {
        id: 'integrations',
        title: 'Integrations',
        description: 'Connect GitHub, GitLab, Linear, and source-hosting services.',
        icon: Blocks,
        searchEntries: INTEGRATIONS_PANE_SEARCH_ENTRIES,
        group: 'setup'
      },
      {
        id: 'git',
        title: 'Git & Source Control',
        description: 'Branch naming, base refs, attribution, and AI commit messages.',
        icon: GitBranch,
        searchEntries: [...GIT_PANE_SEARCH_ENTRIES, ...COMMIT_MESSAGE_AI_PANE_SEARCH_ENTRIES],
        group: 'workflows'
      },
      {
        id: 'tasks',
        title: 'Task Sources',
        description: 'Choose which task providers appear in the Tasks page and sidebar.',
        icon: ListChecks,
        searchEntries: TASKS_PANE_SEARCH_ENTRIES,
        group: 'workflows'
      },
      {
        id: 'rules',
        title: 'Rules',
        description: 'Reusable kickoff prompts you can attach to a new agent session.',
        icon: ScrollText,
        searchEntries: RULES_PANE_SEARCH_ENTRIES,
        group: 'workflows'
      },
      {
        id: 'triggers',
        title: 'Triggers',
        description: 'Built-in agent shortcuts on diffs, PRs, and plan files.',
        icon: Zap,
        searchEntries: TRIGGERS_PANE_SEARCH_ENTRIES,
        group: 'workflows'
      },
      {
        id: 'terminal',
        title: 'Terminal',
        description: 'Shells, terminal appearance, quick commands, and pane behavior.',
        icon: SquareTerminal,
        searchEntries: terminalPaneSearchEntries,
        group: 'workflows'
      },
      ...(showDesktopOnlySettings
        ? [
            {
              id: 'browser' as const,
              title: 'Browser',
              description: 'Home page, link routing, and session cookies.',
              icon: Globe,
              searchEntries: BROWSER_PANE_SEARCH_ENTRIES,
              group: 'workflows'
            }
          ]
        : []),
      {
        id: 'appearance',
        title: 'Appearance',
        description: 'Theme, zoom, app font, sidebars, and status bar.',
        icon: Palette,
        searchEntries: APPEARANCE_PANE_SEARCH_ENTRIES,
        group: 'interface'
      },
      {
        id: 'input',
        title: 'Input & Editing',
        description: 'Selection and editing behavior.',
        icon: TextCursorInput,
        searchEntries: INPUT_PANE_SEARCH_ENTRIES,
        group: 'interface'
      },
      ...(showDesktopOnlySettings
        ? [
            {
              id: 'notifications' as const,
              title: 'Notifications',
              description: 'Native desktop notifications for agent and terminal events.',
              icon: Bell,
              searchEntries: NOTIFICATIONS_PANE_SEARCH_ENTRIES,
              group: 'interface'
            }
          ]
        : []),
      {
        id: 'shortcuts',
        title: 'Shortcuts',
        description: 'Keyboard shortcuts for common actions.',
        icon: Keyboard,
        searchEntries: SHORTCUTS_PANE_SEARCH_ENTRIES,
        group: 'interface'
      },
      {
        id: 'stats',
        title: 'Stats & Usage',
        description: 'Serper stats plus Claude, Codex, and OpenCode usage analytics.',
        icon: BarChart3,
        searchEntries: STATS_PANE_SEARCH_ENTRIES,
        group: 'interface'
      },
      {
        id: 'orchestration',
        title: 'Orchestration',
        description: 'Coordinate multiple coding agents through Serper.',
        icon: Network,
        searchEntries: ORCHESTRATION_PANE_SEARCH_ENTRIES,
        group: 'capabilities'
      },
      ...(showDesktopOnlySettings
        ? [
            {
              id: 'computer-use' as const,
              title: 'Computer Use',
              description: 'Enable agents to control any app on your computer.',
              icon: MousePointerClick,
              searchEntries: COMPUTER_USE_PANE_SEARCH_ENTRIES,
              group: 'capabilities',
              badge: 'Beta'
            },
            {
              id: 'voice' as const,
              title: 'Voice',
              description: 'Local speech-to-text dictation with on-device models.',
              icon: Mic,
              searchEntries: VOICE_PANE_SEARCH_ENTRIES,
              group: 'capabilities',
              badge: 'Beta'
            }
          ]
        : []),
      {
        id: 'servers',
        title: 'Remote Serper Servers',
        description: isWebClient
          ? 'Connect this browser to a saved Serper server.'
          : 'Switch between local desktop mode and paired remote Serper runtimes.',
        icon: Server,
        searchEntries: [runtimeEnvironmentsSearchEntry],
        group: 'remote',
        badge: 'Beta'
      },
      ...(showDesktopOnlySettings
        ? [
            {
              id: 'ssh' as const,
              title: 'SSH Hosts',
              description: 'Remote SSH hosts for files, terminals, and git.',
              icon: Cable,
              searchEntries: SSH_PANE_SEARCH_ENTRIES,
              group: 'remote'
            },
            {
              id: 'mobile' as const,
              title: 'Mobile',
              description: 'Control terminals and agents from your phone.',
              icon: Smartphone,
              searchEntries: MOBILE_SETTINGS_PANE_SEARCH_ENTRIES,
              group: 'remote',
              badge: 'Beta'
            }
          ]
        : []),
      ...(showDesktopOnlySettings && isMac
        ? [
            {
              id: 'developer-permissions' as const,
              title: 'macOS Permissions',
              description: 'macOS privacy access for terminal-launched developer tools.',
              icon: ShieldCheck,
              searchEntries: DEVELOPER_PERMISSIONS_PANE_SEARCH_ENTRIES,
              group: 'safety'
            }
          ]
        : []),
      {
        id: 'privacy',
        title: 'Privacy & Telemetry',
        description: 'Anonymous usage data and telemetry controls.',
        icon: Lock,
        searchEntries: PRIVACY_PANE_SEARCH_ENTRIES,
        group: 'safety'
      },
      {
        id: 'experimental',
        title: 'Experimental',
        description: 'New features that are still taking shape. Give them a try.',
        icon: FlaskConical,
        searchEntries: EXPERIMENTAL_PANE_SEARCH_ENTRIES,
        group: 'experimental'
      },
      ...repos.map((repo) => ({
        id: `repo-${repo.id}`,
        title: repo.displayName,
        description: `${getRepoKindLabel(repo)} • ${repo.path}`,
        icon: SlidersHorizontal,
        searchEntries: getRepositoryPaneSearchEntries(repo),
        group: 'repositories'
      }))
    ],
    [
      isMac,
      isWebClient,
      repos,
      runtimeEnvironmentsSearchEntry,
      showDesktopOnlySettings,
      terminalPaneSearchEntries
    ]
  )

  const visibleNavSections = useMemo(
    () =>
      settingsSearchQuery.trim() === ''
        ? navSections
        : navSections.filter((section) =>
            matchesSettingsSearch(settingsSearchQuery, section.searchEntries)
          ),
    [navSections, settingsSearchQuery]
  )

  const generalNavGroups: SettingsNavGroup[] = useMemo(() => {
    const generalSections = visibleNavSections.filter((s) => !s.id.startsWith('repo-'))
    return SETTINGS_NAV_GROUPS.map((group) => ({
      ...group,
      sections: generalSections.filter((section) => section.group === group.id)
    })).filter((group) => group.sections.length > 0)
  }, [visibleNavSections])

  const repoNavSections = useMemo(
    () =>
      visibleNavSections
        .filter((section) => section.id.startsWith('repo-'))
        .map((section) => {
          const repo = repos.find((entry) => entry.id === section.id.replace('repo-', ''))
          return { ...section, badgeColor: repo?.badgeColor, isRemote: !!repo?.connectionId }
        }),
    [repos, visibleNavSections]
  )

  // Navigate to the first visible section when search filters out current selection
  useEffect(() => {
    if (settingsSearchQuery.trim() === '') {
      return
    }
    const isCurrentVisible = visibleNavSections.some((s) => s.id === activeSectionId)
    if (!isCurrentVisible && visibleNavSections.length > 0) {
      const first = visibleNavSections[0]!
      setActiveSectionId(first.id)
      setActiveGroupId(first.id.startsWith('repo-') ? 'repositories' : first.group)
    }
  }, [activeSectionId, settingsSearchQuery, visibleNavSections])

  // Handle external navigation targets (e.g. deep links from other parts of the app)
  useEffect(() => {
    if (!settings || !settingsNavigationTarget) {
      return
    }
    const paneSectionId = getSettingsSectionId(
      settingsNavigationTarget.pane as SettingsNavTarget,
      settingsNavigationTarget.repoId
    )
    const groupId = findGroupForSection(paneSectionId, generalNavGroups)
    setActiveGroupId(groupId)
    setActiveSectionId(paneSectionId)
    clearSettingsTarget()
  }, [clearSettingsTarget, generalNavGroups, settings, settingsNavigationTarget])

  // Font loading
  useEffect(() => {
    if (activeSectionId !== 'appearance' && activeSectionId !== 'terminal') {
      return
    }
    if (terminalFontsLoadedRef.current) {
      return
    }
    let stale = false
    const loadFontSuggestions = async (): Promise<void> => {
      try {
        const fonts = await window.api.settings.listFonts()
        if (stale || fonts.length === 0) {
          return
        }
        terminalFontsLoadedRef.current = true
        setFontSuggestions((prev) =>
          Array.from(new Set([DEFAULT_APP_FONT_FAMILY, ...fonts, ...prev])).slice(0, 320)
        )
      } catch {
        // Fall back to curated cross-platform suggestions.
      }
    }
    void loadFontSuggestions()
    return () => {
      stale = true
    }
  }, [activeSectionId])

  // Windows shell capability detection
  useEffect(() => {
    if (!isWindows) {
      setWslAvailable(false)
      setPwshAvailable(false)
      terminalCapabilitiesLoadedRef.current = true
      return
    }
    if (activeSectionId !== 'terminal' || terminalCapabilitiesLoadedRef.current) {
      return
    }
    let stale = false
    terminalCapabilitiesLoadedRef.current = true
    void window.api.wsl.isAvailable().then((available) => {
      if (!stale) {
        setWslAvailable(available)
      }
    })
    void window.api.pwsh.isAvailable().then((available) => {
      if (!stale) {
        setPwshAvailable(available)
      }
    })
    return () => {
      stale = true
    }
  }, [activeSectionId, isWindows])

  // Repo hooks loading
  useEffect(() => {
    const repoIdSet = new Set(repos.map((repo) => repo.id))
    setRepoHooksMap((previous) => {
      const next = Object.fromEntries(
        Object.entries(previous).filter(([repoId]) => repoIdSet.has(repoId))
      ) as Record<string, { hasHooks: boolean; hooks: SerperHooks | null; mayNeedUpdate: boolean }>
      return Object.keys(next).length === Object.keys(previous).length ? previous : next
    })
  }, [repos])

  useEffect(() => {
    if (repoHooksRuntimeIdentityRef.current !== runtimeTargetIdentity) {
      repoHooksRuntimeIdentityRef.current = runtimeTargetIdentity
      repoHooksRequestSeqRef.current += 1
      setRepoHooksMap({})
    }
  }, [runtimeTargetIdentity])

  const activeRepoId = activeSectionId.startsWith('repo-')
    ? activeSectionId.replace('repo-', '')
    : null

  useEffect(() => {
    if (!activeRepoId) {
      return
    }
    if (repoHooksMap[activeRepoId]) {
      return
    }

    let stale = false
    const requestSeq = ++repoHooksRequestSeqRef.current
    const repo = repos.find((r) => r.id === activeRepoId)
    if (!repo) {
      return
    }

    if (isFolderRepo(repo)) {
      setRepoHooksMap((previous) => ({
        ...previous,
        [activeRepoId]: { hasHooks: false, hooks: null, mayNeedUpdate: false }
      }))
      return
    }

    void checkRuntimeHooks(
      runtimeTargetIdentity === 'local'
        ? { activeRuntimeEnvironmentId: null }
        : { activeRuntimeEnvironmentId: runtimeTargetIdentity },
      activeRepoId
    )
      .then((result) => {
        if (stale || requestSeq !== repoHooksRequestSeqRef.current) {
          return
        }
        setRepoHooksMap((previous) => ({ ...previous, [activeRepoId]: result }))
      })
      .catch(() => {
        if (stale || requestSeq !== repoHooksRequestSeqRef.current) {
          return
        }
        setRepoHooksMap((previous) => {
          if (previous[activeRepoId]) {
            return previous
          }
          return {
            ...previous,
            [activeRepoId]: { hasHooks: false, hooks: null, mayNeedUpdate: false }
          }
        })
      })

    return () => {
      stale = true
    }
  }, [activeRepoId, repoHooksMap, repos, runtimeTargetIdentity])

  const handleSelectSection = useCallback(
    (sectionId: string, event?: React.MouseEvent) => {
      if (sectionId !== activeSectionId && !confirmDiscardCommitPromptChanges()) {
        return
      }
      if (sectionId === 'experimental' && event?.shiftKey) {
        setHiddenExperimentalUnlocked((prev) => !prev)
      }
      setActiveSectionId(sectionId)
    },
    [activeSectionId, confirmDiscardCommitPromptChanges]
  )

  const handleSelectGroup = useCallback(
    (groupId: string) => {
      if (!confirmDiscardCommitPromptChanges()) {
        return
      }
      setActiveGroupId(groupId)
    },
    [confirmDiscardCommitPromptChanges]
  )

  const openComputerUseFromBrowser = useCallback(() => {
    if (!confirmDiscardCommitPromptChanges()) {
      return
    }
    setActiveGroupId('capabilities')
    setActiveSectionId('computer-use')
  }, [confirmDiscardCommitPromptChanges])

  if (!settings) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading settings...
      </div>
    )
  }

  const activeSection = navSections.find((s) => s.id === activeSectionId)

  return (
    <div className="settings-view-shell flex min-h-0 flex-1 overflow-hidden bg-background">
      <SettingsSidebar
        activeGroupId={activeGroupId}
        activeSectionId={activeSectionId}
        generalGroups={generalNavGroups}
        repoSections={repoNavSections}
        hasRepos={repos.length > 0}
        searchQuery={settingsSearchInputQuery}
        searchInputRef={searchInputRef}
        onBack={closeSettingsPageWithPromptGuard}
        onSearchChange={setSettingsSearchQuery}
        onSelectGroup={handleSelectGroup}
        onSelectSection={handleSelectSection}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeSection ? (
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-sleek">
            <div className="mx-auto w-full max-w-3xl px-10 py-8">
              <header className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{activeSection.title}</h1>
                  {activeSection.badge ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {activeSection.badge}
                    </span>
                  ) : null}
                  {activeSectionId === 'computer-use' && showComputerUsePreviewTooltip ? (
                    <TooltipProvider delayDuration={250}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={`${computerUsePlatform} Computer Use preview details`}
                          >
                            <Info className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-72">
                          <span>
                            {computerUsePlatform} Computer Use is an early preview. Some apps and
                            desktop environments may behave inconsistently.
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                  {activeSectionId === 'terminal' ? (
                    <div className="ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => void ghostty.handleClick()}
                      >
                        <img src={ghosttyIcon} alt="" aria-hidden="true" className="size-4" />
                        Import from Ghostty
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{activeSection.description}</p>
              </header>

              <div className="space-y-6">
                {renderActivePane({
                  activeSectionId,
                  settings,
                  updateSettings,
                  switchRuntimeEnvironment,
                  systemPrefersDark,
                  applyTheme,
                  fontSuggestions,
                  scrollbackMode,
                  setScrollbackMode,
                  ghostty,
                  wslAvailable,
                  pwshAvailable,
                  displayedGitUsername,
                  hasUnsavedCommitPromptChanges,
                  setHasUnsavedCommitPromptChanges,
                  commitPromptDiscardSignal,
                  hiddenExperimentalUnlocked,
                  showDesktopOnlySettings,
                  isWebClient,
                  repos,
                  updateRepo,
                  removeRepo,
                  repoHooksMap,
                  openComputerUseFromBrowser,
                  runtimeEnvironmentsSearchEntry,
                  terminalPaneSearchEntries
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
            {settingsSearchQuery.trim()
              ? `No settings found for "${settingsSearchQuery.trim()}"`
              : 'Select a section from the sidebar.'}
          </div>
        )}
      </div>
    </div>
  )
}

type RenderPaneArgs = {
  activeSectionId: string
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  switchRuntimeEnvironment: (id: string | null) => Promise<boolean>
  systemPrefersDark: boolean
  applyTheme: (theme: GlobalSettings['theme']) => void
  fontSuggestions: string[]
  scrollbackMode: 'preset' | 'custom'
  setScrollbackMode: (mode: 'preset' | 'custom') => void
  ghostty: ReturnType<typeof useGhosttyImport>
  wslAvailable: boolean
  pwshAvailable: boolean
  displayedGitUsername: string
  hasUnsavedCommitPromptChanges: boolean
  setHasUnsavedCommitPromptChanges: (value: boolean) => void
  commitPromptDiscardSignal: number
  hiddenExperimentalUnlocked: boolean
  showDesktopOnlySettings: boolean
  isWebClient: boolean
  repos: Repo[]
  updateRepo: (repoId: string, updates: Partial<Repo>) => Promise<void>
  removeRepo: (repoId: string) => Promise<void>
  repoHooksMap: Record<
    string,
    { hasHooks: boolean; hooks: SerperHooks | null; mayNeedUpdate: boolean }
  >
  openComputerUseFromBrowser: () => void
  runtimeEnvironmentsSearchEntry: SettingsSearchEntry
  terminalPaneSearchEntries: SettingsSearchEntry[]
}

function renderActivePane(args: RenderPaneArgs): React.JSX.Element | null {
  const {
    activeSectionId,
    settings,
    updateSettings,
    switchRuntimeEnvironment,
    applyTheme,
    fontSuggestions,
    scrollbackMode,
    setScrollbackMode,
    ghostty,
    wslAvailable,
    pwshAvailable,
    displayedGitUsername,
    setHasUnsavedCommitPromptChanges,
    commitPromptDiscardSignal,
    hiddenExperimentalUnlocked,
    isWebClient,
    repos,
    updateRepo,
    removeRepo,
    repoHooksMap,
    openComputerUseFromBrowser,
    systemPrefersDark
  } = args

  switch (activeSectionId) {
    case 'general':
      return <GeneralPane settings={settings} updateSettings={updateSettings} />
    case 'agents':
      return <AgentsPane settings={settings} updateSettings={updateSettings} />
    case 'accounts':
      return <AccountsPane settings={settings} updateSettings={updateSettings} />
    case 'integrations':
      return <IntegrationsPane />
    case 'git':
      return (
        <>
          <GitPane
            settings={settings}
            updateSettings={updateSettings}
            displayedGitUsername={displayedGitUsername}
          />
          <CommitMessageAiPane
            settings={settings}
            updateSettings={updateSettings}
            onCustomPromptDirtyChange={setHasUnsavedCommitPromptChanges}
            customPromptDiscardSignal={commitPromptDiscardSignal}
          />
        </>
      )
    case 'tasks':
      return <TasksPane settings={settings} updateSettings={updateSettings} />
    case 'rules':
      return <RulesPane />
    case 'triggers':
      return <TriggersPane settings={settings} updateSettings={updateSettings} />
    case 'terminal':
      return (
        <TerminalPane
          settings={settings}
          updateSettings={updateSettings}
          systemPrefersDark={systemPrefersDark}
          terminalFontSuggestions={fontSuggestions.filter(
            (font) => font !== DEFAULT_APP_FONT_FAMILY
          )}
          scrollbackMode={scrollbackMode}
          setScrollbackMode={setScrollbackMode}
          ghostty={ghostty}
          wslAvailable={wslAvailable}
          pwshAvailable={pwshAvailable}
        />
      )
    case 'browser':
      return (
        <BrowserPane
          settings={settings}
          updateSettings={updateSettings}
          onOpenComputerUse={openComputerUseFromBrowser}
        />
      )
    case 'appearance':
      return (
        <AppearancePane
          settings={settings}
          updateSettings={updateSettings}
          applyTheme={applyTheme}
          fontSuggestions={fontSuggestions}
        />
      )
    case 'input':
      return <InputPane settings={settings} updateSettings={updateSettings} />
    case 'notifications':
      return <NotificationsPane settings={settings} updateSettings={updateSettings} />
    case 'shortcuts':
      return <ShortcutsPane />
    case 'stats':
      return <StatsPane />
    case 'orchestration':
      return <OrchestrationPane />
    case 'computer-use':
      return <ComputerUsePane />
    case 'voice':
      return <VoicePane settings={settings} updateSettings={updateSettings} />
    case 'servers':
      return (
        <RuntimeEnvironmentsPane
          settings={settings}
          switchRuntimeEnvironment={switchRuntimeEnvironment}
          canGeneratePairingUrl={!isWebClient}
          allowLocalRuntime={!isWebClient}
        />
      )
    case 'ssh':
      return <SshPane />
    case 'mobile':
      return <MobileSettingsPane settings={settings} updateSettings={updateSettings} />
    case 'developer-permissions':
      return <DeveloperPermissionsPane />
    case 'privacy':
      return <PrivacyPane settings={settings} />
    case 'experimental':
      return (
        <ExperimentalPane
          settings={settings}
          updateSettings={updateSettings}
          hiddenExperimentalUnlocked={hiddenExperimentalUnlocked}
        />
      )
    default: {
      if (activeSectionId.startsWith('repo-')) {
        const repoId = activeSectionId.replace('repo-', '')
        const repo = repos.find((r) => r.id === repoId)
        if (!repo) {
          return null
        }
        const repoHooksState = repoHooksMap[repoId]
        return (
          <RepositoryPane
            repo={repo}
            yamlHooks={repoHooksState?.hooks ?? null}
            hasHooksFile={repoHooksState?.hasHooks ?? false}
            mayNeedUpdate={repoHooksState?.mayNeedUpdate ?? false}
            updateRepo={updateRepo}
            removeRepo={removeRepo}
          />
        )
      }
      return null
    }
  }
}

export default Settings
