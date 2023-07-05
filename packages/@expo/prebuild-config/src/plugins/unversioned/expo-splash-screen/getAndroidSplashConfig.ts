import { ExpoConfig } from '@expo/config-types';

import { defaultFadeDurationMs, computeFadeDurationMs } from './fadeDurationUtils';

export interface AndroidSplashConfig {
  xxxhdpi: string | null;
  xxhdpi: string | null;
  xhdpi: string | null;
  hdpi: string | null;
  mdpi: string | null;
  backgroundColor: string | null;
  resizeMode: 'contain' | 'cover' | 'native';
  fadeDurationMs: number;
}

const defaultResizeMode = 'contain';

export function getAndroidSplashConfig(
  config: Pick<ExpoConfig, 'splash' | 'android'>
): AndroidSplashConfig {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if (config.android?.splash) {
    const splash = config.android?.splash;
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image ?? null,
      xxhdpi: splash.xxhdpi ?? splash.image ?? null,
      xhdpi: splash.xhdpi ?? splash.image ?? null,
      hdpi: splash.hdpi ?? splash.image ?? null,
      mdpi: splash.mdpi ?? splash.image ?? null,
      backgroundColor: splash.backgroundColor ?? null,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      fadeDurationMs: computeFadeDurationMs(splash?.fadeDurationMs),
    };
  }

  if (config.splash) {
    const splash = config.splash;
    return {
      xxxhdpi: splash.image ?? null,
      xxhdpi: splash.image ?? null,
      xhdpi: splash.image ?? null,
      hdpi: splash.image ?? null,
      mdpi: splash.image ?? null,
      backgroundColor: splash.backgroundColor ?? null,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      fadeDurationMs: computeFadeDurationMs(splash?.fadeDurationMs),
    };
  }

  return {
    xxxhdpi: null,
    xxhdpi: null,
    xhdpi: null,
    hdpi: null,
    mdpi: null,
    backgroundColor: null,
    resizeMode: defaultResizeMode,
    fadeDurationMs: defaultFadeDurationMs,
  };
}

export function getAndroidDarkSplashConfig(
  config: Pick<ExpoConfig, 'splash' | 'android'>
): AndroidSplashConfig | null {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if (config.android?.splash?.dark) {
    const splash = config.android?.splash?.dark;
    const lightTheme = getAndroidSplashConfig(config);
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image ?? null,
      xxhdpi: splash.xxhdpi ?? splash.image ?? null,
      xhdpi: splash.xhdpi ?? splash.image ?? null,
      hdpi: splash.hdpi ?? splash.image ?? null,
      mdpi: splash.mdpi ?? splash.image ?? null,
      backgroundColor: splash.backgroundColor ?? null,
      // Can't support dark resizeMode because the resize mode is hardcoded into the MainActivity.java
      resizeMode: lightTheme?.resizeMode ?? defaultResizeMode,
      fadeDurationMs: computeFadeDurationMs(splash?.fadeDurationMs),
    };
  }

  return null;
}
