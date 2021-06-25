const hexToRGB = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const hexToRGBA = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRGB(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hexToAccessibleHSLA = (hex: string, alpha: number) => {
  let [r, g, b] = hexToRGB(hex);

  // Make r, g, and b fractions of 1
  r /= 255;
  g /= 255;
  b /= 255;

  // Find greatest and smallest channel values
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  // Calculate hue
  // No difference
  if (delta === 0) h = 0;
  // Red is max
  else if (cmax === r) h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax === g) h = (b - r) / delta + 2;
  // Blue is max
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0) h += 360;

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply l and s by 100.
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  if (Number.isNaN(l)) {
    return 'hsla(0,0%,0%,0.5)';
  }

  if (l > 75) {
    l = 100 - l;
  }

  return `hsla(${h},${s}%,${l}%,${alpha})`;
};
