import type { ExpoConfig } from '@expo/config-types';

import type { AndroidManifest } from './Manifest';
import { getMainApplicationOrThrow } from './Manifest';
import type { ConfigPlugin } from '../Plugin.types';
import { withAndroidManifest } from '../plugins/android-plugins';

const ANDROID_ENABLE_ON_BACK_INVOKED_CALLBACK = 'android:enableOnBackInvokedCallback';

export const withPredictiveBackGesture: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = setPredictiveBackGesture(config, config.modResults);
    return config;
  });
};

export function setPredictiveBackGesture(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidManifest
) {
  const app = getMainApplicationOrThrow(androidManifest);
  app.$[ANDROID_ENABLE_ON_BACK_INVOKED_CALLBACK] = getPredictiveBackGestureValue(config);
  return androidManifest;
}

export function getPredictiveBackGestureValue(config: Pick<ExpoConfig, 'android'>) {
  const value = config.android?.predictiveBackGestureEnabled;
  return value === true ? 'true' : 'false';
}
