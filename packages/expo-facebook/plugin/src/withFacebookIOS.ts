import { ConfigPlugin, InfoPlist, IOSConfig, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const { Scheme } = IOSConfig;
const { appendScheme } = Scheme;

type ExpoConfigFacebook = Pick<
  ExpoConfig,
  | 'facebookScheme'
  | 'facebookAdvertiserIDCollectionEnabled'
  | 'facebookAppId'
  | 'facebookAutoInitEnabled'
  | 'facebookAutoLogAppEventsEnabled'
  | 'facebookDisplayName'
>;

const fbSchemes = ['fbapi', 'fb-messenger-api', 'fbauth2', 'fbshareextension'];

const USER_TRACKING = 'This identifier will be used to deliver personalized ads to you.';

export const withFacebookIOS: ConfigPlugin = config => {
  return withInfoPlist(config, config => {
    config.modResults = setFacebookConfig(config, config.modResults);
    return config;
  });
};

/**
 * Getters
 * TODO: these getters are the same between ios/android, we could reuse them
 */

export function getFacebookScheme(config: ExpoConfigFacebook) {
  return config.facebookScheme ?? null;
}

export function getFacebookAppId(config: Pick<ExpoConfigFacebook, 'facebookAppId'>) {
  return config.facebookAppId ?? null;
}

export function getFacebookDisplayName(config: ExpoConfigFacebook) {
  return config.facebookDisplayName ?? null;
}

export function getFacebookAutoInitEnabled(config: ExpoConfigFacebook) {
  return config.facebookAutoInitEnabled ?? null;
}

export function getFacebookAutoLogAppEvents(config: ExpoConfigFacebook) {
  return config.facebookAutoLogAppEventsEnabled ?? null;
}

export function getFacebookAdvertiserIDCollection(config: ExpoConfigFacebook) {
  return config.facebookAdvertiserIDCollectionEnabled ?? null;
}

/**
 * Setters
 */

export function setFacebookConfig(config: ExpoConfigFacebook, infoPlist: InfoPlist) {
  infoPlist = setFacebookAppId(config, infoPlist);
  infoPlist = setFacebookApplicationQuerySchemes(config, infoPlist);
  infoPlist = setFacebookDisplayName(config, infoPlist);
  infoPlist = setFacebookAutoInitEnabled(config, infoPlist);
  infoPlist = setFacebookAutoLogAppEventsEnabled(config, infoPlist);
  infoPlist = setFacebookAdvertiserIDCollectionEnabled(config, infoPlist);
  infoPlist = setFacebookScheme(config, infoPlist);
  return infoPlist;
}

export function setFacebookScheme(config: ExpoConfigFacebook, infoPlist: InfoPlist) {
  const facebookScheme = getFacebookScheme(config);
  return appendScheme(facebookScheme, infoPlist);
}

export function setFacebookAutoInitEnabled(
  config: ExpoConfigFacebook,
  { FacebookAutoInitEnabled, ...infoPlist }: InfoPlist
) {
  const facebookAutoInitEnabled = getFacebookAutoInitEnabled(config);

  if (facebookAutoInitEnabled === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    FacebookAutoInitEnabled: facebookAutoInitEnabled,
  };
}

export function setFacebookAutoLogAppEventsEnabled(
  config: ExpoConfigFacebook,
  { FacebookAutoLogAppEventsEnabled, ...infoPlist }: InfoPlist
) {
  const facebookAutoLogAppEventsEnabled = getFacebookAutoLogAppEvents(config);

  if (facebookAutoLogAppEventsEnabled === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    FacebookAutoLogAppEventsEnabled: facebookAutoLogAppEventsEnabled,
  };
}

export function setFacebookAdvertiserIDCollectionEnabled(
  config: ExpoConfigFacebook,
  { FacebookAdvertiserIDCollectionEnabled, ...infoPlist }: InfoPlist
) {
  const facebookAdvertiserIDCollectionEnabled = getFacebookAdvertiserIDCollection(config);

  if (facebookAdvertiserIDCollectionEnabled === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    FacebookAdvertiserIDCollectionEnabled: facebookAdvertiserIDCollectionEnabled,
  };
}

export function setFacebookAppId(
  config: Pick<ExpoConfigFacebook, 'facebookAppId'>,
  { FacebookAppID, ...infoPlist }: InfoPlist
) {
  const facebookAppId = getFacebookAppId(config);
  if (facebookAppId) {
    return {
      ...infoPlist,
      FacebookAppID: facebookAppId,
    };
  }

  return infoPlist;
}

export function setFacebookDisplayName(
  config: ExpoConfigFacebook,
  { FacebookDisplayName, ...infoPlist }: InfoPlist
) {
  const facebookDisplayName = getFacebookDisplayName(config);

  if (facebookDisplayName) {
    return {
      ...infoPlist,
      FacebookDisplayName: facebookDisplayName,
    };
  }

  return infoPlist;
}

export function setFacebookApplicationQuerySchemes(
  config: Pick<ExpoConfigFacebook, 'facebookAppId'>,
  infoPlist: InfoPlist
): InfoPlist {
  const facebookAppId = getFacebookAppId(config);

  const existingSchemes = infoPlist.LSApplicationQueriesSchemes || [];

  if (facebookAppId && existingSchemes.includes('fbapi')) {
    // already inlcuded, no need to add again
    return infoPlist;
  } else if (!facebookAppId && !existingSchemes.length) {
    // already removed, no need to strip again
    const { LSApplicationQueriesSchemes, ...restInfoPlist } = infoPlist;
    if (LSApplicationQueriesSchemes?.length) {
      return infoPlist;
    } else {
      // Return without the empty LSApplicationQueriesSchemes array.
      return restInfoPlist;
    }
  }

  // Remove all schemes
  for (const scheme of fbSchemes) {
    const index = existingSchemes.findIndex(s => s === scheme);
    if (index > -1) {
      existingSchemes.splice(index, 1);
    }
  }

  if (!facebookAppId) {
    // Run again to ensure the LSApplicationQueriesSchemes array is stripped if needed.
    infoPlist.LSApplicationQueriesSchemes = existingSchemes;
    if (!infoPlist.LSApplicationQueriesSchemes.length) {
      delete infoPlist.LSApplicationQueriesSchemes;
    }
    return infoPlist;
  }

  // TODO: it's actually necessary to add more query schemes (specific to the
  // app) to support all of the features that the Facebook SDK provides, should
  // we sync those here too?
  const updatedSchemes = [...existingSchemes, ...fbSchemes];

  return {
    ...infoPlist,
    LSApplicationQueriesSchemes: updatedSchemes,
  };
}

export const withUserTrackingPermission: ConfigPlugin<{
  userTrackingPermission?: string | false;
} | void> = (config, { userTrackingPermission } = {}) => {
  if (userTrackingPermission === false) {
    return config;
  }
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSUserTrackingUsageDescription =
    userTrackingPermission || config.ios.infoPlist.NSUserTrackingUsageDescription || USER_TRACKING;

  return config;
};
