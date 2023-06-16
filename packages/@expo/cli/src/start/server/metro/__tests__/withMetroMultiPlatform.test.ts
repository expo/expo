import { getBareExtensions } from '@expo/config/paths';

import { getNodejsExtensions, shouldAliasAssetRegistryForWeb } from '../withMetroMultiPlatform';

describe(getNodejsExtensions, () => {
  it(`should return the correct extensions for the node.js platform`, () => {
    const sourceExts = getBareExtensions([], { isTS: true, isReact: true, isModern: true });

    expect(getNodejsExtensions(sourceExts)).not.toEqual(sourceExts);

    // Ensure mjs comes after js
    expect(getNodejsExtensions(sourceExts)).toMatchInlineSnapshot(`
      [
        "ts",
        "tsx",
        "js",
        "jsx",
        "mjs",
        "json",
      ]
    `);
  });
});

describe(shouldAliasAssetRegistryForWeb, () => {
  it(`should return true if the incoming resolution is for the web platform and the AssetRegistry`, () => {
    [
      'node_modules/react-native-web/dist/modules/AssetRegistry/index.js',
      // Monorepo
      '../../react-native-web/dist/modules/AssetRegistry/index.js',
      // Windows
      'node_modules\\react-native-web\\dist\\modules\\AssetRegistry\\index.js',
    ].forEach((filePath) => {
      expect(
        shouldAliasAssetRegistryForWeb('web', {
          type: 'sourceFile',
          filePath,
        })
      ).toBe(true);
    });
  });
  it(`should return false if the path is wrong`, () => {
    ['modules/AssetRegistry/index.js', 'invalid'].forEach((filePath) => {
      expect(
        shouldAliasAssetRegistryForWeb('web', {
          type: 'sourceFile',
          filePath,
        })
      ).toBe(false);
    });
  });
  it(`should return false if the incoming resolution is for non-web platforms`, () => {
    [
      'invalid.js',

      // valid
      'node_modules/react-native-web/dist/modules/AssetRegistry/index.js',
    ].forEach((filePath) => {
      expect(
        shouldAliasAssetRegistryForWeb('ios', {
          type: 'sourceFile',
          filePath,
        })
      ).toBe(false);
    });
  });
});
