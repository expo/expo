import { asMock } from '../../../../__tests__/asMock';
import { getReleasedVersionsAsync } from '../../../../api/getVersions';
import { getVersionedNativeModulesAsync } from '../bundledNativeModules';
import {
  getOperationLog,
  getRemoteVersionsForSdkAsync,
  getVersionedPackagesAsync,
} from '../getVersionedPackages';

jest.mock('../../../../api/getVersions', () => ({
  getVersionsAsync: jest.fn(),
  getReleasedVersionsAsync: jest.fn(),
}));

jest.mock('../bundledNativeModules', () => ({
  getVersionedNativeModulesAsync: jest.fn(),
}));

describe(getVersionedPackagesAsync, () => {
  it('should return versioned packages', async () => {
    asMock(getVersionedNativeModulesAsync).mockResolvedValueOnce({});
    asMock(getReleasedVersionsAsync).mockResolvedValueOnce({
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
    });

    const { packages, messages } = await getVersionedPackagesAsync('/', {
      sdkVersion: '1.0.0',
      packages: ['@expo/vector-icons', 'react@next', 'expo-camera', 'uuid@^3.4.0'],
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
    asMock(getReleasedVersionsAsync).mockResolvedValueOnce({});

    expect(await getRemoteVersionsForSdkAsync({ sdkVersion: '1.0.0', skipCache: true })).toEqual(
      {}
    );
  });

  it('returns versions for SDK with Facebook overrides', async () => {
    asMock(getReleasedVersionsAsync).mockResolvedValueOnce({
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
    });

    expect(await getRemoteVersionsForSdkAsync({ sdkVersion: '1.0.0', skipCache: true })).toEqual({
      'expo-sms': 'default',
      react: 'facebook-react',
      'react-dom': 'facebook-react',
      'react-native': 'facebook-rn',
    });
  });
});
