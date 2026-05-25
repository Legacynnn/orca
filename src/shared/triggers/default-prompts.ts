import type { TriggerDefinition, TriggerId } from './types'

export const TRIGGER_DEFINITIONS: Record<TriggerId, TriggerDefinition> = {
  'diff-review': {
    id: 'diff-review',
    name: 'Diff review',
    description: 'Spawn an agent to review the uncommitted/unpushed diff on this branch.',
    surfaceLabel: 'Source Control panel, when changes exist',
    variables: ['branchName', 'baseBranch'],
    output: 'chat',
    defaultPrompt:
      `Review the diff on this branch for bugs, design issues, and missing edge cases. ` +
      `Be direct and prioritise things that would matter in code review — skip nitpicks.\n\n` +
      `Branch: {{branchName}} (base: {{baseBranch}})\n\n` +
      `Fetch the diff yourself:\n` +
      '- Unpushed commits: `git diff {{baseBranch}}...{{branchName}}`\n' +
      '- Working tree changes: `git diff` and `git diff --staged`\n'
  },
  'branch-summarize': {
    id: 'branch-summarize',
    name: 'Branch summarize',
    description:
      'Spawn an agent to summarize what changed on this branch vs the base — useful before opening a PR.',
    surfaceLabel: 'Source Control panel, when changes exist',
    variables: ['branchName', 'baseBranch'],
    output: 'chat',
    defaultPrompt:
      `Summarise what changed on branch {{branchName}} versus {{baseBranch}}. ` +
      `Group changes by intent (feature / fix / refactor / chore) and call out anything ` +
      `that looks risky or out of scope.\n\n` +
      'Fetch the diff with `git diff {{baseBranch}}...{{branchName}}` and the commit list ' +
      'with `git log --oneline {{baseBranch}}..{{branchName}}` before answering.\n'
  },
  'pr-creation': {
    id: 'pr-creation',
    name: 'Draft PR',
    description: 'Spawn an agent to draft a PR title and body for the current branch.',
    surfaceLabel: 'Pull Request panel, when no PR exists yet',
    variables: ['branchName', 'baseBranch'],
    output: 'chat',
    defaultPrompt:
      `Draft a pull-request title and body for branch {{branchName}} (base: {{baseBranch}}).\n\n` +
      `- Title: under 70 characters, imperative voice, no prefix.\n` +
      `- Body: a Summary section (1-3 bullets) and a Test plan section ` +
      `(checklist of how to verify).\n` +
      `- Don't speculate about scope you can't see in the diff.\n\n` +
      'Fetch the diff with `git diff {{baseBranch}}...{{branchName}}` and the commit list with ' +
      '`git log --oneline {{baseBranch}}..{{branchName}}` before drafting.\n'
  },
  'pr-review': {
    id: 'pr-review',
    name: 'PR review',
    description: 'Spawn an agent to review the open PR — description, files, and intent.',
    surfaceLabel: 'Pull Request panel, when a PR is open · GitHub PR dialog',
    variables: ['prTitle', 'prBody', 'prNumber', 'prUrl', 'prFilesSummary'],
    output: 'chat',
    defaultPrompt:
      `Review PR #{{prNumber}}: {{prTitle}}\n` +
      `URL: {{prUrl}}\n\n` +
      `Look for bugs, design issues, missing tests, and scope creep ` +
      `(changes that don't match the stated intent in the description).\n\n` +
      `Fetch the full diff yourself with \`gh pr diff {{prNumber}}\` — the ` +
      `files-changed summary below is just a fast reference.\n\n` +
      `## PR description\n\n{{prBody}}\n\n` +
      `## Files changed\n\n{{prFilesSummary}}\n`
  },
  'plan-review': {
    id: 'plan-review',
    name: 'Plan review',
    description:
      'Spawn an agent to review a plan markdown file and leave anchored comments on specific lines.',
    surfaceLabel: 'Plan editor toolbar (.md files)',
    variables: ['planContent', 'planPath'],
    output: 'structured-comments',
    defaultPrompt:
      `Review the plan at {{planPath}}. For every observation, call:\n\n` +
      '```\nserper plan-comment leave --file {{planPath}} --line-start <N> --line-end <M> --body "..."\n```\n\n' +
      `Use one tool call per observation. Do NOT reply in chat — every piece of ` +
      `feedback must be an anchored plan-comment so the human can accept or reject ` +
      `each one individually.\n\n` +
      `See the bundled "plan-review" skill for the full protocol.\n\n` +
      `## Plan content\n\n{{planContent}}\n`
  },
  'apply-plan-comments': {
    id: 'apply-plan-comments',
    name: 'Apply plan comments',
    description: 'Spawn an agent to rewrite a plan file, incorporating the comments left on it.',
    surfaceLabel: 'Plan editor, when comments exist',
    variables: ['planContent', 'planPath', 'comments'],
    output: 'chat',
    defaultPrompt:
      `Rewrite the plan at {{planPath}}, incorporating the feedback below. ` +
      `Edit the file in place. Preserve any structure the comments do not ` +
      `address.\n\n` +
      `## Current plan\n\n{{planContent}}\n\n` +
      `## Comments to incorporate\n\n{{comments}}\n`
  }
}
