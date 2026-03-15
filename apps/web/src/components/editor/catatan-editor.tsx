'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { FloatingToolbar } from './floating-toolbar';
import { SlashCommandMenu } from './slash-command-menu';
import { useSlashCommand } from './extensions/use-slash-command';

const lowlight = createLowlight(common);

interface CatatanEditorProps {
  content?: Record<string, unknown>;
  onUpdate?: (data: {
    json: Record<string, unknown>;
    text: string;
    wordCount: number;
    title: string;
  }) => void;
  editable?: boolean;
}

const DEFAULT_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [],
    },
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

/**
 * Extract title from the first H1 in the document.
 */
function extractTitle(json: Record<string, unknown>): string {
  const content = json.content as Array<Record<string, unknown>> | undefined;
  if (!content?.length) return 'Untitled';

  const firstNode = content[0];
  if (
    firstNode?.type === 'heading' &&
    (firstNode.attrs as Record<string, unknown>)?.level === 1
  ) {
    const nodeContent = firstNode.content as Array<Record<string, unknown>> | undefined;
    if (nodeContent?.length) {
      return nodeContent
        .filter((n) => n.type === 'text')
        .map((n) => n.text as string)
        .join('');
    }
  }
  return 'Untitled';
}

export function CatatanEditor({
  content,
  onUpdate,
  editable = true,
}: CatatanEditorProps) {
  const { slashState, handleSlashKeyDown, closeSlash, openSlash } = useSlashCommand();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // replaced by CodeBlockLowlight
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            const level = node.attrs.level as number;
            if (level === 1) return 'Untitled';
            return `Heading ${level}`;
          }
          return "Ketik '/' untuk melihat opsi...";
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent underline decoration-accent/30 hover:decoration-accent',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200/50 dark:bg-yellow-500/20 rounded px-0.5',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose',
        },
      }),
      TaskItem.configure({
        nested: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'text-code rounded-lg bg-bg-tertiary p-4 overflow-x-auto',
        },
      }),
      Typography,
      CharacterCount,
    ],
    content: content || DEFAULT_CONTENT,
    editable,
    editorProps: {
      attributes: {
        class: 'catatan-editor focus:outline-none min-h-[calc(100vh-180px)]',
      },
      handleKeyDown: (_view, event) => {
        return handleSlashKeyDown(event);
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as Record<string, unknown>;
      const text = ed.getText();
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const title = extractTitle(json);

      onUpdate?.({ json, text, wordCount, title });
    },
  });

  // Listen for "/" to open slash menu
  if (editor) {
    editor.on('transaction', ({ editor: ed }) => {
      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(
        Math.max(0, from - 1),
        from,
        '\n'
      );
      if (textBefore === '/' && !slashState.isOpen) {
        // Get cursor position for menu placement
        const coords = ed.view.coordsAtPos(from);
        openSlash(coords.left, coords.bottom + 8, from);
      }
    });
  }

  if (!editor) return null;

  return (
    <div className="relative">
      <FloatingToolbar editor={editor} />
      <EditorContent editor={editor} />
      <SlashCommandMenu
        editor={editor}
        isOpen={slashState.isOpen}
        position={{ x: slashState.x, y: slashState.y }}
        onClose={closeSlash}
        triggerPos={slashState.triggerPos}
      />
    </div>
  );
}
