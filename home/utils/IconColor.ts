import { Experience } from 'components/ExperienceView.types';

const LUMINOSITY_THEME_BREAKPOINT = 0.62;

// NOTE(jim): Lighten/darken code lifted from:
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
export const shadeHex = (color, percent) => {
  const f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
};

export const getBackgroundColorFromIMGIX = (experience: Pick<Experience, 'icon'>) => {
  const { icon } = experience;
  if (!icon) {
    return null;
  }

  // NOTE(jim): IMGIX palette API is limited, explaining these cases below.
  if (icon.colorPalette) {
    const { dominant_colors, colors, average_luminance } = icon.colorPalette;

    // NOTE(jim): User overrides IMGIX choice.
    if (icon.primaryColor && icon.primaryColor.toUpperCase() !== '#CCCCCC') {
      const { primaryColor } = icon;
      if (primaryColor === '#A3A1F7' || primaryColor === '#FFDB8A' || primaryColor === '#FFBB8D') {
        return primaryColor;
      }

      return shadeHex(primaryColor, -0.1);
    }

    // NOTE(jim): Luminance is past a threshold. Use light colors.
    if (average_luminance > LUMINOSITY_THEME_BREAKPOINT) {
      if (dominant_colors && dominant_colors.vibrant_light) {
        return dominant_colors.vibrant_light.hex;
      }
    }

    // NOTE(jim): Do not allow common IMGIX light color extraction.
    // NOTE(jim): Very defensive :( to guard for even if colors exists.
    if (colors) {
      const { hex } = colors[0];
      if (hex.toUpperCase() === '#FFFFFF' || hex.toUpperCase() === '#FEFEFE') {
        return colors[1].hex;
      }

      // NOTE(jim): Least used color.
      return hex;
    }
  }

  return null;
};
