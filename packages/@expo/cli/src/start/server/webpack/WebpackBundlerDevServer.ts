import chalk from 'chalk';
import type { Application } from 'express';
import fs from 'fs';
import http from 'http';
import * as path from 'path';
import resolveFrom from 'resolve-from';
import type webpack from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { getIpAddress } from '../../../utils/ip';
import { setNodeEnv } from '../../../utils/nodeEnv';
import { choosePortAsync } from '../../../utils/port';
import { createProgressBar } from '../../../utils/progress';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { compileAsync } from './compile';
import {
  importExpoWebpackConfigFromProject,
  importWebpackDevServerFromProject,
  importWebpackFromProject,
} from './resolveFromProject';
import { ensureEnvironmentSupportsTLSAsync } from './tls';

const debug = require('debug')('expo:start:server:webpack:devServer') as typeof console.log;

export type WebpackConfiguration = webpack.Configuration & {
  devServer?: {
    before?: (app: Application, server: WebpackDevServer, compiler: webpack.Compiler) => void;
  };
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

  private async createNativeDevServerMiddleware({
    port,
    options,
  }: {
    port: number;
    options: BundlerStartOptions;
  }) {
    if (!this.isTargetingNative()) {
      return null;
    }

    const { createDevServerMiddleware } = await import('../middleware/createDevServerMiddleware');

    const nativeMiddleware = createDevServerMiddleware(this.projectRoot, {
      port,
      watchFolders: [this.projectRoot],
    });
    // Add manifest middleware to the other middleware.
    // TODO: Move this in to expo/dev-server.

    const middleware = await this.getManifestMiddlewareAsync(options);

    nativeMiddleware.middleware.use(middleware.getHandler());

    return nativeMiddleware;
  }

  private async getAvailablePortAsync(options: { defaultPort?: number }): Promise<number> {
    try {
      const defaultPort = options?.defaultPort ?? 19006;
      const port = await choosePortAsync(this.projectRoot, {
        defaultPort,
        host: env.WEB_HOST,
      });
      if (!port) {
        throw new CommandError('NO_PORT_FOUND', `Port ${defaultPort} not available.`);
      }
      return port;
    } catch (error: any) {
      throw new CommandError('NO_PORT_FOUND', error.message);
    }
  }

  async bundleAsync({ mode, clear }: { mode: 'development' | 'production'; clear: boolean }) {
    // Do this first to fail faster.
    const webpack = importWebpackFromProject(this.projectRoot);

    if (clear) {
      await this.clearWebProjectCacheAsync(this.projectRoot, mode);
    }

    const config = await this.loadConfigAsync({
      isImageEditingEnabled: true,
      mode,
    });

    if (!config.plugins) {
      config.plugins = [];
    }

    const bar = createProgressBar(chalk`{bold Web} Bundling Javascript [:bar] :percent`, {
      width: 64,
      total: 100,
      clear: true,
      complete: '=',
      incomplete: ' ',
    });

    // NOTE(EvanBacon): Add a progress bar to the webpack logger if defined (e.g. not in CI).
    if (bar != null) {
      config.plugins.push(
        new webpack.ProgressPlugin((percent: number) => {
          bar?.update(percent);
          if (percent === 1) {
            bar?.terminate();
          }
        })
      );
    }

    // Create a webpack compiler that is configured with custom messages.
    const compiler = webpack(config);

    try {
      await compileAsync(compiler);
    } catch (error: any) {
      Log.error(chalk.red('Failed to compile'));
      throw error;
    } finally {
      bar?.terminate();
    }
  }

  protected async startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance> {
    // Do this first to fail faster.
    const webpack = importWebpackFromProject(this.projectRoot);
    const WebpackDevServer = importWebpackDevServerFromProject(this.projectRoot);

    await this.stopAsync();

    options.port = await this.getAvailablePortAsync({
      defaultPort: options.port,
    });
    const { resetDevServer, https, port, mode } = options;

    this.urlCreator = this.getUrlCreator({
      port,
      location: {
        scheme: https ? 'https' : 'http',
      },
    });

    debug('Starting webpack on port: ' + port);

    if (resetDevServer) {
      await this.clearWebProjectCacheAsync(this.projectRoot, mode);
    }

    if (https) {
      debug('Configuring TLS to enable HTTPS support');
      await ensureEnvironmentSupportsTLSAsync(this.projectRoot).catch((error) => {
        Log.error(`Error creating TLS certificates: ${error}`);
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
        options,
      });
      // Inject the native manifest middleware.
      const originalBefore = config.devServer.before.bind(config.devServer.before);
      config.devServer.before = (
        app: Application,
        server: WebpackDevServer,
        compiler: webpack.Compiler
      ) => {
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
    server.listen(port, env.WEB_HOST, function (this: http.Server, error) {
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

    return {
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
    };
  }

  /** Load the Webpack config. Exposed for testing. */
  getProjectConfigFilePath(): string | null {
    // Check if the project has a webpack.config.js in the root.
    return (
      this.getConfigModuleIds().reduce<string | null | undefined>(
        (prev, moduleId) => prev || resolveFrom.silent(this.projectRoot, moduleId),
        null
      ) ?? null
    );
  }

  async loadConfigAsync(
    options: Pick<BundlerStartOptions, 'mode' | 'isImageEditingEnabled' | 'https'>,
    argv?: string[]
  ): Promise<WebpackConfiguration> {
    // let bar: ProgressBar | null = null;

    const env = {
      projectRoot: this.projectRoot,
      pwa: !!options.isImageEditingEnabled,
      // TODO: Use a new loader in Webpack config...
      logger: {
        info() {},
      },
      mode: options.mode,
      https: options.https,
    };
    setNodeEnv(env.mode ?? 'development');
    require('@expo/env').load(env.projectRoot);
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
      config = await loadDefaultConfigAsync(env, argv);
    }
    return config;
  }

  protected getConfigModuleIds(): string[] {
    return ['./webpack.config.js'];
  }

  protected async clearWebProjectCacheAsync(
    projectRoot: string,
    mode: string = 'development'
  ): Promise<void> {
    Log.log(chalk.dim(`Clearing Webpack ${mode} cache directory...`));

    const dir = await ensureDotExpoProjectDirectoryInitialized(projectRoot);
    const cacheFolder = path.join(dir, 'web/cache', mode);
    try {
      await fs.promises.rm(cacheFolder, { recursive: true, force: true });
    } catch (error: any) {
      Log.error(`Could not clear ${mode} web cache directory: ${error.message}`);
    }
  }
}

export function getProjectWebpackConfigFilePath(projectRoot: string) {
  return resolveFrom.silent(projectRoot, './webpack.config.js');
}
