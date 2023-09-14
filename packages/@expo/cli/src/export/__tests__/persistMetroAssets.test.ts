import { stripAssetPrefix } from '../persistMetroAssets';

it(`strips asset prefix`, () => {
  expect(
    stripAssetPrefix(
      '/expo-router-gh-pages-test/assets/node_modules/@expo/metro-runtime/assets',
      '/expo-router-gh-pages-test'
    )
  ).toBe('/assets/node_modules/@expo/metro-runtime/assets');
});
