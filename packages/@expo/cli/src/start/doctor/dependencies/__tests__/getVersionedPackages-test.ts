import { getVersionsAsync } from '../../../../api/getVersions';
import { Log } from '../../../../log';
import { getVersionedNativeModulesAsync } from '../bundledNativeModules';
import {
  getCombinedKnownVersionsAsync,
  getOperationLog,
  getRemoteVersionsForSdkAsync,
  getVersionedPackagesAsync,
} from '../getVersionedPackages';
import { hasExpoCanaryAsync } from '../resolvePackages';

jest.mock('../../../../log');

jest.mock('../../../../api/getVersions', () => ({
  getVersionsAsync: jest.fn(),
}));

jest.mock('../bundledNativeModules', () => ({
  getVersionedNativeModulesAsync: jest.fn(),
}));

jest.mock('../resolvePackages', () => ({
  hasExpoCanaryAsync: jest.fn().mockResolvedValue(false),
}));

describe(getCombinedKnownVersionsAsync, () => {
  it(`should prioritize remote versions over bundled versions`, async () => {
    // Remote versions
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            shared: 'remote',
            'remote-only': 'xxx',
          },
        },
      },
    } as any);

    // Bundled versions
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({
      shared: 'bundled',
      'local-only': 'xxx',
    });

    expect(await getCombinedKnownVersionsAsync({ projectRoot: '/', sdkVersion: '1.0.0' })).toEqual({
      shared: 'remote',
      'local-only': 'xxx',
      'remote-only': 'xxx',
    });
  });

  it(`skips remote versions for canary releases`, async () => {
    jest.mocked(hasExpoCanaryAsync).mockResolvedValueOnce(true);
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValue({
      shared: 'bundled',
    });

    // Should not call the API
    expect(getVersionsAsync).not.toBeCalled();
    // Should only return the bundled modules value
    expect(
      await getCombinedKnownVersionsAsync({
        projectRoot: '/',
        sdkVersion: '1.0.0',
      })
    ).toEqual({
      shared: 'bundled',
    });
  });
});

describe(getVersionedPackagesAsync, () => {
  it('should return an SDK compatible version of a package if one is available', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons'],
      pkg: {},
    });

    expect(packages).toEqual(['@expo/vector-icons@3.0.0']);

    expect(messages).toEqual(['1 SDK 1.0.0 compatible native module']);
  });

  it('should ignore SDK compatible version if package@version is passed in', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons@4.0.0'],
      pkg: {},
    });

    expect(packages).toEqual(['@expo/vector-icons@4.0.0']);

    expect(messages).toEqual(['1 other package']);
  });

  it('should return an SDK compatible version of react if one is available', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['react'],
      pkg: {},
    });

    expect(packages).toEqual(['react@facebook-react']);

    expect(messages).toEqual(['1 SDK 1.0.0 compatible native module']);
  });

  it('should return the SDK incompatible version of react when react@version is passed in', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['react@next'],
      pkg: {},
    });

    expect(packages).toEqual(['react@next']);

    expect(messages).toEqual(['1 other package']);
  });

  it('should ignore SDK compatible version if package@version is passed in', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons@4.0.0'],
      pkg: {},
    });

    expect(packages).toEqual(['@expo/vector-icons@4.0.0']);

    expect(messages).toEqual(['1 other package']);
  });

  it('should return versioned packages', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
            'react-native': 'default',
            react: 'default',
            'react-dom': 'default',
            'expo-sms': 'default',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: [
        '@expo/vector-icons',
        'react',
        '@expo/vector-icons@2.0.0',
        'expo-camera',
        'uuid@^3.4.0',
      ],
      pkg: {},
    });

    expect(packages).toEqual([
      // Not specified -> sending an SDK compatible version
      '@expo/vector-icons@3.0.0',
      'react@facebook-react',
      // Version specified -> sending that version, NOT the SDK compatible one
      '@expo/vector-icons@2.0.0',
      // No SDK compatible one -> passthough
      'expo-camera',
      'uuid@^3.4.0',
    ]);

    expect(messages).toEqual(['2 SDK 1.0.0 compatible native modules', '3 other packages']);
  });

  it('should not specify versions for excluded packages', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
            'react-native': 'default',
            react: 'default',
            'react-dom': 'default',
            'expo-sms': 'default',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages, excludedNativeModules } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons'],
      pkg: {
        expo: {
          install: {
            exclude: ['@expo/vector-icons'],
          },
        },
      },
    });

    expect(packages).toEqual(['@expo/vector-icons']);

    expect(messages).toEqual(['1 other package']);
    expect(excludedNativeModules).toEqual([
      {
        name: '@expo/vector-icons',
        bundledNativeVersion: '3.0.0',
        isExcludedFromValidation: true,
        specifiedVersion: '',
      },
    ]);
  });

  it('should not list packages in expo.install.exclude that do not have a bundledNativeVersion', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            '@expo/vector-icons': '3.0.0',
            'react-native': 'default',
            react: 'default',
            'react-dom': 'default',
            'expo-sms': 'default',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);
    const { packages, messages, excludedNativeModules } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons', 'react', 'expo-camera', 'uuid@^3.4.0'],
      pkg: {
        expo: {
          install: {
            exclude: ['expo-camera'],
          },
        },
      },
    });

    expect(packages).toEqual([
      // Custom
      '@expo/vector-icons@3.0.0',
      // SDK compatible
      'react@facebook-react',
      // Passthrough
      'expo-camera', // but also excluded
      'uuid@^3.4.0',
    ]);

    expect(messages).toEqual(['2 SDK 1.0.0 compatible native modules', '2 other packages']);
    expect(excludedNativeModules).toEqual([]);
  });
});

