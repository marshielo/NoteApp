/**
 * Export utilities — convert Tiptap/ProseMirror JSON to various formats.
 */

/* ---- Types ---- */

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

/* ---- Markdown conversion ---- */

function serializeMarks(node: TiptapNode): string {
  let text = node.text || '';
  if (!node.marks) return text;

  for (const mark of node.marks) {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `*${text}*`;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'link':
        text = `[${text}](${(mark.attrs as Record<string, string>)?.href || ''})`;
        break;
      case 'highlight':
        text = `==${text}==`;
        break;
    }
  }
  return text;
}

function inlineContent(nodes?: TiptapNode[]): string {
  if (!nodes) return '';
  return nodes.map((n) => {
    if (n.type === 'text') return serializeMarks(n);
    if (n.type === 'hardBreak') return '\n';
    return '';
  }).join('');
}

function nodeToMarkdown(node: TiptapNode, indent = ''): string {
  switch (node.type) {
    case 'doc':
      return (node.content || []).map((c) => nodeToMarkdown(c)).join('\n\n');

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${inlineContent(node.content)}`;
    }

    case 'paragraph':
      return `${indent}${inlineContent(node.content)}`;

    case 'bulletList':
      return (node.content || [])
        .map((item) => nodeToMarkdown(item, indent))
        .join('\n');

    case 'orderedList':
      return (node.content || [])
        .map((item, i) => {
          const num = ((node.attrs?.start as number) || 1) + i;
          return nodeToMarkdown(item, indent).replace(/^(\s*)- /, `$1${num}. `);
        })
        .join('\n');

    case 'listItem': {
      const children = node.content || [];
      const lines: string[] = [];
      children.forEach((child, i) => {
        if (child.type === 'paragraph') {
          if (i === 0) {
            lines.push(`${indent}- ${inlineContent(child.content)}`);
          } else {
            lines.push(`${indent}  ${inlineContent(child.content)}`);
          }
        } else {
          lines.push(nodeToMarkdown(child, indent + '  '));
        }
      });
      return lines.join('\n');
    }

    case 'taskList':
      return (node.content || [])
        .map((item) => {
          const checked = item.attrs?.checked ? 'x' : ' ';
          const text = (item.content || [])
            .map((c) => inlineContent(c.content))
            .join('\n');
          return `${indent}- [${checked}] ${text}`;
        })
        .join('\n');

    case 'taskItem': {
      const checked = node.attrs?.checked ? 'x' : ' ';
      const text = (node.content || [])
        .map((c) => inlineContent(c.content))
        .join('\n');
      return `${indent}- [${checked}] ${text}`;
    }

    case 'blockquote':
      return (node.content || [])
        .map((c) => `> ${nodeToMarkdown(c)}`)
        .join('\n');

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || '';
      const code = inlineContent(node.content);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'horizontalRule':
      return '---';

    case 'image': {
      const src = (node.attrs?.src as string) || '';
      const alt = (node.attrs?.alt as string) || '';
      const title = (node.attrs?.title as string) || '';
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }

    default:
      return inlineContent(node.content);
  }
}

export function tiptapToMarkdown(doc: Record<string, unknown>): string {
  return nodeToMarkdown(doc as unknown as TiptapNode).trim();
}

/* ---- Plain text conversion ---- */

export function tiptapToPlainText(doc: Record<string, unknown>): string {
  function extractText(node: TiptapNode): string {
    if (node.type === 'text') return node.text || '';
    if (node.type === 'hardBreak') return '\n';
    if (node.type === 'horizontalRule') return '\n---\n';

    const children = (node.content || []).map(extractText);

    switch (node.type) {
      case 'doc':
        return children.join('\n\n');
      case 'paragraph':
      case 'heading':
        return children.join('');
      case 'bulletList':
      case 'orderedList':
      case 'taskList':
        return children.join('\n');
      case 'listItem':
        return `• ${children.join('\n  ')}`;
      case 'taskItem': {
        const checked = node.attrs?.checked ? '✓' : '○';
        return `${checked} ${children.join('\n  ')}`;
      }
      case 'blockquote':
        return children.map((c) => `> ${c}`).join('\n');
      case 'codeBlock':
        return children.join('');
      default:
        return children.join('');
    }
  }
  return extractText(doc as unknown as TiptapNode).trim();
}

/* ---- HTML conversion ---- */

function inlineToHTML(nodes?: TiptapNode[]): string {
  if (!nodes) return '';
  return nodes
    .map((n) => {
      if (n.type === 'hardBreak') return '<br>';
      if (n.type !== 'text') return '';

      let html = escapeHTML(n.text || '');
      if (n.marks) {
        for (const mark of n.marks) {
          switch (mark.type) {
            case 'bold':
              html = `<strong>${html}</strong>`;
              break;
            case 'italic':
              html = `<em>${html}</em>`;
              break;
            case 'strike':
              html = `<del>${html}</del>`;
              break;
            case 'code':
              html = `<code>${html}</code>`;
              break;
            case 'link': {
              const href = escapeHTML((mark.attrs as Record<string, string>)?.href || '');
              html = `<a href="${href}">${html}</a>`;
              break;
            }
            case 'highlight':
              html = `<mark>${html}</mark>`;
              break;
          }
        }
      }
      return html;
    })
    .join('');
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeToHTML(node: TiptapNode): string {
  switch (node.type) {
    case 'doc':
      return (node.content || []).map(nodeToHTML).join('\n');

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      return `<h${level}>${inlineToHTML(node.content)}</h${level}>`;
    }

    case 'paragraph':
      return `<p>${inlineToHTML(node.content)}</p>`;

    case 'bulletList':
      return `<ul>\n${(node.content || []).map(nodeToHTML).join('\n')}\n</ul>`;

    case 'orderedList':
      return `<ol>\n${(node.content || []).map(nodeToHTML).join('\n')}\n</ol>`;

    case 'listItem':
      return `<li>${(node.content || []).map((c) => inlineToHTML(c.content)).join('')}</li>`;

    case 'taskList':
      return `<ul class="task-list">\n${(node.content || []).map(nodeToHTML).join('\n')}\n</ul>`;

    case 'taskItem': {
      const checked = node.attrs?.checked ? ' checked' : '';
      const text = (node.content || []).map((c) => inlineToHTML(c.content)).join('');
      return `<li class="task-item"><input type="checkbox"${checked} disabled> ${text}</li>`;
    }

    case 'blockquote':
      return `<blockquote>\n${(node.content || []).map(nodeToHTML).join('\n')}\n</blockquote>`;

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || '';
      const code = escapeHTML(inlineContent(node.content));
      return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${code}</code></pre>`;
    }

    case 'horizontalRule':
      return '<hr>';

    case 'image': {
      const src = escapeHTML((node.attrs?.src as string) || '');
      const alt = escapeHTML((node.attrs?.alt as string) || '');
      return `<img src="${src}" alt="${alt}">`;
    }

    default:
      return inlineToHTML(node.content);
  }
}

