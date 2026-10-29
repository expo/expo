import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseArtifactPath, type ArtifactContext } from './ArtifactPath';

const SHARED = '/repo/packages/precompile/.build';
const IMAGE: ArtifactContext = {
  packageName: 'expo-image',
  flavor: 'Debug',
  artifactName: 'ExpoImage',
};
const SCREENS: ArtifactContext = {
  packageName: 'react-native-screens',
  flavor: 'Release',
  artifactName: 'RNScreens',
};
const SKIA: ArtifactContext = {
  packageName: '@shopify/react-native-skia',
  flavor: 'Debug',
  artifactName: 'RNSkia',
};

/**
 * Both output layouts the repo writes, each with and without a version prefix and each with a
 * scoped and an unscoped package name.
 */
const LAYOUTS: [string, string, ArtifactContext][] = [
  [
    'shared build tree',
    `${SHARED}/expo-image/output/debug/xcframeworks/ExpoImage.xcframework`,
    IMAGE,
  ],
  [
    'shared build tree, version-prefixed',
    `${SHARED}/react-native-screens/output/4.26.0/0.83.0/release/xcframeworks/RNScreens.xcframework`,
    SCREENS,
  ],
  [
    'shared build tree, scoped package',
    `${SHARED}/@shopify/react-native-skia/output/debug/xcframeworks/RNSkia.xcframework`,
    SKIA,
  ],
  [
    'shared build tree, scoped package, version-prefixed',
    `${SHARED}/@shopify/react-native-skia/output/2.5.0/0.88.0/debug/xcframeworks/RNSkia.xcframework`,
    SKIA,
  ],
  [
    'package-local build directory',
    '/repo/packages/expo-image/.expo-prebuild/output/debug/xcframeworks/ExpoImage.xcframework',
    IMAGE,
  ],
  [
    'package-local build directory, version-prefixed',
    '/repo/node_modules/react-native-screens/.expo-prebuild/output/4.26.0/0.83.0/release/xcframeworks/RNScreens.xcframework',
    SCREENS,
  ],
  [
    'package-local build directory, scoped package',
    '/repo/node_modules/@shopify/react-native-skia/.expo-prebuild/output/debug/xcframeworks/RNSkia.xcframework',
    SKIA,
  ],
  [
    'package-local build directory, scoped package, version-prefixed',
    '/repo/node_modules/@shopify/react-native-skia/.expo-prebuild/output/2.5.0/0.88.0/debug/xcframeworks/RNSkia.xcframework',
    SKIA,
  ],
];

describe('parseArtifactPath', () => {
  for (const [name, artifactPath, expected] of LAYOUTS) {
    it(`reads package, flavor and artifact name out of a ${name} path`, () => {
      assert.deepEqual(parseArtifactPath(artifactPath), expected);
    });
  }

  for (const [marker, artifactPath] of [
    [
      '.build',
      '/Users/x/.build/expo/packages/precompile/.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework',
    ],
    [
      '.expo-prebuild',
      '/Users/x/.expo-prebuild/expo/packages/expo-image/.expo-prebuild/output/debug/xcframeworks/ExpoImage.xcframework',
    ],
  ]) {
    it(`ignores an unrelated ${marker} marker before the matched layout`, () => {
      assert.deepEqual(parseArtifactPath(artifactPath), IMAGE);
    });
  }

  it('returns null for a path outside the prebuild output tree', () => {
    assert.equal(parseArtifactPath('/tmp/copy/ExpoImage.xcframework'), null);
  });

  it('returns null for a directory that merely ends in .build (C6)', () => {
    assert.equal(
      parseArtifactPath(
        '/repo/my.build/expo-image/output/debug/xcframeworks/ExpoImage.xcframework'
      ),
      null
    );
  });

  it('returns null for a directory that merely ends in .expo-prebuild', () => {
    assert.equal(
      parseArtifactPath(
        '/repo/packages/my.expo-prebuild/output/debug/xcframeworks/ExpoImage.xcframework'
      ),
      null
    );
  });

  it('returns null for a package-local tail copied into a scratch directory', () => {
    assert.equal(
      parseArtifactPath('/tmp/copy/output/debug/xcframeworks/ExpoImage.xcframework'),
      null
    );
  });
});

describe('round 6c item 6: ambiguous layout markers', () => {
  it('refuses a path matching both output layouts', () => {
    assert.throws(
      () =>
        parseArtifactPath(
          '/repo/packages/.build/.expo-prebuild/output/debug/xcframeworks/Foo.xcframework'
        ),
      {
        message: /ambiguous[\s\S]*both.*layouts/i,
      }
    );
  });

  for (const [marker, artifact] of [
    [
      '.build',
      '/repo/.build/outer/output/version/.build/inner/output/debug/xcframeworks/Foo.xcframework',
    ],
    [
      '.expo-prebuild',
      '/repo/outer/.expo-prebuild/output/version/inner/.expo-prebuild/output/debug/xcframeworks/Foo.xcframework',
    ],
  ]) {
    it(`refuses a repeated ${marker} marker swallowed by the version prefix`, () => {
      assert.throws(
        () => parseArtifactPath(artifact),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.ok(error.message.startsWith(artifact));
          assert.equal(
            error.message.slice(artifact.length),
            ` is ambiguous: layout marker ${marker} occurs more than once. The dependency check ` +
              `cannot choose a package configuration without guessing. Point at an unambiguous ` +
              `prebuild output path and preserve exactly one layout tail when copying an artifact.`
          );
          return true;
        }
      );
    });
  }
});
