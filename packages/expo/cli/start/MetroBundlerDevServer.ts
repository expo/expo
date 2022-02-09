import { MetroDevServerOptions, prependMiddleware, runMetroDevServerAsync } from '@expo/dev-server';

import { getFreePortAsync } from '../utils/port';
import { attachLogger } from './attachLogger';
import { BundlerStartOptions, BundlerDevServer, DevServerInstance } from './BundlerDevServer';
import { getLogger } from './logger';
import * as ExpoUpdatesManifestHandler from './metro/ExpoUpdatesManifestHandler';
import * as LoadingPageHandler from './metro/LoadingPageHandler';
import * as ManifestHandler from './metro/ManifestHandler';

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 19000;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

export class MetroBundlerDevServer extends BundlerDevServer {
  async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    await this.stopAsync();

    await attachLogger(this.projectRoot);

    const useExpoUpdatesManifest = options.forceManifestType === 'expo-updates';

    const port =
      // If the manually defined port is busy then an error should be thrown...
      options.port ??
      // Otherwise use the default port based on the runtime target.
      (options.devClient
        ? // Don't check if the port is busy if we're using the dev client since most clients are hardcoded to 8081.
          Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT
        : // Otherwise (running in Expo Go) use a free port that falls back on the classic 19000 port.
          await getFreePortAsync(options.port || EXPO_GO_METRO_PORT));

    const parsedOptions: MetroDevServerOptions = {
      port,
      logger: getLogger(),
      maxWorkers: options.maxWorkers,
      resetCache: options.resetDevServer,

      // Use the unversioned metro config.
      // TODO: Deprecate this property when expo-cli goes away.
      unversioned: false,
    };

    const { server, middleware, messageSocket } = await runMetroDevServerAsync(
      this.projectRoot,
      parsedOptions
    );

    const manifestMiddleware = useExpoUpdatesManifest
      ? ExpoUpdatesManifestHandler.getManifestHandler(this.projectRoot)
      : ManifestHandler.getManifestHandler(this.projectRoot);
    // We need the manifest handler to be the first middleware to run so our
    // routes take precedence over static files. For example, the manifest is
    // served from '/' and if the user has an index.html file in their project
    // then the manifest handler will never run, the static middleware will run
    // and serve index.html instead of the manifest.
    // https://github.com/expo/expo/issues/13114
    prependMiddleware(middleware, manifestMiddleware);

    middleware.use(LoadingPageHandler.getLoadingPageHandler(this.projectRoot));

    // Extend the close method to ensure that we clean up the local info.
    const originalClose = server.close.bind(server);

    server.close = (callback?: (err?: Error) => void) => {
      return originalClose((err?: Error) => {
        this.instance = null;
        callback?.(err);
      });
    };

    this.setInstance({
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
    });

    return this.instance;
  }
}
