'use strict';

const { rewriteFlavorInPath, describeFlavoredArtifact } = require('../swap-flavor');

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
