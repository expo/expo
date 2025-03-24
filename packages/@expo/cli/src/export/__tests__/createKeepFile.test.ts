/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { vol } from 'memfs';
import type { AssetData } from 'metro';

import { createKeepFile } from '../persistMetroAssets';

jest.mock('fs');

describe(createKeepFile, () => {
  const assets: AssetData[] = [
    {
      __packager_asset: true,
      fileSystemLocation: 'input',
      httpServerLocation: '/assets/input',
      width: 100,
      height: 100,
      scales: [1, 2, 3],
      hash: 'hash',
      name: 'image',
      type: 'png',
      files: ['/input/image.png'],
    },
    {
      __packager_asset: true,
      fileSystemLocation: 'input',
      httpServerLocation: '/assets/input',
      width: undefined,
      height: undefined,
      scales: [1],
      hash: 'hash',
      name: 'testFont',
      type: 'ttf',
      files: ['/input/someFont.ttf'],
    },
  ];

  it('creates a keep.xml file', async () => {
    await createKeepFile(assets, '/output');

    expect(vol.readdirSync('/output/raw')).toEqual(['keep.xml']);
    expect(vol.readFileSync('/output/raw/keep.xml', 'utf8')).toBe(
      `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="@drawable/input_image,@raw/input_testfont" />`
    );
  });
});
