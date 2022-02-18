import { ExpoConfig, getConfig } from '@expo/config';
import assert from 'assert';

import * as Log from '../../log';
import { logEvent } from '../../utils/analytics/rudderstackClient';
import * as AndroidDeviceBridge from '../platforms/android/AndroidDeviceBridge';
import { BundlerDevServer, BundlerStartOptions } from './BundlerDevServer';
import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { WebpackBundlerDevServer } from './WebpackBundlerDevServer';

const devServers: BundlerDevServer[] = [];

const BUNDLERS = {
  webpack: WebpackBundlerDevServer,
  metro: MetroBundlerDevServer,
};

export type MultiBundlerStartOptions = {
  type: keyof typeof BUNDLERS;
  options?: BundlerStartOptions;
}[];

// Only store the settings in-memory.
let persistedOptions: BundlerStartOptions | null = null;

// Keep track of the original CLI options for bundlers that are started interactively.
export function setPersistedOptions(options: BundlerStartOptions) {
  persistedOptions = options;
}

/**
 * Sends a message over web sockets to any connected device,
 * does nothing when the dev server is not running.
 *
 * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
 * @param params extra event info to send over the socket.
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
  const server = devServers.find((server) => server.isTargetingNative());
  return server?.getInstance?.()?.location?.port ?? null;
}

/** Get the first server that targets web. */
export function getWebDevServer() {
  const server = devServers.find((server) => server.isTargetingWeb());
  return server ?? null;
}

export function getDefaultDevServer(): BundlerDevServer {
  // Return the first native dev server otherwise return the first dev server.
  const server = devServers.find((server) => server.isTargetingNative());
  const defaultServer = server ?? devServers[0];
  assert(defaultServer, 'No dev servers are running');
  return defaultServer;
}

export async function ensureWebDevServerRunningAsync(projectRoot: string) {
  const [server] = devServers.filter((server) => server.isTargetingWeb());
  if (server) {
    return;
  }
  Log.debug('Starting webpack dev server');
  return startDevServersAsync(projectRoot, [
    {
      type: 'webpack',
      options: persistedOptions,
    },
  ]);
}

export async function startDevServersAsync(
  projectRoot: string,
  startOptions: MultiBundlerStartOptions
): Promise<ExpoConfig> {
  const { exp } = getConfig(projectRoot);

  logEvent('Start Project', {
    sdkVersion: exp.sdkVersion ?? null,
  });

  // Start all dev servers...
  for (const { type, options } of startOptions) {
    const BundlerDevServerClass = BUNDLERS[type];
    const server = new BundlerDevServerClass(projectRoot, exp, !!options?.devClient);
    await server.startAsync(options ?? persistedOptions);
    devServers.push(server);
  }

  return exp;
}

export async function stopAsync(): Promise<void> {
  await Promise.race([
    Promise.allSettled([
      // Stop all dev servers
      ...devServers.map((server) => server.stopAsync()),
      // Stop ADB
      AndroidDeviceBridge.server.stopAdbDaemonAsync(),
    ]),
    new Promise((resolve) => setTimeout(resolve, 2000, 'stopFailed')),
  ]);
}
