import { vol } from 'memfs';

import {
  getBuildManifestAsync,
  getBuildManifestHashSet,
  getExportedMetadataAsync,
  getExportedMetadataHashSet,
  getFullAssetDumpAsync,
  getFullAssetDumpHashSet,
} from '../assetsVerifyAsync';
import { BuildManifest, ExportedMetadata, FullAssetDump } from '../assetsVerifyTypes';

jest.mock('fs');

const projectRoot = '/wat';

const metadata: ExportedMetadata = {
  fileMetadata: {
    ios: {
      bundle: 'bundle.hbc',
      assets: [
        {
          path: 'assets/a7643581b54e5c60b852c5d827e629dc',
          ext: 'jpg',
        },
      ],
    },
    android: {
      bundle: 'bundle.hbc',
      assets: [
        {
          path: 'assets/a7643581b54e5c60b852c5d827e629dc',
          ext: 'jpg',
        },
      ],
    },
  },
};
const assetMap: FullAssetDump = new Map(
  Object.entries({
    '1052d6ca3993ae24a932304560a4c8b4': {
      files: ['Abel_400Regular.ttf'],
      hash: '1052d6ca3993ae24a932304560a4c8b4',
      name: 'Abel_400Regular',
      type: 'ttf',
      fileHashes: ['1052d6ca3993ae24a932304560a4c8b4'],
    },
    '6c6f1942f05d08b0a89b3720a8d2aecd': {
      files: ['HankenGrotesk_300Light.ttf'],
      hash: '6c6f1942f05d08b0a89b3720a8d2aecd',
      name: 'HankenGrotesk_300Light',
      type: 'ttf',
      fileHashes: ['6c6f1942f05d08b0a89b3720a8d2aecd'],
    },
    c0869ee4a51820ceef252798829c4c76: {
      files: ['dougheadshot.jpg'],
      hash: 'c0869ee4a51820ceef252798829c4c76',
      name: 'dougheadshot',
      type: 'jpg',
      fileHashes: ['c0869ee4a51820ceef252798829c4c76'],
    },
    a7643581b54e5c60b852c5d827e629dc: {
      files: ['coffee-prep.jpg'],
      hash: 'a7643581b54e5c60b852c5d827e629dc',
      name: 'coffee-prep',
      type: 'jpg',
      fileHashes: ['a7643581b54e5c60b852c5d827e629dc'],
    },
  })
);
const buildManifest: BuildManifest = {
  id: '3b66f846-1be5-458d-a96a-5f1de9d8fc85',
  commitTime: 1706311180697,
  assets: [
    {
      name: 'Abel_400Regular',
      type: 'ttf',
      packagerHash: '1052d6ca3993ae24a932304560a4c8b4',
    },
    {
      name: 'HankenGrotesk_300Light',
      type: 'ttf',
      packagerHash: '6c6f1942f05d08b0a89b3720a8d2aecd',
    },
    {
      name: 'dougheadshot',
      type: 'jpg',
      packagerHash: 'c0869ee4a51820ceef252798829c4c76',
    },
  ],
};
describe(getFullAssetDumpAsync, () => {
  beforeEach(() => {
    vol.reset();
  });
  it('throws if assetmap is missing', async () => {
    vol.fromJSON({}, projectRoot);
    let errorMessage = '';
    try {
      await getFullAssetDumpAsync(`${projectRoot}/dist/assetmap.json`);
    } catch (e) {
      errorMessage = `${e}`;
    }
    expect(errorMessage.length).toBeGreaterThan(0);
  });

  it('returns full asset map and set', async () => {
    vol.fromJSON(
      {
        'dist/assetmap.json': JSON.stringify(Object.fromEntries(assetMap)),
      },
      projectRoot
    );
    const result = await getFullAssetDumpAsync(`${projectRoot}/dist/assetmap.json`);
    expect(result.get('c0869ee4a51820ceef252798829c4c76')?.name).toEqual('dougheadshot');
  });
});
describe(getFullAssetDumpHashSet, () => {
  it('Converts full asset map to set', () => {
    const result = getFullAssetDumpHashSet(assetMap);
    expect(result.size).toEqual(4);
  });
});
describe(getBuildManifestAsync, () => {
  beforeEach(() => {
    vol.reset();
  });
  it('Reads the build manifest', async () => {
    vol.fromJSON(
      {
        'android/app/build/intermediates/app.manifest': JSON.stringify(buildManifest),
      },
      projectRoot
    );
    const result = await getBuildManifestAsync(
      `${projectRoot}/android/app/build/intermediates/app.manifest`
    );
    expect(result.assets.length).toEqual(3);
  });
  it('Throws if build manifest does not exist', async () => {
    vol.fromJSON(
      {
        'android/app/build/app.manifest': JSON.stringify(buildManifest),
      },
      projectRoot
    );
    let errorMessage = '';
    try {
      await getBuildManifestAsync(`${projectRoot}/ios/app.manifest`);
    } catch (e) {
      errorMessage = `${e}`;
    }
    expect(errorMessage.length).toBeGreaterThan(0);
  });
});
describe(getBuildManifestHashSet, () => {
  it('Constructs hash set from build manifest', () => {
    const result = getBuildManifestHashSet(buildManifest);
    expect(result.size).toEqual(3);
    expect(result.has('1052d6ca3993ae24a932304560a4c8b4'));
  });
});
describe(getExportedMetadataAsync, () => {
  beforeEach(() => {
    vol.reset();
  });
  it('Gets exported metadata from an export bundle', async () => {
    vol.reset();

    vol.fromJSON(
      {
        'dist/metadata.json': JSON.stringify(metadata),
      },
      projectRoot
    );
    const result = await getExportedMetadataAsync(`${projectRoot}/dist/metadata.json`);
    expect(result.fileMetadata.android?.assets.length).toEqual(1);
    expect(result.fileMetadata.android?.assets.length).toEqual(1);
  });
  it('Throws if metadata does not exist', async () => {
    vol.fromJSON({}, projectRoot);
    let errorMessage = '';
    try {
      await getExportedMetadataAsync(`${projectRoot}/dist/metadata.json`);
    } catch (e) {
      errorMessage = `${e}`;
    }
    expect(errorMessage.length).toBeGreaterThan(0);
  });
});
describe(getExportedMetadataHashSet, () => {
  it('Constructs hash set from exported metadata', () => {
    const result = getExportedMetadataHashSet(metadata, 'ios');
    expect(result.size).toEqual(1);
  });
  it('Throws if platform missing from metadata', () => {
    const metadataWithoutAndroid: ExportedMetadata = {
      fileMetadata: {
        ios: metadata.fileMetadata.ios,
        android: undefined,
      },
    };
    expect(() => getExportedMetadataHashSet(metadataWithoutAndroid, 'android')).toThrow();
  });
});
