import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const META_APPLICATION_ID = 'com.google.android.gms.ads.APPLICATION_ID';
const META_DELAY_APP_MEASUREMENT_INIT = 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT';

export const withAndroidAdMob: ConfigPlugin = config => {
  return withAndroidManifest(config, config => {
    config.modResults = setAdMobConfig(config, config.modResults);
    return config;
  });
};

export function getGoogleMobileAdsAppId(config: Pick<ExpoConfig, 'android'>) {
  return config.android?.config?.googleMobileAdsAppId ?? null;
}

export function getGoogleMobileAdsAutoInit(config: Pick<ExpoConfig, 'android'>) {
  return config.android?.config?.googleMobileAdsAutoInit ?? false;
}

export function setAdMobConfig(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest
) {
  const appId = getGoogleMobileAdsAppId(config);
  const autoInit = getGoogleMobileAdsAutoInit(config);
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  if (appId) {
    addMetaDataItemToMainApplication(mainApplication, META_APPLICATION_ID, appId);
    addMetaDataItemToMainApplication(
      mainApplication,
      META_DELAY_APP_MEASUREMENT_INIT,
      String(!autoInit)
    );
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_APPLICATION_ID);
    removeMetaDataItemFromMainApplication(mainApplication, META_DELAY_APP_MEASUREMENT_INIT);
  }

  return androidManifest;
}
