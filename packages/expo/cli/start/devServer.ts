import { ExpoConfig, getConfig } from '@expo/config';

import * as Log from '../log';
import { logEvent } from '../utils/analytics/rudderstackClient';
import ProcessSettings from './api/ProcessSettings';
import { startDevSessionAsync, stopDevSession } from './api/startDevSession';
import { BundlerDevServer, BundlerStartOptions } from './BundlerDevServer';
import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import * as NgrokServer from './ngrok/ngrokServer';
import { startTunnelAsync, stopTunnelAsync } from './ngrok/startTunnel';
import * as AndroidDeviceBridge from './platforms/android/AndroidDeviceBridge';
import { WebpackBundlerDevServer } from './WebpackBundlerDevServer';

const devServers: BundlerDevServer[] = [];

/**
 * Sends a message over web sockets to any connected device,
 * does nothing when the dev server is not running.
 *
 * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
 * @param params
 */
export function broadcastMessage(
  method: 'reload' | 'devMenu' | 'sendDevCommand',
  params?: Record<string, any>
) {
  devServers.forEach((server) => {
    server.broadcastMessage(method, params);
  });
}

/** Get the port for the dev server (either Webpack or Metro) that is hosting code for React Native runtimes. */
export function getNativeDevServerPort() {
  const [server] = devServers.filter((server) => server.isTargetingNative());
  return server?.getInstance?.()?.location?.port ?? null;
}

const BUNDLERS = {
  webpack: WebpackBundlerDevServer,
  metro: MetroBundlerDevServer,
};

export type MultiBundlerStartOptions = {
  type: keyof typeof BUNDLERS;
  options?: BundlerStartOptions;
}[];

export async function startDevServersAsync(
  projectRoot: string,
  startOptions: MultiBundlerStartOptions
): Promise<ExpoConfig> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  logEvent('Start Project', {
    developerTool: ProcessSettings.developerTool,
    sdkVersion: exp.sdkVersion ?? null,
  });

  await startBundlerDevServersAsync(projectRoot, startOptions);

  if (!ProcessSettings.isOffline && ProcessSettings.hostType === 'tunnel') {
    await startTunnelAsync(projectRoot);
  }

  // If any dev server is hosting native then we should display the native button.
  const runtime = getNativeDevServerPort() ? 'native' : 'web';

  // This is used to make Expo Go open the project in either Expo Go, or the web browser.
  // Must come after ngrok (`startTunnelsAsync`) setup.
  startDevSessionAsync(projectRoot, { exp, runtime });

  return exp;
}

async function startBundlerDevServersAsync(
  projectRoot: string,
  startOptions: MultiBundlerStartOptions
) {
  const devServers: BundlerDevServer[] = [];

  for (const { type, options } of startOptions) {
    const BundlerDevServerClass = BUNDLERS[type];
    const server = new BundlerDevServerClass(projectRoot);
    await server.startAsync(options);
    devServers.push(server);
  }

  return devServers;
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
    ...devServers.map((server) => server.stopAsync()),
    async () => {
      if (!ProcessSettings.isOffline) {
        await stopTunnelAsync(projectRoot).catch((e) => {
          Log.error(`Error stopping ngrok: ${e.message}`);
        });
      }
    },
    AndroidDeviceBridge.stopAdbDaemonAsync(),
  ]);
}

async function forceQuitAsync() {
  // find ngrok pid, attempt to kill manually
  NgrokServer.killNgrokInstance();
}
