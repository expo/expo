import type { AppJSONConfig, ExpoConfig, PackageJSONConfig, ProjectConfig } from '@expo/config';
import { getConfig, getProjectConfigDescriptionWithPaths } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { getPlatformBundlers } from '../../server/platformBundlers';
import { PrerequisiteCommandError, ProjectPrerequisite } from '../Prerequisite';
import { ensureDependenciesAsync } from '../dependencies/ensureDependenciesAsync';
import type { ResolvedPackage } from '../dependencies/getMissingPackages';

const debug = require('debug')('expo:doctor:webSupport') as typeof console.log;

/** Ensure the project has the required web support settings. */
export class WebSupportProjectPrerequisite extends ProjectPrerequisite {
  /** Ensure a project that hasn't explicitly disabled web support has all the required packages for running in the browser. */
  async assertImplementation(): Promise<void> {
    if (env.EXPO_NO_WEB_SETUP) {
      Log.warn('Skipping web setup: EXPO_NO_WEB_SETUP is enabled.');
      return;
    }
    debug('Ensuring web support is setup');

    const result = await this._shouldSetupWebSupportAsync();

    // Ensure web packages are installed
    await this._ensureWebDependenciesInstalledAsync({ exp: result.exp, pkg: result.pkg });
  }

  /** Exposed for testing. */
  async _shouldSetupWebSupportAsync(): Promise<ProjectConfig> {
    const config = getConfig(this.projectRoot);

    // Detect if the 'web' string is purposefully missing from the platforms array.
    if (isWebPlatformExcluded(config.rootConfig)) {
      // Get exact config description with paths.
      const configName = getProjectConfigDescriptionWithPaths(this.projectRoot, config);
      throw new PrerequisiteCommandError(
        'WEB_SUPPORT',
        chalk`Skipping web setup: {bold "web"} is not included in the project ${configName} {bold "platforms"} array.`
      );
    }

    return config;
  }

  /** Exposed for testing. */
  async _ensureWebDependenciesInstalledAsync({
    exp,
    pkg,
  }: {
    exp: ExpoConfig;
    pkg: PackageJSONConfig;
  }): Promise<boolean> {
    const requiredPackages: ResolvedPackage[] = [
      { file: 'react-dom/package.json', pkg: 'react-dom' },
    ];
    const hasReactNative = !!(
      pkg.dependencies?.['react-native'] || pkg.devDependencies?.['react-native']
    );
    if (hasReactNative) {
      // react-native-web is recommended but not required to start a web project.
      // use react-native-web/package.json to skip node module cache issues when the user installs
      // the package and attempts to resolve the module in the same process.
      requiredPackages.push({ file: 'react-native-web/package.json', pkg: 'react-native-web' });
    }

    const bundler = getPlatformBundlers(this.projectRoot, exp).web;
    // Only include webpack-config if bundler is webpack.
    if (bundler === 'webpack') {
      requiredPackages.push(
        // `webpack` and `webpack-dev-server` should be installed in the `@expo/webpack-config`
        {
          file: '@expo/webpack-config/package.json',
          pkg: '@expo/webpack-config',
          dev: true,
        }
      );
    }

    try {
      return await ensureDependenciesAsync(this.projectRoot, {
        // This never seems to work when prompting, installing, and running -- instead just inform the user to run the install command and try again.
        skipPrompt: true,
        isProjectMutable: false,
        exp,
        installMessage: `It looks like you're trying to use web support but don't have the required dependencies installed.`,
        warningMessage: chalk`If you're not using web, please ensure you remove the {bold "web"} string from the platforms array in the project Expo config.`,
        requiredPackages,
      });
    } catch (error) {
      // Reset the cached check so we can re-run the check if the user re-runs the command by pressing 'w' in the Terminal UI.
      this.resetAssertion();

      // react-native-web is optional — if it's the only missing package, warn instead of blocking.
      const hasReactDOM = !!(pkg.dependencies?.['react-dom'] || pkg.devDependencies?.['react-dom']);
      if (hasReactDOM) {
        Log.warn(
          chalk`{bold react-native-web} is not installed. Some React Native components may not work on web without it. Install it with: {bold npx expo install react-native-web}`
        );
        return false;
      }

      throw error;
    }
  }
}

/** Return `true` if the `web` platform is purposefully excluded from the project Expo config. */
export function isWebPlatformExcluded(rootConfig: AppJSONConfig): boolean {
  // Detect if the 'web' string is purposefully missing from the platforms array.
  const isWebExcluded =
    Array.isArray(rootConfig?.expo?.platforms) &&
    !!rootConfig.expo?.platforms.length &&
    !rootConfig.expo?.platforms.includes('web');
  return isWebExcluded;
}
