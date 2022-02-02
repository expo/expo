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

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 19000;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

type DevServerInstance = {
  /** Metro dev server instance. */
  server: http.Server;
  /** Dev server URL location properties. */
  location: {
    url: string;
    port: number;
    protocol: 'http' | 'https';
    host?: string;
  };
  /** Additional middleware that's attached to the `server`. */
  middleware: any;
  /** Message socket for communicating with the native runtime. */
  messageSocket: MessageSocket;
};

let instance: DevServerInstance | null = null;

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
  instance?.messageSocket?.broadcast?.(method, params);
}

/** Get the running dev server instance. */
export function getInstance() {
  return instance;
}

/** Start the Metro dev server using settings defined in the start command. */
export async function startAsync(
  projectRoot: string,
  startOptions: Pick<StartOptions, 'metroPort'>
): Promise<DevServerInstance> {
  await attachLogger(projectRoot);

  const useExpoUpdatesManifest = ProcessSettings.forceManifestType === 'expo-updates';

  const port =
    // If the manually defined port is busy then an error should be thrown...
    startOptions.metroPort ??
    // Otherwise use the default port based on the runtime target.
    (ProcessSettings.devClient
      ? // Don't check if the port is busy if we're using the dev client since most clients are hardcoded to 8081.
        Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT
      : // Otherwise (running in Expo Go) use a free port that falls back on the classic 19000 port.
        await getFreePortAsync(startOptions.metroPort || EXPO_GO_METRO_PORT));

  const options: MetroDevServerOptions = {
    port,
    logger: getLogger(),
    maxWorkers: ProcessSettings.maxMetroWorkers,
    resetCache: ProcessSettings.resetDevServer,
    // Use the unversioned metro config.
    // TODO: Deprecate this property when expo-cli goes away.
    unversioned: false,
  };

  const { server, middleware, messageSocket } = await runMetroDevServerAsync(projectRoot, options);

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

  instance = {
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
  return instance;
}

/** Stop the running dev server instance. */
export async function stopAsync() {
  return new Promise<void>((resolve, reject) => {
    if (instance?.server) {
      instance.server.close((error) => {
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
