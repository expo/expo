import { ConfigPlugin, createRunOncePlugin, withEntitlementsPlist } from '@expo/config-plugins';
import assert from 'assert';

const pkg = require('expo-document-picker/package.json');

const withDocumentPicker: ConfigPlugin<{ appleTeamId: string }> = (
  config,
  // This cannot be a default plugin because it has required properties.
  props
) => {
  const { bundleIdentifier } = config.ios ?? {};
  assert(
    bundleIdentifier,
    'expo-document-picker plugin requires `ios.bundleIdentifier` to be defined for iCloud entitlements. Learn more: https://docs.expo.io/versions/latest/sdk/document-picker/#configuration'
  );
  assert(
    props.appleTeamId,
    'expo-document-picker plugin requires the property `appleTeamId` to be defined for iCloud entitlements. Learn more: https://docs.expo.io/versions/latest/sdk/document-picker/#configuration'
  );
  // TODO: Should we ignore if `config.ios?.usesIcloudStorage` is false?
  return withEntitlementsPlist(config, config => {
    const { modResults: entitlements } = config;

    entitlements['com.apple.developer.icloud-container-identifiers'] = [
      'iCloud.' + bundleIdentifier,
    ];
    entitlements['com.apple.developer.ubiquity-container-identifiers'] = [
      'iCloud.' + bundleIdentifier,
    ];
    entitlements['com.apple.developer.ubiquity-kvstore-identifier'] =
      props.appleTeamId + '.' + bundleIdentifier;

    entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];

    config.modResults = entitlements;
    return config;
  });
};

export default createRunOncePlugin(withDocumentPicker, pkg.name, pkg.version);
