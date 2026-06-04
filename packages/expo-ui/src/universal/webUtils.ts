import type { ComponentProps, ElementType } from 'react';
import {
  processColor,
  unstable_createElement,
  type ColorValue,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type Simplify<T> = { [K in keyof T]: T[K] };
type Merge<A, B> = Simplify<Omit<A, keyof B> & B>;

type WebComponentProps<T extends ElementType> = Merge<
  ComponentProps<T>,
  {
    dataSet?: Record<string, string | undefined>;
    focusable?: boolean;
    style?: StyleProp<ImageStyle | TextStyle | ViewStyle>;
    testID?: string;
  }
>;

export const createWebComponent =
  <T extends ElementType>(type: T) =>
  (props: WebComponentProps<T>) =>
    unstable_createElement(type, props);

export const css = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings
    .reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''), '')
    .replace(/\s+/g, ' ')
    .trim();

const lightVariables = css`
  --expo-ui-background: #ffffff;
  --expo-ui-foreground: #000000;

  --expo-ui-gray-50: #f9fafb;
  --expo-ui-gray-100: #f0f1f2;
  --expo-ui-gray-150: #eaecf0;
  --expo-ui-gray-200: #e1e4e8;
  --expo-ui-gray-300: #d7dbdf;
  --expo-ui-gray-400: #c9d1d9;
  --expo-ui-gray-500: #687076;
  --expo-ui-gray-600: #596068;
  --expo-ui-gray-700: #37414a;
  --expo-ui-gray-800: #25292e;
  --expo-ui-gray-900: #11181c;

  --expo-ui-shadow-button: 0 1px 2px 0 rgba(0, 0, 0, 0.08);
`;

const darkVariables = css`
  --expo-ui-background: #0b0f14;
  --expo-ui-foreground: #ffffff;

  --expo-ui-gray-50: #111418;
  --expo-ui-gray-100: #1d2128;
  --expo-ui-gray-150: #252932;
  --expo-ui-gray-200: #1f242c;
  --expo-ui-gray-300: #30363d;
  --expo-ui-gray-400: #484f58;
  --expo-ui-gray-500: #6e7781;
  --expo-ui-gray-600: #9aa4ae;
  --expo-ui-gray-700: #4b5560;
  --expo-ui-gray-800: #c0c8d0;
  --expo-ui-gray-900: #e6edf3;

  --expo-ui-shadow-button: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
`;

export const colors = {
  background: 'var(--expo-ui-background)',
  foreground: 'var(--expo-ui-foreground)',

  red: '#cf222e',

  primary: {
    foreground: 'var(--expo-ui-primary-foreground)',
    50: 'var(--expo-ui-primary-50)',
    100: 'var(--expo-ui-primary-100)',
    200: 'var(--expo-ui-primary-200)',
    300: 'var(--expo-ui-primary-300)',
    400: 'var(--expo-ui-primary-400)',
    500: 'var(--expo-ui-primary-500)',
    600: 'var(--expo-ui-primary-600)',
    700: 'var(--expo-ui-primary-700)',
    800: 'var(--expo-ui-primary-800)',
    900: 'var(--expo-ui-primary-900)',
  },

  gray: {
    50: 'var(--expo-ui-gray-50)',
    100: 'var(--expo-ui-gray-100)',
    200: 'var(--expo-ui-gray-200)',
    300: 'var(--expo-ui-gray-300)',
    400: 'var(--expo-ui-gray-400)',
    500: 'var(--expo-ui-gray-500)',
    600: 'var(--expo-ui-gray-600)',
    700: 'var(--expo-ui-gray-700)',
    800: 'var(--expo-ui-gray-800)',
    900: 'var(--expo-ui-gray-900)',
  },
};

export const durations = {
  fast: '120ms',
  base: '120ms',
  slow: '280ms',
};

export const easings = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const shadows = {
  button: 'var(--expo-ui-shadow-button)',
  focus: '0 0 0 3px color-mix(in oklab, var(--expo-ui-primary-500) 35%, transparent)',
  input: '0 1px 0 rgba(0, 0, 0, 0.02)',
};

export const globalCss = css`
  :root {
    ${lightVariables}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
      ${darkVariables}
    }
  }

  [data-theme='dark'] {
    ${darkVariables}
  }
`;

// Color utils

const DEFAULT_PRIMARY_COLOR = '#007aff';

type Lch = [number, number, number];

const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const linearToSrgb = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const hexToLch = (hex: string): Lch => {
  const raw = hex.replace('#', '');
  const body = raw.length === 3 ? Array.from(raw, (c) => c + c).join('') : raw;

  const r = srgbToLinear(Number.parseInt(body.slice(0, 2), 16) / 255);
  const g = srgbToLinear(Number.parseInt(body.slice(2, 4), 16) / 255);
  const b = srgbToLinear(Number.parseInt(body.slice(4, 6), 16) / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const labA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return [L, Math.sqrt(labA * labA + labB * labB), Math.atan2(labB, labA)];
};

const lchToHex = ([L, chroma, hue]: Lch): string => {
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const cl = (c: number): number => Math.max(0, Math.min(255, Math.round(linearToSrgb(c) * 255)));
  return '#' + [cl(r), cl(g), cl(bl)].map((x) => x.toString(16).padStart(2, '0')).join('');
};

// Steps tuned for sensible UI scale. Lightness targets are perceptual (OKLCH).
// Chroma multiplier softens lightest and darkest stops so they don't read neon.
const PRIMARY_STOPS = [
  { step: 50, L: 0.975, cMul: 0.08 },
  { step: 100, L: 0.945, cMul: 0.2 },
  { step: 200, L: 0.89, cMul: 0.45 },
  { step: 300, L: 0.81, cMul: 0.7 },
  { step: 400, L: 0.7, cMul: 0.9 },
  { step: 500, L: null, cMul: 1.0 }, // anchor at user input
  { step: 600, L: 0.5, cMul: 1.0 },
  { step: 700, L: 0.42, cMul: 0.95 },
  { step: 800, L: 0.34, cMul: 0.85 },
  { step: 900, L: 0.25, cMul: 0.7 },
] as const;

type PrimaryColorScale = Record<
  `--expo-ui-primary-${'foreground' | (typeof PRIMARY_STOPS)[number]['step']}`,
  string
>;

// Normalize any `ColorValue` (named color, `rgb()` / `rgba()`, hex string, or
// processed number) to a `#RRGGBB` string. `processColor` returns an
// `0xAARRGGBB` integer (or `null`/`undefined` for invalid input); alpha is
// dropped since the scale only needs the base hue.
const colorValueToHex = (color: ColorValue): string | null => {
  const argb = processColor(color);

  if (typeof argb !== 'number') {
    return null;
  }

  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
};

export const generatePrimaryColorScale = (
  color: ColorValue | undefined = DEFAULT_PRIMARY_COLOR
): Record<string, string> => {
  const [L, C, H] = hexToLch(colorValueToHex(color) ?? DEFAULT_PRIMARY_COLOR);

  const scale = {
    // Contrast for filled buttons: pick white or a hue-tinted near-black based on L of 500
    '--expo-ui-primary-foreground': L < 0.68 ? '#ffffff' : lchToHex([0.18, C * 0.1, H]),
  } as PrimaryColorScale;

  for (const { step, L: tgtL, cMul } of PRIMARY_STOPS) {
    const newL = tgtL == null ? L : tgtL;
    const newC = C * cMul;
    scale[`--expo-ui-primary-${step}`] = lchToHex([newL, newC, H]);
  }

  return scale;
};
