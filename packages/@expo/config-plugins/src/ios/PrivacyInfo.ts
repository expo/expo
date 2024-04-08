import { ExpoConfig } from '@expo/config-types';
import plist from '@expo/plist';

import { withBuildSourceFile } from './XcodeProjectFile';

export function withPrivacyInfo(config: ExpoConfig): ExpoConfig {
  if (!config.ios?.privacyManifests) {
    return config;
  }

  const {
    NSPrivacyAccessedAPITypes = [],
    NSPrivacyCollectedDataTypes = [],
    NSPrivacyTracking = false,
    NSPrivacyTrackingDomains = [],
  } = config.ios?.privacyManifests;

  const contents = plist.build({
    NSPrivacyCollectedDataTypes,
    NSPrivacyTracking,
    NSPrivacyTrackingDomains,
    NSPrivacyAccessedAPITypes,
  });

  return withBuildSourceFile(config, {
    filePath: 'PrivacyInfo.xcprivacy',
    contents,
    overwrite: true,
  });
}
