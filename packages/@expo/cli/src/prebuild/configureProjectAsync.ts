import type { ExpoConfig } from '@expo/config';
import type { ExportedConfig, ModPlatform } from '@expo/config-plugins';
import { compileModsAsync } from '@expo/config-plugins';
import { getPrebuildConfigAsync } from '@expo/prebuild-config';

import { logConfig } from '../config/configAsync';
import * as Log from '../log';
import { env } from '../utils/env';
import {
  getOrPromptForBundleIdentifierAsync,
  getOrPromptForPackageAsync,
} from '../utils/getOrPromptApplicationId';

export async function configureProjectAsync(
  projectRoot: string,
  {
    platforms,
    exp,
    templateChecksum,
  }: {
    platforms: ModPlatform[];
    exp?: ExpoConfig;
    templateChecksum?: string;
  }
): Promise<ExpoConfig> {
  let bundleIdentifier: string | undefined;
  if (platforms.includes('ios') || platforms.includes('tvos')) {
    // Check bundle ID before reading the config because it may mutate the config if the user is prompted to define it.
    bundleIdentifier = await getOrPromptForBundleIdentifierAsync(projectRoot, exp);
  }
  let packageName: string | undefined;
  if (platforms.includes('android')) {
    // Check package before reading the config because it may mutate the config if the user is prompted to define it.
    packageName = await getOrPromptForPackageAsync(projectRoot, exp);
  }

  let { exp: config } = await getPrebuildConfigAsync(projectRoot, {
    platforms,
    packageName,
    bundleIdentifier,
  });

  if (templateChecksum) {
    // Prepare template checksum for the patch mods
    config._internal = config._internal ?? {};
    config._internal.templateChecksum = templateChecksum;
  }

  // Plugins register the Apple mods under the `ios` key, since tvOS shares the iOS mod shape.
  // Copy them onto the `tvos` key so the mod compiler runs the same chain once per platform,
  // each against its own native directory (`ios/` and `tvos/`).
  const moddedConfig = config as ExportedConfig;
  if (platforms.includes('tvos') && moddedConfig.mods?.ios) {
    moddedConfig.mods.tvos = { ...moddedConfig.mods.ios };
  }

  // compile all plugins and mods
  config = await compileModsAsync(config, {
    projectRoot,
    platforms,
    assertMissingModProviders: false,
  });

  if (env.EXPO_DEBUG) {
    Log.log();
    Log.log('Evaluated config:');
    logConfig(config);
    Log.log();
  }

  return config;
}
