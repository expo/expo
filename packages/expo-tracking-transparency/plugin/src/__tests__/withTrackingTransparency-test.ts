import withUserTrackingPermission from '../withTrackingTransparency';

describe('Expo Tracking Transparency', () => {
  it('sets default `NSUserTrackingUsageDescription` permission message in the config', () => {
    expect(
      withUserTrackingPermission({
        slug: 'testSlug',
        name: 'testName',
      })
    ).toMatchObject({
      _internal: {
        pluginHistory: {
          'expo-tracking-transparency': {
            name: 'expo-tracking-transparency',
            version: expect.any(String),
          },
        },
      },
      android: { permissions: ['com.google.android.gms.permission.AD_ID'] },
      mods: {
        android: { manifest: expect.anything() },
        ios: {
          infoPlist: expect.anything(),
        },
      },
      name: 'testName',
      slug: 'testSlug',
    });
  });
});
