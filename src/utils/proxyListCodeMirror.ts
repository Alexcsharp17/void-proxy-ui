import type { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';

/**
 * Green line highlight for proxy strings that match the last generated batch (trimmed equality).
 */
export function proxyPendingHighlightExtension(pending: ReadonlySet<string>): Extension {
  const pendingSet = pending;

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = build(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged) this.decorations = build(update.view);
      }
    },
    { decorations: (v) => v.decorations }
  );

  function build(view: EditorView): DecorationSet {
    const doc = view.state.doc;
    const out: Parameters<typeof Decoration.set>[0] = [];
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const t = line.text.trim();
      if (t && pendingSet.has(t)) {
        out.push(Decoration.line({ class: 'cm-proxy-line-pending' }).range(line.from));
      }
    }
    return Decoration.set(out, true);
  }
}

export const proxyListEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'color-mix(in srgb, var(--bg-input) 50%, transparent)',
    fontSize: '12px',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: 'var(--accent-primary)',
    padding: '16px',
    minHeight: '168px',
  },
  '.cm-line': {
    color: 'var(--accent-primary)',
  },
  '.cm-line.cm-proxy-line-pending': {
    color: 'var(--cm-proxy-pending)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--accent-primary)',
  },
  '.cm-selectionBackground, ::selection': {
    background: 'var(--cm-selection-bg) !important',
  },
});
