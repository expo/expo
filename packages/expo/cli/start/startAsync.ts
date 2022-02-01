import { ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';

import * as Log from '../log';
import getDevClientProperties from '../utils/analytics/getDevClientProperties';
import { logEvent } from '../utils/analytics/rudderstackClient';
import StatusEventEmitter from '../utils/analytics/StatusEventEmitter';
import { CI } from '../utils/env';
import { AbortCommandError, CommandError } from '../utils/errors';
import { installExitHooks } from '../utils/exit';
import { getAllSpinners, ora } from '../utils/ora';
import { profile } from '../utils/profile';
import { getProgressBar, setProgressBar } from '../utils/progress';
import * as Android from './android/Android';
import ProcessSettings from './api/ProcessSettings';
import { validateDependenciesVersionsAsync } from './dependencies/validateDependenciesVersions';
import * as Project from './devServer';
import { printQRCode } from './interface/qr';
import * as TerminalUI from './interface/TerminalUI';
import * as Simulator from './ios/Simulator';
import * as LoadingPageHandler from './metro/LoadingPageHandler';
import { StartOptions } from './metro/MetroDevServer';
import { Options, resolvePortsAsync } from './resolveOptions';
import { constructDeepLinkAsync } from './serverUrl';
import { ensureTypeScriptSetupAsync } from './typescript/ensureTypeScriptSetup';
import { ensureWebSupportSetupAsync } from './web/ensureWebSetup';
import * as Webpack from './webpack/Webpack';
import * as WebpackDevServer from './webpack/WebpackDevServer';

export function isDevClientPackageInstalled(projectRoot: string) {
  try {
    // we check if `expo-dev-launcher` is installed instead of `expo-dev-client`
    // because someone could install only launcher.
    resolveFrom(projectRoot, 'expo-dev-launcher');
    return true;
  } catch {
    return false;
  }
}

export async function startAsync(
  projectRoot: string,
  options: Options,
  settings: { webOnly?: boolean }
) {
  const multiBundlerSettings = await resolvePortsAsync(projectRoot, options, settings);

  Log.log(chalk.gray(`Starting project at ${projectRoot}`));

  // Add clean up hooks
  installExitHooks(() => {
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
    Project.stopAsync(projectRoot)
      .then(() => {
        spinner.stopAndPersist({ text: 'Stopped server', symbol: `\u203A` });
        process.exit();
      })
      .catch((error) => {
        spinner.fail('Failed to stop server');
        Log.error(error);
      });
  });

  const { exp, pkg } = profile(getConfig)(projectRoot, {
    skipSDKVersionRequirement: settings.webOnly || options.devClient,
  });

  if (options.web || settings.webOnly) {
    await ensureWebSupportSetupAsync(projectRoot);
  }

  if (options.devClient) {
    track(projectRoot, exp);
  }

  await profile(ensureTypeScriptSetupAsync)(projectRoot);

  if (!settings.webOnly) {
    // TODO: only validate dependencies if starting in managed workflow
    await profile(validateDependenciesVersionsAsync)(projectRoot, exp, pkg);
  }

  const startOptions = profile(parseStartOptions)(
    options,
    { ...settings, ...multiBundlerSettings },
    exp
  );
  LoadingPageHandler.setOnDeepLink(
    async (projectRoot: string, isDevClient: boolean, platform: string | null) => {
      if (!isDevClient) {
        return;
      }

      const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
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
  await profile(Project.startAsync)(projectRoot, { ...startOptions, ...multiBundlerSettings, exp });

  // Send to option...
  const url: string | null = await profile(constructDeepLinkAsync)(projectRoot).catch((error) => {
    // TODO: Maybe there's a better way to do this
    if (!options.devClient || error.code !== 'NO_DEV_CLIENT_SCHEME') {
      throw error;
    }
    return null;
  });

  // Open project on devices.
  await profile(openPlatformsAsync)(projectRoot, options, settings);

  // Present the Terminal UI.
  if (!CI) {
    await profile(TerminalUI.startAsync, 'TerminalUI.startAsync')(projectRoot, startOptions);
  } else if (url) {
    Log.log();
    printQRCode(url);
    Log.log(`Your native app is running at ${chalk.underline(url)}`);
  }

  // Final note about closing the server.
  if (!settings.webOnly) {
    Log.log(`Logs for your project will appear below. ${chalk.dim(`Press Ctrl+C to exit.`)}`);
  } else {
    Log.log(
      `\nLogs for your project will appear in the browser console. ${chalk.dim(
        `Press Ctrl+C to exit.`
      )}`
    );
  }
  if (options.devClient) {
    logEvent('dev client start command', {
      status: 'ready',
      ...getDevClientProperties(projectRoot, exp),
    });
  }
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

export function parseStartOptions(
  options: Options,
  settings: { webOnly?: boolean; metroPort?: number; webpackPort?: number },
  exp: ExpoConfig
): StartOptions {
  const startOpts: StartOptions = {
    metroPort: settings.metroPort,
    webpackPort: settings.webpackPort,
    nonInteractive: CI,
    platforms: exp.platforms ?? ['ios', 'android', 'web'],
    maxWorkers: options.maxWorkers,
    // reset: options.clear,
    webOnly: settings.webOnly,
    devClient: options.devClient,
    isWebSocketsEnabled: !settings.webOnly || WebpackDevServer.isTargetingNative(),
  };

  if (!options.forceManifestType) {
    const easUpdatesUrlRegex = /^https:\/\/(staging-)?u\.expo\.dev/;
    const updatesUrl = exp.updates?.url;
    const isEasUpdatesUrl = updatesUrl && easUpdatesUrlRegex.test(updatesUrl);

    ProcessSettings.forceManifestType = isEasUpdatesUrl ? 'expo-updates' : 'classic';
  }

  return startOpts;
}
async function openPlatformsAsync(
  projectRoot: string,
  options: Pick<Options, 'devClient' | 'ios' | 'android' | 'web'>,
  settings: { webOnly?: boolean }
) {
  const results = await Promise.all([
    (async () => {
      if (options.android) {
        if (settings.webOnly) {
          return await Android.openWebProjectAsync(projectRoot);
        } else {
          return await Android.openProjectAsync(projectRoot, {
            devClient: options.devClient ?? false,
          });
        }
      }
      return null;
    })(),
    (async () => {
      if (options.ios) {
        if (settings.webOnly) {
          return await Simulator.openWebProjectAsync(projectRoot, { shouldPrompt: false });
        } else {
          return await Simulator.openProjectAsync(projectRoot, {
            devClient: options.devClient ?? false,
            shouldPrompt: false,
          });
        }
      }
      return null;
    })(),
    (async () => {
      if (options.web) {
        return await Webpack.openAsync(projectRoot);
      }
      return null;
    })(),
  ]);

  const errors = results
    .reduce<(string | Error)[]>((prev, curr) => {
      if (curr && !curr.success) {
        return prev.concat([curr.error]);
      }
      return prev;
    }, [])
    .filter(Boolean);

  if (errors.length) {
    // ctrl+c
    const isEscapedError = errors.some((error) => error === 'escaped');
    if (isEscapedError) {
      throw new AbortCommandError();
    } else {
      if (typeof errors[0] === 'string') {
        // Throw the first error
        throw new CommandError(errors[0]);
      }
      throw errors[0];
    }
  }

  return !!options.android || !!options.ios;
}
