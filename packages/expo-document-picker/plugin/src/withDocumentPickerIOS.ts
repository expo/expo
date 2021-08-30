import { ConfigPlugin, WarningAggregator, withEntitlementsPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withDocumentPickerIOS: ConfigPlugin<{ appleTeamId?: string }> = (
  config,
  { appleTeamId }
) => {
  return withEntitlementsPlist(config, config => {
    if (appleTeamId) {
      config.modResults = setICloudEntitlments(config, appleTeamId, config.modResults);
    } else {
      WarningAggregator.addWarningIOS(
        'expo-document-picker',
        'Cannot configure iOS entitlements because neither the appleTeamId property, nor the environment variable EXPO_APPLE_TEAM_ID were defined.'
      );
    }
    return config;
  });
};

export function setICloudEntitlments(
  config: Pick<ExpoConfig, 'ios'>,
  appleTeamId: string,
  entitlements: Record<string, any>
): Record<string, any> {
  if (config.ios?.usesIcloudStorage) {
    entitlements['com.apple.developer.icloud-container-identifiers'] = [
      'iCloud.' + config.ios.bundleIdentifier,
    ];
    entitlements['com.apple.developer.ubiquity-container-identifiers'] = [
      'iCloud.' + config.ios.bundleIdentifier,
    ];
    entitlements['com.apple.developer.ubiquity-kvstore-identifier'] =
      appleTeamId + '.' + config.ios.bundleIdentifier;
    entitlements['com.apple.developer.icloud-services'] = ['CloudDocuments'];
  }
  return entitlements;
}
