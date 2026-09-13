import { vol } from 'memfs';
import path from 'path';

import { findModulesAsync } from '../autolinking/findModules';
import type { LinkingOptionsLoader } from '../commands/autolinkingOptions';
import { resolvePrebuiltMetadataAsync } from '../prebuiltMetadata';
import { createReactNativeConfigAsync } from '../reactNativeConfig';

jest.mock('../autolinking/findModules', () => ({ findModulesAsync: jest.fn() }));
jest.mock('../reactNativeConfig', () => ({ createReactNativeConfigAsync: jest.fn() }));

const externalConfigsDir = path.join(__dirname, '..', '..', 'external-configs', 'ios');

const optionsLoader = {
  getCommandRoot: () => '/app',
  getAppRoot: async () => '/app',
  getPlatformOptions: async () => ({}),
} as unknown as LinkingOptionsLoader;

const config = (products: object[]) => JSON.stringify({ products });

describe('resolvePrebuiltMetadataAsync', () => {
  beforeEach(() => {
    vol.reset();
    jest.mocked(findModulesAsync).mockResolvedValue({
      'expo-modules-core': {
        name: 'expo-modules-core',
        path: '/app/node_modules/expo-modules-core',
        version: '58.0.0',
      },
    });
    jest.mocked(createReactNativeConfigAsync).mockResolvedValue({
      root: '/app',
      reactNativePath: '/app/node_modules/react-native',
      project: {},
      dependencies: {
        'react-native-worklets': {
          root: '/app/node_modules/react-native-worklets',
          name: 'react-native-worklets',
          platforms: {},
        },
      },
    });
    vol.fromJSON({
      '/app/node_modules/expo-modules-core/package.json': '{ "name": "expo-modules-core" }',
      '/app/node_modules/expo-modules-core/spm.config.json': config([
        { name: 'ExpoModulesCore', podName: 'ExpoModulesCore' },
        {
          name: 'ExpoModulesWorkletsAdapter',
          podName: 'ExpoModulesWorkletsAdapter',
          sourceOnly: true,
        },
      ]),
      [path.join(externalConfigsDir, 'react-native-worklets', 'spm.config.json')]: config([
        { name: 'RNWorklets', podName: 'RNWorklets', sourceOnly: true },
      ]),
    });
  });

  // A source-only product never becomes an artifact — consumers need that from
  // the document, because the config it comes from is not theirs to read.
  it('marks a source-only internal product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesWorkletsAdapter).toMatchObject({
      type: 'internal',
      productName: 'ExpoModulesWorkletsAdapter',
      sourceOnly: true,
    });
  });

  it('marks a source-only external product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorklets).toMatchObject({
      type: 'external',
      productName: 'RNWorklets',
      sourceOnly: true,
    });
  });

  it('leaves the flag off a product that does build an artifact', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).toMatchObject({ productName: 'ExpoModulesCore' });
    expect(document.ExpoModulesCore).not.toHaveProperty('sourceOnly');
  });
});
