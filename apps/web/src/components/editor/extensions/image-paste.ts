import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { getImageFiles, processImageForEmbed, countImages } from '@/lib/image-utils';
import { showToast } from '@/components/ui/toast';

/**
 * Custom Tiptap extension that handles image paste and drop events.
 * Compresses images client-side and embeds as base64 (free tier).
 */
export const ImagePaste = Extension.create({
  name: 'imagePaste',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('imagePaste'),
        props: {
          handlePaste(_view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const imageFiles = getImageFiles(clipboardData);
            if (imageFiles.length === 0) return false;

            event.preventDefault();

            const doc = editor.getJSON() as Record<string, unknown>;
            const currentCount = countImages(doc);

            imageFiles.forEach(async (file) => {
              const result = await processImageForEmbed(file, currentCount);
              if (result.error) {
                showToast({ message: result.error });
                return;
              }
              editor
                .chain()
                .focus()
                .setImage({ src: result.dataUrl! })
                .run();
            });

            return true;
          },

          handleDrop(_view, event) {
            const dataTransfer = event.dataTransfer;
            if (!dataTransfer) return false;

            const imageFiles = getImageFiles(dataTransfer);
            if (imageFiles.length === 0) return false;

            event.preventDefault();

            const doc = editor.getJSON() as Record<string, unknown>;
            const currentCount = countImages(doc);

            imageFiles.forEach(async (file) => {
              const result = await processImageForEmbed(file, currentCount);
              if (result.error) {
                showToast({ message: result.error });
                return;
              }
              editor
                .chain()
                .focus()
                .setImage({ src: result.dataUrl! })
                .run();
            });

            return true;
          },
        },
      }),
    ];
  },
});
