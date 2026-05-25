import { useEffect, useState } from 'react'
import type { Rule, RuleSummary } from '../../../shared/rule-metadata'

let cachedRules: RuleSummary[] | null = null
const listeners = new Set<(rules: RuleSummary[]) => void>()
let inflight: Promise<RuleSummary[]> | null = null

async function loadRules(): Promise<RuleSummary[]> {
  if (cachedRules) {
    return cachedRules
  }
  if (inflight) {
    return inflight
  }
  inflight = window.api.rules
    .list()
    .then((rules) => {
      cachedRules = rules
      inflight = null
      for (const fn of listeners) {
        fn(rules)
      }
      return rules
    })
    .catch((error) => {
      inflight = null
      throw error
    })
  return inflight
}

function publish(rules: RuleSummary[]): void {
  cachedRules = rules
  for (const fn of listeners) {
    fn(rules)
  }
}

export function invalidateRulesList(rules?: RuleSummary[]): void {
  if (rules) {
    publish(rules)
    return
  }
  cachedRules = null
  void loadRules().catch(() => {})
}

export function useRulesList(): {
  rules: RuleSummary[]
  loading: boolean
} {
  const [rules, setRules] = useState<RuleSummary[]>(cachedRules ?? [])
  const [loading, setLoading] = useState<boolean>(cachedRules === null)

  useEffect(() => {
    listeners.add(setRules)
    return () => {
      listeners.delete(setRules)
    }
  }, [])

  useEffect(() => {
    if (cachedRules) {
      return
    }
    setLoading(true)
    void loadRules()
      .then((next) => setRules(next))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { rules, loading }
}

export async function loadRuleBody(slug: string): Promise<Rule | null> {
  try {
    return await window.api.rules.read(slug)
  } catch {
    return null
  }
}
