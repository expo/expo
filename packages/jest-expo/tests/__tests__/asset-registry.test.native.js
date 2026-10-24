// Regression tests for the asset registry mock in `jest-expo/src/preset/setup.js`.

describe('asset registry', () => {
  it('resolves asset modules through the AssetRegistry exported by react-native', () => {
    const { AssetRegistry } = require('react-native');
    const assetModule = require('../__fixtures__/asset/font.ttf');

    expect(AssetRegistry.getAssetByID(assetModule)).toBeDefined();
  });

  it('lets expo-asset create an Asset from an asset module', () => {
    const { Asset } = require('expo-asset');
    const assetModule = require('../__fixtures__/asset/font.ttf');

    expect(() => Asset.fromModule(assetModule)).not.toThrow();
  });
});
