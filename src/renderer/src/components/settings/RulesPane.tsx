import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Rule, RuleSummary } from '../../../../shared/rule-metadata'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '@/lib/utils'
import { invalidateRulesList } from '@/hooks/useRulesList'

export { RULES_PANE_SEARCH_ENTRIES } from './rules-search'

type EditState = {
  slug: string | null
  name: string
  description: string
  body: string
}

const EMPTY_DRAFT: EditState = { slug: null, name: '', description: '', body: '' }

function asDraft(rule: Rule): EditState {
  return {
    slug: rule.slug,
    name: rule.name,
    description: rule.description ?? '',
    body: rule.body
  }
}

function isDirty(draft: EditState, original: EditState | null): boolean {
  if (!original) {
    return draft.name.trim().length > 0 || draft.body.trim().length > 0
  }
  return (
    draft.name !== original.name ||
    draft.description !== original.description ||
    draft.body !== original.body
  )
}

export function RulesPane(): React.JSX.Element {
  const [rules, setRules] = useState<RuleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditState>(EMPTY_DRAFT)
  const [original, setOriginal] = useState<EditState | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.api.rules.list()
      setRules(list)
    } catch (error) {
      console.error('Failed to load rules', error)
      toast.error('Could not load rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (activeSlug === null) {
      return
    }
    let cancelled = false
    setEditLoading(true)
    void window.api.rules.read(activeSlug).then((rule) => {
      if (cancelled) {
        return
      }
      if (!rule) {
        toast.error('Rule no longer exists')
        setActiveSlug(null)
        setDraft(EMPTY_DRAFT)
        setOriginal(null)
        void refresh()
        return
      }
      const d = asDraft(rule)
      setDraft(d)
      setOriginal(d)
      setEditLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [activeSlug, refresh])

  const dirty = useMemo(() => isDirty(draft, original), [draft, original])

  const handleNew = (): void => {
    setActiveSlug(null)
    setDraft(EMPTY_DRAFT)
    setOriginal(null)
  }

  const handleSelect = (slug: string): void => {
    if (dirty && activeSlug !== slug) {
      const confirmed = window.confirm('Discard unsaved changes to this rule?')
      if (!confirmed) {
        return
      }
    }
    setActiveSlug(slug)
  }

  const handleSave = async (): Promise<void> => {
    const name = draft.name.trim()
    const body = draft.body.trim()
    if (!name) {
      toast.error('Rule name is required')
      return
    }
    if (!body) {
      toast.error('Rule body is required')
      return
    }
    setSaving(true)
    try {
      const input = {
        name,
        description: draft.description.trim() || null,
        body
      }
      const result = draft.slug
        ? await window.api.rules.update({ slug: draft.slug, input })
        : await window.api.rules.create(input)
      setRules(result.rules)
      invalidateRulesList(result.rules)
      const next = asDraft(result.rule)
      setDraft(next)
      setOriginal(next)
      setActiveSlug(result.rule.slug)
      toast.success(draft.slug ? 'Rule updated' : 'Rule created')
    } catch (error) {
      console.error('Failed to save rule', error)
      toast.error(error instanceof Error ? error.message : 'Could not save rule')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = (): void => {
    if (original) {
      setDraft(original)
    } else {
      setDraft(EMPTY_DRAFT)
    }
  }

  const handleDelete = async (slug: string): Promise<void> => {
    try {
      const next = await window.api.rules.delete(slug)
      setRules(next)
      invalidateRulesList(next)
      if (activeSlug === slug) {
        setActiveSlug(null)
        setDraft(EMPTY_DRAFT)
        setOriginal(null)
      }
      toast.success('Rule deleted')
    } catch (error) {
      console.error('Failed to delete rule', error)
      toast.error('Could not delete rule')
    } finally {
      setConfirmingDelete(null)
    }
  }

  const noSelection = activeSlug === null && draft.slug === null && draft === EMPTY_DRAFT

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Rules are reusable kickoff prompts. When you attach a rule to a new agent session in the
          composer, the rule body is sent silently as the agent&apos;s first message.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-2 lg:max-h-[28rem]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="justify-start gap-2"
          >
            <Plus className="size-3.5" />
            New rule
          </Button>

          <div className="flex-1 overflow-y-auto rounded-md border border-border bg-background">
            {loading ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">Loading rules…</div>
            ) : rules.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                No rules yet. Create one to get started.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {rules.map((rule) => {
                  const isActive = rule.slug === (activeSlug ?? draft.slug)
                  const confirming = confirmingDelete === rule.slug
                  return (
                    <li key={rule.slug} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleSelect(rule.slug)}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 px-2 py-2 text-left transition-colors',
                          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/40'
                        )}
                      >
                        <span className="line-clamp-1 text-sm font-medium">{rule.name}</span>
                        {rule.description ? (
                          <span className="line-clamp-2 text-[11px] text-muted-foreground">
                            {rule.description}
                          </span>
                        ) : null}
                      </button>
                      <div className="absolute right-1 top-1.5">
                        {confirming ? (
                          <div className="flex items-center gap-1 rounded-md bg-background/90 px-1 py-0.5 text-[11px] shadow-sm">
                            <span className="text-muted-foreground">Delete?</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="h-5 px-1.5 text-xs"
                              onClick={() => void handleDelete(rule.slug)}
                            >
                              Yes
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="h-5 px-1.5 text-xs"
                              onClick={() => setConfirmingDelete(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="size-5 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label={`Delete rule ${rule.name}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setConfirmingDelete(rule.slug)
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {noSelection && rules.length > 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
              Select a rule on the left, or create a new one.
            </div>
          ) : editLoading ? (
            <div className="rounded-md border border-border px-4 py-8 text-center text-xs text-muted-foreground">
              Loading rule…
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="rule-name">Name</Label>
                <Input
                  id="rule-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Strict TDD"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rule-description">
                  Description{' '}
                  <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="rule-description"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="One line summary for the rule list"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rule-body">Rule body</Label>
                <p className="text-[11px] text-muted-foreground">
                  Markdown. Sent verbatim as the agent&apos;s first message when this rule is
                  attached.
                </p>
                <textarea
                  id="rule-body"
                  rows={14}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="Always start by reading CONTEXT.md, then..."
                  spellCheck={false}
                  className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">
                  {dirty ? 'Unsaved changes' : original ? 'Saved' : 'Draft'}
                </p>
                <div className="flex items-center gap-2">
                  {dirty ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDiscard}
                      disabled={saving}
                    >
                      Discard
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSave()}
                    disabled={!dirty || saving}
                  >
                    {saving ? 'Saving…' : original ? 'Save' : 'Create rule'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
