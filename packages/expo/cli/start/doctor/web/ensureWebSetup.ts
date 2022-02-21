import {
  AppJSONConfig,
  ExpoConfig,
  getConfig,
  getProjectConfigDescriptionWithPaths,
  ProjectConfig,
} from '@expo/config';
import chalk from 'chalk';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { ensureDependenciesAsync } from '../dependencies/ensureDependenciesAsync';

// Only check once per run.
let hasChecked = false;
let disabledReason = '';

/** Ensure a project that hasn't explicitly disabled web support has all the required packages for running in the browser. */
export async function ensureWebSupportSetupAsync(
  projectRoot: string,
  { skipCache = false }: { skipCache?: boolean } = {}
): Promise<boolean> {
  if (!skipCache && hasChecked) {
    if (disabledReason) {
      Log.log(chalk.dim(disabledReason));
    }
    return false;
  }
  hasChecked = true;
  Log.debug('Ensuring web support is setup');
  const result = await shouldSetupWebSupportAsync(projectRoot);

  if ('failureReason' in result) {
    disabledReason = result.failureReason;
    return ensureWebSupportSetupAsync(projectRoot);
  }

  // Ensure web packages are installed
  await ensureWebDependenciesInstalledAsync(projectRoot, { exp: result.exp });

  return true;
}

/** Return `true` if the `web` platform is purposefully excluded from the project Expo config. */
export function isWebPlatformExcluded(rootConfig: AppJSONConfig): boolean {
  // Detect if the 'web' string is purposefully missing from the platforms array.
  const isWebExcluded =
    Array.isArray(rootConfig.expo?.platforms) &&
    !!rootConfig.expo?.platforms.length &&
    !rootConfig.expo?.platforms.includes('web');
  return isWebExcluded;
}

export async function shouldSetupWebSupportAsync(
  projectRoot: string
): Promise<{ failureReason: string } | ProjectConfig> {
  if (env.EXPO_NO_WEB_SETUP) {
    return { failureReason: '\u203A Skipping web setup: EXPO_NO_WEB_SETUP is enabled.' };
  }

  const projectConfig = getConfig(projectRoot);

  // Detect if the 'web' string is purposefully missing from the platforms array.
  if (isWebPlatformExcluded(projectConfig.rootConfig)) {
    // Get exact config description with paths.
    const configName = getProjectConfigDescriptionWithPaths(projectRoot, projectConfig);
    return {
      failureReason: chalk`\u203A Skipping web setup: {bold "web"} is not included in the project ${configName} {bold "platforms"} array.`,
    };
  }

  return projectConfig;
}

async function ensureWebDependenciesInstalledAsync(
  projectRoot: string,
  {
    exp = getConfig(projectRoot).exp,
  }: {
    exp?: ExpoConfig;
  } = {}
): Promise<boolean> {
  try {
    return await ensureDependenciesAsync(projectRoot, {
      exp,
      installMessage: `It looks like you're trying to use web support but don't have the required dependencies installed.`,
      warningMessage: chalk`If you're not using web, please remove the {bold "web"} string from the platforms array in the project Expo config.`,
      requiredPackages: [
        // use react-native-web/package.json to skip node module cache issues when the user installs
        // the package and attempts to resolve the module in the same process.
        { file: 'react-native-web/package.json', pkg: 'react-native-web' },
        { file: 'react-dom/package.json', pkg: 'react-dom' },
      ],
    });
  } catch (error) {
    // Reset the cached check so we can re-run the check if the user re-runs the command.
    hasChecked = false;
    throw error;
  }
}
