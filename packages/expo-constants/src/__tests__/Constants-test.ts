import { ExpoConfig } from '@expo/config-types';
import { Platform } from 'react-native';

import Constants, { ExecutionEnvironment } from '../Constants';
import { Manifest } from '../Constants.types';

it(`defines a manifest`, () => {
  expect(Constants.manifest).toBeTruthy();
  expect(typeof Constants.manifest).toBe('object');
});

it(`defines a linking URI`, () => {
  expect(typeof Constants.linkingUri).toBe('string');
});

describe(`manifest`, () => {
  const fakeEmbeddedAppConfig: ExpoConfig = {
    name: 'manifest',
    slug: 'manifest',
    version: '1.0.0',
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
    mockExponentConstants({ manifest: fakeEmbeddedAppConfig });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeEmbeddedAppConfig);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
      )
    );
  });

  it(`exists if defined as a string in ExponentConstants`, () => {
    mockExponentConstants({ manifest: JSON.stringify(fakeEmbeddedAppConfig) });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeEmbeddedAppConfig);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
      )
    );
  });

  it(`exists if defined as an object by expo-updates`, () => {
    mockExponentConstants({ manifest: undefined });
    mockExpoUpdates({ manifest: fakeManifestNew, manifestString: undefined });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest2).toEqual(fakeManifestNew);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`exists if defined as a string by expo-updates`, () => {
    mockExponentConstants({ manifest: undefined });
    mockExpoUpdates({ manifest: undefined, manifestString: JSON.stringify(fakeManifestNew) });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest2).toEqual(fakeManifestNew);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`is null if undefined in ExponentConstants and expo-updates with bare execution environment`, () => {
    mockExponentConstants({ manifest: undefined, executionEnvironment: ExecutionEnvironment.Bare });
    mockExpoUpdates({ manifest: undefined, manifestString: undefined });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toBeNull();

    // Skip warnings on web
    if (Platform.OS === 'web') {
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
        )
      );
    } else {
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
        )
      );
    }
  });

  it(`is null if undefined in ExponentConstants, and expo-updates does not exist with bare execution environment`, () => {
    mockExponentConstants({ manifest: undefined, executionEnvironment: ExecutionEnvironment.Bare });
    mockNativeModulesProxy({ ExpoUpdates: undefined });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toBeNull();

    // Skip warnings on web
    if (Platform.OS === 'web') {
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
        )
      );
    } else {
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
        )
      );
    }
  });

  it(`is overridden by expo-updates if both are defined`, () => {
    mockExponentConstants({ manifest: fakeEmbeddedAppConfig });
    mockExpoUpdates({ manifest: fakeManifestNew });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest2).toEqual(fakeManifestNew);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it(`is not overridden if expo-updates exports an empty manifest`, () => {
    mockExponentConstants({ manifest: fakeEmbeddedAppConfig });
    mockExpoUpdates({ manifest: {} });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toEqual(fakeEmbeddedAppConfig);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
      )
    );
  });

  it(`has manifest2 when manifest is a new manifest`, () => {
    mockExponentConstants({ manifest: fakeEmbeddedAppConfig });
    mockExpoUpdates({ manifest: fakeManifestNew });
    const ConstantsWithMock = require('../Constants').default;
    expect(ConstantsWithMock.manifest).toBeNull();
    expect(ConstantsWithMock.manifest2).toEqual(fakeManifestNew);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Constants.manifest has been deprecated in favor of Constants.expoConfig.'
      )
    );
  });

  describe('expoConfig', () => {
    it('is present for new manifests', () => {
      mockExponentConstants({ manifest: fakeEmbeddedAppConfig });
      mockExpoUpdates({ manifest: fakeManifestNew });
      const ConstantsWithMock = require('../Constants').default;
      expect(ConstantsWithMock.expoConfig).toEqual(fakeManifestNew.extra?.expoClient);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('uses embedded app config for running embedded manifests', () => {
      mockExponentConstants({ manifest: fakeEmbeddedAppConfig });
      mockExpoUpdates({ manifest: fakeManifestNew, isEmbeddedLaunch: true });
      const ConstantsWithMock = require('../Constants').default;
      expect(ConstantsWithMock.expoConfig).toEqual(fakeEmbeddedAppConfig);
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
