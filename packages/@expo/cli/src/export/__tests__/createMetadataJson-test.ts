import { createMetadataJson } from '../createMetadataJson';

describe(createMetadataJson, () => {
  it(`writes metadata without file hashes`, async () => {
    // Should not throw
    await createMetadataJson({
      fileNames: { ios: ['_expo/static/js/ios/ios-xxfooxxbarxx.js', 'other'] },
      bundles: {
        ios: {
          assets: [{ type: 'font' } as any],
        },
      },
    });
  });
  it(`writes metadata manifest`, async () => {
    const metadata = await createMetadataJson({
      fileNames: { ios: ['_expo/static/js/ios/ios-xxfooxxbarxx.js', 'other'] },

      bundles: {
        ios: {
          assets: [{ type: 'image', fileHashes: ['foobar', 'other'] } as any],
        },
      },
    });

    expect(metadata).toStrictEqual({
      bundler: expect.any(String),
      fileMetadata: {
        ios: {
          assets: [
            {
              ext: 'image',
              path: 'assets/foobar',
            },
            {
              ext: 'image',
              path: 'assets/other',
            },
          ],
          bundle: '_expo/static/js/ios/ios-xxfooxxbarxx.js',
        },
      },
      version: expect.any(Number),
    });
  });
  it(`writes metadata manifest with excluded assets`, async () => {
    const metadata = await createMetadataJson({
      fileNames: {
        ios: ['ios-xxfooxxbarxx.js'],
      },
      bundles: {
        ios: {
          assets: [{ hash: 'foo', type: 'image', fileHashes: ['foobar', 'other'] } as any],
        },
      },
      embeddedHashSet: new Set(['foo']),
    });

    expect(metadata).toStrictEqual({
      bundler: expect.any(String),
      fileMetadata: {
        ios: {
          assets: [],
          bundle: 'ios-xxfooxxbarxx.js',
        },
      },
      version: expect.any(Number),
    });
  });
});
