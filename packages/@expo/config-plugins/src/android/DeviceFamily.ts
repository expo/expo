import { ExpoConfig } from '@expo/config-types';

import { ExportedConfigWithProps, withAndroidManifest } from '..';
import { ConfigPlugin } from '../Plugin.types';

type AndroidScreenSizesConfig = {
  smallScreens?: boolean;
  normalScreens?: boolean;
  largeScreens?: boolean;
  xlargeScreens?: boolean;
  anyDensity?: boolean;
  requiresSmallestWidthDp?: number;
  compatibleWidthLimitDp?: number;
  largestWidthLimitDp?: number;
};

export function getSupportsScreen(config: Pick<ExpoConfig, 'android'>): AndroidScreenSizesConfig {
  return config.android?.supportsScreens ?? {};
}

export const setSupportsScreens = (
  config: ExportedConfigWithProps,
  supportsScreensConfig: AndroidScreenSizesConfig
) => {
  const supportsScreensAttributes = {
    ...(supportsScreensConfig.smallScreens !== undefined && {
      'android:smallScreens': supportsScreensConfig.smallScreens?.toString(),
    }),
    ...(supportsScreensConfig.normalScreens !== undefined && {
      'android:normalScreens': supportsScreensConfig.normalScreens?.toString(),
    }),
    ...(supportsScreensConfig.largeScreens !== undefined && {
      'android:largeScreens': supportsScreensConfig.largeScreens?.toString(),
    }),
    ...(supportsScreensConfig.xlargeScreens !== undefined && {
      'android:xlargeScreens': supportsScreensConfig.xlargeScreens?.toString(),
    }),
    ...(supportsScreensConfig.anyDensity !== undefined && {
      'android:anyDensity': supportsScreensConfig.anyDensity?.toString(),
    }),
    ...(supportsScreensConfig.requiresSmallestWidthDp !== undefined && {
      'android:requiresSmallestWidthDp': supportsScreensConfig.requiresSmallestWidthDp?.toString(),
    }),
    ...(supportsScreensConfig.compatibleWidthLimitDp !== undefined && {
      'android:compatibleWidthLimitDp': supportsScreensConfig.compatibleWidthLimitDp?.toString(),
    }),
    ...(supportsScreensConfig.largestWidthLimitDp !== undefined && {
      'android:largestWidthLimitDp': supportsScreensConfig.largestWidthLimitDp?.toString(),
    }),
  };

  if (Object.keys(supportsScreensAttributes).length > 0) {
    config.modResults.manifest['supports-screens'] = [
      {
        $: supportsScreensAttributes,
      },
    ];
  }

  return config;
};

export const withDeviceFamily: ConfigPlugin<AndroidScreenSizesConfig | void> = (config) => {
  const supportsScreensConfig = getSupportsScreen(config);

  return withAndroidManifest(config, async (config) => {
    return setSupportsScreens(config, supportsScreensConfig);
  });
};

export default withDeviceFamily;
