import { createSymbolicateMiddleware } from '@expo/dev-server/build/webpack/symbolicateMiddleware';
import chalk from 'chalk';
import fs from 'fs';
import http from 'http';
import * as path from 'path';
import resolveFrom from 'resolve-from';
import type webpack from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';

import * as Log from '../../../log';
import { WEB_HOST } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { getIpAddress } from '../../../utils/ip';
import { choosePortAsync } from '../../../utils/port';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { UrlCreator } from '../UrlCreator';
import {
  importExpoWebpackConfigFromProject,
  importWebpackDevServerFromProject,
  importWebpackFromProject,
} from './resolveFromProject';
import { ensureEnvironmentSupportsSSLAsync } from './ssl';

type AnyCompiler = webpack.Compiler | webpack.MultiCompiler;

export type WebpackConfiguration = webpack.Configuration & {
  devServer?: { before?: Function };
};

function assertIsWebpackDevServer(value: any): asserts value is WebpackDevServer {
  if (!value?.sockWrite) {
    throw new CommandError(
      'WEBPACK',
      value
        ? 'Expected Webpack dev server, found: ' + (value.constructor?.name ?? value)
        : 'Webpack dev server not started yet.'
    );
  }
}

export class WebpackBundlerDevServer extends BundlerDevServer {
  get name(): string {
    return 'webpack';
  }

  // A custom message websocket broadcaster used to send messages to a React Native runtime.
  private customMessageSocketBroadcaster:
    | undefined
    | ((message: string, data?: Record<string, any>) => void);

  public broadcastMessage(
    method: string | 'reload' | 'devMenu' | 'sendDevCommand',
    params?: Record<string, any>
  ): void {
    if (!this.instance) {
      return;
    }

    assertIsWebpackDevServer(this.instance?.server);

    // Allow any message on native
    if (this.customMessageSocketBroadcaster) {
      this.customMessageSocketBroadcaster(method, params);
      return;
    }

    // TODO(EvanBacon): Custom Webpack overlay.
    // Default webpack-dev-server sockets use "content-changed" instead of "reload" (what we use on native).
    // For now, just manually convert the value so our CLI interface can be unified.
    const hackyConvertedMessage = method === 'reload' ? 'content-changed' : method;

    this.instance.server.sockWrite(this.instance.server.sockets, hackyConvertedMessage, params);
  }

  private async attachNativeDevServerMiddlewareToDevServer({
    server,
    middleware,
    attachToServer,
    logger,
  }: { server: http.Server } & Awaited<ReturnType<typeof this.createNativeDevServerMiddleware>>) {
    const { attachInspectorProxy, LogReporter } = await import('@expo/dev-server');

    // Hook up the React Native WebSockets to the Webpack dev server.
    const { messageSocket, debuggerProxy, eventsSocket } = attachToServer(server);

    this.customMessageSocketBroadcaster = messageSocket.broadcast;

    const logReporter = new LogReporter(logger);
    logReporter.reportEvent = eventsSocket.reportEvent;

    const { inspectorProxy } = attachInspectorProxy(this.projectRoot, {
      middleware,
      server,
    });

    return {
      messageSocket,
      eventsSocket,
      debuggerProxy,
      logReporter,
      inspectorProxy,
    };
  }

  isTargetingNative(): boolean {
    // Temporary hack while we implement multi-bundler dev server proxy.
    return ['ios', 'android'].includes(process.env.EXPO_WEBPACK_PLATFORM || '');
  }

  isTargetingWeb(): boolean {
    return true;
  }

  private async createNativeDevServerMiddleware({
    port,
    compiler,
    options,
  }: {
    port: number;
    compiler: AnyCompiler;
    options: BundlerStartOptions;
  }) {
    if (!this.isTargetingNative()) {
      return null;
    }

    const { createDevServerMiddleware } = await import('../middleware/createDevServerMiddleware');

    const nativeMiddleware = createDevServerMiddleware({
      port,
      watchFolders: [this.projectRoot],
    });
    // Add manifest middleware to the other middleware.
    // TODO: Move this in to expo/dev-server.

    const middleware = await this.getManifestMiddlewareAsync(options);

    nativeMiddleware.middleware.use(middleware).use(
      '/symbolicate',
      createSymbolicateMiddleware({
        projectRoot: this.projectRoot,
        // @ts-expect-error: type mismatch -- Webpack types aren't great.
        compiler,
        logger: nativeMiddleware.logger,
      })
    );
    return nativeMiddleware;
  }

  private async getAvailablePortAsync(options: { defaultPort?: number }): Promise<number> {
    try {
      const defaultPort = options?.defaultPort ?? 19006;
      const port = await choosePortAsync(this.projectRoot, {
        defaultPort,
        host: WEB_HOST,
      });
      if (!port) {
        throw new CommandError('NO_PORT_FOUND', `Port ${defaultPort} not available.`);
      }
      return port;
    } catch (error) {
      throw new CommandError('NO_PORT_FOUND', error.message);
    }
  }

  async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    // Do this first to fail faster.
    const webpack = importWebpackFromProject(this.projectRoot);
    const WebpackDevServer = importWebpackDevServerFromProject(this.projectRoot);

    await this.stopAsync();

    const { resetDevServer, https, mode } = options;

