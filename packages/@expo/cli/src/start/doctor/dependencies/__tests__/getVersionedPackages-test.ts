import { asMock } from '../../../../__tests__/asMock';
import { getVersionsAsync } from '../../../../api/getVersions';
import { getVersionedNativeModulesAsync } from '../bundledNativeModules';
import {
  getOperationLog,
  getRemoteVersionsForSdkAsync,
  getVersionedPackagesAsync,
} from '../getVersionedPackages';

jest.mock('../../../../api/getVersions', () => ({
  getVersionsAsync: jest.fn(),
}));

jest.mock('../bundledNativeModules', () => ({
  getVersionedNativeModulesAsync: jest.fn(),
}));

describe(getVersionedPackagesAsync, () => {
  it('should return versioned packages', async () => {
    asMock(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    asMock(getVersionsAsync).mockResolvedValueOnce({
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
      packages: ['@expo/vector-icons', 'react@next', 'expo-camera', 'uuid@^3.4.0'],
      pkg: {},
    });

    expect(packages).toEqual([
      // Custom
      '@expo/vector-icons@3.0.0',
      'react@facebook-react',
      // Passthrough
      'expo-camera',
      'uuid@^3.4.0',
    ]);

    expect(messages).toEqual(['2 SDK 1.0.0 compatible native modules', '2 other packages']);
  });

  it('should not specify versions for excluded packages', async () => {
    asMock(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    asMock(getVersionsAsync).mockResolvedValueOnce({
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
      packages: ['@expo/vector-icons', 'react@next', 'expo-camera', 'uuid@^3.4.0'],
      pkg: {
        expo: {
          install: {
            exclude: ['@expo/vector-icons'],
          },
        },
      },
    });

    expect(packages).toEqual([
      // Excluded
      '@expo/vector-icons',
      // Custom
      'react@facebook-react',
      // Passthrough
      'expo-camera',
      'uuid@^3.4.0',
    ]);

    expect(messages).toEqual(['1 SDK 1.0.0 compatible native module', '3 other packages']);
    expect(excludedNativeModules).toEqual(['@expo/vector-icons']);
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
  it('returns an empty object when the SDK version is not supported', async () => {
    asMock(getVersionsAsync).mockResolvedValueOnce({ sdkVersions: {} } as any);

    expect(await getRemoteVersionsForSdkAsync({ sdkVersion: '1.0.0', skipCache: true })).toEqual(
      {}
    );
  });

  it('returns versions for SDK with Facebook overrides', async () => {
    asMock(getVersionsAsync).mockResolvedValueOnce({
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
