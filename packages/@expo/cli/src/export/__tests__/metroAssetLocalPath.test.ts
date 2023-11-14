/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as path from 'path';

import { stripAssetPrefix, getAssetLocalPath } from '../metroAssetLocalPath';

describe(stripAssetPrefix, () => {
  it(`strips asset prefix`, () => {
    expect(
      stripAssetPrefix(
        '/expo-router-gh-pages-test/assets/node_modules/@expo/metro-runtime/assets',
        '/expo-router-gh-pages-test'
      )
    ).toBe('/assets/node_modules/@expo/metro-runtime/assets');
  });
});

describe(getAssetLocalPath, () => {
  describe('android', () => {
    it('should use the right destination folder', () => {
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

    it('should lowercase path', () => {
      const asset = {
        name: 'Icon',
        type: 'png',
        httpServerLocation: '/assets/App/Test',
      };

      expect(getAssetLocalPath(asset, { scale: 1, platform: 'android' })).toBe(
        path.normalize('drawable-mdpi/app_test_icon.png')
      );
    });

    it('should remove `assets/` prefix', () => {
      const asset = {
        name: 'icon',
        type: 'png',
        httpServerLocation: '/assets/RKJSModules/Apps/AndroidSample/Assets',
      };

      expect(
        getAssetLocalPath(asset, { scale: 1, platform: 'android' }).startsWith('assets_')
      ).toBeFalsy();
    });

    it('should put non-drawable resources to `raw/`', () => {
      const asset = {
        name: 'video',
        type: 'mp4',
        httpServerLocation: '/assets/app/test',
      };

      expect(getAssetLocalPath(asset, { scale: 1, platform: 'android' })).toBe(
        path.normalize('raw/app_test_video.mp4')
      );
    });

    it('should handle assets with a relative path outside of root', () => {
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

  describe('ios', () => {
    it('should build correct path', () => {
      const asset = {
        name: 'icon',
        type: 'png',
        httpServerLocation: '/assets/test',
      };

      expect(getAssetLocalPath(asset, { scale: 1, platform: 'ios' })).toBe(
        path.normalize('assets/test/icon.png')
      );
    });

    it('should consider scale', () => {
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

    it('should handle assets with a relative path outside of root', () => {
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
});
