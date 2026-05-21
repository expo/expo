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
  `--eui-primary-${'foreground' | (typeof PRIMARY_STOPS)[number]['step']}`,
  string
>;

export const generatePrimaryColorScale = (hex: string): Record<string, string> => {
  const [L, C, H] = hexToLch(hex);

  const scale = {
    // Contrast for filled buttons: pick white or a hue-tinted near-black based on L of 500
    '--eui-primary-foreground': L < 0.68 ? '#ffffff' : lchToHex([0.18, C * 0.1, H]),
  } as PrimaryColorScale;

  for (const { step, L: tgtL, cMul } of PRIMARY_STOPS) {
    const newL = tgtL == null ? L : tgtL;
    const newC = C * cMul;
    scale[`--eui-primary-${step}`] = lchToHex([newL, newC, H]);
  }

  return scale;
};
