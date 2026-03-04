import * as generator from '@babel/generator';
import { type AssetData, getAssetData } from '@expo/metro/metro/Assets';
import * as fs from 'fs';
import { vol } from 'memfs';

import { transform } from '../asset-transformer';

type MockAssetData = AssetData & { fileHashes: string[] };

const multiScaleImage: MockAssetData = {
  __packager_asset: true,
  fileSystemLocation: '/root/assets/images',
  files: [
    '/root/assets/images/react-logo.png',
    '/root/assets/images/react-logo@2x.png',
    '/root/assets/images/react-logo@3x.png',
  ],
  httpServerLocation: '',
  width: 1024,
  height: 1024,
  scales: [1, 2, 3],
  hash: 'abc123def456',
  name: 'react-logo',
  type: 'png',
  fileHashes: ['aaa111', 'bbb222', 'ccc333'],
};

function getMockImageDev(): MockAssetData {
  return {
    __packager_asset: true,
    fileSystemLocation: '/root/assets/images',
    files: ['/root/assets/images/icon.png'],
    httpServerLocation: '/assets/?unstable_path=.%2Fassets%2Fimages',
    width: 1024,
    height: 1024,
    scales: [1],
    hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
    name: 'icon',
    type: 'png',
    fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a'],
  };
}
function getMockFontDev(): MockAssetData {
  return {
    __packager_asset: true,
    fileSystemLocation: '/root/assets/fonts',
    files: ['/root/assets/fonts/SpaceMono-Regular.ttf'],
    httpServerLocation: '/assets/?unstable_path=.%2Fassets%2Ffonts',
    scales: [1],
    hash: '49a79d66bdea2debf1832bf4d7aca127',
    name: 'SpaceMono-Regular',
    type: 'ttf',
    fileHashes: ['49a79d66bdea2debf1832bf4d7aca127'],
  };
}
function getMockImageExport(): MockAssetData {
  return {
    __packager_asset: true,
    fileSystemLocation: '/root/assets/images',
    files: ['/root/assets/images/icon.png'],
    httpServerLocation: '/assets/assets/images',
    width: 1024,
    height: 1024,
    scales: [1],
    hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
    name: 'icon',
    type: 'png',
    fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a'],
  };
}
function getMockMultiScaleImageDev(): MockAssetData {
  return {
    ...multiScaleImage,
    httpServerLocation: '/assets/?unstable_path=.%2Fassets%2Fimages',
  };
}
function getMockMultiScaleImageExport(): MockAssetData {
  return {
    ...multiScaleImage,
    httpServerLocation: '/assets/assets/images',
  };
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
  jest.mocked(getAssetData).mockResolvedValueOnce({ files: [], fileHashes: [] } as any);
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

it(`generates density-aware code for multi-scale images on web (dev)`, async () => {
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
  const code = astString(results.ast);
  // Should include static sources array instead of runtime devicePixelRatio check
  expect(code).not.toContain('devicePixelRatio');
  expect(code).toContain('sources');
  expect(code).toMatchSnapshot();
  expect(results.reactClientReference).toBeUndefined();
});

it(`generates density-aware code for multi-scale images on web (export)`, async () => {
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
  const code = astString(results.ast);
  // Should include static sources array instead of runtime devicePixelRatio check
  expect(code).not.toContain('devicePixelRatio');
  expect(code).toContain('sources');
  expect(code).toMatchSnapshot();
  expect(results.reactClientReference).toBeUndefined();
});

it(`still uses static path for single-scale images on web`, async () => {
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
  const code = astString(results.ast);
  // Single-scale images should NOT include sources array
  expect(code).not.toContain('sources');
  // Should use the simple static object form
  expect(code).toContain('uri: "/assets/?unstable_path=.%2Fassets%2Fimages/icon.png"');
});

it(`includes sources for multi-scale images in react-server environment`, async () => {
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
  const code = astString(results.ast);
  // Server environment should include static sources for hydration parity
  expect(code).not.toContain('devicePixelRatio');
  expect(code).toContain('sources');
  // Server environment should NOT include toString
  expect(code).not.toContain('toString');
  expect(code).toMatchSnapshot();
  expect(results.reactClientReference).toBe('file:///root/local/foo.png');
});

it(`does not emit sources for multi-scale images when useMd5Filename is set`, async () => {
  jest.mocked(getAssetData).mockResolvedValueOnce(getMockMultiScaleImageDev());
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'web',
        publicPath: EXPORT_PUBLIC_PATH,
        customTransformOptions: {
          useMd5Filename: '1',
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  const code = astString(results.ast);
  // md5 filenames have no scale suffix, so sources should not be emitted
  expect(code).not.toContain('sources');
  expect(code).not.toContain('@2x');
  expect(code).not.toContain('@3x');
  // Should use the hash-based static path
  expect(code).toContain(multiScaleImage.hash);
});

function astString(ast: any): string {
  return generator.default(ast).code;
}
