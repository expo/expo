import * as generator from '@babel/generator';
import * as fs from 'fs';
import { vol } from 'memfs';
import { getAssetData } from '@bycedric/metro/metro/src/Assets';

import { transform } from '../asset-transformer';

jest.mock('fs');

jest.mock('metro/src/Assets', () => ({ getAssetData: jest.fn() }));

beforeEach(() => {
  jest.resetModules();
  vol.reset();
  fs.mkdirSync('/root/local', { recursive: true });
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
  expect(generator.default(results.ast).code).toMatchInlineSnapshot(
    `"module.exports = require('react-server-dom-webpack/server').createClientModuleProxy("file:///root/local/foo.png");"`
  );
  expect(results.reactClientReference).toBe('file:///root/local/foo.png');
});

it(`parses asset as normal module in client environment`, async () => {
  jest.mocked(getAssetData).mockReturnValueOnce({ files: [], fileHashes: [] });
  const results = await transform(
    {
      filename: '/root/local/foo.png',
      options: {
        platform: 'ios',
        publicPath: '/assets',
        customTransformOptions: {
          //   environment: 'react-server',
        },
        projectRoot: '/root',
      },
    },
    '[MOCK_ASSET_REGISTRY]',
    []
  );
  expect(generator.default(results.ast).code).toMatchInlineSnapshot(`
    "module.exports = require("[MOCK_ASSET_REGISTRY]").registerAsset({
      "fileHashes": []
    });"
  `);
  expect(results.reactClientReference).toBeUndefined();
});
