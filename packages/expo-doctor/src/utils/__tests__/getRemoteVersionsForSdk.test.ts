import { getRemoteVersionsForSdkAsync } from '../getRemoteVersionsForSdkAsync';

jest.mock('../../api/getVersionsAsync', () => ({
  getVersionsAsync: jest.fn(() => ({
    sdkVersions: {
      '43.0.0': {
        iosClientUrl: 'https://dpq5q02fu5f55.cloudfront.net/Exponent-2.22.4.tar.gz',
        releaseNoteUrl: 'https://blog.expo.dev/expo-sdk-43-aa9b3c7d5541',
        relatedPackages: [Object],
        androidClientUrl: 'https://d1ahtucjixef4r.cloudfront.net/Exponent-2.22.3.apk',
        iosClientVersion: '2.22.4',
        expoReactNativeTag: 'sdk-43',
        androidClientVersion: '2.22.3',
        facebookReactVersion: '17.0.1',
        facebookReactNativeVersion: '0.64.3',
        packagesToInstallWhenEjecting: [Object],
      },
    },
  })),
}));

describe(getRemoteVersionsForSdkAsync, () => {
  it(`returns results for a valid SDK version`, async () => {
    const data = await getRemoteVersionsForSdkAsync('43.0.0');
    expect(data).toBeDefined();
    expect(Object.keys(data).length).toBeGreaterThan(0);
    expect(typeof data['react-native']).toBe('string');
    expect(data.react).toEqual(data['react-dom']);
  });

  it(`returns an empty object for invalid SDK version`, async () => {
    const data = await getRemoteVersionsForSdkAsync('Expo');
    expect(data).toBeDefined();
    expect(Object.keys(data).length).toBe(0);
  });

  it(`returns an empty object for unspecified SDK version`, async () => {
    const data = await getRemoteVersionsForSdkAsync(undefined);
    expect(data).toBeDefined();
    expect(Object.keys(data).length).toBe(0);
  });
});
