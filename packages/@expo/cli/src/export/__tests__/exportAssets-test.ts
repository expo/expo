import { resolveAssetPatternsToBeBundledAsync } from '../exportAssets';

describe(resolveAssetPatternsToBeBundledAsync, () => {
  it(`does nothing with empty bundle patterns`, async () => {
    const exp = {
      name: 'Foo',
      slug: 'Foo',
    };
    expect(await resolveAssetPatternsToBeBundledAsync('/', exp, [])).toEqual({
      name: 'Foo',
      slug: 'Foo',
    });
  });
  it(`expands bundle patterns`, async () => {
    const exp: any = {
      name: 'Foo',
      slug: 'Foo',
      extra: {
        assetPatternsToBeBundled: ['**/*'],
      },
    };
    await resolveAssetPatternsToBeBundledAsync('/', exp, [
      {
        __packager_asset: true,
        files: ['/Users/evanbacon/Documents/GitHub/lab/yolo87/assets/icon.png'],
        hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
        name: 'icon',
        type: 'png',
        fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a'],
      },
      {
        __packager_asset: true,
        files: ['/Users/evanbacon/Documents/GitHub/lab/yolo87/assets/somn'],
        hash: 'foobar',
        name: 'somn',
        fileHashes: [
          'foobar',
          'foobar2',
          // duplicates are stripped
          'foobar2',
        ],
      },
      {
        // Wont match
        __packager_asset: false,
        files: ['/Users/evanbacon/Documents/GitHub/lab/yolo87/assets/somn'],
        hash: 'foobar',
        name: 'somn',
        fileHashes: ['foobar3'],
      },
    ]);
    const result = [...exp.bundledAssets];
    result.sort();
    expect(result).toEqual([
      'asset_4e3f888fc8475f69fd5fa32f1ad5216a.png',
      'asset_foobar',
      'asset_foobar2',
    ]);
  });
});
