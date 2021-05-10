import { setAppleAuthEntitlements } from '../withAppleAuthIOS';

describe(setAppleAuthEntitlements, () => {
  it(`sets the apple auth entitlements`, () => {
    expect(setAppleAuthEntitlements({ ios: { usesAppleSignIn: true } }, {})).toMatchObject({
      'com.apple.developer.applesignin': ['Default'],
    });
  });
});
