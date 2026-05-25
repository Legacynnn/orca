import type { CommandHandler } from '../dispatch'
import { printResult } from '../format'
import { getOptionalStringFlag, getRequiredPositiveNumber, getRequiredStringFlag } from '../flags'
import { resolveCurrentWorktreeSelector } from '../selectors'
import type { DiffComment } from '../../shared/types'

type PlanCommentLeaveResult = { comment: DiffComment }
type PlanCommentListResult = { comments: DiffComment[] }

function formatLeave(payload: PlanCommentLeaveResult): string {
  const c = payload.comment
  const range =
    c.startLine && c.startLine !== c.lineNumber
      ? `${c.startLine}-${c.lineNumber}`
      : `${c.lineNumber}`
  return `Left comment ${c.id} on ${c.filePath}:${range}`
}

function formatList(payload: PlanCommentListResult): string {
  if (payload.comments.length === 0) {
    return 'No plan comments yet.'
  }
  return payload.comments
    .map((c) => {
      const range =
        c.startLine && c.startLine !== c.lineNumber
          ? `${c.startLine}-${c.lineNumber}`
          : `${c.lineNumber}`
      const author =
        c.authoredBy?.kind === 'agent'
          ? `${c.authoredBy.harness}${c.authoredBy.model ? ` · ${c.authoredBy.model}` : ''}`
          : 'user'
      return `${c.filePath}:${range}  [${author}]  ${c.body.replace(/\s+/g, ' ').slice(0, 120)}`
    })
    .join('\n')
}

export const PLAN_COMMENT_HANDLERS: Record<string, CommandHandler> = {
  'plan-comment leave': async ({ flags, client, cwd, json }) => {
    const file = getRequiredStringFlag(flags, 'file')
    const lineStart = getRequiredPositiveNumber(flags, 'line-start')
    const lineEnd = getRequiredPositiveNumber(flags, 'line-end')
    const body = getRequiredStringFlag(flags, 'body')
    const worktreeFlag = getOptionalStringFlag(flags, 'worktree')
    const worktree = worktreeFlag ?? (await resolveCurrentWorktreeSelector(cwd, client))
    const result = await client.call<PlanCommentLeaveResult>('plan-comment.leave', {
      worktree,
      file,
      lineStart,
      lineEnd,
      body,
      ...(getOptionalStringFlag(flags, 'harness')
        ? { harness: getOptionalStringFlag(flags, 'harness') }
        : {}),
      ...(getOptionalStringFlag(flags, 'model')
        ? { model: getOptionalStringFlag(flags, 'model') }
        : {})
    })
    printResult(result, json, formatLeave)
  },
  'plan-comment list': async ({ flags, client, cwd, json }) => {
    const file = getOptionalStringFlag(flags, 'file')
    const worktreeFlag = getOptionalStringFlag(flags, 'worktree')
    const worktree = worktreeFlag ?? (await resolveCurrentWorktreeSelector(cwd, client))
    const result = await client.call<PlanCommentListResult>('plan-comment.list', {
      worktree,
      ...(file ? { file } : {})
    })
    printResult(result, json, formatList)
  }
}
