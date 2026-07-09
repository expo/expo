'use strict';

const {
  flavorForConfiguration,
  rewriteFlavorInPath,
  sliceForPlatform,
  describeFlavoredArtifact,
} = require('../swap-flavor');

describe('flavorForConfiguration', () => {
  it('maps only "Release" to release; everything else to debug', () => {
    expect(flavorForConfiguration('Release')).toBe('release');
    expect(flavorForConfiguration('Debug')).toBe('debug');
    expect(flavorForConfiguration('MyCustomConfig')).toBe('debug');
    expect(flavorForConfiguration(undefined)).toBe('debug');
  });
});

describe('rewriteFlavorInPath', () => {
  const debugPath =
    '/repo/packages/precompile/.build/expo-modules-core/output/debug/xcframeworks/ExpoModulesCore.xcframework';

  it('swaps the flavor segment', () => {
    expect(rewriteFlavorInPath(debugPath, 'release')).toBe(
      '/repo/packages/precompile/.build/expo-modules-core/output/release/xcframeworks/ExpoModulesCore.xcframework'
    );
    expect(rewriteFlavorInPath(debugPath, 'debug')).toBe(debugPath);
  });

  it('returns null for a path that is not a precompile output path', () => {
    expect(rewriteFlavorInPath('/some/other/ExpoModulesCore.xcframework', 'release')).toBeNull();
  });
});

describe('sliceForPlatform', () => {
  const libraries = [
    { LibraryIdentifier: 'ios-arm64', SupportedPlatform: 'ios' },
    {
      LibraryIdentifier: 'ios-arm64_x86_64-simulator',
      SupportedPlatform: 'ios',
      SupportedPlatformVariant: 'simulator',
    },
    { LibraryIdentifier: 'tvos-arm64', SupportedPlatform: 'tvos' },
  ];

  it('picks the simulator slice for iphonesimulator', () => {
    expect(sliceForPlatform(libraries, 'iphonesimulator')).toBe('ios-arm64_x86_64-simulator');
  });

  it('picks the device slice for iphoneos', () => {
    expect(sliceForPlatform(libraries, 'iphoneos')).toBe('ios-arm64');
  });

  it('returns null for unsupported platforms', () => {
    expect(sliceForPlatform(libraries, 'appletvos')).toBeNull();
    expect(sliceForPlatform(libraries, undefined)).toBeNull();
  });
});

describe('describeFlavoredArtifact', () => {
  const debugPath =
    '/repo/packages/precompile/.build/expo-modules-core/output/debug/xcframeworks/ExpoModulesCore.xcframework';

  it('declares both flavors from either flavor path', () => {
    const artifact = describeFlavoredArtifact('ExpoModulesCore', '/gen/artifacts/ExpoModulesCore.xcframework', debugPath);
    expect(artifact).toEqual({
      name: 'ExpoModulesCore',
      link: '/gen/artifacts/ExpoModulesCore.xcframework',
      flavors: {
        debug: debugPath,
        release: debugPath.replace('/output/debug/', '/output/release/'),
      },
    });
  });

  it('omits flavors for non-precompile paths', () => {
    const artifact = describeFlavoredArtifact('X', '/gen/artifacts/X.xcframework', '/somewhere/else/X.xcframework');
    expect(artifact.flavors).toEqual({});
  });
});
