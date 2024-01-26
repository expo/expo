import { resolveAssetPatternsToBeBundled } from '../exportAssets';

describe(resolveAssetPatternsToBeBundled, () => {
  it(`does nothing with empty bundle patterns`, () => {
    const exp = {
      name: 'Foo',
      slug: 'Foo',
    };
    const assetPatterns = resolveAssetPatternsToBeBundled('/', exp, []);
    expect(assetPatterns).toBeUndefined();
  });
  it(`expands bundle patterns`, () => {
    const exp: any = {
      name: 'Foo',
      slug: 'Foo',
      extra: {
        updates: {
          assetPatternsToBeBundled: ['**/*'],
        },
      },
    };
    const resultSet = resolveAssetPatternsToBeBundled('/', exp, [
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
    const result = [...(resultSet ?? new Set())];
    result.sort();
    expect(result).toEqual([
      'asset_4e3f888fc8475f69fd5fa32f1ad5216a.png',
      'asset_foobar',
      'asset_foobar2',
    ]);
  });
});
