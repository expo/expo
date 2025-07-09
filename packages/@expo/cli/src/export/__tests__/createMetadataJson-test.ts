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
  it(`writes metadata manifest with dom components asset`, async () => {
    const metadata = await createMetadataJson({
      fileNames: { ios: ['_expo/static/js/ios/ios-xxfooxxbarxx.js', 'other'] },

      bundles: {
        ios: {
          assets: [{ type: 'image', fileHashes: ['foobar', 'other'] } as any],
        },
      },
      domComponentAssetsMetadata: {
        ios: [
          {
            path: 'www.bundle/6f3d5250b031acb593b17db64fef2375a3763a5e.html',
            ext: 'html',
          },
          {
            path: 'www.bundle/_expo/static/js/web/entry-f6b050d6eb8cc8aa0515b4914358ee47.js',
            ext: 'js',
          },
        ],
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
            {
              ext: 'html',
              path: 'www.bundle/6f3d5250b031acb593b17db64fef2375a3763a5e.html',
            },
            {
              ext: 'js',
              path: 'www.bundle/_expo/static/js/web/entry-f6b050d6eb8cc8aa0515b4914358ee47.js',
            },
          ],
          bundle: '_expo/static/js/ios/ios-xxfooxxbarxx.js',
        },
      },
      version: expect.any(Number),
    });
  });
});
