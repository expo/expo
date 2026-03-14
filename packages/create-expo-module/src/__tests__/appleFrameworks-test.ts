import { isAppleFramework, ensureSafeModuleName } from '../appleFrameworks';

describe('ensureSafeModuleName', () => {
  it('prefixes Apple framework names with Expo', () => {
    expect(ensureSafeModuleName('MultipeerConnectivity')).toEqual({
      name: 'ExpoMultipeerConnectivity',
      wasRenamed: true,
    });
  });

  it('does not modify safe names', () => {
    expect(ensureSafeModuleName('MyCustomModule')).toEqual({
      name: 'MyCustomModule',
      wasRenamed: false,
    });
  });

  it('is case-sensitive', () => {
    expect(isAppleFramework('multipeerconnectivity')).toBe(false);
  });
});
