import { requireOptionalNativeModule } from 'expo-modules-core';

import { SplashScreenNativeModule, SplashScreenOptions } from './SplashScreen.types';

const SplashModule = requireOptionalNativeModule<SplashScreenNativeModule>('ExpoSplashScreen');

export function setOptions(options: SplashScreenOptions) {
  if (!SplashModule) {
    return;
  }

  SplashModule.setOptions(options);
}

export function hide() {
  if (!SplashModule) {
    return;
  }

  SplashModule.hide();
}

export async function hideAsync(): Promise<void> {
  hide();
}

export async function preventAutoHideAsync() {
  if (!SplashModule) {
    return;
  }

  return SplashModule.preventAutoHideAsync();
}