describe(getOperationLog, () => {
  it('crafts messages', () => {
    expect(
      getOperationLog({
        nativeModulesCount: 1,
        sdkVersion: '1.0.0',
        othersCount: 1,
      })
    ).toEqual(['1 SDK 1.0.0 compatible native module', '1 other package']);
  });
  it('crafts messages plural', () => {
    expect(
      getOperationLog({
        nativeModulesCount: 2,
        sdkVersion: '1.0.0',
        othersCount: 2,
      })
    ).toEqual(['2 SDK 1.0.0 compatible native modules', '2 other packages']);
  });
});

describe(getRemoteVersionsForSdkAsync, () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });

  it('returns an empty object in offline-mode', async () => {
    process.env.EXPO_OFFLINE = '1';

    expect(await getRemoteVersionsForSdkAsync({ sdkVersion: '1.0.0', skipCache: true })).toEqual(
      {}
    );
    expect(Log.warn).toBeCalledWith(
      expect.stringMatching(/Dependency validation is unreliable in offline-mode/)
    );
    expect(getVersionsAsync).not.toBeCalled();
  });
  it('returns an empty object when the SDK version is not supported', async () => {
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({ sdkVersions: {} } as any);

    expect(await getRemoteVersionsForSdkAsync({ sdkVersion: '1.0.0', skipCache: true })).toEqual(
      {}
    );
  });

  it('returns versions for SDK with Facebook overrides', async () => {
    jest.mocked(getVersionsAsync).mockResolvedValueOnce({
      sdkVersions: {
        '1.0.0': {
          relatedPackages: {
            'react-native': 'default',
            react: 'default',
            'react-dom': 'default',
            'expo-sms': 'default',
          },
          facebookReactVersion: 'facebook-react',
          facebookReactNativeVersion: 'facebook-rn',
        },
      },
    } as any);

    expect(await getRemoteVersionsForSdkAsync({ sdkVersion: '1.0.0', skipCache: true })).toEqual({
      'expo-sms': 'default',
      react: 'facebook-react',
      'react-dom': 'facebook-react',
      'react-native': 'facebook-rn',
    });
  });
});
