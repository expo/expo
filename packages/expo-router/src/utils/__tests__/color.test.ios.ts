import { PlatformColor } from 'react-native';

import { Color } from '../color';

describe(Color, () => {
  it('parses a hex color string', () => {
    const result = Color('#ff0000');
    expect(result).toBeDefined();
    expect(result!.hex()).toBe('#FF0000');
  });

  it('parses a named color string', () => {
    const result = Color('red');
    expect(result).toBeDefined();
    expect(result!.hex()).toBe('#FF0000');
  });

  it('returns undefined for CSS variable strings', () => {
    expect(Color('var(--my-color)')).toBeUndefined();
  });

  it('returns undefined for PlatformColor', () => {
    expect(Color(PlatformColor('systemPink'))).toBeUndefined();
  });
});
