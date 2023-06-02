import { ExpoConfig, getConfig, PackageJSONConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import JsonFile, { JSONObject } from '@expo/json-file';
import path from 'path';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import {
  getOrPromptForBundleIdentifier,
  getOrPromptForPackage,
} from '../utils/getOrPromptApplicationId';

/**
 * If an Expo config file does not exist, write a new one using the in-memory config.
 *
 * @param projectRoot
 */
export async function ensureConfigExistsAsync(projectRoot: string) {
  try {
    const config = getConfig(projectRoot, { skipSDKVersionRequirement: false });
    // If no config exists in the file system then we should generate one so the process doesn't fail.
    if (!config.dynamicConfigPath && !config.staticConfigPath) {
      // Remove the internal object before writing.
      delete config.exp._internal;

      // Write the generated config.
      await JsonFile.writeAsync(
        path.join(projectRoot, 'app.json'),
        { expo: config.exp as unknown as JSONObject },
        { json5: false }
      );
    }
  } catch (error: any) {
    // TODO(Bacon): Currently this is already handled in the command
    Log.log();
    throw new CommandError(`${error.message}\n`);
  }
}

/** Ensure config is written, and prompts for application identifiers. */
export async function ensureConfigAsync(
  projectRoot: string,
  {
    platforms,
  }: {
    platforms: ModPlatform[];
  }
): Promise<{ exp: ExpoConfig; pkg: PackageJSONConfig }> {
  await ensureConfigExistsAsync(projectRoot);

  // Prompt for the Android package first because it's more strict than the bundle identifier
  // this means you'll have a better chance at matching the bundle identifier with the package name.
  if (platforms.includes('android')) {
    await getOrPromptForPackage(projectRoot);
  }

  if (platforms.includes('ios')) {
    await getOrPromptForBundleIdentifier(projectRoot);
  }

  // Read config again because prompting for bundle id or package name may have mutated the results.
  return getConfig(projectRoot);
}
