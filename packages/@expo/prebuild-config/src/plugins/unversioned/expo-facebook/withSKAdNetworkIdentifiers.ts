import { ConfigPlugin } from '@expo/config-plugins';

import { getFacebookAppId } from './withIosFacebook';

/**
 * Plugin to add [`SKAdNetworkIdentifier`](https://developer.apple.com/documentation/storekit/skadnetwork/configuring_the_participating_apps)s to the Info.plist safely.
 *
 *
 * @param config
 * @param props.identifiers array of lowercase string ids to push to the `SKAdNetworkItems` array in the `Info.plist`.
 */
export const withSKAdNetworkIdentifiers: ConfigPlugin<string[]> = (config, identifiers) => {
  // Only add the iOS ad network values if facebookAppId is defined.
  const facebookAppId = getFacebookAppId(config);
  if (!facebookAppId) {
    return config;
  }

  if (!config.ios) {
    config.ios = {};
  }
  if (!config.ios.infoPlist) {
    config.ios.infoPlist = {};
  }
  if (!Array.isArray(config.ios.infoPlist.SKAdNetworkItems)) {
    config.ios.infoPlist.SKAdNetworkItems = [];
  }

  // Get ids
  let existingIds = config.ios.infoPlist.SKAdNetworkItems.map(
    (item: any) => item?.SKAdNetworkIdentifier ?? null
  ).filter(Boolean) as string[];
  // remove duplicates
  existingIds = [...new Set(existingIds)];

  for (const id of identifiers) {
    // Must be lowercase
    const lower = id.toLowerCase();
    if (!existingIds.includes(lower)) {
      config.ios.infoPlist.SKAdNetworkItems.push({
        SKAdNetworkIdentifier: lower,
      });
    }
  }

  return config;
};
