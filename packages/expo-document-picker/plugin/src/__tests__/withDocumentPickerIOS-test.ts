import { setICloudEntitlments } from '../withDocumentPickerIOS';

describe(setICloudEntitlments, () => {
  it(`skips setting the iCloud entitlements if the flag isn't enabled`, () => {
    expect(setICloudEntitlments({ ios: {} }, 'X1X2X3X4X', {})).toStrictEqual({});
  });
  it(`sets the iCloud entitlements`, () => {
    expect(
      setICloudEntitlments(
        { ios: { usesIcloudStorage: true, bundleIdentifier: 'com.bacon.foobar' } },
        'X1X2X3X4X',
        {}
      )
    ).toStrictEqual({
      'com.apple.developer.icloud-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.icloud-services': ['CloudDocuments'],
      'com.apple.developer.ubiquity-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.ubiquity-kvstore-identifier': 'X1X2X3X4X.com.bacon.foobar',
    });
  });
});
