import { setICloudEntitlements } from '../withDocumentPickerIOS';

describe(setICloudEntitlements, () => {
  it(`skips setting the iCloud entitlements if the flag isn't enabled`, () => {
    expect(setICloudEntitlements({ ios: {} }, { appleTeamId: 'X1X2X3X4X' }, {})).toStrictEqual({});
  });
  it(`sets the iCloud entitlements`, () => {
    expect(
      setICloudEntitlements(
        { ios: { usesIcloudStorage: true, bundleIdentifier: 'com.bacon.foobar' } },
        { appleTeamId: 'X1X2X3X4X', iCloudContainerEnvironment: 'Production' },
        {}
      )
    ).toStrictEqual({
      'com.apple.developer.icloud-container-environment': 'Production',
      'com.apple.developer.icloud-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.icloud-services': ['CloudDocuments'],
      'com.apple.developer.ubiquity-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.ubiquity-kvstore-identifier': 'X1X2X3X4X.com.bacon.foobar',
    });
  });
});
