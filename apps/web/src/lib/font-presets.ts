/**
 * Font pair presets for the editor.
 * Free users get Classic (default); Pro users can choose from all 5.
 */

export type FontPresetId = 'classic' | 'modern' | 'warm' | 'technical' | 'indonesian';

export interface FontPreset {
  id: FontPresetId;
  name: string;
  headingFont: string;
  bodyFont: string;
  /** Google Fonts URL to load (null = already loaded via next/font) */
  googleFontsUrl: string | null;
  vibe: string;
  /** Whether this preset is available for free users */
  isFree: boolean;
  /** Preview text sample */
  previewHeading: string;
  previewBody: string;
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    headingFont: "'Source Serif 4', Georgia, serif",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    googleFontsUrl: null, // Already loaded via next/font
    vibe: 'Timeless, editorial',
    isFree: true,
    previewHeading: 'Catatan Indah',
    previewBody: 'Menulis dengan gaya klasik dan elegan.',
  },
  {
    id: 'modern',
    name: 'Modern',
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    vibe: 'Clean, contemporary',
    isFree: false,
    previewHeading: 'Catatan Indah',
    previewBody: 'Menulis dengan gaya modern dan bersih.',
  },
  {
    id: 'warm',
    name: 'Warm',
    headingFont: "'Lora', Georgia, serif",
    bodyFont: "'Nunito', system-ui, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Nunito:wght@400;500;600;700&display=swap',
    vibe: 'Soft, approachable',
    isFree: false,
    previewHeading: 'Catatan Indah',
    previewBody: 'Menulis dengan gaya hangat dan nyaman.',
  },
  {
    id: 'technical',
    name: 'Technical',
    headingFont: "'Space Grotesk', system-ui, sans-serif",
    bodyFont: "'IBM Plex Sans', system-ui, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
    vibe: 'Precise, structured',
    isFree: false,
    previewHeading: 'Catatan Indah',
    previewBody: 'Menulis dengan gaya teknikal dan terstruktur.',
  },
  {
    id: 'indonesian',
    name: 'Indonesian',
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    vibe: 'Local pride, modern',
    isFree: false,
    previewHeading: 'Catatan Indah',
    previewBody: 'Menulis dengan kebanggaan lokal.',
  },
];

export function getPreset(id: FontPresetId): FontPreset {
  return FONT_PRESETS.find((p) => p.id === id) || FONT_PRESETS[0];
}

const STORAGE_KEY = 'catatan-font-preset';

export function getSavedPreset(): FontPresetId {
  if (typeof window === 'undefined') return 'classic';
  return (localStorage.getItem(STORAGE_KEY) as FontPresetId) || 'classic';
}

export function savePreset(id: FontPresetId) {
  localStorage.setItem(STORAGE_KEY, id);
}

/**
 * Load Google Fonts for a preset by injecting a <link> tag.
 * Idempotent — won't duplicate if already loaded.
 */
export function loadPresetFonts(preset: FontPreset) {
  if (!preset.googleFontsUrl) return;
  const linkId = `font-preset-${preset.id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = preset.googleFontsUrl;
  document.head.appendChild(link);
}
