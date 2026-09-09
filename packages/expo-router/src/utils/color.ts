// @ts-expect-error: The package uses Flow instead of TypeScript declarations.
import normalizeColor from '@react-native/normalize-colors';
import type { ColorValue } from 'react-native';

type RGB = [red: number, green: number, blue: number];
type RGBA = [red: number, green: number, blue: number, alpha: number];

function rgba(value: ColorValue): RGBA | undefined {
  const normalized = normalizeColor(value);

  if (normalized == null) {
    return undefined;
  }

  return [normalized >>> 24, (normalized >>> 16) & 255, (normalized >>> 8) & 255, normalized & 255];
}

function serialize([red, green, blue, opacity]: RGBA): string {
  return `rgba(${red}, ${green}, ${blue}, ${opacity / 255})`;
}

export function isDark(value: ColorValue): boolean | undefined {
  const channels = rgba(value);

  if (!channels) {
    return undefined;
  }

  const [red, green, blue] = channels;
  return (red * 2126 + green * 7152 + blue * 722) / 10000 < 128;
}

export function isLight(value: ColorValue): boolean | undefined {
  const dark = isDark(value);
  return dark === undefined ? undefined : !dark;
}

export function alpha(value: ColorValue): number | undefined;
export function alpha(value: ColorValue, opacity: number): string | undefined;
export function alpha(value: ColorValue, opacity?: number): number | string | undefined {
  if (Number.isNaN(opacity)) {
    return undefined;
  }

  const channels = rgba(value);

  if (!channels) {
    return undefined;
  }

  if (opacity === undefined) {
    return channels[3] / 255;
  }

  channels[3] = Math.max(0, Math.min(1, opacity)) * 255;
  return serialize(channels);
}

export function darken(value: ColorValue, ratio: number): string | undefined {
  if (Number.isNaN(ratio)) {
    return undefined;
  }

  const channels = rgba(value);

  if (!channels) {
    return undefined;
  }

  const [red, green, blue, opacity] = channels;
  const normalized: RGB = [red / 255, green / 255, blue / 255];
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === normalized[0]) {
      hue = ((normalized[1] - normalized[2]) / delta + (normalized[1] < normalized[2] ? 6 : 0)) / 6;
    } else if (max === normalized[1]) {
      hue = ((normalized[2] - normalized[0]) / delta + 2) / 6;
    } else {
      hue = ((normalized[0] - normalized[1]) / delta + 4) / 6;
    }
  }

  const darkenedLightness = Math.max(0, Math.min(1, lightness * (1 - ratio)));
  const q =
    darkenedLightness < 0.5
      ? darkenedLightness * (1 + saturation)
      : darkenedLightness + saturation - darkenedLightness * saturation;
  const p = 2 * darkenedLightness - q;
  const hueToRgb = (offset: number) => {
    const channel = (offset + 1) % 1;

    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };

  return serialize([
    Math.round(hueToRgb(hue + 1 / 3) * 255),
    Math.round(hueToRgb(hue) * 255),
    Math.round(hueToRgb(hue - 1 / 3) * 255),
    opacity,
  ]);
}
