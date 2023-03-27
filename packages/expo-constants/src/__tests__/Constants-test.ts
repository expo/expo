import { ExpoConfig } from '@expo/config-types';
import { Platform } from 'react-native';

import Constants, { customPropertiesFromExpoConfig, ExecutionEnvironment } from '../Constants';
import { AppManifest, Manifest } from '../Constants.types';

it(`defines a manifest`, () => {
  expect(Constants.manifest).toBeTruthy();
  expect(typeof Constants.manifest).toBe('object');
});

it(`defines a linking URI`, () => {
  expect(typeof Constants.linkingUri).toBe('string');
});

describe(`manifest`, () => {
  const fakeManifest: AppManifest = {
    id: '@jester/manifest',
    name: 'manifest',
    slug: 'manifest',
    bundleUrl: '',
  };
  const fakeManifest2: AppManifest = {
    id: '@jester/manifest2',
    name: 'manifest2',
    slug: 'manifest2',
    bundleUrl: '',
  };
  const fakeManifestNew: Manifest = {
    id: 'fakeid',
    metadata: {},
    createdAt: '',
    runtimeVersion: '1',
    launchAsset: { url: '' },
    assets: [],
    extra: {
      expoClient: {
        slug: 'hello',
        name: 'hello',
      },
    },
  };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('../ExponentConstants');
    jest.dontMock('expo-modules-core');
  });

  // mock console.warn
  const originalWarn = console.warn;
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => (console.warn = originalWarn));

  function mockExponentConstants(mockValues: object) {
    jest.doMock('../ExponentConstants', () => {
      const ExponentConstants = jest.requireActual('../ExponentConstants');
      return {
        ...ExponentConstants,
        ...mockValues,
      };
    });
  }

  function mockNativeModulesProxy(mockValues: object) {
    jest.doMock('expo-modules-core', () => {
      const UnimodulesCore = jest.requireActual('expo-modules-core');
      return {
        ...UnimodulesCore,
        NativeModulesProxy: {
          ...(UnimodulesCore.NativeModulesProxy ?? {}),
          ...mockValues,
        },
      };
    });
  }

  function mockExpoUpdates(mockValues: object) {
    jest.doMock('expo-modules-core', () => {
      const UnimodulesCore = jest.requireActual('expo-modules-core');
      return {
        ...UnimodulesCore,
        NativeModulesProxy: {
          ...(UnimodulesCore.NativeModulesProxy ?? {}),
          ExpoUpdates: {
            ...(UnimodulesCore.NativeModulesProxy?.ExpoUpdates ?? {}),
            ...mockValues,
          },
        },
      };
    });
  }

  it(`exists if defined as an object in ExponentConstants`, () => {
    mockExponentConstants({ manifest: fakeManifest });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`exists if defined as a string in ExponentConstants`, () => {
    mockExponentConstants({ manifest: JSON.stringify(fakeManifest) });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`exists if defined as an object by expo-updates`, () => {
    mockExponentConstants({ manifest: undefined });
    mockExpoUpdates({ manifest: fakeManifest, manifestString: undefined });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`exists if defined as a string by expo-updates`, () => {
    mockExponentConstants({ manifest: undefined });
    mockExpoUpdates({ manifest: undefined, manifestString: JSON.stringify(fakeManifest) });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`is null if undefined in ExponentConstants and expo-updates with bare execution environment`, () => {
    mockExponentConstants({ manifest: undefined, executionEnvironment: ExecutionEnvironment.Bare });
    mockExpoUpdates({ manifest: undefined, manifestString: undefined });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toBeNull();

    // Skip warnings on web
    if (Platform.OS === 'web') {
      expect(console.warn).not.toHaveBeenCalled();
    } else {
      expect(console.warn).toHaveBeenCalled();
    }
  });

  it(`is null if undefined in ExponentConstants, and expo-updates does not exist with bare execution environment`, () => {
    mockExponentConstants({ manifest: undefined, executionEnvironment: ExecutionEnvironment.Bare });
    mockNativeModulesProxy({ ExpoUpdates: undefined });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toBeNull();

    // Skip warnings on web
    if (Platform.OS === 'web') {
      expect(console.warn).not.toHaveBeenCalled();
    } else {
      expect(console.warn).toHaveBeenCalled();
    }
  });

  it(`is overridden by expo-updates if both are defined`, () => {
    mockExponentConstants({ manifest: fakeManifest });
    mockExpoUpdates({ manifest: fakeManifest2 });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest2);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`is not overridden if expo-updates exports an empty manifest`, () => {
    mockExponentConstants({ manifest: fakeManifest });
    mockExpoUpdates({ manifest: {} });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`does not have manifest2 when manifest is a classic manifest`, () => {
    mockExponentConstants({ manifest: fakeManifest });
    mockExpoUpdates({ manifest: fakeManifest });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeManifest);
    expect(ConstantsWithMock.manifest2).toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`has manifest2 when manifest is a new manifest`, () => {
    mockExponentConstants({ manifest: fakeManifestNew });
    mockExpoUpdates({ manifest: fakeManifestNew });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toBeNull();
    expect(ConstantsWithMock.manifest2).toEqual(fakeManifestNew);
    expect(console.warn).not.toHaveBeenCalled();
  });

  describe('expoConfig', () => {
    it('is present for classic manifests', () => {
      mockExponentConstants({ manifest: fakeManifest });
      mockExpoUpdates({ manifest: fakeManifest });
      const ConstantsWithMock = require('../Constants').default;
      expect(ConstantsWithMock.expoConfig).toEqual(fakeManifest);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('is present for new manifests', () => {
      mockExponentConstants({ manifest: fakeManifestNew });
      mockExpoUpdates({ manifest: fakeManifestNew });
      const ConstantsWithMock = require('../Constants').default;
      expect(ConstantsWithMock.expoConfig).toEqual(fakeManifestNew.extra?.expoClient);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  // web will only ever be in bare environment
  if (Platform.OS !== 'web') {
    [ExecutionEnvironment.Standalone, ExecutionEnvironment.StoreClient].forEach((env) => {
      it(`throws an error if manifest is falsey when Constants.executionEnvironment is ${env}`, () => {
        mockExponentConstants({
          manifest: null,
          executionEnvironment: env,
        });
        const ConstantsWithMock = require('../Constants').default;
        expect(() => ConstantsWithMock.manifest).toThrowErrorMatchingSnapshot();
      });
    });
  }
});

describe('customPropertiesFromExpoConfig', () => {
  const mockConfig: ExpoConfig = {
    name: 'Test',
    slug: '0000',
  };
  it('Get expected results when extra properties exist', () => {
    const configWithExtra: ExpoConfig = {
      ...mockConfig,
      extra: {
        eas: {
          projectId: '0000-xxxx',
        },
        stringProp: 'message',
        booleanProp: true,
        nullProp: null,
        numberProp: 1000,
      },
    };
    const result = customPropertiesFromExpoConfig(configWithExtra);
    // Only the properties added to 'extra' should be present
    expect(Object.keys(result)).toHaveLength(4);
    expect(result['stringProp']).toEqual('message');
    expect(result['booleanProp']).toBe(true);
    expect(result['nullProp']).toBeNull();
    expect(result['numberProp']).toEqual(1000);
    // 'eas' property should be excluded
    expect(result['eas']).toBeUndefined();
  });

  it('Get expected results when no extras in manifest', () => {
    const result = customPropertiesFromExpoConfig(mockConfig);
    expect(Object.keys(result)).toHaveLength(0);
  });
});
