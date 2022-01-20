import {
  attachInspectorProxy,
  createDevServerMiddleware,
  LogReporter,
  MessageSocket,
} from '@expo/dev-server';
import { createSymbolicateMiddleware } from '@expo/dev-server/build/webpack/symbolicateMiddleware';
import * as devcert from '@expo/devcert';
import openBrowserAsync from 'better-opn';
import chalk from 'chalk';
import fs from 'fs-extra';
import getenv from 'getenv';
import http from 'http';
import * as path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import * as Log from '../../log';
import { getIpAddressAsync } from '../../utils/ip';

import type BunyanLog from '@expo/bunyan';
import { constructWebAppUrlAsync } from '../serverUrl';
import { CommandError } from '../../utils/errors';
import { CI } from '../../utils/env';

import * as ProjectSettings from '../api/ProjectSettings';
import * as ExpoUpdatesManifestHandler from '../metro/ExpoUpdatesManifestHandler';
import * as ManifestHandler from '../metro/ManifestHandler';
import { choosePortAsync } from '../../utils/port';
import { formatWebpackMessages } from './formatWebpackMessages';
import { getLogger } from '../logger';
type DevServer = WebpackDevServer | http.Server;

let webpackDevServerInstance: DevServer | null = null;
let webpackServerPort: number | null = null;

interface WebpackSettings {
  url: string;
  server: DevServer;
  port: number;
  protocol: 'http' | 'https';
  host?: string;
}

type CLIWebOptions = {
  dev?: boolean;
  clear?: boolean;
  pwa?: boolean;
  nonInteractive?: boolean;
  port?: number;
  onWebpackFinished?: (error?: Error) => void;
  forceManifestType?: 'classic' | 'expo-updates';
};

type BundlingOptions = {
  dev?: boolean;
  clear?: boolean;
  port?: number;
  pwa?: boolean;
  isImageEditingEnabled?: boolean;
  webpackEnv?: object;
  mode?: 'development' | 'production' | 'test' | 'none';
  https?: boolean;
  nonInteractive?: boolean;
  onWebpackFinished?: (error?: Error) => void;
};

type WebpackConfiguration = webpack.Configuration;

export type WebEnvironment = {
  projectRoot: string;
  isImageEditingEnabled: boolean;
  // deprecated
  pwa: boolean;
  mode: 'development' | 'production' | 'test' | 'none';
  https: boolean;
  logger: BunyanLog;
};

// A custom message websocket broadcaster used to send messages to a React Native runtime.
let customMessageSocketBroadcaster:
  | undefined
  | ((message: string, data?: Record<string, any>) => void);

async function clearWebCacheAsync(projectRoot: string, mode: string): Promise<void> {
  const cacheFolder = path.join(projectRoot, '.expo', 'web', 'cache', mode);
  Log.log(chalk.dim(`Clearing ${mode} cache directory...`));
  try {
    await fs.remove(cacheFolder);
  } catch {}
}

// Temporary hack while we implement multi-bundler dev server proxy.
const _isTargetingNative: boolean = ['ios', 'android'].includes(
  process.env.EXPO_WEBPACK_PLATFORM || ''
);

export function isTargetingNative() {
  return _isTargetingNative;
}

export type WebpackDevServerResults = {
  server: DevServer;
  location: Omit<WebpackSettings, 'server'>;
  messageSocket: MessageSocket;
};

export async function broadcastMessage(message: 'reload' | string, data?: any) {
  if (!webpackDevServerInstance || !(webpackDevServerInstance instanceof WebpackDevServer)) {
    return;
  }

  // Allow any message on native
  if (customMessageSocketBroadcaster) {
    customMessageSocketBroadcaster(message, data);
    return;
  }

  if (message !== 'reload') {
    // TODO:
    // Webpack currently only supports reloading the client (browser),
    // remove this when we have custom sockets, and native support.
    return;
  }

  // TODO:
  // Default webpack-dev-server sockets use "content-changed" instead of "reload" (what we use on native).
  // For now, just manually convert the value so our CLI interface can be unified.
  const hackyConvertedMessage = message === 'reload' ? 'content-changed' : message;

  webpackDevServerInstance.sockWrite(webpackDevServerInstance.sockets, hackyConvertedMessage, data);
}

