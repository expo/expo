import { prependMiddleware } from '@expo/dev-server';

import { getFreePortAsync } from '../../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { UrlCreator } from '../UrlCreator';
import { InterstitialPageMiddleware } from '../middleware/InterstitialPageMiddleware';
import { RuntimeRedirectMiddleware } from '../middleware/RuntimeRedirectMiddleware';
import { instantiateMetroAsync } from './instantiateMetro';

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 19000;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

export class MetroBundlerDevServer extends BundlerDevServer {
  get name(): string {
    return 'metro';
  }

  async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    await this.stopAsync();
    const port =
      // If the manually defined port is busy then an error should be thrown...
      options.port ??
      // Otherwise use the default port based on the runtime target.
      (options.devClient
        ? // Don't check if the port is busy if we're using the dev client since most clients are hardcoded to 8081.
          Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT
        : // Otherwise (running in Expo Go) use a free port that falls back on the classic 19000 port.
          await getFreePortAsync(options.port || EXPO_GO_METRO_PORT));

    this.urlCreator = new UrlCreator(options.location, {
      port,
      getTunnelUrl: this.getTunnelUrl.bind(this),
    });

    const parsedOptions = {
      port,
      maxWorkers: options.maxWorkers,
      resetCache: options.resetDevServer,

      // Use the unversioned metro config.
      // TODO: Deprecate this property when expo-cli goes away.
      unversioned: false,
    };

    const { server, middleware, messageSocket } = await instantiateMetroAsync(
      this.projectRoot,
      parsedOptions
    );

    const manifestMiddleware = this._getManifestMiddleware(options);

    // We need the manifest handler to be the first middleware to run so our
    // routes take precedence over static files. For example, the manifest is
    // served from '/' and if the user has an index.html file in their project
    // then the manifest handler will never run, the static middleware will run
    // and serve index.html instead of the manifest.
    // https://github.com/expo/expo/issues/13114
    prependMiddleware(middleware, manifestMiddleware);

    middleware.use(new InterstitialPageMiddleware(this.projectRoot).getHandler());

    const deepLinkMiddleware = new RuntimeRedirectMiddleware(this.projectRoot, {
      onDeepLink: ({ runtime }) => {
        if (runtime === 'expo') return;
        // TODO: Some heavy analytics...
      },
      getLocation({ runtime }) {
        if (runtime === 'custom') {
          return this.urlCreator.constructDevClientUrl({
            hostType: 'localhost',
          });
        } else {
          return this.urlCreator.constructUrl({
            scheme: 'exp',
            hostname: 'localhost',
          });
        }
      },
    });
    middleware.use(deepLinkMiddleware.getHandler());

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

    await this.postStartAsync(options);

    return this.instance;
  }

  protected getConfigModuleIds(): string[] {
    return ['./metro.config.js', './metro.config.json', './rn-cli.config.js'];
  }
}
