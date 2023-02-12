import { createMetadataJson } from '../createMetadataJson';

describe(createMetadataJson, () => {
  it(`writes metadata without file hashes`, async () => {
    // Should not throw
    await createMetadataJson({
      fileNames: {
        ios: 'ios-xxfooxxbarxx.js',
      },
      bundles: {
        ios: {
          assets: [{ type: 'font' } as any],
        },
      },
    });
  });
  it(`writes metadata manifest`, async () => {
    const metadata = await createMetadataJson({
      fileNames: {
        ios: 'ios-xxfooxxbarxx.js',
      },
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
          bundle: 'bundles/ios-xxfooxxbarxx.js',
        },
      },
      version: expect.any(Number),
    });
  });
});
