import { ExpoConfig } from '@expo/config-types';

import { ConfigPlugin } from '../Plugin.types';
import { withAndroidManifest } from '../plugins/android-plugins';
import { AndroidManifest, getMainActivityOrThrow } from './Manifest';

const ANDROID_WINDOW_SOFT_INPUT_MODE = 'android:windowSoftInputMode';

const MAPPING: Record<string, string> = {
  pan: 'adjustPan',
  resize: 'adjustResize',
};

export const withWindowSoftInputMode: ConfigPlugin = config => {
  return withAndroidManifest(config, async config => {
    config.modResults = setWindowSoftInputModeMode(config, config.modResults);
    return config;
  });
};

export function setWindowSoftInputModeMode(
  config: Pick<ExpoConfig, 'android' | 'userInterfaceStyle'>,
  androidManifest: AndroidManifest
) {
  const app = getMainActivityOrThrow(androidManifest);
  app.$[ANDROID_WINDOW_SOFT_INPUT_MODE] = getWindowSoftInputModeMode(config);
  return androidManifest;
}

export function getWindowSoftInputModeMode(config: Pick<ExpoConfig, 'android'>) {
  const value = config.android?.softwareKeyboardLayoutMode;

  if (!value) {
    // Default to `adjustResize` or `resize`.
    return 'adjustResize';
  }
  return MAPPING[value] ?? value;
}
