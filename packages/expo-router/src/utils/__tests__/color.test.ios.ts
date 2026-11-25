import { type ColorValue, PlatformColor } from 'react-native';

import { alpha, darken, isDark, isLight } from '../color';

describe('color', () => {
  it.each([
    ['hex', '#ff0000', 1],
    ['RGB', 'rgb(10, 20, 30)', 1],
    ['RGBA', 'rgba(10, 20, 30, 0.5)', 128 / 255],
    ['HSL', 'hsl(200, 50%, 50%)', 1],
    ['named', 'red', 1],
    ['transparent', 'transparent', 0],
  ])('parses %s colors', (_name, color, expectedAlpha) => {
    expect(alpha(color)).toBe(expectedAlpha);
  });

  it.each([
    ['invalid strings', 'not-a-color'],
    ['CSS variables', 'var(--my-color)'],
    ['PlatformColor', PlatformColor('systemPink')],
    // `NaN` can reach these functions at runtime despite not being a valid `ColorValue`.
    ['NaN', NaN as unknown as ColorValue],
  ])('returns undefined for %s', (_name, color) => {
    expect(isDark(color)).toBeUndefined();
    expect(isLight(color)).toBeUndefined();
    expect(alpha(color)).toBeUndefined();
    expect(alpha(color, 0.5)).toBeUndefined();
    expect(darken(color, 0.5)).toBeUndefined();
  });

  it('returns undefined for NaN numeric arguments', () => {
    expect(alpha('red', NaN)).toBeUndefined();
    expect(darken('red', NaN)).toBeUndefined();
  });

  it('uses the existing luminance boundary', () => {
    expect(isDark('#7f7f7f')).toBe(true);
    expect(isLight('#7f7f7f')).toBe(false);
    expect(isDark('#808080')).toBe(false);
    expect(isLight('#808080')).toBe(true);
  });

  it.each([
    [-1, 'rgba(10, 20, 30, 0)'],
    [0.25, 'rgba(10, 20, 30, 0.25)'],
    [2, 'rgba(10, 20, 30, 1)'],
  ])('replaces and clamps alpha to %s', (value, expected) => {
    expect(alpha('rgba(10, 20, 30, 0.5)', value)).toBe(expected);
  });

  it('darkens by scaling HSL lightness', () => {
    expect(darken('#007aff', 0.71)).toBe('rgba(0, 35, 74, 1)');
    expect(darken('rgb(100, 150, 200)', 0.2)).toBe('rgba(63, 120, 177, 1)');
  });

  it('preserves normalized alpha when darkening', () => {
    expect(darken('rgba(100, 150, 200, 0.5)', 0.2)).toBe(`rgba(63, 120, 177, ${128 / 255})`);
  });
});
