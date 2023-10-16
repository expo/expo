import { getConfig } from '@expo/config';

import * as Log from '../log';

/**
 * A convenience feature for automatically applying Expo Config Plugins to the `app.json` after installing them.
 * This should be dropped in favor of autolinking in the future.
 */
export async function applyPluginsAsync(projectRoot: string, packages: string[]) {
  const { autoAddConfigPluginsAsync } = await import('./utils/autoAddConfigPlugins.js');

  try {
    const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

    // Only auto add plugins if the plugins array is defined or if the project is using SDK +42.
    await autoAddConfigPluginsAsync(
      projectRoot,
      exp,
      // Split any possible NPM tags. i.e. `expo@latest` -> `expo`
      packages.map((pkg) => pkg.split('@')[0]).filter(Boolean)
    );
  } catch (error: any) {
    // If we fail to apply plugins, the log a warning and continue.
    if (error.isPluginError) {
      Log.warn(`Skipping config plugin check: ` + error.message);
      return;
    }
    // Any other error, rethrow.
    throw error;
  }
}
