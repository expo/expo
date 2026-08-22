import {
  APPLE_TARGET_PLATFORMS,
  KNOWN_PLATFORMS,
  OUT_OF_TREE_PLATFORMS,
  PLATFORM_EXTENSIONS,
  REACT_NATIVE_HOST_PACKAGES,
  getReactNativeHostPackage,
  isAppleTargetPlatform,
  isOutOfTreePlatform,
} from '..';

describe('platform sets', () => {
  it(`knows the five platform names`, () => {
    expect(KNOWN_PLATFORMS).toEqual(['android', 'ios', 'web', 'tvos', 'macos']);
  });

  it(`every out-of-tree platform is a known platform with a host package`, () => {
    for (const platform of OUT_OF_TREE_PLATFORMS) {
      expect(KNOWN_PLATFORMS).toContain(platform);
      expect(REACT_NATIVE_HOST_PACKAGES[platform]).toBeDefined();
    }
  });

  it(`every Apple target platform is a known platform`, () => {
    for (const platform of APPLE_TARGET_PLATFORMS) {
      expect(KNOWN_PLATFORMS).toContain(platform);
    }
  });
});

describe(isOutOfTreePlatform, () => {
  it(`identifies out-of-tree platforms`, () => {
    expect(isOutOfTreePlatform('tvos')).toBe(true);
    expect(isOutOfTreePlatform('macos')).toBe(true);
  });

  it(`rejects in-tree platforms and unknown values`, () => {
    expect(isOutOfTreePlatform('ios')).toBe(false);
    expect(isOutOfTreePlatform('android')).toBe(false);
    expect(isOutOfTreePlatform('web')).toBe(false);
    expect(isOutOfTreePlatform('windows')).toBe(false);
    expect(isOutOfTreePlatform(null)).toBe(false);
    expect(isOutOfTreePlatform(undefined)).toBe(false);
  });
});

describe(isAppleTargetPlatform, () => {
  it(`identifies Apple target platforms`, () => {
    expect(isAppleTargetPlatform('ios')).toBe(true);
    expect(isAppleTargetPlatform('tvos')).toBe(true);
    expect(isAppleTargetPlatform('macos')).toBe(true);
  });

  it(`rejects non-Apple platforms`, () => {
    expect(isAppleTargetPlatform('android')).toBe(false);
    expect(isAppleTargetPlatform('web')).toBe(false);
    expect(isAppleTargetPlatform(null)).toBe(false);
  });
});

describe(getReactNativeHostPackage, () => {
  it(`maps platforms to their react-native host package`, () => {
    expect(getReactNativeHostPackage('ios')).toBe('react-native');
    expect(getReactNativeHostPackage('android')).toBe('react-native');
    expect(getReactNativeHostPackage('tvos')).toBe('react-native-tvos');
    expect(getReactNativeHostPackage('macos')).toBe('react-native-macos');
    expect(getReactNativeHostPackage('windows')).toBe('react-native-windows');
  });

  it(`returns undefined for platforms without a host package`, () => {
    expect(getReactNativeHostPackage('web')).toBeUndefined();
    expect(getReactNativeHostPackage('devtools')).toBeUndefined();
    expect(getReactNativeHostPackage('apple')).toBeUndefined();
    expect(getReactNativeHostPackage(null)).toBeUndefined();
    expect(getReactNativeHostPackage(undefined)).toBeUndefined();
  });
});

describe('PLATFORM_EXTENSIONS', () => {
  it(`defines the fallback chains for out-of-tree platforms only`, () => {
    expect(PLATFORM_EXTENSIONS).toEqual({
      tvos: ['tvos', 'ios', 'native'],
      macos: ['macos', 'ios', 'native'],
    });
  });
});
