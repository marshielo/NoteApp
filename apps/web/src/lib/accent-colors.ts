/**
 * Custom accent color system.
 * Free users get the default terracotta; Pro users can pick from presets or custom hex.
 */

export interface AccentColor {
  name: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentColor[] = [
  { name: 'Terracotta', hex: '#C4642D' },
  { name: 'Ocean Blue', hex: '#2D7CC4' },
  { name: 'Forest Green', hex: '#2D8B57' },
  { name: 'Royal Purple', hex: '#7B2DC4' },
  { name: 'Sunset Pink', hex: '#C42D6E' },
  { name: 'Golden', hex: '#C49E2D' },
  { name: 'Slate', hex: '#5A6B7D' },
  { name: 'Charcoal', hex: '#3D3D3D' },
];

export const DEFAULT_ACCENT = '#C4642D';
const STORAGE_KEY = 'catatan-accent-color';

/* ---- Color math (hex → HSL manipulation) ---- */

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);

  function f(n: number): string {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  }

  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generate hover variant (+10% lightness) and light variant (+40% lightness).
 */
export function generateVariants(hex: string): {
  base: string;
  hover: string;
  light: string;
} {
  const [h, s, l] = hexToHSL(hex);
  return {
    base: hex,
    hover: hslToHex(h, s, Math.min(100, l + 10)),
    light: hslToHex(h, Math.max(0, s - 20), Math.min(100, l + 40)),
  };
}

/* ---- Persistence ---- */

export function getSavedAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_ACCENT;
}

export function saveAccent(hex: string) {
  localStorage.setItem(STORAGE_KEY, hex);
}

/**
 * Apply accent color to the document by updating CSS custom properties.
 */
export function applyAccent(hex: string) {
  const { base, hover, light } = generateVariants(hex);
  const root = document.documentElement;
  root.style.setProperty('--accent-primary', base);
  root.style.setProperty('--accent-primary-hover', hover);
  root.style.setProperty('--color-accent', base);
  root.style.setProperty('--color-accent-hover', hover);
  // Also set a lighter variant for backgrounds
  root.style.setProperty('--accent-light', light);
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}
