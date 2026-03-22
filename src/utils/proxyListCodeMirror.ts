import type { Extension, Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';

export interface ProxyLineDecorationsOptions {
  /** Green: lines from last generate batch (trim match). */
  pendingHighlight: ReadonlySet<string>;
  /** Red strikethrough: marked for removal until Save. */
  pendingDelete: ReadonlySet<string>;
  /** Amber: failed save validation (trim match). */
  invalidLines: ReadonlySet<string>;
}

/**
 * Line decorations: invalid (save validation) > pending delete > pending highlight.
 */
export function proxyLineDecorationsExtension(options: ProxyLineDecorationsOptions): Extension {
  const hi = options.pendingHighlight;
  const del = options.pendingDelete;
  const inv = options.invalidLines;

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
    const out: Range<Decoration>[] = [];
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const t = line.text.trim();
      if (!t) continue;
      if (inv.has(t)) {
        out.push(Decoration.line({ class: 'cm-proxy-line-invalid' }).range(line.from));
      } else if (del.has(t)) {
        out.push(Decoration.line({ class: 'cm-proxy-line-pending-delete' }).range(line.from));
      } else if (hi.has(t)) {
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
    paddingBottom: '3px',
  },
  '.cm-line.cm-proxy-line-pending': {
    color: 'var(--cm-proxy-pending)',
  },
  '.cm-line.cm-proxy-line-pending-delete': {
    color: 'rgb(248 113 113)',
    textDecoration: 'line-through',
    textDecorationColor: 'rgb(248 113 113 / 0.85)',
    opacity: '0.92',
  },
  '.cm-line.cm-proxy-line-invalid': {
    color: 'rgb(251 191 36)',
    backgroundColor: 'rgb(251 191 36 / 0.09)',
    boxShadow: 'inset 0 0 0 1px rgb(251 191 36 / 0.45)',
    borderRadius: '4px',
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