function createNativeDevServerMiddleware(
  projectRoot: string,
  {
    port,
    compiler,
    forceManifestType,
  }: { port: number; compiler: webpack.Compiler; forceManifestType?: 'classic' | 'expo-updates' }
) {
  if (!isTargetingNative()) {
    return null;
  }
  const nativeMiddleware = createDevServerMiddleware({
    logger: getLogger(projectRoot),
    port,
    watchFolders: [projectRoot],
  });
  // Add manifest middleware to the other middleware.
  // TODO: Move this in to expo/dev-server.

  const useExpoUpdatesManifest = forceManifestType === 'expo-updates';

  const middleware = useExpoUpdatesManifest
    ? ExpoUpdatesManifestHandler.getManifestHandler(projectRoot)
    : ManifestHandler.getManifestHandler(projectRoot);

  nativeMiddleware.middleware.use(middleware).use(
    '/symbolicate',
    createSymbolicateMiddleware({
      projectRoot,
      compiler,
      logger: nativeMiddleware.logger,
    })
  );
  return nativeMiddleware;
}

function attachNativeDevServerMiddlewareToDevServer(
  projectRoot: string,
  {
    server,
    middleware,
    attachToServer,
    logger,
  }: { server: http.Server } & ReturnType<typeof createNativeDevServerMiddleware>
) {
  // Hook up the React Native WebSockets to the Webpack dev server.
  const { messageSocket, debuggerProxy, eventsSocket } = attachToServer(server);

  customMessageSocketBroadcaster = messageSocket.broadcast;

  const logReporter = new LogReporter(logger);
  logReporter.reportEvent = eventsSocket.reportEvent;

  const { inspectorProxy } = attachInspectorProxy(projectRoot, {
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

export async function startAsync(
  projectRoot: string,
  options: CLIWebOptions = {}
): Promise<WebpackDevServerResults | null> {
  await stopAsync(projectRoot);

  if (webpackDevServerInstance) {
    Log.error(chalk.red(`Webpack is already running.`));
    return null;
  }

  const fullOptions = transformCLIOptions(options);

  const env = await getWebpackConfigEnvFromBundlingOptionsAsync(projectRoot, fullOptions);

  if (fullOptions.clear) {
    await clearWebCacheAsync(projectRoot, env.mode);
  }

  if (env.https) {
    if (!process.env.SSL_CRT_FILE || !process.env.SSL_KEY_FILE) {
      const ssl = await getSSLCertAsync({
        name: 'localhost',
        directory: projectRoot,
      });
      if (ssl) {
        process.env.SSL_CRT_FILE = ssl.certPath;
        process.env.SSL_KEY_FILE = ssl.keyPath;
      }
    }
  }

  const config = await loadConfigAsync(env);
  const port = await getAvailablePortAsync({
    projectRoot,
    defaultPort: options.port,
  });

  webpackServerPort = port;

  Log.log(`Starting Webpack on port ${webpackServerPort} in ${chalk.underline(env.mode)} mode.`);

  const protocol = env.https ? 'https' : 'http';

  if (isTargetingNative()) {
    await ProjectSettings.setPackagerInfoAsync(projectRoot, {
      packagerPort: webpackServerPort,
    });
  }

  // Create a webpack compiler that is configured with custom messages.
  const compiler = webpack(config);

  // Create the middleware required for interacting with a native runtime (Expo Go, or a development build).
  const nativeMiddleware = createNativeDevServerMiddleware(projectRoot, {
    port,
    compiler,
    forceManifestType: options.forceManifestType,
  });
  // Inject the native manifest middleware.
  const originalBefore = config.devServer!.before!.bind(config.devServer!.before);
  config.devServer!.before = (app, server, compiler) => {
    originalBefore(app, server, compiler);

    if (nativeMiddleware?.middleware) {
      app.use(nativeMiddleware.middleware);
    }
  };

  const server = new WebpackDevServer(compiler, config.devServer);
  // Launch WebpackDevServer.
  server.listen(port, HOST, function (this: http.Server, error) {
    if (nativeMiddleware) {
      attachNativeDevServerMiddlewareToDevServer(projectRoot, {
        server: this,
        ...nativeMiddleware,
      });
    }
    if (error) {
      Log.error(error.message);
    }
    if (typeof options.onWebpackFinished === 'function') {
      options.onWebpackFinished(error);
    }
  });

  webpackDevServerInstance = server;

  await ProjectSettings.setPackagerInfoAsync(projectRoot, {
    webpackServerPort,
  });

  const host = getIpAddressAsync();
  const url = `${protocol}://${host}:${port}`;

  // Extend the close method to ensure that we clean up the local info.
  const originalClose = server.close.bind(server);

  server.close = (callback?: (err?: Error) => void) => {
    return originalClose((err?: Error) => {
      ProjectSettings.setPackagerInfoAsync(projectRoot, {
        webpackServerPort: null,
      }).finally(() => {
        callback?.(err);
        webpackDevServerInstance = null;
        webpackServerPort = null;
      });
    });
  };

  return {
    server,
    location: {
      url,
      port,
      protocol,
      host,
    },
    // Match the native protocol.
    messageSocket: {
      broadcast: broadcastMessage,
    },
  };
}

export async function stopAsync(projectRoot: string): Promise<void> {
  if (webpackDevServerInstance) {
    await new Promise((res) => {
      if (webpackDevServerInstance) {
        Log.log('\u203A Stopping Webpack server');
        webpackDevServerInstance.close(res);
      }
    });
  }
}

export async function openAsync(projectRoot: string, options?: BundlingOptions): Promise<void> {
  if (!webpackDevServerInstance) {
    await startAsync(projectRoot, options);
  }
  await openProjectAsync(projectRoot);
}

async function compileWebAppAsync(projectRoot: string, compiler: webpack.Compiler): Promise<any> {
  // We generate the stats.json file in the webpack-config
  const { warnings } = await new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      let messages;
      if (error) {
        if (!error.message) {
          return reject(error);
        }
        messages = formatWebpackMessages({
          errors: [error.message],
          warnings: [],
          _showErrors: true,
          _showWarnings: true,
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        );
      }

      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new CommandError('WEBPACK_BUNDLE', messages.errors.join('\n\n')));
      }
      if (getenv.boolish('EXPO_WEB_BUILD_STRICT', false) && CI && messages.warnings.length) {
        Log.warn(
          chalk.yellow(
            '\nTreating warnings as errors because `process.env.CI = true` and `process.env.EXPO_WEB_BUILD_STRICT = true`. \n' +
              'Most CI servers set it automatically.\n'
          )
        );
        return reject(new CommandError('WEBPACK_BUNDLE', messages.warnings.join('\n\n')));
      }
      resolve({
        warnings: messages.warnings,
      });
    })
  );
  return { warnings };
}

