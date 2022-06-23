import { ConfigPlugin, InfoPlist, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withIosAdMob: ConfigPlugin = config => {
  return withInfoPlist(config, config => {
    config.modResults = setAdMobConfig(config, config.modResults);
    return config;
  });
};

// NOTE(brentvatne): if the developer has installed the google ads sdk and does
// not provide an app id their app will crash. Standalone apps get around this by
// providing some default value, we will instead here assume that the user can
// do the right thing if they have installed the package. This is a slight discrepancy
// that arises in ejecting because it's possible for the package to be installed and
// not crashing in the managed workflow, then you eject and the app crashes because
// you don't have an id to fall back to.
export function getGoogleMobileAdsAppId(config: Pick<ExpoConfig, 'ios'>) {
  return config.ios?.config?.googleMobileAdsAppId ?? null;
}

export function setGoogleMobileAdsAppId(
  config: Pick<ExpoConfig, 'ios'>,
  { GADApplicationIdentifier, ...infoPlist }: InfoPlist
): InfoPlist {
  const appId = getGoogleMobileAdsAppId(config);

  if (appId === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    GADApplicationIdentifier: appId,
  };
}

function setAdMobConfig(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist {
  infoPlist = setGoogleMobileAdsAppId(config, infoPlist);
  return infoPlist;
}
