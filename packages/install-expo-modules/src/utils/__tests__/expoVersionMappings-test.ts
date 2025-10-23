import resolveFrom from 'resolve-from';

import { getDefaultSdkVersion } from '../expoVersionMappings';

jest.mock('resolve-from');

describe(getDefaultSdkVersion, () => {
  function setupReactNativeVersionMock(version: string) {
    const mockResolve = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockResolve.mockReturnValueOnce('fs');
    jest.doMock('fs', () => ({ version }));
  }

  afterEach(() => {
    jest.resetModules();
  });

  it.each([
    ['0.81.0', '54.0.0'],
    ['0.79.0', '53.0.0'],
    ['0.78.0', '53.0.0'],
    ['0.77.0', '52.0.0'],
    ['0.76.0', '52.0.0'],
    ['0.68.0', '45.0.0'],
    ['0.65.0', '45.0.0'],
    ['0.64.3', '44.0.0'],
  ])(
    'should resolve as sdk %s from react-native %s project',
    async (reactNativeVersion, expectedSdkVersion) => {
      setupReactNativeVersionMock(reactNativeVersion);
      expect(getDefaultSdkVersion('/projectRoot').sdkVersion).toBe(expectedSdkVersion);
    }
  );

  it.each([
    // explicitly not supported versions
    ['0.80.0'],
    // future versions
    ['1.0.0'],
    ['0.199.0'],
  ])(
    'should throw "Unable to find compatible expo sdk version" for react-native %s',
    async (reactNativeVersion) => {
      setupReactNativeVersionMock(reactNativeVersion);
      expect(() => getDefaultSdkVersion('/projectRoot')).toThrow(
        'Unable to find compatible Expo SDK version'
      );
    }
  );
});