export function tiptapToHTML(
  doc: Record<string, unknown>,
  title: string
): string {
  const bodyHTML = nodeToHTML(doc as unknown as TiptapNode);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)}</title>
<style>
  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 680px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.7;
    color: #2C2520;
    background: #FAF8F5;
  }
  h1, h2, h3 { font-family: 'Source Serif 4', Georgia, serif; font-weight: 700; margin-top: 2rem; }
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  p { margin: 0.75rem 0; }
  a { color: #C4642D; }
  code { background: #EDE8E1; padding: 0.15em 0.4em; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
  pre { background: #2C2520; color: #E8E2DA; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; color: inherit; }
  blockquote { border-left: 3px solid #C4642D; margin: 1rem 0; padding: 0.5rem 1rem; color: #6B5B4E; }
  img { max-width: 100%; border-radius: 8px; }
  mark { background: #C4642D33; padding: 0.1em 0.2em; border-radius: 2px; }
  hr { border: none; border-top: 1px solid #EDE8E1; margin: 2rem 0; }
  ul.task-list { list-style: none; padding-left: 0; }
  .task-item { display: flex; align-items: baseline; gap: 0.5rem; }
  .task-item input { margin: 0; }
  del { color: #8C807B; }
</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

/* ---- Download helpers ---- */

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) || 'catatan';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
