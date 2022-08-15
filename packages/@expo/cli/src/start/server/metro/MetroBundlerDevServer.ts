import { prependMiddleware } from '@expo/dev-server';
import chalk from 'chalk';
import fs from 'fs';

import { Log } from '../../../log';
import { getFreePortAsync } from '../../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { HistoryFallbackMiddleware } from '../middleware/HistoryFallbackMiddleware';
import { InterstitialPageMiddleware } from '../middleware/InterstitialPageMiddleware';
import { RuntimeRedirectMiddleware } from '../middleware/RuntimeRedirectMiddleware';
import { ServeStaticMiddleware } from '../middleware/ServeStaticMiddleware';
import { ensureEnvironmentSupportsTLSAsync } from '../webpack/tls';
import { instantiateMetroAsync } from './instantiateMetro';

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 19000;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

const debug = require('debug')('expo:start:server:metro:devServer') as typeof console.log;

export class MetroBundlerDevServer extends BundlerDevServer {
  get name(): string {
    return 'metro';
  }

  async resolvePortAsync(options: Partial<BundlerStartOptions> = {}): Promise<number> {
    const port =
      // If the manually defined port is busy then an error should be thrown...
      options.port ??
      // Otherwise use the default port based on the runtime target.
      (options.devClient
        ? // Don't check if the port is busy if we're using the dev client since most clients are hardcoded to 8081.
          Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT
        : // Otherwise (running in Expo Go) use a free port that falls back on the classic 19000 port.
          await getFreePortAsync(EXPO_GO_METRO_PORT));

    return port;
  }

  protected async startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance> {
    options.port = await this.resolvePortAsync(options);
    this.urlCreator = this.getUrlCreator({
      ...options,
      location: {
        scheme: options.https ? 'https' : 'http',
      },
    });

    const parsedOptions: Parameters<typeof instantiateMetroAsync>[1] = {
      port: options.port,
      maxWorkers: options.maxWorkers,
      resetCache: options.resetDevServer,

      // Use the unversioned metro config.
      // TODO: Deprecate this property when expo-cli goes away.
      unversioned: false,
    };

    if (options.https) {
      const hostname = new URL(this.urlCreator.constructUrl()).hostname;
      debug('Configuring TLS to enable HTTPS support:', hostname);

      const tlsConfig = await ensureEnvironmentSupportsTLSAsync(this.projectRoot, {
        name: hostname,
      }).catch((error) => {
        Log.error(chalk.red`Error creating TLS certificates: ${error}`);
      });
      if (tlsConfig) {
        debug('Using secure server options', tlsConfig);
        parsedOptions.secureServerOptions = {
          key: await fs.promises.readFile(tlsConfig.keyPath),
          cert: await fs.promises.readFile(tlsConfig.certPath),
        };
      }
    }

    const { server, middleware, messageSocket } = await instantiateMetroAsync(
      this.projectRoot,
      parsedOptions
    );

    const manifestMiddleware = await this.getManifestMiddlewareAsync(options);

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
        // eslint-disable-next-line no-useless-return
        if (runtime === 'expo') return;
        // TODO: Some heavy analytics...
      },
      getLocation: ({ runtime }) => {
        if (runtime === 'custom') {
          return this.urlCreator?.constructDevClientUrl();
        } else {
          return this.urlCreator?.constructUrl({
            scheme: options.https ? 'exps' : 'exp',
          });
        }
      },
    });
    middleware.use(deepLinkMiddleware.getHandler());

    // Append support for redirecting unhandled requests to the index.html page on web.
    if (this.isTargetingWeb()) {
      // This MUST be after the manifest middleware so it doesn't have a chance to serve the template `public/index.html`.
      middleware.use(new ServeStaticMiddleware(this.projectRoot).getHandler());

      // This MUST run last since it's the fallback.
      middleware.use(new HistoryFallbackMiddleware(manifestMiddleware.internal).getHandler());
    }
    // Extend the close method to ensure that we clean up the local info.
    const originalClose = server.close.bind(server);

    server.close = (callback?: (err?: Error) => void) => {
      return originalClose((err?: Error) => {
        this.instance = null;
        callback?.(err);
      });
    };

    const protocol = options.https ? 'https' : 'http';

    return {
      server,
      location: {
        // The port is the main thing we want to send back.
        port: options.port,
        // localhost isn't always correct.
        host: 'localhost',
        // http is the only supported protocol on native.
        url: `${protocol}://localhost:${options.port}`,
        protocol,
      },
      middleware,
      messageSocket,
    };
  }

  protected getConfigModuleIds(): string[] {
    return ['./metro.config.js', './metro.config.json', './rn-cli.config.js'];
  }
}
