import { ExpoConfig } from '@expo/config';
import { compileModsAsync, ModPlatform } from '@expo/config-plugins';
import { getPrebuildConfigAsync } from '@expo/prebuild-config';

import { logConfig } from '../config/configAsync';
import * as Log from '../log';
import { env } from '../utils/env';
import {
  getOrPromptForBundleIdentifier,
  getOrPromptForPackage,
} from '../utils/getOrPromptApplicationId';

export async function configureProjectAsync(
  projectRoot: string,
  {
    platforms,
    templateProjectRoot,
    exp,
    templateChecksum,
  }: {
    platforms: ModPlatform[];
    templateProjectRoot?: string;
    exp?: ExpoConfig;
    templateChecksum?: string;
  }
): Promise<ExpoConfig> {
  let bundleIdentifier: string | undefined;
  if (platforms.includes('ios')) {
    // Check bundle ID before reading the config because it may mutate the config if the user is prompted to define it.
    bundleIdentifier = await getOrPromptForBundleIdentifier(projectRoot, exp);
  }
  let packageName: string | undefined;
  if (platforms.includes('android')) {
    // Check package before reading the config because it may mutate the config if the user is prompted to define it.
    packageName = await getOrPromptForPackage(projectRoot, exp);
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

  // compile all plugins and mods
  config = await compileModsAsync(config, {
    projectRoot,
    platforms,
    assertMissingModProviders: false,
    templateProjectRoot,
  });

  if (env.EXPO_DEBUG) {
    Log.log();
    Log.log('Evaluated config:');
    logConfig(config);
    Log.log();
  }

  return config;
}
