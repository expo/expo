import { getAccountUsername, getConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

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
    expoUsername?: string | ((config: ExpoConfig) => string | null);
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
    expoUsername,
  }: {
    bundleIdentifier?: string;
    packageName?: string;
    platforms: ModPlatform[];
    autolinkedModules?: string[];
    expoUsername?: string | ((config: ExpoConfig) => string | null);
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

  const resolvedExpoUsername =
    typeof expoUsername === 'function'
      ? expoUsername(config)
      : // If the user didn't pass a username then fallback on the static cached username.
        expoUsername ?? getAccountUsername(config);

  // Add all built-in plugins first because they should take
  // priority over the unversioned plugins.
  config = withVersionedExpoSDKPlugins(config, {
    expoUsername: resolvedExpoUsername,
  });
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
