import type { DiffComment } from '../../../../shared/types'

function authorLabel(comment: DiffComment): string {
  const author = comment.authoredBy
  if (!author || author.kind === 'user') {
    return 'user'
  }
  if (author.acceptedAt) {
    return `${author.harness}${author.model ? ` · ${author.model}` : ''} (accepted)`
  }
  return `${author.harness}${author.model ? ` · ${author.model}` : ''}`
}

function rangeLabel(comment: DiffComment): string {
  if (comment.startLine && comment.startLine !== comment.lineNumber) {
    return `lines ${comment.startLine}-${comment.lineNumber}`
  }
  return `line ${comment.lineNumber}`
}

/** Renders comments into a markdown block suitable for the
 *  `apply-plan-comments` trigger's `{{comments}}` template variable. */
export function formatPlanCommentsForTrigger(
  comments: DiffComment[],
  options: { filterFilePath?: string } = {}
): string {
  const filtered = options.filterFilePath
    ? comments.filter((comment) => comment.filePath === options.filterFilePath)
    : comments
  if (filtered.length === 0) {
    return '(no comments)'
  }
  // Why: order by anchor line then creation time so the agent walks the
  // plan top-to-bottom and gets stable ordering across re-runs of the same
  // set of comments.
  const sorted = [...filtered].sort((a, b) => {
    const lineDelta = (a.startLine ?? a.lineNumber) - (b.startLine ?? b.lineNumber)
    if (lineDelta !== 0) {
      return lineDelta
    }
    return a.createdAt - b.createdAt
  })
  return sorted
    .map((comment, index) => {
      const header = `### Comment ${index + 1} — ${rangeLabel(comment)} (${authorLabel(comment)})`
      return `${header}\n\n${comment.body.trim()}`
    })
    .join('\n\n')
}
