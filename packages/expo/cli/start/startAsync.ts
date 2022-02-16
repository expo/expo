import { ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import getDevClientProperties from '../utils/analytics/getDevClientProperties';
import { logEvent } from '../utils/analytics/rudderstackClient';
import StatusEventEmitter from '../utils/analytics/StatusEventEmitter';
import { CI } from '../utils/env';
import { installExitHooks } from '../utils/exit';
import { FileNotifier } from '../utils/FileNotifier';
import { getAllSpinners, ora } from '../utils/ora';
import { profile } from '../utils/profile';
import { getProgressBar, setProgressBar } from '../utils/progress';
import { validateDependenciesVersionsAsync } from './doctor/dependencies/validateDependenciesVersions';
import { ensureTypeScriptSetupAsync } from './doctor/typescript/ensureTypeScriptSetup';
import { ensureWebSupportSetupAsync } from './doctor/web/ensureWebSetup';
import { startInterfaceAsync } from './interface/TerminalUI';
import { Options, resolvePortsAsync } from './resolveOptions';
import { BundlerStartOptions } from './server/BundlerDevServer';
import * as LoadingPageHandler from './server/middleware/LoadingPageHandler';
import { openPlatformsAsync } from './server/openPlatforms';
import * as Project from './server/startDevServers';

async function getMultiBundlerStartOptions(
  projectRoot: string,
  { forceManifestType, ...options }: Options,
  settings: { webOnly?: boolean }
): Promise<Project.MultiBundlerStartOptions> {
  const multiBundlerStartOptions: Project.MultiBundlerStartOptions = [];
  const mode = options.dev ? 'development' : 'production';
  const commonOptions: BundlerStartOptions = {
    mode,
    devClient: options.devClient,
    forceManifestType,
    https: options.https,
    // host: options.host,
    maxWorkers: options.maxWorkers,
    resetDevServer: options.clear,
    location: {
      hostType: options.host,
      minify: options.minify,
      scheme: options.scheme,
      isOffline: options.offline,
      mode,
    },
  };
  const multiBundlerSettings = await resolvePortsAsync(projectRoot, options, settings);

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

  return multiBundlerStartOptions;
}

export async function startAsync(
  projectRoot: string,
  options: Options,
  settings: { webOnly?: boolean }
) {
  Log.log(chalk.gray(`Starting project at ${projectRoot}`));

  const { exp, pkg } = profile(getConfig)(projectRoot);

  // TODO: Move into resolveOptions
  if (!options.forceManifestType) {
    const easUpdatesUrlRegex = /^https:\/\/(staging-)?u\.expo\.dev/;
    const updatesUrl = exp.updates?.url;
    const isEasUpdatesUrl = updatesUrl && easUpdatesUrlRegex.test(updatesUrl);
    options.forceManifestType = isEasUpdatesUrl ? 'expo-updates' : 'classic';
  }

  const startOptions = await getMultiBundlerStartOptions(projectRoot, options, settings);

  // Validations

  if (options.web || settings.webOnly) {
    await ensureWebSupportSetupAsync(projectRoot);
  }

  await profile(ensureTypeScriptSetupAsync)(projectRoot);

  if (!settings.webOnly && !options.devClient) {
    await profile(validateDependenciesVersionsAsync)(projectRoot, exp, pkg);
  }

  // Some tracking thing

  if (options.devClient) {
    track(projectRoot, exp);
  }

  // More Dev Client

  LoadingPageHandler.setOnDeepLink(
    async (projectRoot: string, isDevClient: boolean, platform: string | null) => {
      if (!isDevClient) {
        return;
      }

      const { exp } = getConfig(projectRoot);
      StatusEventEmitter.once('deviceLogReceive', () => {
        // Send the 'ready' event once the app is running in a device.
        logEvent('dev client start command', {
          status: 'ready',
          platform,
          ...getDevClientProperties(projectRoot, exp),
        });
      });

      logEvent('dev client start command', {
        status: 'started',
        platform,
        ...getDevClientProperties(projectRoot, exp),
      });
    }
  );

  await profile(Project.startDevServersAsync)(projectRoot, startOptions);

  // Open project on devices.
  await profile(openPlatformsAsync)(projectRoot, options);

  watchBabelConfig(projectRoot);

  // Present the Terminal UI.
  if (!CI) {
    await profile(startInterfaceAsync)(projectRoot, {
      platforms: exp.platforms ?? ['ios', 'android', 'web'],
      devClient: options.devClient,
      isWebSocketsEnabled: Project.getDefaultDevServer()?.isTargetingNative(),
      async stopAsync() {
        const spinners = getAllSpinners();
        spinners.forEach((spinner) => {
          spinner.fail();
        });

        const currentProgress = getProgressBar();
        if (currentProgress) {
          currentProgress.terminate();
          setProgressBar(null);
        }
        const spinner = ora({ text: 'Stopping server', color: 'white' }).start();
        try {
          await Project.stopAsync();
          spinner.stopAndPersist({ text: 'Stopped server', symbol: `\u203A` });
          process.exit();
        } catch (error) {
          spinner.fail('Failed to stop server');
          Log.exit(error);
        }
      },
    });
  } else {
    // Display the server location in CI...
    const url = Project.getDefaultDevServer()?.getDevServerUrl();
    if (url) {
      Log.log(chalk`Waiting on {underline ${url}`);
    }
  }

  // Final note about closing the server.
  const logLocation = settings.webOnly ? 'in the browser console' : 'below';
  Log.log(chalk`Logs for your project will appear ${logLocation}. {dim Press Ctrl+C to exit.}`);
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

function watchBabelConfig(projectRoot: string) {
  const notifier = new FileNotifier(projectRoot, [
    './babel.config.js',
    './.babelrc',
    './.babelrc.js',
  ]);

  notifier.startObserving();

  return notifier;
}
