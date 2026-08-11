import { getThreeVersions, latestSdkVersionValues, sdkVersionValues } from './utils';

describe('SDK compatibility table values', () => {
  it('derives documentation values from the shared compatibility registry', () => {
    expect(latestSdkVersionValues).toMatchObject({
      sdk: '57.0.0',
      android: '7+',
      ios: '16.4+',
      xcode: '26.4+',
      'react-native': '0.86',
      node: '22.13.x',
    });
  });

  it('formats a bounded Xcode range for older SDKs', () => {
    expect(sdkVersionValues.find(version => version.sdk === '51.0.0')?.xcode).toBe('15.4 - 16.2');
  });

  it('preserves the extended SDK 57 documentation window', () => {
    expect(getThreeVersions('57.0.0').map(version => version.sdk)).toEqual([
      '57.0.0',
      '56.0.0',
      '55.0.0',
      '54.0.0',
    ]);
  });
});
