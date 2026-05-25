// Why: triggers ship default prompts with `{{var}}` placeholders that are
// filled in at invocation time from the current UI context (diff text,
// branch name, plan content, etc.). This tiny renderer intentionally does
// not handle conditionals or loops — anything more than literal substitution
// belongs in the calling code, not the template.

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g

export type TemplateContext = Record<string, string | number | null | undefined>

export type RenderResult = {
  /** Rendered string. Missing variables are replaced with an empty string. */
  text: string
  /** Names of `{{var}}` tokens referenced by the template. */
  referenced: string[]
  /** Subset of `referenced` that had no value in the supplied context (or
   *  the value was null/undefined). The caller decides whether to warn. */
  missing: string[]
}

function coerceValue(value: TemplateContext[string]): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null
  }
  return value
}

export function renderTemplate(template: string, context: TemplateContext): RenderResult {
  const referenced = new Set<string>()
  const missing = new Set<string>()
  const text = template.replace(PLACEHOLDER_PATTERN, (_match, key: string) => {
    referenced.add(key)
    if (!(key in context)) {
      missing.add(key)
      return ''
    }
    const coerced = coerceValue(context[key])
    if (coerced === null) {
      missing.add(key)
      return ''
    }
    return coerced
  })
  return {
    text,
    referenced: Array.from(referenced),
    missing: Array.from(missing)
  }
}

export function extractTemplateVariables(template: string): string[] {
  const variables = new Set<string>()
  let match: RegExpExecArray | null
  const pattern = new RegExp(PLACEHOLDER_PATTERN.source, 'g')
  while ((match = pattern.exec(template)) !== null) {
    variables.add(match[1])
  }
  return Array.from(variables)
}