async function bundleWebAppAsync(projectRoot: string, config: WebpackConfiguration) {
  const compiler = webpack(config);

  try {
    const { warnings } = await compileWebAppAsync(projectRoot, compiler);
    if (warnings.length) {
      Log.warn(chalk.yellow('Compiled with warnings.\n'));
      Log.warn(warnings.join('\n\n'));
    } else {
      Log.log(chalk.green('Compiled successfully.\n'));
    }
  } catch (error) {
    Log.error(chalk.red('Failed to compile.\n'));
    throw error;
  }
}

export async function bundleAsync(projectRoot: string, options?: BundlingOptions): Promise<void> {
  const fullOptions = transformCLIOptions({
    ...options,
  });

  const env = await getWebpackConfigEnvFromBundlingOptionsAsync(projectRoot, {
    ...fullOptions,
    // Force production
    mode: 'production',
  });

  // @ts-ignore
  if (typeof env.offline !== 'undefined') {
    throw new Error(
      'offline support must be added manually: https://expo.fyi/enabling-web-service-workers'
    );
  }

  if (fullOptions.clear) {
    await clearWebCacheAsync(projectRoot, env.mode);
  }

  const config = await loadConfigAsync(env);
  await bundleWebAppAsync(projectRoot, config);
}

/**
 * Get the URL for the running instance of Webpack dev server.
 *
 * @param projectRoot
 */
export async function getUrlAsync(projectRoot: string): Promise<string | null> {
  if (!webpackDevServerInstance) {
    return null;
  }
  const host = getIpAddressAsync();
  const protocol = await getProtocolAsync(projectRoot);
  return `${protocol}://${host}:${webpackServerPort}`;
}

async function getProtocolAsync(projectRoot: string): Promise<'http' | 'https'> {
  // TODO: Bacon: Handle when not in expo
  const { https } = await ProjectSettings.readAsync(projectRoot);
  return https === true ? 'https' : 'http';
}

async function getAvailablePortAsync(options: {
  host?: string;
  defaultPort?: number;
  projectRoot: string;
}): Promise<number> {
  try {
    const defaultPort =
      'defaultPort' in options && options.defaultPort ? options.defaultPort : DEFAULT_PORT;
    const port = await choosePortAsync(options.projectRoot, {
      defaultPort,
      host: 'host' in options && options.host ? options.host : HOST,
    });
    if (!port) {
      throw new Error(`Port ${defaultPort} not available.`);
    }
    return port;
  } catch (error) {
    throw new CommandError('NO_PORT_FOUND', error.message);
  }
}

