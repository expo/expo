import { requireNative, requireOptionalNative } from '../requireNativeModule';

describe('requireNative', () => {
  const originalExpo = globalThis.expo;
  const audioPackage = { AudioModule: {}, AudioPlayer: class {} };

  beforeEach(() => {
    globalThis.expo = {
      ...originalExpo,
      packages: { 'expo-audio': audioPackage },
    } as typeof globalThis.expo;
  });

  afterEach(() => {
    globalThis.expo = originalExpo;
  });

  it('returns the package object', () => {
    expect(requireNative('expo-audio')).toBe(audioPackage);
  });

  it('throws when the package has no native modules', () => {
    expect(() => requireNative('expo-video')).toThrow(
      "Cannot find native modules of the 'expo-video' package"
    );
  });
});

describe('requireOptionalNative', () => {
  const originalExpo = globalThis.expo;

  afterEach(() => {
    globalThis.expo = originalExpo;
  });

  it('returns null when the package has no native modules', () => {
    globalThis.expo = { ...originalExpo, packages: {} } as typeof globalThis.expo;
    expect(requireOptionalNative('expo-video')).toBeNull();
  });
});
