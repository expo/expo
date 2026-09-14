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
        {
          name: 'ExpoModulesCore',
          podName: 'ExpoModulesCore',
          platforms: ['iOS("16.4")', 'macOS("13.0")'],
        },
        {
          name: 'ExpoModulesWorkletsAdapter',
          podName: 'ExpoModulesWorkletsAdapter',
          sourceOnly: true,
          platforms: ['iOS(.v15)'],
        },
        { name: 'ExpoFloorless', podName: 'ExpoFloorless' },
        { name: 'ExpoMacOnly', podName: 'ExpoMacOnly', platforms: ['macOS("13.0")'] },
        { name: 'ExpoOddFloor', podName: 'ExpoOddFloor', platforms: ['iOS(SomeConstant)'] },
        {
          name: 'ExpoTwoFloors',
          podName: 'ExpoTwoFloors',
          platforms: ['iOS(.v16)', 'iOS("16.4")'],
        },
      ]),
      [path.join(externalConfigsDir, 'react-native-worklets', 'spm.config.json')]: config([
        {
          name: 'RNWorklets',
          podName: 'RNWorklets',
          sourceOnly: true,
          platforms: ['iOS("16.4")'],
        },
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

  // The iOS floor belongs to the product, and consumers outside CocoaPods have
  // nowhere else to read it from.
  it('publishes the iOS floor a product declares as a version literal', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).toMatchObject({ iosDeploymentTarget: '16.4' });
  });

  it('publishes a floor declared as a PackageDescription case as the version it means', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesWorkletsAdapter).toMatchObject({ iosDeploymentTarget: '15.0' });
  });

  it('publishes the floor of an external product too', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorklets).toMatchObject({ type: 'external', iosDeploymentTarget: '16.4' });
  });

  // The schema admits three iOS literals, so a product may legally declare two.
  // The first wins, the way a Package.swift would take the first `.iOS` it sees.
  it('takes the first iOS floor where a product declares several', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoTwoFloors).toMatchObject({ iosDeploymentTarget: '16.0' });
  });

  // No floor is a floor the consumer picks itself, not a floor of zero.
  it('omits the floor where the product declares none this can read', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoFloorless).not.toHaveProperty('iosDeploymentTarget');
    expect(document.ExpoMacOnly).not.toHaveProperty('iosDeploymentTarget');
    expect(document.ExpoOddFloor).not.toHaveProperty('iosDeploymentTarget');
  });
});
