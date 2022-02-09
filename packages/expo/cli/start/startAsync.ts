import { ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';

import * as Log from '../log';
import getDevClientProperties from '../utils/analytics/getDevClientProperties';
import { logEvent } from '../utils/analytics/rudderstackClient';
import StatusEventEmitter from '../utils/analytics/StatusEventEmitter';
import { CI } from '../utils/env';
import { installExitHooks } from '../utils/exit';
import { getAllSpinners, ora } from '../utils/ora';
import { profile } from '../utils/profile';
import { getProgressBar, setProgressBar } from '../utils/progress';
import ProcessSettings from './api/ProcessSettings';
import * as Project from './devServer';
import { validateDependenciesVersionsAsync } from './doctor/dependencies/validateDependenciesVersions';
import { ensureTypeScriptSetupAsync } from './doctor/typescript/ensureTypeScriptSetup';
import { ensureWebSupportSetupAsync } from './doctor/web/ensureWebSetup';
import { printQRCode } from './interface/qr';
import { startInterfaceAsync } from './interface/TerminalUI';
import * as LoadingPageHandler from './metro/LoadingPageHandler';
import { openPlatformsAsync } from './platforms/openPlatformsAsync';
import { Options, resolvePortsAsync } from './resolveOptions';
import { constructDeepLink } from './serverUrl';
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

  // TODO: Move into resolveOptions
  if (!options.forceManifestType) {
    const easUpdatesUrlRegex = /^https:\/\/(staging-)?u\.expo\.dev/;
    const updatesUrl = exp.updates?.url;
    const isEasUpdatesUrl = updatesUrl && easUpdatesUrlRegex.test(updatesUrl);
    ProcessSettings.forceManifestType = isEasUpdatesUrl ? 'expo-updates' : 'classic';
  }

  // Validations

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

  // More Dev Client

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

  await profile(Project.startDevServersAsync)(projectRoot, {
    webOnly: settings.webOnly,
    ...multiBundlerSettings,
  });

  // Send to option...
  let url: string | null = null;

  try {
    url = constructDeepLink();
  } catch (error) {
    // TODO: Maybe there's a better way to do this
    if (!options.devClient || error.code !== 'NO_DEV_CLIENT_SCHEME') {
      throw error;
    }
    url = null;
  }

  // Open project on devices.
  await profile(openPlatformsAsync)(projectRoot, options, settings);

  // Present the Terminal UI.
  if (!CI) {
    await profile(startInterfaceAsync, 'TerminalUI.startAsync')(projectRoot, {
      platforms: exp.platforms ?? ['ios', 'android', 'web'],
      webOnly: settings.webOnly,
      isWebSocketsEnabled: !settings.webOnly || WebpackDevServer.isTargetingNative(),
    });
  } else if (url) {
    Log.log();
    printQRCode(url);
    Log.log(`Your native app is running at ${chalk.underline(url)}`);
  }

  // Final note about closing the server.
  Log.log(
    settings.webOnly
      ? chalk`Logs for your project will appear in the browser console. {dim Press Ctrl+C to exit.}`
      : chalk`Logs for your project will appear below. {dim Press Ctrl+C to exit.}`
  );

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
