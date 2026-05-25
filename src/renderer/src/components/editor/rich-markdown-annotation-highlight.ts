import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

type RichMarkdownAnnotationHighlightState = {
  activeRange: RichMarkdownAnnotationHighlightRange | null
  noteRanges: RichMarkdownAnnotationHighlightRange[]
  decorations: DecorationSet
}

export type RichMarkdownAnnotationHighlightRange = {
  from: number
  to: number
  /** When present, decorations get a data-comment-id attribute so hover/click
   *  handlers in the editor can route back to the originating comment. Only
   *  the persistent noteRanges carry this — activeRange is anonymous. */
  commentId?: string
}

type RichMarkdownAnnotationHighlightMeta = {
  activeRange?: RichMarkdownAnnotationHighlightRange | null
  noteRanges?: RichMarkdownAnnotationHighlightRange[]
} | null

export const richMarkdownAnnotationHighlightPluginKey =
  new PluginKey<RichMarkdownAnnotationHighlightState>('richMarkdownAnnotationHighlight')

function createAnnotationDecorations(
  doc: ProseMirrorNode,
  activeRange: RichMarkdownAnnotationHighlightRange | null,
  noteRanges: RichMarkdownAnnotationHighlightRange[]
): DecorationSet {
  // Why: noteRanges get the calm persistent highlight; activeRange is used
  // both for the "currently composing" popover selection and for hover from
  // a note card in the rail, and gets a stronger class so it pops above the
  // baseline note tint.
  const decorations: Decoration[] = []
  for (const range of noteRanges) {
    const from = Math.min(range.from, range.to)
    const to = Math.max(range.from, range.to)
    if (from === to) {
      continue
    }
    const attrs: Record<string, string> = { class: 'rich-markdown-annotation-selection' }
    if (range.commentId) {
      attrs['data-comment-id'] = range.commentId
    }
    decorations.push(Decoration.inline(from, to, attrs))
  }
  if (activeRange) {
    const from = Math.min(activeRange.from, activeRange.to)
    const to = Math.max(activeRange.from, activeRange.to)
    if (from !== to) {
      decorations.push(Decoration.inline(from, to, { class: 'rich-markdown-annotation-active' }))
    }
  }
  return decorations.length === 0 ? DecorationSet.empty : DecorationSet.create(doc, decorations)
}

function createRichMarkdownAnnotationHighlightPlugin(): Plugin<RichMarkdownAnnotationHighlightState> {
  return new Plugin<RichMarkdownAnnotationHighlightState>({
    key: richMarkdownAnnotationHighlightPluginKey,
    state: {
      init: () => ({
        activeRange: null,
        noteRanges: [],
        decorations: DecorationSet.empty
      }),
      apply: (tr, pluginState) => {
        const meta = tr.getMeta(richMarkdownAnnotationHighlightPluginKey) as
          | RichMarkdownAnnotationHighlightMeta
          | undefined
        if (meta === null) {
          return {
            activeRange: null,
            noteRanges: pluginState.noteRanges,
            decorations: createAnnotationDecorations(tr.doc, null, pluginState.noteRanges)
          }
        }
        if (meta) {
          const activeRange =
            meta.activeRange === undefined ? pluginState.activeRange : meta.activeRange
          const noteRanges =
            meta.noteRanges === undefined ? pluginState.noteRanges : meta.noteRanges
          return {
            activeRange,
            noteRanges,
            decorations: createAnnotationDecorations(tr.doc, activeRange, noteRanges)
          }
        }
        if (tr.docChanged) {
          return {
            ...pluginState,
            decorations: pluginState.decorations.map(tr.mapping, tr.doc)
          }
        }
        return pluginState
      }
    },
    props: {
      decorations(state) {
        return (
          richMarkdownAnnotationHighlightPluginKey.getState(state)?.decorations ??
          DecorationSet.empty
        )
      }
    }
  })
}

export function createRichMarkdownAnnotationHighlightExtension(): Extension {
  return Extension.create({
    name: 'richMarkdownAnnotationHighlight',
    addProseMirrorPlugins() {
      return [createRichMarkdownAnnotationHighlightPlugin()]
    }
  })
}
