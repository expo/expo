import { ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import getDevClientProperties from '../utils/analytics/getDevClientProperties';
import { logEvent } from '../utils/analytics/rudderstackClient';
import { CI } from '../utils/env';
import { installExitHooks } from '../utils/exit';
import { profile } from '../utils/profile';
import { validateDependenciesVersionsAsync } from './doctor/dependencies/validateDependenciesVersions';
import { TypeScriptProjectPrerequisite } from './doctor/typescript/TypeScriptProjectPrerequisite';
import { WebSupportProjectPrerequisite } from './doctor/web/WebSupportProjectPrerequisite';
import { startInterfaceAsync } from './interface/startInterface';
import { Options, resolvePortsAsync } from './resolveOptions';
import { BundlerStartOptions } from './server/BundlerDevServer';
import { DevServerManager, MultiBundlerStartOptions } from './server/DevServerManager';
import { openPlatformsAsync } from './server/openPlatforms';

async function getMultiBundlerStartOptions(
  projectRoot: string,
  { forceManifestType, ...options }: Options,
  settings: { webOnly?: boolean }
): Promise<[BundlerStartOptions, MultiBundlerStartOptions]> {
  const commonOptions: BundlerStartOptions = {
    mode: options.dev ? 'development' : 'production',
    devClient: options.devClient,
    forceManifestType,
    privateKeyPath: options.privateKeyPath ?? undefined,
    https: options.https,
    maxWorkers: options.maxWorkers,
    resetDevServer: options.clear,
    minify: options.minify,
    location: {
      hostType: options.host,
      scheme: options.scheme,
    },
  };
  const multiBundlerSettings = await resolvePortsAsync(projectRoot, options, settings);

  const multiBundlerStartOptions: MultiBundlerStartOptions = [];

  if (options.web || settings.webOnly) {
    multiBundlerStartOptions.push({
      type: 'webpack',
      options: {
        ...commonOptions,
        port: multiBundlerSettings.webpackPort,
      },
    });
  }

  if (!settings.webOnly) {
    multiBundlerStartOptions.push({
      type: 'metro',
      options: {
        ...commonOptions,
        port: multiBundlerSettings.metroPort,
      },
    });
  }

  return [commonOptions, multiBundlerStartOptions];
}

export async function startAsync(
  projectRoot: string,
  options: Options,
  settings: { webOnly?: boolean }
) {
  Log.log(chalk.gray(`Starting project at ${projectRoot}`));

  const { exp, pkg } = profile(getConfig)(projectRoot);

  if (!options.forceManifestType) {
    const easUpdatesUrlRegex = /^https:\/\/(staging-)?u\.expo\.dev/;
    const isEasUpdatesUrl = exp.updates?.url ? easUpdatesUrlRegex.test(exp.updates.url) : false;
    options.forceManifestType = isEasUpdatesUrl ? 'expo-updates' : 'classic';
  }

  const [defaultOptions, startOptions] = await getMultiBundlerStartOptions(
    projectRoot,
    options,
    settings
  );

  const devServerManager = new DevServerManager(projectRoot, defaultOptions);

  // Validations

  if (options.web || settings.webOnly) {
    await devServerManager.ensureProjectPrerequisiteAsync(WebSupportProjectPrerequisite);
  }

  await devServerManager.ensureProjectPrerequisiteAsync(TypeScriptProjectPrerequisite);

  if (!settings.webOnly && !options.devClient) {
    await profile(validateDependenciesVersionsAsync)(projectRoot, exp, pkg);
  }

  // Some tracking thing

  if (options.devClient) {
    track(projectRoot, exp);
  }

  await profile(devServerManager.startAsync.bind(devServerManager))(startOptions);

  // Open project on devices.
  await profile(openPlatformsAsync)(devServerManager, options);

  // Present the Terminal UI.
  if (!CI) {
    await profile(startInterfaceAsync)(devServerManager, {
      platforms: exp.platforms ?? ['ios', 'android', 'web'],
    });
  } else {
    // Display the server location in CI...
    const url = devServerManager.getDefaultDevServer()?.getDevServerUrl();
    if (url) {
      Log.log(chalk`Waiting on {underline ${url}}`);
    }
  }

  // Final note about closing the server.
  const logLocation = settings.webOnly ? 'in the browser console' : 'below';
  Log.log(
    chalk`Logs for your project will appear ${logLocation}.${
      CI ? '' : chalk.dim(` Press Ctrl+C to exit.`)
    }`
  );
}

function track(projectRoot: string, exp: ExpoConfig) {
  logEvent('dev client start command', {
    status: 'started',
    ...getDevClientProperties(projectRoot, exp),
  });
  installExitHooks(() => {
    logEvent('dev client start command', {
      status: 'finished',
      ...getDevClientProperties(projectRoot, exp),
    });
    // UnifiedAnalytics.flush();
  });
}
