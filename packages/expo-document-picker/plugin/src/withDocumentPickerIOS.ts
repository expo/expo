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
};

export const withDocumentPickerIOS: ConfigPlugin<IosProps> = (
  config,
  { iCloudContainerEnvironment } = {}
) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults = setICloudEntitlements(
      config,
      { iCloudContainerEnvironment },
      config.modResults
    );
    return config;
  });
};

export function setICloudEntitlements(
  config: Pick<ExpoConfig, 'ios'>,
  { iCloudContainerEnvironment }: IosProps,
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
      `$(TeamIdentifierPrefix)${config.ios.bundleIdentifier}`;

    entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];
  }
  return entitlements;
}
