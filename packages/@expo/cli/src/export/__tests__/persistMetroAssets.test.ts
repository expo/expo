import {
  stripAssetPrefix,
  filterPlatformAssetScales,
  getAssetLocalPath,
} from '../persistMetroAssets';
import * as path from 'path';

it(`strips asset prefix`, () => {
  expect(
    stripAssetPrefix(
      '/expo-router-gh-pages-test/assets/node_modules/@expo/metro-runtime/assets',
      '/expo-router-gh-pages-test'
    )
  ).toBe('/assets/node_modules/@expo/metro-runtime/assets');
});

describe('filterPlatformAssetScales', () => {
  test('removes everything but 2x and 3x for iOS', () => {
    expect(filterPlatformAssetScales('ios', [1, 1.5, 2, 3, 4])).toEqual([1, 2, 3]);
    expect(filterPlatformAssetScales('ios', [3, 4])).toEqual([3]);
  });

  test('keeps closest largest one if nothing matches', () => {
    expect(filterPlatformAssetScales('ios', [0.5, 4, 100])).toEqual([4]);
    expect(filterPlatformAssetScales('ios', [0.5, 100])).toEqual([100]);
    expect(filterPlatformAssetScales('ios', [0.5])).toEqual([0.5]);
    expect(filterPlatformAssetScales('ios', [])).toEqual([]);
  });

  test('keeps all scales for unknown platform', () => {
    expect(filterPlatformAssetScales('freebsd', [1, 1.5, 2, 3.7])).toEqual([1, 1.5, 2, 3.7]);
  });
});

describe('getAssetDestPathAndroid', () => {
  test('should use the right destination folder', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    const expectDestPathForScaleToStartWith = (scale: number, location: string) => {
      if (!getAssetLocalPath(asset, { scale, platform: 'android' }).startsWith(location)) {
        throw new Error(`asset for scale ${scale} should start with path '${location}'`);
      }
    };

    expectDestPathForScaleToStartWith(1, 'drawable-mdpi');
    expectDestPathForScaleToStartWith(1.5, 'drawable-hdpi');
    expectDestPathForScaleToStartWith(2, 'drawable-xhdpi');
    expectDestPathForScaleToStartWith(3, 'drawable-xxhdpi');
    expectDestPathForScaleToStartWith(4, 'drawable-xxxhdpi');
  });

  test('should lowercase path', () => {
    const asset = {
      name: 'Icon',
      type: 'png',
      httpServerLocation: '/assets/App/Test',
    };

    expect(getAssetLocalPath(asset, { scale: 1, platform: 'android' })).toBe(
      path.normalize('drawable-mdpi/app_test_icon.png')
    );
  });

  test('should remove `assets/` prefix', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/RKJSModules/Apps/AndroidSample/Assets',
    };

    expect(
      getAssetLocalPath(asset, { scale: 1, platform: 'android' }).startsWith('assets_')
    ).toBeFalsy();
  });

  test('should put non-drawable resources to `raw/`', () => {
    const asset = {
      name: 'video',
      type: 'mp4',
      httpServerLocation: '/assets/app/test',
    };

    expect(getAssetLocalPath(asset, { scale: 1, platform: 'android' })).toBe(
      path.normalize('raw/app_test_video.mp4')
    );
  });

  test('should handle assets with a relative path outside of root', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/../../test',
    };

    expect(getAssetLocalPath(asset, { scale: 1, platform: 'android' })).toBe(
      path.normalize('drawable-mdpi/__test_icon.png')
    );
  });
});

describe('getAssetDestPathIOS', () => {
  test('should build correct path', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetLocalPath(asset, { scale: 1, platform: 'ios' })).toBe(
      path.normalize('assets/test/icon.png')
    );
  });

  test('should consider scale', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetLocalPath(asset, { scale: 2, platform: 'ios' })).toBe(
      path.normalize('assets/test/icon@2x.png')
    );
    expect(getAssetLocalPath(asset, { scale: 3, platform: 'ios' })).toBe(
      path.normalize('assets/test/icon@3x.png')
    );
  });

  test('should handle assets with a relative path outside of root', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/../../test',
    };

    expect(getAssetLocalPath(asset, { scale: 1, platform: 'ios' })).toBe(
      path.normalize('assets/__test/icon.png')
    );
  });
});
