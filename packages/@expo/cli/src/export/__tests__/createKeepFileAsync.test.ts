import type { AssetData } from '@expo/metro/metro';
import { vol } from 'memfs';

import { createKeepFileAsync } from '../persistMetroAssets';

jest.mock('fs');

describe(createKeepFileAsync, () => {
  afterAll(() => vol.reset());

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
    await createKeepFileAsync(assets, '/output');

    expect(vol.existsSync('/output/raw/keep.xml')).toBe(true);
    expect(await vol.promises.readFile('/output/raw/keep.xml', 'utf8')).toBe(
      `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="@drawable/input_image,@raw/input_testfont" />`
    );
  });
});