    const port = await this.getAvailablePortAsync({
      defaultPort: options.port,
    });

    this.urlCreator = new UrlCreator(
      {
        scheme: https ? 'https' : 'http',
        ...options.location,
      },
      {
        port,
        getTunnelUrl: this.getTunnelUrl.bind(this),
      }
    );

    Log.debug('Starting webpack on port: ' + port);

    if (resetDevServer) {
      await clearWebProjectCacheAsync(this.projectRoot, mode);
    }

    if (https) {
      Log.debug('Configuring SSL to enable HTTPS support');
      await ensureEnvironmentSupportsSSLAsync(this.projectRoot).catch((error) => {
        Log.error(`Error creating SSL certificates: ${error}`);
      });
    }

    const config = await this.loadConfigAsync(options);

    Log.log(chalk`Starting Webpack on port ${port} in {underline ${mode}} mode.`);

    // Create a webpack compiler that is configured with custom messages.
    const compiler = webpack(config);

    let nativeMiddleware: Awaited<ReturnType<typeof this.createNativeDevServerMiddleware>> | null =
      null;
    if (config.devServer?.before) {
      // Create the middleware required for interacting with a native runtime (Expo Go, or a development build).
      nativeMiddleware = await this.createNativeDevServerMiddleware({
        port,
        compiler,
        options,
      });
      // Inject the native manifest middleware.
      const originalBefore = config.devServer.before.bind(config.devServer.before);
      config.devServer.before = (app, server, compiler) => {
        originalBefore(app, server, compiler);

        if (nativeMiddleware?.middleware) {
          app.use(nativeMiddleware.middleware);
        }
      };
    }
    const { attachNativeDevServerMiddlewareToDevServer } = this;

    const server = new WebpackDevServer(
      // @ts-expect-error: type mismatch -- Webpack types aren't great.
      compiler,
      config.devServer
    );
    // Launch WebpackDevServer.
    server.listen(port, WEB_HOST, function (this: http.Server, error) {
      if (nativeMiddleware) {
        attachNativeDevServerMiddlewareToDevServer({
          server: this,
          ...nativeMiddleware,
        });
      }
      if (error) {
        Log.error(error.message);
      }
    });

    // Extend the close method to ensure that we clean up the local info.
    const originalClose = server.close.bind(server);

    server.close = (callback?: (err?: Error) => void) => {
      return originalClose((err?: Error) => {
        this.instance = null;
        callback?.(err);
      });
    };

    const _host = getIpAddress();
    const protocol = https ? 'https' : 'http';

    this.setInstance({
      // Server instance
      server,
      // URL Info
      location: {
        url: `${protocol}://${_host}:${port}`,
        port,
        protocol,
        host: _host,
      },
      middleware: nativeMiddleware?.middleware,
      // Match the native protocol.
      messageSocket: {
        broadcast: this.broadcastMessage,
      },
    });

    await this.postStartAsync(options);

    return this.instance;
  }

  /** Load the Webpack config. Exposed for testing. */
  getProjectConfigFilePath(): string | null {
    // Check if the project has a webpack.config.js in the root.
    return (
      this.getConfigModuleIds().reduce(
        (prev, moduleId) => prev || resolveFrom.silent(this.projectRoot, moduleId),
        null
      ) ?? null
    );
  }
  async loadConfigAsync(
    options: BundlerStartOptions,
    argv?: string[]
  ): Promise<WebpackConfiguration> {
    // let bar: ProgressBar | null = null;

    const env = {
      projectRoot: this.projectRoot,
      pwa: !!options.isImageEditingEnabled,
      // TODO: Use a new loader in Webpack config...
      logger: {
        info(input, jsonString) {},
      },
      mode: options.mode,
      https: options.https,
    };
    setMode(env.mode);
    // Check if the project has a webpack.config.js in the root.
    const projectWebpackConfig = this.getProjectConfigFilePath();
    let config: WebpackConfiguration;
    if (projectWebpackConfig) {
      const webpackConfig = require(projectWebpackConfig);
      if (typeof webpackConfig === 'function') {
        config = await webpackConfig(env, argv);
      } else {
        config = webpackConfig;
      }
    } else {
      // Fallback to the default expo webpack config.
      const loadDefaultConfigAsync = importExpoWebpackConfigFromProject(this.projectRoot);
      // @ts-expect-error: types appear to be broken
      config = await loadDefaultConfigAsync.default(env, argv);
    }
    return config;
  }

  protected getConfigModuleIds(): string[] {
    return ['./webpack.config.js'];
  }
}

function setMode(mode: 'development' | 'production' | 'test' | 'none'): void {
  process.env.BABEL_ENV = mode;
  process.env.NODE_ENV = mode;
}

export function getProjectWebpackConfigFilePath(projectRoot: string) {
  return resolveFrom.silent(projectRoot, './webpack.config.js');
}

async function clearWebProjectCacheAsync(
  projectRoot: string,
  mode: string = 'development'
): Promise<void> {
  Log.log(chalk.dim(`Clearing Webpack ${mode} cache directory...`));

  const dir = await ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const cacheFolder = path.join(dir, 'web/cache', mode);
  try {
    await fs.promises.rm(cacheFolder, { recursive: true, force: true });
  } catch (e) {
    Log.error(`Could not clear ${mode} web cache directory: ${e.message}`);
  }
}
