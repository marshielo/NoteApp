'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface SlashCommandMenuProps {
  editor: Editor;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  triggerPos: number;
}

interface CommandItem {
  label: string;
  description: string;
  icon: string;
  action: (editor: Editor) => void;
}

const commands: CommandItem[] = [
  {
    label: 'Text',
    description: 'Plain text paragraph',
    icon: 'Aa',
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    label: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet List',
    description: 'Unordered list',
    icon: '•',
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Numbered List',
    description: 'Ordered list',
    icon: '1.',
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Checklist',
    description: 'Todo checklist items',
    icon: '☐',
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Quote',
    description: 'Block quote',
    icon: '"',
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Divider',
    description: 'Horizontal rule',
    icon: '—',
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    label: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: '</>',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Image',
    description: 'Upload or paste an image',
    icon: '🖼',
    action: (editor) => {
      const url = window.prompt('Image URL');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
];

export function SlashCommandMenu({
  editor,
  isOpen,
  position,
  onClose,
  triggerPos,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(filter.toLowerCase())
  );

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      // Delete the "/" trigger character and any filter text
      const { from } = editor.state.selection;
      const deleteFrom = triggerPos - 1; // position before "/"
      const deleteTo = from;

      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: deleteTo })
        .run();

      cmd.action(editor);
      onClose();
      setFilter('');
      setSelectedIndex(0);
    },
    [editor, onClose, triggerPos]
  );

  // Reset filter/selection when menu closes (adjust state during render)
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (prevOpen && !isOpen) {
      setFilter('');
      setSelectedIndex(0);
    }
  }

  // Track typed characters after "/" for filtering
  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        return;
      }

      if (event.key === 'Backspace') {
        if (filter.length === 0) {
          onClose();
        } else {
          setFilter((prev) => prev.slice(0, -1));
          setSelectedIndex(0);
        }
        return;
      }

      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        setFilter((prev) => prev + event.key);
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, filter, selectedIndex, filteredCommands, executeCommand, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return;
    const items = menuRef.current.querySelectorAll('[data-command-item]');
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-bg-elevated p-1.5 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      {filter && (
        <div className="mb-1.5 px-2 text-caption text-text-muted">
          Searching: {filter}
        </div>
      )}
      {filteredCommands.map((cmd, index) => (
        <button
          key={cmd.label}
          data-command-item
          onClick={() => executeCommand(cmd)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary/50'
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-bg-secondary text-caption font-medium">
            {cmd.icon}
          </span>
          <div>
            <div className="text-body-ui font-medium">{cmd.label}</div>
            <div className="text-caption text-text-muted">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
