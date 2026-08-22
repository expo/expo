import * as generator from '@babel/generator';
import { getAssetData, type AssetData } from '@expo/metro/metro/Assets';
import * as fs from 'fs';
import { vol } from 'memfs';

import { transform } from '../asset-transformer';

// Fixtures stand in for the resolved `getAssetData` value. They include the Expo-only
// `fileHashes` field (normally injected downstream) to exercise that code path, so the
// returned object is cast to the Metro `AssetData` type the mock is typed against.
function getMockImageDev(): AssetData {
  return {
    __packager_asset: true,
    fileSystemLocation: '/root/local',
    httpServerLocation: '/assets/?unstable_path=.%2Fassets%2Fimages',
    width: 1024,
    height: 1024,
    scales: [1],
    hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
    name: 'icon',
    type: 'png',
    files: [],
    fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a'],
  } as AssetData;
}
function getMockFontDev(): AssetData {
  return {
    __packager_asset: true,
    fileSystemLocation: '/root/local',
    httpServerLocation: '/assets/?unstable_path=.%2Fassets%2Ffonts',
    scales: [1],
    hash: '49a79d66bdea2debf1832bf4d7aca127',
    name: 'SpaceMono-Regular',
    type: 'ttf',
    files: [],
    fileHashes: ['49a79d66bdea2debf1832bf4d7aca127'],
  } as AssetData;
}
function getMockImageExport(): AssetData {
  return {
    __packager_asset: true,
    fileSystemLocation: '/root/local',
    httpServerLocation: '/assets/assets/images',
    width: 1024,
    height: 1024,
    scales: [1],
    hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
    name: 'icon',
    type: 'png',
    files: [],
    fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a'],
  } as AssetData;
}
// `icon.png` shipped alongside `icon@2x.png` and `icon@3x.png`.
const MULTI_SCALE_FILE_HASHES = [
  '4e3f888fc8475f69fd5fa32f1ad5216a',
  '0d2b0f1c1e5d4a3b9c8e7f6a5b4c3d2e',
  '1a2b3c4d5e6f708192a3b4c5d6e7f809',
];
function getMockMultiScaleImageDev(): AssetData {
  return {
    ...getMockImageDev(),
    scales: [1, 2, 3],
    fileHashes: MULTI_SCALE_FILE_HASHES,
  } as AssetData;
}
function getMockMultiScaleImageExport(): AssetData {
  return {
    ...getMockImageExport(),
    scales: [1, 2, 3],
    fileHashes: MULTI_SCALE_FILE_HASHES,
  } as AssetData;
}

jest.mock('fs');

jest.mock('@expo/metro/metro/Assets', () => ({ getAssetData: jest.fn() }));

beforeEach(() => {
  jest.resetModules();
  vol.reset();
  fs.mkdirSync('/root/local', { recursive: true });
});

const EXPORT_PUBLIC_PATH = '/assets?export_path=/assets';

it(`parses asset as normal module in client environment`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce({
    files: [],
    fileHashes: [],
  } as unknown as AssetData);
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'ios',
        publicPath: '/assets',
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(`
    "module.exports = require("[MOCK_ASSET_REGISTRY]").registerAsset({
      "fileHashes": []
    });"
  `);
  expect(results.reactClientReference).toBeUndefined();
});

it(`parses asset for dom components export`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockImageExport());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: EXPORT_PUBLIC_PATH,
        customTransformOptions: {
          dom: '1',
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(getAssetData).toHaveBeenCalledTimes(1);
  expect(astString(results.ast)).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/assets/images/icon.4e3f888fc8475f69fd5fa32f1ad5216a.png",
      width: 1024,
      height: 1024,
      toString() {
        return this.uri;
      }
    };"
  `);
  expect(results.reactClientReference).toBeUndefined();
});

it(`parses asset as string in client environment for web`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockImageDev());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: '/assets',
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png",
      width: 1024,
      height: 1024,
      toString() {
        return this.uri;
      }
    };"
  `);
  expect(results.reactClientReference).toBeUndefined();
});

it(`parses font asset as string in client environment for web`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockFontDev());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: '/assets',
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(
    `"module.exports = "/assets/?unstable_path=.%2Fassets%2Ffonts/SpaceMono-Regular.ttf";"`
  );
  expect(results.reactClientReference).toBeUndefined();
});

