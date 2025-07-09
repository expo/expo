import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, withEntitlementsPlist } from 'expo/config-plugins';

export type IosProps = {
  /**
   * Sets the `com.apple.developer.icloud-container-environment` entitlement which is read by EAS CLI to set
   * the `iCloudContainerEnvironment` in the `xcodebuild` `exportOptionsPlist`.
   *
   * Available options: https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment
   */
  iCloudContainerEnvironment?: 'Development' | 'Production';
  /**
   * By default, the `com.apple.developer.ubiquity-kvstore-identifier` entitlement is set to a concatenation
   * of your Apple Team ID and the bundle identifier. However, this entitlement may need to reflect a previous Team ID if your
   * app was transferred from another team. Use this option to set this entitlement value manually.
   */
  kvStoreIdentifier?: string;
};

export const withDocumentPickerIOS: ConfigPlugin<IosProps> = (
  config,
  { iCloudContainerEnvironment, kvStoreIdentifier } = {}
) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults = setICloudEntitlements(
      config,
      { iCloudContainerEnvironment, kvStoreIdentifier },
      config.modResults
    );
    return config;
  });
};

export function setICloudEntitlements(
  config: Pick<ExpoConfig, 'ios'>,
  { iCloudContainerEnvironment, kvStoreIdentifier }: IosProps,
  { 'com.apple.developer.icloud-container-environment': _env, ...entitlements }: Record<string, any>
): Record<string, any> {
  if (config.ios?.usesIcloudStorage) {
    // Used for AdHoc iOS builds: https://github.com/expo/eas-cli/issues/693
    // https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment
    entitlements['com.apple.developer.icloud-container-environment'] = iCloudContainerEnvironment;

    entitlements['com.apple.developer.icloud-container-identifiers'] = [
      `iCloud.${config.ios.bundleIdentifier}`,
    ];
    entitlements['com.apple.developer.ubiquity-container-identifiers'] = [
      `iCloud.${config.ios.bundleIdentifier}`,
    ];
    entitlements['com.apple.developer.ubiquity-kvstore-identifier'] =
      kvStoreIdentifier || `$(TeamIdentifierPrefix)${config.ios.bundleIdentifier}`;

    entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];
  }
  return entitlements;
}
