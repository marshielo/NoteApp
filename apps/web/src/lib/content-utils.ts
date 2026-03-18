/**
 * Recursively extract plain text from Tiptap/ProseMirror JSON.
 */
export function extractTextFromTiptapJSON(node: Record<string, unknown>): string {
  if (node.type === 'text') {
    return (node.text as string) || '';
  }

  const content = node.content as Array<Record<string, unknown>> | undefined;
  if (!content?.length) return '';

  return content.map((child) => extractTextFromTiptapJSON(child)).join('\n');
}

/**
 * Calculate word count from plain text.
 */
export function calculateWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate estimated reading time in minutes (200 words/min).
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Extract the title from the first H1 in a Tiptap JSON document.
 */
export function extractTitle(doc: Record<string, unknown>): string {
  const content = doc.content as Array<Record<string, unknown>> | undefined;
  if (!content?.length) return 'Untitled';

  const firstNode = content[0];
  if (
    firstNode?.type === 'heading' &&
    (firstNode.attrs as Record<string, unknown>)?.level === 1
  ) {
    const nodeContent = firstNode.content as Array<Record<string, unknown>> | undefined;
    if (nodeContent?.length) {
      return (
        nodeContent
          .filter((n) => n.type === 'text')
          .map((n) => n.text as string)
          .join('') || 'Untitled'
      );
    }
  }
  return 'Untitled';
}
