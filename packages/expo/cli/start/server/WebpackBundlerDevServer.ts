import { createSymbolicateMiddleware } from '@expo/dev-server/build/webpack/symbolicateMiddleware';
import chalk from 'chalk';
import getenv from 'getenv';
import http from 'http';
import * as path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import * as Log from '../../log';
import { fileExistsAsync } from '../../utils/dir';
import { WEB_HOST, WEB_PORT } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { getIpAddress } from '../../utils/ip';
import { choosePortAsync } from '../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from './BundlerDevServer';
import { UrlCreator } from './UrlCreator';
import { ensureEnvironmentSupportsSSLAsync } from './webpack/ssl';
import { clearWebProjectCacheAsync } from './webpack/WebProjectCache';

export type WebpackConfiguration = webpack.Configuration;

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
    if (!this.instance?.server || !(this.instance?.server instanceof WebpackDevServer)) {
      return;
    }

    // Allow any message on native
    if (this.customMessageSocketBroadcaster) {
      this.customMessageSocketBroadcaster(method, params);
      return;
    }

    if (method !== 'reload') {
      // TODO:
      // Webpack currently only supports reloading the client (browser),
      // remove this when we have custom sockets, and native support.
      return;
    }

    // TODO:
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
    compiler: webpack.Compiler;
    options: BundlerStartOptions;
  }) {
    if (!this.isTargetingNative()) {
      return null;
    }

    const { createDevServerMiddleware } = await import('./middleware/createDevServerMiddleware');

    const nativeMiddleware = createDevServerMiddleware({
      port,
      watchFolders: [this.projectRoot],
    });
    // Add manifest middleware to the other middleware.
    // TODO: Move this in to expo/dev-server.

    const middleware = this.getManifestMiddleware(options);

    nativeMiddleware.middleware.use(middleware).use(
      '/symbolicate',
      createSymbolicateMiddleware({
        projectRoot: this.projectRoot,
        compiler,
        logger: nativeMiddleware.logger,
      })
    );
    return nativeMiddleware;
  }

  private async getAvailablePortAsync(options: { defaultPort?: number }): Promise<number> {
    try {
      const defaultPort = options?.defaultPort ?? WEB_PORT;
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
    await this.stopAsync();

    const { resetDevServer, https, mode } = options;

    const port = await this.getAvailablePortAsync({
      defaultPort: options.port,
    });

    this.urlCreator = new UrlCreator(options.location, {
      port,
      getTunnelUrl: this.getTunnelUrl.bind(this),
    });

    Log.debug('Starting webpack on port: ' + port);

    if (resetDevServer) {
      Log.log(chalk.dim(`Clearing ${mode} cache directory...`));
      await clearWebProjectCacheAsync(this.projectRoot, mode);
    }

    if (https) {
      Log.debug('Configuring SSL to enable HTTPS support');
      await ensureEnvironmentSupportsSSLAsync(this.projectRoot);
    }

    const config = await loadConfigAsync(this.projectRoot, options);

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

    const server = new WebpackDevServer(compiler, config.devServer);
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

  protected getConfigModuleIds(): string[] {
    return ['./webpack.config.js'];
  }
}

function setMode(mode: 'development' | 'production' | 'test' | 'none'): void {
  process.env.BABEL_ENV = mode;
  process.env.NODE_ENV = mode;
}

function applyEnvironmentVariables(config: WebpackConfiguration): WebpackConfiguration {
  // Use EXPO_DEBUG_WEB=true to enable debugging features for cases where the prod build
  // has errors that aren't caught in development mode.
  // Related: https://github.com/expo/expo-cli/issues/614
  if (isDebugModeEnabled() && config.mode === 'production') {
    Log.log(chalk.bgYellow.black('Bundling the project in debug mode.'));

    const output = config.output || {};
    const optimization = config.optimization || {};

    // Enable line to line mapped mode for all/specified modules.
    // Line to line mapped mode uses a simple SourceMap where each line of the generated source is mapped to the same line of the original source.
    // It’s a performance optimization. Only use it if your performance need to be better and you are sure that input lines match which generated lines.
    // true enables it for all modules (not recommended)
    output.devtoolLineToLine = true;

    // Add comments that describe the file import/exports.
    // This will make it easier to debug.
    output.pathinfo = true;
    // Instead of numeric ids, give modules readable names for better debugging.
    optimization.namedModules = true;
    // Instead of numeric ids, give chunks readable names for better debugging.
    optimization.namedChunks = true;
    // Readable ids for better debugging.
    // @ts-ignore Property 'moduleIds' does not exist.
    optimization.moduleIds = 'named';
    // if optimization.namedChunks is enabled optimization.chunkIds is set to 'named'.
    // This will manually enable it just to be safe.
    // @ts-ignore Property 'chunkIds' does not exist.
    optimization.chunkIds = 'named';

    if (optimization.splitChunks) {
      optimization.splitChunks.name = true;
    }

    Object.assign(config, { output, optimization });
  }

  return config;
}

async function loadConfigAsync(
  projectRoot: string,
  options: BundlerStartOptions,
  argv?: string[]
): Promise<WebpackConfiguration> {
  // let bar: ProgressBar | null = null;

  const env = {
    projectRoot,
    pwa: !!options.isImageEditingEnabled,
    // TODO: Use a new loader in Webpack config...
    logger: {
      info(input, jsonString) {
        // const {
        //   tag,
        // id,
        // shouldHide,
        // type,
        // ...props
        // } = JSON.parse(jsonString)
        // if (type === 'bundling_error') {
        //   Log.error(props.error)
        // } else if (type === 'bundling_warning') {
        //   Log.warn(props.error)
        // } else if (type === 'bundle_build_started') {
        //   bar = new ProgressBar(`${chalk.bold(props?.bundleDetails?.platform)} Bundling JavaScript [:bar] :percent`, {
        //     width: 64,
        //     total: 100,
        //     clear: true,
        //     complete: '=',
        //     incomplete: ' ',
        //   });
        // } else if (type === 'bundle_transform_progressed') {
        //   const percentProgress = props.percentage * 100;
        //   // const roundedPercentProgress = Math.floor(100 * percentProgress) / 100;
        //   if (this.bar && !this.bar.complete) {
        //     const ticks = percentProgress - this.bar.curr;
        //     if (ticks > 0) {
        //       this.bar.tick(ticks);
        //     }
        //   }
        // } else if (type === 'bundle_build_done') {
        // }
      },
    },
    mode: options.mode,
    https: options.https,
  };
  setMode(env.mode);
  // Check if the project has a webpack.config.js in the root.
  const projectWebpackConfig = path.resolve(env.projectRoot, 'webpack.config.js');
  let config: WebpackConfiguration;
  if (await fileExistsAsync(projectWebpackConfig)) {
    const webpackConfig = require(projectWebpackConfig);
    if (typeof webpackConfig === 'function') {
      config = await webpackConfig(env, argv);
    } else {
      config = webpackConfig;
    }
  } else {
    // Fallback to the default expo webpack config.
    const loadDefaultConfigAsync = require('@expo/webpack-config');
    config = await loadDefaultConfigAsync(env, argv);
  }
  return applyEnvironmentVariables(config);
}

// When you have errors in the production build that aren't present in the development build you can use `EXPO_WEB_DEBUG=true expo start --no-dev` to debug those errors.
// - Prevent the production build from being minified
// - Include file path info comments in the bundle
function isDebugModeEnabled(): boolean {
  return getenv.boolish('EXPO_WEB_DEBUG', false);
}
