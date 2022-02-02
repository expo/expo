import { ExpoConfig, getConfig } from '@expo/config';

import * as Log from '../log';
import { logEvent } from '../utils/analytics/rudderstackClient';
import * as AndroidDeviceBridge from './android/AndroidDeviceBridge';
import ProcessSettings from './api/ProcessSettings';
import { startDevSessionAsync, stopDevSession } from './api/startDevSession';
import * as MetroDevServer from './metro/MetroDevServer';
import * as NgrokServer from './ngrok/ngrokServer';
import { startTunnelAsync, stopTunnelAsync } from './ngrok/startTunnel';
import { watchBabelConfigForProject } from './watchBabelConfig';
import * as Webpack from './webpack/Webpack';
import * as WebpackDevServer from './webpack/WebpackDevServer';

/** Get the port for the dev server (either Webpack or Metro) that is hosting code for React Native runtimes. */
export function getNativeDevServerPort() {
  if (WebpackDevServer.isTargetingNative()) {
    return WebpackDevServer.getInstance()?.location?.port ?? null;
  }
  return MetroDevServer.getInstance()?.location?.port ?? null;
}

export async function startAsync(
  projectRoot: string,
  options: Pick<MetroDevServer.StartOptions, 'webOnly' | 'webpackPort' | 'metroPort'> = {}
): Promise<ExpoConfig> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  logEvent('Start Project', {
    developerTool: ProcessSettings.developerTool,
    sdkVersion: exp.sdkVersion ?? null,
  });

  watchBabelConfigForProject(projectRoot);

  if (options.webOnly) {
    await Webpack.startAsync(projectRoot, {
      port: options.webpackPort,
    });
  } else {
    await MetroDevServer.startAsync(projectRoot, options);
  }

  if (!ProcessSettings.isOffline && ProcessSettings.hostType === 'tunnel') {
    await startTunnelAsync(projectRoot);
  }

  const runtime = !options.webOnly || WebpackDevServer.isTargetingNative() ? 'native' : 'web';

  // This is used to make Expo Go open the project in either Expo Go, or the web browser.
  // Must come after ngrok (`startTunnelsAsync`) setup.
  startDevSessionAsync(projectRoot, { exp, runtime });

  return exp;
}

export async function stopAsync(projectRoot: string): Promise<void> {
  try {
    const result = await Promise.race([
      stopInternalAsync(projectRoot),
      new Promise((resolve) => setTimeout(resolve, 2000, 'stopFailed')),
    ]);
    if (result === 'stopFailed') {
      await forceQuitAsync();
    }
  } catch (error) {
    await forceQuitAsync();
    throw error;
  }
}

async function stopInternalAsync(projectRoot: string): Promise<void> {
  stopDevSession();

  await Promise.all([
    WebpackDevServer.stopAsync(),
    MetroDevServer.stopAsync(),
    async () => {
      if (!ProcessSettings.isOffline) {
        await stopTunnelAsync(projectRoot).catch((e) => {
          Log.error(`Error stopping ngrok: ${e.message}`);
        });
      }
    },
    await AndroidDeviceBridge.stopAdbDaemonAsync(),
  ]);
}

async function forceQuitAsync() {
  // find ngrok pid, attempt to kill manually
  NgrokServer.killNgrokInstance();
}
