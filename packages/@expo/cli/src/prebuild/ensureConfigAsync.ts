import { ExpoConfig, getConfig, PackageJSONConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';

import {
  getOrPromptForBundleIdentifier,
  getOrPromptForPackage,
} from '../utils/getOrPromptApplicationId';

/** Ensure config is written, and prompts for application identifiers. */
export async function ensureConfigAsync(
  projectRoot: string,
  {
    platforms,
  }: {
    platforms: ModPlatform[];
  }
): Promise<{ exp: ExpoConfig; pkg: PackageJSONConfig }> {
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