it(`parses asset as string in client environment for web during export`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockImageExport());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: EXPORT_PUBLIC_PATH,
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/assets/images/icon.4e3f888fc8475f69fd5fa32f1ad5216a.png",
      width: 1024,
      height: 1024,
      toString() {
        return this.uri;
      }
    };"
  `);
  expect(results.reactClientReference).toBeUndefined();
});

it(`adds a density srcset for a multi-resolution asset for web`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockMultiScaleImageDev());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: '/assets',
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png",
      width: 1024,
      height: 1024,
      sources: [{
        uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png",
        scale: 1
      }, {
        uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon@2x.png",
        scale: 2
      }, {
        uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon@3x.png",
        scale: 3
      }],
      srcset: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png 1x, /assets/?unstable_path=.%2Fassets%2Fimages/icon@2x.png 2x, /assets/?unstable_path=.%2Fassets%2Fimages/icon@3x.png 3x",
      toString() {
        return this.uri;
      }
    };"
  `);
});

it(`adds a density srcset for a multi-resolution asset for web during export`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockMultiScaleImageExport());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: EXPORT_PUBLIC_PATH,
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b.png",
      width: 1024,
      height: 1024,
      sources: [{
        uri: "/assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b.png",
        scale: 1
      }, {
        uri: "/assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b@2x.png",
        scale: 2
      }, {
        uri: "/assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b@3x.png",
        scale: 3
      }],
      srcset: "/assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b.png 1x, /assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b@2x.png 2x, /assets/assets/images/icon.ac83c8d6b16d2f88fae0494fe6388e4b@3x.png 3x",
      toString() {
        return this.uri;
      }
    };"
  `);
});

it(`dedupes a repeated scale in the sources and srcset`, async () => {
  // `icon.png` shipped alongside `icon@1x.png`: Metro reports scale 1 twice, and both files
  // collapse to the same output file. A repeated density descriptor is invalid in `srcset`.
  jest.mocked(getAssetData).mockResolvedValueOnce({
    ...getMockMultiScaleImageExport(),
    scales: [1, 1, 2, 3],
    fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a', ...MULTI_SCALE_FILE_HASHES],
  } as AssetData);
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: EXPORT_PUBLIC_PATH,
        customTransformOptions: {},
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  const asset = astString(results.ast);
  expect(asset).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e.png",
      width: 1024,
      height: 1024,
      sources: [{
        uri: "/assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e.png",
        scale: 1
      }, {
        uri: "/assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e@2x.png",
        scale: 2
      }, {
        uri: "/assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e@3x.png",
        scale: 3
      }],
      srcset: "/assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e.png 1x, /assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e@2x.png 2x, /assets/assets/images/icon.d93fed005074388e3a58d33607ebb15e@3x.png 3x",
      toString() {
        return this.uri;
      }
    };"
  `);
});

it(`adds sources and srcset for a multi-resolution asset in react server environment for web`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockMultiScaleImageDev());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: '/assets',
        customTransformOptions: {
          environment: 'react-server',
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  const asset = astString(results.ast);
  expect(asset).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png",
      width: 1024,
      height: 1024,
      sources: [{
        uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png",
        scale: 1
      }, {
        uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon@2x.png",
        scale: 2
      }, {
        uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon@3x.png",
        scale: 3
      }],
      srcset: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png 1x, /assets/?unstable_path=.%2Fassets%2Fimages/icon@2x.png 2x, /assets/?unstable_path=.%2Fassets%2Fimages/icon@3x.png 3x"
    };"
  `);
  // Functions cannot cross the RSC boundary.
  expect(asset).not.toContain('toString');
});

it(`omits the srcset for a multi-resolution asset in a dom components export`, async () => {
  // Every scale is written to the same `<md5>.png` file name, so there is nothing to pick between.
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockMultiScaleImageExport());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: EXPORT_PUBLIC_PATH,
        customTransformOptions: {
          dom: '1',
          useMd5Filename: true,
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).not.toContain('srcset');
});

it(`parses asset as string in react server environment for web`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockImageDev());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: '/assets',
        customTransformOptions: {
          environment: 'react-server',
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(getAssetData).toHaveBeenCalledTimes(1);
  const asset = astString(results.ast);
  expect(asset).toMatchInlineSnapshot(`
    "module.exports = {
      uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png",
      width: 1024,
      height: 1024
    };"
  `);
  expect(asset).not.toContain('toString');
  expect(results.reactClientReference).toBe('file:///root/local/foo.png');
});

it(`parses asset as client reference in react server environment`, async () => {
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'ios',
        publicPath: '/assets',
        customTransformOptions: {
          environment: 'react-server',
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(astString(results.ast)).toMatchInlineSnapshot(
    `"module.exports = require('react-server-dom-webpack/server').createClientModuleProxy("./local/foo.png");"`
  );
  expect(results.reactClientReference).toBe('file:///root/local/foo.png');
});

function astString(ast: any): string {
  return generator.default(ast).code;
}
