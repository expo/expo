import { requireNative, requireOptionalNative } from '../requireNativeModule';

describe('requireNative', () => {
  if (typeof window === 'undefined') {
    it('returns an empty object during server rendering', () => {
      expect(requireNative('expo-audio')).toEqual({});
    });
  } else {
    it('throws outside of DOM components', () => {
      expect(() => requireNative('expo-audio')).toThrow(
        "Cannot find native modules of the 'expo-audio' package"
      );
    });
  }
});

describe('requireOptionalNative', () => {
  it('returns null outside of DOM components', () => {
    expect(requireOptionalNative('expo-audio')).toBeNull();
  });
});
