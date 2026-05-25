import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { defineMethod, type RpcAnyMethod } from '../core'
import type { DiffComment } from '../../../../shared/types'

const StringSelector = z
  .unknown()
  .transform((value) => (typeof value === 'string' ? value : ''))
  .pipe(z.string().min(1))

const OptionalString = z
  .unknown()
  .transform((value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  .optional()

const PositiveInt = z
  .unknown()
  .transform((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  })
  .pipe(z.number().int().positive())

const PlanCommentLeave = z.object({
  worktree: StringSelector,
  file: StringSelector,
  lineStart: PositiveInt,
  lineEnd: PositiveInt,
  body: StringSelector,
  harness: OptionalString,
  model: OptionalString
})

const PlanCommentList = z.object({
  worktree: StringSelector,
  file: OptionalString
})

function buildComment(args: {
  worktreeId: string
  filePath: string
  lineStart: number
  lineEnd: number
  body: string
  harness?: string
  model?: string
}): DiffComment {
  const isAgent = Boolean(args.harness)
  const startLine = Math.min(args.lineStart, args.lineEnd)
  const endLine = Math.max(args.lineStart, args.lineEnd)
  return {
    id: randomUUID(),
    worktreeId: args.worktreeId,
    filePath: args.filePath,
    source: 'markdown',
    startLine,
    lineNumber: endLine,
    body: args.body,
    createdAt: Date.now(),
    side: 'modified',
    authoredBy: isAgent
      ? {
          kind: 'agent',
          harness: args.harness ?? 'unknown',
          model: args.model ?? null
        }
      : { kind: 'user' }
  }
}

export const PLAN_COMMENT_METHODS: readonly RpcAnyMethod[] = [
  defineMethod({
    name: 'plan-comment.leave',
    params: PlanCommentLeave,
    handler: async (params, { runtime }) => {
      // Why: resolve via the runtime so the CLI can pass a relative cwd
      // selector (e.g. via `resolveCurrentWorktreeSelector` on the client
      // side), then atomically read-merge-write the diffComments array to
      // avoid losing a concurrent comment.
      const worktreeRecord = await runtime.showManagedWorktree(params.worktree)
      const existing = (worktreeRecord.diffComments ?? []) as DiffComment[]
      const comment = buildComment({
        worktreeId: worktreeRecord.id,
        filePath: params.file,
        lineStart: params.lineStart,
        lineEnd: params.lineEnd,
        body: params.body,
        ...(params.harness ? { harness: params.harness } : {}),
        ...(params.model ? { model: params.model } : {})
      })
      const next = [...existing, comment]
      await runtime.updateManagedWorktreeMeta(`id:${worktreeRecord.id}`, {
        diffComments: next
      })
      return { comment }
    }
  }),
  defineMethod({
    name: 'plan-comment.list',
    params: PlanCommentList,
    handler: async (params, { runtime }) => {
      const worktreeRecord = await runtime.showManagedWorktree(params.worktree)
      const all = (worktreeRecord.diffComments ?? []) as DiffComment[]
      const filtered = params.file ? all.filter((comment) => comment.filePath === params.file) : all
      return { comments: filtered }
    }
  })
]
