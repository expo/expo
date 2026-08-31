import type { ColorValue } from 'react-native';

import { resolveStringColor } from '../utils';

// A stand-in for what PlatformColor()/DynamicColorIOS() return at runtime: an opaque object,
// not a string. Constructed by hand instead of calling the real functions so this test doesn't
// depend on react-native's native color-resolution module being available under Jest.
const opaqueColorValue = { semantic: ['label'] } as unknown as ColorValue;

describe('resolveStringColor', () => {
  it('returns undefined when omitted', () => {
    expect(resolveStringColor(undefined)).toBeUndefined();
  });

  it('passes through a plain color string', () => {
    expect(resolveStringColor('#16332b')).toBe('#16332b');
  });

  it('discards an OpaqueColorValue (e.g. PlatformColor)', () => {
    expect(resolveStringColor(opaqueColorValue)).toBeUndefined();
  });
});
