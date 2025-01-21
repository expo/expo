import { setICloudEntitlements } from '../withDocumentPickerIOS';

describe(setICloudEntitlements, () => {
  it(`skips setting the iCloud entitlements if the flag isn't enabled`, () => {
    expect(
      setICloudEntitlements({ ios: {} }, { iCloudContainerEnvironment: 'Production' }, {})
    ).toStrictEqual({});
  });
  it(`sets the iCloud entitlements`, () => {
    expect(
      setICloudEntitlements(
        { ios: { usesIcloudStorage: true, bundleIdentifier: 'com.bacon.foobar' } },
        { iCloudContainerEnvironment: 'Production' },
        {}
      )
    ).toStrictEqual({
      'com.apple.developer.icloud-container-environment': 'Production',
      'com.apple.developer.icloud-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.icloud-services': ['CloudDocuments'],
      'com.apple.developer.ubiquity-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.ubiquity-kvstore-identifier': '$(TeamIdentifierPrefix)com.bacon.foobar',
    });
  });

  it(`Overrides com.apple.developer.ubiquity-kvstore-identifier when kvStoreIdentifier is set`, () => {
    expect(
      setICloudEntitlements(
        { ios: { usesIcloudStorage: true, bundleIdentifier: 'com.bacon.foobar' } },
        { iCloudContainerEnvironment: 'Production', kvstoreIdentifier: 'ABC123.com.bacon.foobar' },
        {}
      )
    ).toStrictEqual({
      'com.apple.developer.icloud-container-environment': 'Production',
      'com.apple.developer.icloud-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.icloud-services': ['CloudDocuments'],
      'com.apple.developer.ubiquity-container-identifiers': ['iCloud.com.bacon.foobar'],
      'com.apple.developer.ubiquity-kvstore-identifier': 'ABC123.com.bacon.foobar',
    });
  });
});
