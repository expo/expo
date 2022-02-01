import { ExpoConfig, ProjectTarget } from '@expo/config';
import {
  MessageSocket,
  MetroDevServerOptions,
  prependMiddleware,
  runMetroDevServerAsync,
} from '@expo/dev-server';
import http from 'http';

import { getFreePortAsync } from '../../utils/port';
import ProcessSettings from '../api/ProcessSettings';
import { attachLogger } from '../attachLogger';
import { getLogger } from '../logger';
import * as ExpoUpdatesManifestHandler from './ExpoUpdatesManifestHandler';
import * as LoadingPageHandler from './LoadingPageHandler';
import * as ManifestHandler from './ManifestHandler';

export type StartOptions = {
  metroPort?: number;
  webpackPort?: number;
  isWebSocketsEnabled?: boolean;
  devClient?: boolean;
  nonInteractive?: boolean;
  nonPersistent?: boolean;
  maxWorkers?: number;
  webOnly?: boolean;
  target?: ProjectTarget;
  platforms?: ExpoConfig['platforms'];
};

/**
 * Sends a message over web sockets to any connected device,
 * does nothing when the dev server is not running.
 *
 * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
 * @param params
 */
export function broadcastMessage(
  method: 'reload' | 'devMenu' | 'sendDevCommand',
  params?: Record<string, any> | undefined
) {
  if (metroDevServerInstance?.messageSocket) {
    metroDevServerInstance.messageSocket.broadcast(method, params);
  }
}

async function resolvePortAsync(
  startOptions: Pick<StartOptions, 'metroPort' | 'devClient'>
): Promise<number> {
  if (startOptions.metroPort != null) {
    // If the manually defined port is busy then an error should be thrown
    return startOptions.metroPort;
  } else {
    return startOptions.devClient
      ? Number(process.env.RCT_METRO_PORT) || 8081
      : await getFreePortAsync(startOptions.metroPort || 19000);
  }
}
export function getInstance() {
  return metroDevServerInstance;
}

export async function startAsync(
  projectRoot: string,
  startOptions: Pick<StartOptions, 'metroPort' | 'devClient' | 'maxWorkers'>
): Promise<{
  server: http.Server;
  middleware: any;
  location: {
    url: string;
    port: number;
    protocol: 'http' | 'https';
    host?: string;
  };
  messageSocket: MessageSocket;
}> {
  await attachLogger(projectRoot);

  const port = await resolvePortAsync(startOptions);

  const options: MetroDevServerOptions = {
    port,
    logger: getLogger(projectRoot),
    maxWorkers: startOptions.maxWorkers,
    resetCache: ProcessSettings.resetDevServer,
    // Use the unversioned metro config.
    // TODO: Deprecate this property when expo-cli goes away.
    unversioned: false,
  };

  const { server, middleware, messageSocket } = await runMetroDevServerAsync(projectRoot, options);

  const useExpoUpdatesManifest = ProcessSettings.forceManifestType === 'expo-updates';

  const manifestMiddleware = useExpoUpdatesManifest
    ? ExpoUpdatesManifestHandler.getManifestHandler(projectRoot)
    : ManifestHandler.getManifestHandler(projectRoot);
  // We need the manifest handler to be the first middleware to run so our
  // routes take precedence over static files. For example, the manifest is
  // served from '/' and if the user has an index.html file in their project
  // then the manifest handler will never run, the static middleware will run
  // and serve index.html instead of the manifest.
  // https://github.com/expo/expo/issues/13114
  prependMiddleware(middleware, manifestMiddleware);

  middleware.use(LoadingPageHandler.getLoadingPageHandler(projectRoot));

  metroDevServerInstance = {
    server,
    location: {
      // The port is the main thing we want to send back.
      port,
      // localhost isn't always correct.
      host: 'localhost',
      // http is the only supported protocol on native.
      url: `http://localhost:${port}`,
      protocol: 'http',
    },
    middleware,
    messageSocket,
  };
  return metroDevServerInstance;
}

let metroDevServerInstance: {
  server: http.Server;
  location: {
    url: string;
    port: number;
    protocol: 'http' | 'https';
    host?: string;
  };
  middleware: any;
  messageSocket: MessageSocket;
} | null = null;

export async function stopAsync() {
  return new Promise<void>((resolve, reject) => {
    if (metroDevServerInstance?.server) {
      metroDevServerInstance.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}
