import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

const LEAVE_FLAGS = [
  ...GLOBAL_FLAGS,
  'worktree',
  'file',
  'line-start',
  'line-end',
  'body',
  'harness',
  'model'
]

const LIST_FLAGS = [...GLOBAL_FLAGS, 'worktree', 'file']

export const PLAN_COMMENT_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['plan-comment', 'leave'],
    summary: 'Leave an anchored comment on a plan markdown file',
    usage:
      'serper plan-comment leave --file <path> --line-start <N> --line-end <M> --body "..." [--harness <id>] [--model <id>] [--worktree <selector>] [--json]',
    allowedFlags: LEAVE_FLAGS
  },
  {
    path: ['plan-comment', 'list'],
    summary: 'List plan comments for the current (or specified) worktree',
    usage: 'serper plan-comment list [--file <path>] [--worktree <selector>] [--json]',
    allowedFlags: LIST_FLAGS
  }
]