function setMode(mode: 'development' | 'production' | 'test' | 'none'): void {
  process.env.BABEL_ENV = mode;
  process.env.NODE_ENV = mode;
}

function validateBoolOption(name: string, value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'undefined') {
    value = defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new CommandError('WEBPACK_INVALID_OPTION', `'${name}' option must be a boolean.`);
  }

  return value;
}

function transformCLIOptions(options: CLIWebOptions): BundlingOptions {
  // Transform the CLI flags into more explicit values
  return {
    ...options,

    isImageEditingEnabled: options.pwa,
  };
}

async function applyOptionsToProjectSettingsAsync(
  projectRoot: string,
  options: BundlingOptions
): Promise<ProjectSettings.Settings> {
  const newSettings: Partial<ProjectSettings.Settings> = {};
  // Change settings before reading them
  if (typeof options.https === 'boolean') {
    newSettings.https = options.https;
  }

  if (Object.keys(newSettings).length) {
    await ProjectSettings.setAsync(projectRoot, newSettings);
  }

  return await ProjectSettings.readAsync(projectRoot);
}

async function getWebpackConfigEnvFromBundlingOptionsAsync(
  projectRoot: string,
  options: BundlingOptions
): Promise<WebEnvironment> {
  const { dev, https } = await applyOptionsToProjectSettingsAsync(projectRoot, options);

  const mode = typeof options.mode === 'string' ? options.mode : dev ? 'development' : 'production';

  const isImageEditingEnabled = validateBoolOption(
    'isImageEditingEnabled',
    options.isImageEditingEnabled,
    true
  );

  return {
    projectRoot,
    pwa: isImageEditingEnabled,
    logger: getLogger(projectRoot),
    isImageEditingEnabled,
    mode,
    https,
    ...(options.webpackEnv || {}),
  };
}

async function getSSLCertAsync({
  name,
  directory,
}: {
  name: string;
  directory: string;
}): Promise<{ keyPath: string; certPath: string } | false> {
  console.log(
    chalk.magenta`Ensuring auto SSL certificate is created (you might need to re-run with sudo)`
  );
  try {
    const result = await devcert.certificateFor(name);
    if (result) {
      const { key, cert } = result;
      const folder = path.join(directory, '.expo', 'web', 'development', 'ssl');
      await fs.ensureDir(folder);

      const keyPath = path.join(folder, `key-${name}.pem`);
      await fs.writeFile(keyPath, key);

      const certPath = path.join(folder, `cert-${name}.pem`);
      await fs.writeFile(certPath, cert);

      return {
        keyPath,
        certPath,
      };
    }
    return result;
  } catch (error) {
    console.log(`Error creating SSL certificates: ${error}`);
  }

  return false;
}

function applyEnvironmentVariables(config: WebpackConfiguration): WebpackConfiguration {
  // Use EXPO_DEBUG_WEB=true to enable debugging features for cases where the prod build
  // has errors that aren't caught in development mode.
  // Related: https://github.com/expo/expo-cli/issues/614
  if (isDebugModeEnabled() && config.mode === 'production') {
    console.log(chalk.bgYellow.black('Bundling the project in debug mode.'));

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
  env: WebEnvironment,
  argv?: string[]
): Promise<WebpackConfiguration> {
  setMode(env.mode);
  // Check if the project has a webpack.config.js in the root.
  const projectWebpackConfig = path.resolve(env.projectRoot, 'webpack.config.js');
  let config: WebpackConfiguration;
  if (fs.existsSync(projectWebpackConfig)) {
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

async function openProjectAsync(
  projectRoot: string
): Promise<{ success: true; url: string } | { success: false; error: Error }> {
  try {
    const url = await constructWebAppUrlAsync(projectRoot, { hostType: 'localhost' });
    if (!url) {
      throw new Error('Webpack Dev Server is not running');
    }
    openBrowserAsync(url);
    return { success: true, url };
  } catch (e) {
    Log.error(`Couldn't start project on web: ${e.message}`);
    return { success: false, error: e };
  }
}

export const HOST = getenv.string('WEB_HOST', '0.0.0.0');

export const DEFAULT_PORT = getenv.int('WEB_PORT', 19006);

// When you have errors in the production build that aren't present in the development build you can use `EXPO_WEB_DEBUG=true expo start --no-dev` to debug those errors.
// - Prevent the production build from being minified
// - Include file path info comments in the bundle
function isDebugModeEnabled(): boolean {
  return getenv.boolish('EXPO_WEB_DEBUG', false);
}

function isInfoEnabled(): boolean {
  return getenv.boolish('EXPO_WEB_INFO', false);
}
