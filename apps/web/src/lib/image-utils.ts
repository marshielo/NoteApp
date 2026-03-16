/**
 * Client-side image compression and base64 conversion for the editor.
 *
 * Free: max 800px wide, quality 0.8, max 500KB per image, max 5 images per note
 * Pro: max 1600px wide, quality 0.85, max 2MB per image (cloud upload in future)
 */

const FREE_MAX_WIDTH = 800;
const FREE_QUALITY = 0.8;
const FREE_MAX_SIZE_BYTES = 500 * 1024; // 500KB
const FREE_MAX_IMAGES_PER_NOTE = 5;

/**
 * Compress an image file to WebP format using OffscreenCanvas.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth = FREE_MAX_WIDTH,
  quality = FREE_QUALITY
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  // Use regular canvas (OffscreenCanvas.convertToBlob has limited browser support)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to compress image'));
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Convert a Blob to a base64 data URL.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Count image nodes in a Tiptap JSON document.
 */
export function countImages(doc: Record<string, unknown>): number {
  let count = 0;

  function walk(node: Record<string, unknown>) {
    if (node.type === 'image') count++;
    const content = node.content as Array<Record<string, unknown>> | undefined;
    if (content) content.forEach(walk);
  }

  walk(doc);
  return count;
}

/**
 * Process an image file for embedding in the editor (free tier).
 * Compresses, validates size, and returns base64 data URL.
 */
export async function processImageForEmbed(
  file: File | Blob,
  currentImageCount: number
): Promise<{ dataUrl: string; error?: never } | { dataUrl?: never; error: string }> {
  // Check image count limit
  if (currentImageCount >= FREE_MAX_IMAGES_PER_NOTE) {
    return {
      error: `Maksimal ${FREE_MAX_IMAGES_PER_NOTE} gambar per catatan. Upgrade ke Pro untuk lebih banyak.`,
    };
  }

  // Check if it's actually an image
  if (file instanceof File && !file.type.startsWith('image/')) {
    return { error: 'File bukan gambar yang valid.' };
  }

  try {
    const compressed = await compressImage(file);

    // Check compressed size
    if (compressed.size > FREE_MAX_SIZE_BYTES) {
      return {
        error: `Gambar terlalu besar (${Math.round(compressed.size / 1024)}KB). Maksimal ${FREE_MAX_SIZE_BYTES / 1024}KB.`,
      };
    }

    const dataUrl = await blobToBase64(compressed);
    return { dataUrl };
  } catch (err) {
    return { error: `Gagal memproses gambar: ${(err as Error).message}` };
  }
}

/**
 * Extract image files from clipboard/drag data.
 */
export function getImageFiles(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    if (file.type.startsWith('image/')) {
      files.push(file);
    }
  }
  return files;
}
