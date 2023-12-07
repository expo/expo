import { getConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';

import { getAutolinkedPackagesAsync } from './getAutolinkedPackages';
import {
  withAndroidExpoPlugins,
  withIosExpoPlugins,
  withLegacyExpoPlugins,
  withVersionedExpoSDKPlugins,
} from './plugins/withDefaultPlugins';

export async function getPrebuildConfigAsync(
  projectRoot: string,
  props: {
    bundleIdentifier?: string;
    packageName?: string;
    platforms: ModPlatform[];
  }
): Promise<ReturnType<typeof getConfig>> {
  const autolinkedModules = await getAutolinkedPackagesAsync(projectRoot, props.platforms);

  return getPrebuildConfig(projectRoot, {
    ...props,
    autolinkedModules,
  });
}

function getPrebuildConfig(
  projectRoot: string,
  {
    platforms,
    bundleIdentifier,
    packageName,
    autolinkedModules,
  }: {
    bundleIdentifier?: string;
    packageName?: string;
    platforms: ModPlatform[];
    autolinkedModules?: string[];
  }
) {
  // let config: ExpoConfig;
  let { exp: config, ...rest } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    isModdedConfig: true,
  });

  if (autolinkedModules) {
    if (!config._internal) {
      config._internal = {};
    }
    config._internal.autolinkedModules = autolinkedModules;
  }

  // Add all built-in plugins first because they should take
  // priority over the unversioned plugins.
  config = withVersionedExpoSDKPlugins(config);
  config = withLegacyExpoPlugins(config);

  if (platforms.includes('ios')) {
    if (!config.ios) config.ios = {};
    config.ios.bundleIdentifier =
      bundleIdentifier ?? config.ios.bundleIdentifier ?? `com.placeholder.appid`;

    // Add all built-in plugins
    config = withIosExpoPlugins(config, {
      bundleIdentifier: config.ios.bundleIdentifier,
    });
  }

  if (platforms.includes('android')) {
    if (!config.android) config.android = {};
    config.android.package = packageName ?? config.android.package ?? `com.placeholder.appid`;

    // Add all built-in plugins
    config = withAndroidExpoPlugins(config, {
      package: config.android.package,
    });
  }

  return { exp: config, ...rest };
}
