import { ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import getDevClientProperties from '../utils/analytics/getDevClientProperties';
import { logEventAsync } from '../utils/analytics/rudderstackClient';
import { installExitHooks } from '../utils/exit';
import { isInteractive } from '../utils/interactive';
import { setNodeEnv } from '../utils/nodeEnv';
import { profile } from '../utils/profile';
import { validateDependenciesVersionsAsync } from './doctor/dependencies/validateDependenciesVersions';
import { WebSupportProjectPrerequisite } from './doctor/web/WebSupportProjectPrerequisite';
import { startInterfaceAsync } from './interface/startInterface';
import { Options, resolvePortsAsync } from './resolveOptions';
import { BundlerStartOptions } from './server/BundlerDevServer';
import { DevServerManager, MultiBundlerStartOptions } from './server/DevServerManager';
import { openPlatformsAsync } from './server/openPlatforms';
import { getPlatformBundlers, PlatformBundlers } from './server/platformBundlers';

async function getMultiBundlerStartOptions(
  projectRoot: string,
  { forceManifestType, ...options }: Options,
  settings: { webOnly?: boolean },
  platformBundlers: PlatformBundlers
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

  const optionalBundlers: Partial<PlatformBundlers> = { ...platformBundlers };
  // In the default case, we don't want to start multiple bundlers since this is
  // a bit slower. Our priority (for legacy) is native platforms.
  if (!options.web) {
    delete optionalBundlers['web'];
  }

  const bundlers = [...new Set(Object.values(optionalBundlers))];
  const multiBundlerStartOptions = bundlers.map((bundler) => {
    const port =
      bundler === 'webpack' ? multiBundlerSettings.webpackPort : multiBundlerSettings.metroPort;
    return {
      type: bundler,
      options: {
        ...commonOptions,
        port,
      },
    };
  });

  return [commonOptions, multiBundlerStartOptions];
}

export async function startAsync(
  projectRoot: string,
  options: Options,
  settings: { webOnly?: boolean }
) {
  Log.log(chalk.gray(`Starting project at ${projectRoot}`));

  setNodeEnv(options.dev ? 'development' : 'production');

  const { exp, pkg } = profile(getConfig)(projectRoot);

  const platformBundlers = getPlatformBundlers(exp);

  if (!options.forceManifestType) {
    const easUpdatesUrlRegex = /^https:\/\/(staging-)?u\.expo\.dev/;
    const isEasUpdatesUrl = exp.updates?.url ? easUpdatesUrlRegex.test(exp.updates.url) : false;
    options.forceManifestType = isEasUpdatesUrl ? 'expo-updates' : 'classic';
  }

  const [defaultOptions, startOptions] = await getMultiBundlerStartOptions(
    projectRoot,
    options,
    settings,
    platformBundlers
  );

  const devServerManager = new DevServerManager(projectRoot, defaultOptions);

  // Validations

  if (options.web || settings.webOnly) {
    await devServerManager.ensureProjectPrerequisiteAsync(WebSupportProjectPrerequisite);
  }

  // Start the server as soon as possible.
  await profile(devServerManager.startAsync.bind(devServerManager))(startOptions);

  if (!settings.webOnly) {
    // After the server starts, we can start attempting to bootstrap TypeScript.
    await devServerManager.bootstrapTypeScriptAsync();
  }

  if (!settings.webOnly && !options.devClient) {
    await profile(validateDependenciesVersionsAsync)(projectRoot, exp, pkg);
  }

  // Some tracking thing

  if (options.devClient) {
    await trackAsync(projectRoot, exp);
  }

  // Open project on devices.
  await profile(openPlatformsAsync)(devServerManager, options);

  // Present the Terminal UI.
  if (isInteractive()) {
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
      isInteractive() ? chalk.dim(` Press Ctrl+C to exit.`) : ''
    }`
  );
}

async function trackAsync(projectRoot: string, exp: ExpoConfig): Promise<void> {
  await logEventAsync('dev client start command', {
    status: 'started',
    ...getDevClientProperties(projectRoot, exp),
  });
  installExitHooks(async () => {
    await logEventAsync('dev client start command', {
      status: 'finished',
      ...getDevClientProperties(projectRoot, exp),
    });
    // UnifiedAnalytics.flush();
  });
}
