/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { vol } from 'memfs';
import type { AssetData } from 'metro';

import { filterPlatformAssetScales, persistMetroAssetsAsync } from '../persistMetroAssets';

describe(filterPlatformAssetScales, () => {
  it('removes everything but 2x and 3x for iOS', () => {
    expect(filterPlatformAssetScales('ios', [1, 1.5, 2, 3, 4])).toEqual([1, 2, 3]);
    expect(filterPlatformAssetScales('ios', [3, 4])).toEqual([3]);
  });

  it('keeps closest largest one if nothing matches', () => {
    expect(filterPlatformAssetScales('ios', [0.5, 4, 100])).toEqual([4]);
    expect(filterPlatformAssetScales('ios', [0.5, 100])).toEqual([100]);
    expect(filterPlatformAssetScales('ios', [0.5])).toEqual([0.5]);
    expect(filterPlatformAssetScales('ios', [])).toEqual([]);
  });

  it('keeps all scales for unknown platform', () => {
    expect(filterPlatformAssetScales('freebsd', [1, 1.5, 2, 3.7])).toEqual([1, 1.5, 2, 3.7]);
  });
});

describe(persistMetroAssetsAsync, () => {
  describe('virtual files match real files', () => {
    beforeEach(() => {
      vol.fromJSON(
        {
          'input/a.png': '...',
          'input/a@2x.png': '...',
          'input/a@3x.png': '...',
        },
        '/'
      );
    });

    const assets: readonly AssetData[] = [
      {
        __packager_asset: true,
        fileSystemLocation: 'input',
        httpServerLocation: '/assets/input',
        width: 100,
        height: 100,
        scales: [1, 2, 3],
        hash: 'hash',
        name: 'asset',
        type: 'png',
        files: ['/input/a.png', '/input/a@2x.png', '/input/a@3x.png'],
      },
    ];

    it(`adds files to persist without writing to disk`, async () => {
      const files = new Map();

      await persistMetroAssetsAsync(assets, {
        outputDirectory: '/output',
        platform: 'ios',
        files,
      });

      expect([...files.keys()]).toEqual([
        'assets/input/asset.png',
        'assets/input/asset@2x.png',
        'assets/input/asset@3x.png',
      ]);

      expect(Object.keys(vol.toJSON())).toEqual([
        '/input/a.png',
        '/input/a@2x.png',
        '/input/a@3x.png',
      ]);
    });

    it(`writes files that match virtual output`, async () => {
      await persistMetroAssetsAsync(assets, {
        outputDirectory: '/output',
        platform: 'ios',
      });

      expect(Object.keys(vol.toJSON())).toEqual([
        '/input/a.png',
        '/input/a@2x.png',
        '/input/a@3x.png',

        // outputDirectory + asset file
        '/output/assets/input/asset.png',
        '/output/assets/input/asset@2x.png',
        '/output/assets/input/asset@3x.png',
      ]);
    });
  });
});
