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

jest.mock('fs');

jest.mock('@expo/metro/metro/Assets', () => ({ getAssetData: jest.fn() }));

beforeEach(() => {
  jest.resetModules();
  vol.reset();
  fs.mkdirSync('/root/local', { recursive: true });
});

const EXPORT_PUBLIC_PATH = '/assets?export_path=/assets';

it(`parses asset as normal module in client environment`, async () => {
  jest
    .mocked(getAssetData)
    .mockResolvedValueOnce({ files: [], fileHashes: [] } as unknown as AssetData);
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
