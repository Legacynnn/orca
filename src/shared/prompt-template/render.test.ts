import { describe, expect, it } from 'vitest'
import { extractTemplateVariables, renderTemplate } from './render'

describe('renderTemplate', () => {
  it('substitutes simple placeholders', () => {
    const result = renderTemplate('Hello {{name}}!', { name: 'World' })
    expect(result.text).toBe('Hello World!')
    expect(result.referenced).toEqual(['name'])
    expect(result.missing).toEqual([])
  })

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('{{ foo }} {{bar}}', { foo: 'a', bar: 'b' }).text).toBe('a b')
  })

  it('replaces missing or nullish variables with an empty string and reports them', () => {
    const result = renderTemplate('A {{x}} B {{y}} C', { x: null })
    expect(result.text).toBe('A  B  C')
    expect(result.missing.sort()).toEqual(['x', 'y'])
  })

  it('coerces numbers and skips non-finite values', () => {
    expect(renderTemplate('{{count}}', { count: 7 }).text).toBe('7')
    expect(renderTemplate('{{count}}', { count: Number.NaN }).missing).toContain('count')
  })

  it('does not re-process substituted output', () => {
    const result = renderTemplate('{{a}}', { a: '{{b}}' })
    expect(result.text).toBe('{{b}}')
    expect(result.referenced).toEqual(['a'])
  })

  it('ignores tokens that look like placeholders but are malformed', () => {
    const result = renderTemplate('{{ 1foo }} {{bar }', { bar: 'x' })
    expect(result.text).toBe('{{ 1foo }} {{bar }')
    expect(result.referenced).toEqual([])
  })

  it('extracts template variables without rendering', () => {
    expect(extractTemplateVariables('Hi {{a}} and {{ b }}; {{a}} again').sort()).toEqual(['a', 'b'])
  })
})
