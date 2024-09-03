import { ExpoConfig, getConfig } from '@expo/config';
import { getMetroServerRoot } from '@expo/config/paths';
import { getDefaultConfig, LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import { Server as ConnectServer } from 'connect';
import http from 'http';
import type Metro from 'metro';
import Bundler from 'metro/src/Bundler';
import type { TransformOptions } from 'metro/src/DeltaBundler/Worker';
import MetroHmrServer from 'metro/src/HmrServer';
import { loadConfig, resolveConfig, ConfigT } from 'metro-config';
import { Terminal } from 'metro-core';
import util from 'node:util';
import { URL } from 'url';

import { createDevToolsPluginWebsocketEndpoint } from './DevToolsPluginWebsocketEndpoint';
import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { attachAtlasAsync } from './debugging/attachAtlas';
import { createDebugMiddleware } from './debugging/createDebugMiddleware';
import { runServer } from './runServer-fork';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';
import { Log } from '../../../log';
import { getMetroProperties } from '../../../utils/analytics/getMetroProperties';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { logEventAsync } from '../../../utils/telemetry';
import { createCorsMiddleware } from '../middleware/CorsMiddleware';
import { createJsInspectorMiddleware } from '../middleware/inspector/createJsInspectorMiddleware';
import { prependMiddleware, replaceMiddlewareWith } from '../middleware/mutations';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import { suppressRemoteDebuggingErrorMiddleware } from '../middleware/suppressErrorMiddleware';
import { getPlatformBundlers } from '../platformBundlers';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

// Wrap terminal and polyfill console.log so we can log during bundling without breaking the indicator.
class LogRespectingTerminal extends Terminal {
  constructor(stream: import('node:net').Socket | import('node:stream').Writable) {
    super(stream);

    const sendLog = (...args: any[]) => {
      // @ts-expect-error
      this._logLines.push(
        // format args like console.log
        util.format(...args)
      );
      // @ts-expect-error
      this._scheduleUpdate();

      // Flush the logs to the terminal immediately so logs at the end of the process are not lost.
      this.flush();
    };

    console.log = sendLog;
    console.info = sendLog;
  }
}

// Share one instance of Terminal for all instances of Metro.
const terminal = new LogRespectingTerminal(process.stdout);

export async function loadMetroConfigAsync(
  projectRoot: string,
  options: LoadOptions,
  {
    exp,
    isExporting,
    getMetroBundler,
  }: { exp: ExpoConfig; isExporting: boolean; getMetroBundler: () => Bundler }
) {
  let reportEvent: ((event: any) => void) | undefined;

  // NOTE: Enable all the experimental Metro flags when RSC is enabled.
  if (exp.experiments?.reactServerComponents) {
    process.env.EXPO_USE_METRO_REQUIRE = '1';
    process.env.EXPO_USE_FAST_RESOLVER = '1';
  }

  const serverRoot = getMetroServerRoot(projectRoot);
  const terminalReporter = new MetroTerminalReporter(serverRoot, terminal);

  const hasConfig = await resolveConfig(options.config, projectRoot);
  let config: ConfigT = {
    ...(await loadConfig(
      { cwd: projectRoot, projectRoot, ...options },
      // If the project does not have a metro.config.js, then we use the default config.
      hasConfig.isEmpty ? getDefaultConfig(projectRoot) : undefined
    )),
    reporter: {
      update(event: any) {
        terminalReporter.update(event);
        if (reportEvent) {
          reportEvent(event);
        }
      },
    },
  };

  if (isExporting) {
    // This token will be used in the asset plugin to ensure the path is correct for writing locally.
    // @ts-expect-error: typed as readonly.
    config.transformer.publicPath = `/assets?export_path=${
      (exp.experiments?.baseUrl ?? '') + '/assets'
    }`;
  } else {
    // @ts-expect-error: typed as readonly
    config.transformer.publicPath = '/assets/?unstable_path=.';
  }

  const platformBundlers = getPlatformBundlers(projectRoot, exp);

  if (exp.experiments?.reactCompiler) {
    Log.warn(`Experimental React Compiler is enabled.`);
  }

  if (env.EXPO_UNSTABLE_TREE_SHAKING && !env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH) {
    throw new CommandError(
      'EXPO_UNSTABLE_TREE_SHAKING requires EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH to be enabled.'
    );
  }

  if (env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH) {
    Log.warn(`Experimental bundle optimization is enabled.`);
  }
  if (env.EXPO_UNSTABLE_TREE_SHAKING) {
    Log.warn(`Experimental tree shaking is enabled.`);
  }

  config = await withMetroMultiPlatformAsync(projectRoot, {
    config,
    exp,
    platformBundlers,
    isTsconfigPathsEnabled: exp.experiments?.tsconfigPaths ?? true,
    webOutput: exp.web?.output ?? 'single',
    isFastResolverEnabled: env.EXPO_USE_FAST_RESOLVER,
    isExporting,
    isReactCanaryEnabled:
      (exp.experiments?.reactServerComponents || exp.experiments?.reactCanary) ?? false,
    isNamedRequiresEnabled: env.EXPO_USE_METRO_REQUIRE,
    getMetroBundler,
  });

  if (process.env.NODE_ENV !== 'test') {
    logEventAsync('metro config', getMetroProperties(projectRoot, exp, config));
  }

  return {
    config,
    setEventReporter: (logger: (event: any) => void) => (reportEvent = logger),
    reporter: terminalReporter,
  };
}

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  metroBundler: MetroBundlerDevServer,
  options: Omit<LoadOptions, 'logger'>,
  {
    isExporting,
    exp = getConfig(metroBundler.projectRoot, {
      skipSDKVersionRequirement: true,
    }).exp,
  }: { isExporting: boolean; exp?: ExpoConfig }
): Promise<{
  metro: Metro.Server;
  hmrServer: MetroHmrServer | null;
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  const projectRoot = metroBundler.projectRoot;

  const { config: metroConfig, setEventReporter } = await loadMetroConfigAsync(
    projectRoot,
    options,
    {
      exp,
      isExporting,
      getMetroBundler() {
        return metro.getBundler().getBundler();
      },
    }
  );

  const { createDevServerMiddleware, securityHeadersMiddleware } =
    require('@react-native-community/cli-server-api') as typeof import('@react-native-community/cli-server-api');

  const { middleware, messageSocketEndpoint, eventsSocketEndpoint, websocketEndpoints } =
    createDevServerMiddleware({
      port: metroConfig.server.port,
      watchFolders: metroConfig.watchFolders,
    });

  let debugWebsocketEndpoints: {
    [path: string]: import('ws').WebSocketServer;
  } = {};

  if (!isExporting) {
    // The `securityHeadersMiddleware` does not support cross-origin requests, we replace with the enhanced version.
    // From react-native 0.75, the exported `securityHeadersMiddleware` is a middleware factory that accepts single option parameter.
    const securityHeadersMiddlewareHandler =
      securityHeadersMiddleware.length === 1
        ? securityHeadersMiddleware({})
        : securityHeadersMiddleware;
    replaceMiddlewareWith(
      middleware as ConnectServer,
      securityHeadersMiddlewareHandler,
      createCorsMiddleware(exp)
    );

    prependMiddleware(middleware, suppressRemoteDebuggingErrorMiddleware);

    // TODO: We can probably drop this now.
    const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
    // @ts-expect-error: can't mutate readonly config
    metroConfig.server.enhanceMiddleware = (metroMiddleware: any, server: Metro.Server) => {
      if (customEnhanceMiddleware) {
        metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
      }
      return middleware.use(metroMiddleware);
    };

    middleware.use(createDebuggerTelemetryMiddleware(projectRoot, exp));

    // Initialize all React Native debug features
    const { debugMiddleware, ...options } = createDebugMiddleware(metroBundler);
    debugWebsocketEndpoints = options.debugWebsocketEndpoints;
    prependMiddleware(middleware, debugMiddleware);
    middleware.use('/_expo/debugger', createJsInspectorMiddleware());
  }

  // Attach Expo Atlas if enabled
  await attachAtlasAsync({
    isExporting,
    exp,
    projectRoot,
    middleware,
    metroConfig,
    // NOTE(cedric): reset the Atlas file once, and reuse it for static exports
    resetAtlasFile: isExporting,
  });

  const { server, hmrServer, metro } = await runServer(
    metroBundler,
    metroConfig,
    {
      // @ts-expect-error: Inconsistent `websocketEndpoints` type between metro and @react-native-community/cli-server-api
      websocketEndpoints: {
        ...websocketEndpoints,
        ...debugWebsocketEndpoints,
        ...createDevToolsPluginWebsocketEndpoint(),
      },
      watch: !isExporting && isWatchEnabled(),
    },
    {
      mockServer: isExporting,
    }
  );

  // Patch transform file to remove inconvenient customTransformOptions which are only used in single well-known files.
  const originalTransformFile = metro
    .getBundler()
    .getBundler()
    .transformFile.bind(metro.getBundler().getBundler());

  metro.getBundler().getBundler().transformFile = async function (
    filePath: string,
    transformOptions: TransformOptions,
    fileBuffer?: Buffer
  ) {
    return originalTransformFile(
      filePath,
      pruneCustomTransformOptions(
        filePath,
        // Clone the options so we don't mutate the original.
        {
          ...transformOptions,
          customTransformOptions: {
            __proto__: null,
            ...transformOptions.customTransformOptions,
          },
        }
      ),
      fileBuffer
    );
  };

  prependMiddleware(middleware, (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
    // If the URL is a Metro asset request, then we need to skip all other middleware to prevent
    // the community CLI's serve-static from hosting `/assets/index.html` in place of all assets if it exists.
    // /assets/?unstable_path=.
    if (req.url) {
      const url = new URL(req.url!, 'http://localhost:8000');
      if (url.pathname.match(/^\/assets\/?/) && url.searchParams.get('unstable_path') != null) {
        return metro.processRequest(req, res, next);
      }
    }
    return next();
  });

  setEventReporter(eventsSocketEndpoint.reportEvent);

  return {
    metro,
    hmrServer,
    server,
    middleware,
    messageSocket: messageSocketEndpoint,
  };
}

// TODO: Fork the entire transform function so we can simply regex the file contents for keywords instead.
function pruneCustomTransformOptions(
  filePath: string,
  transformOptions: TransformOptions
): TransformOptions {
  if (
    transformOptions.customTransformOptions?.dom &&
    // The only generated file that needs the dom root is `expo/dom/entry.js`
    !filePath.match(/expo\/dom\/entry\.js$/)
  ) {
    // Clear the dom root option if we aren't transforming the magic entry file, this ensures
    // that cached artifacts from other DOM component bundles can be reused.
    transformOptions.customTransformOptions.dom = 'true';
  }

  if (
    transformOptions.customTransformOptions?.routerRoot &&
    // The router root is used all over expo-router (`process.env.EXPO_ROUTER_ABS_APP_ROOT`, `process.env.EXPO_ROUTER_APP_ROOT`) so we'll just ignore the entire package.
    !(filePath.match(/\/expo-router\/_ctx/) || filePath.match(/\/expo-router\/build\//))
  ) {
    // Set to the default value.
    transformOptions.customTransformOptions.routerRoot = 'app';
  }
  if (
    transformOptions.customTransformOptions?.asyncRoutes &&
    // The async routes settings are also used in `expo-router/_ctx.ios.js` (and other platform variants) via `process.env.EXPO_ROUTER_IMPORT_MODE`
    !(
      filePath.match(/\/expo-router\/_ctx\.(ios|android|web)\.js$/) ||
      filePath.match(/\/expo-router\/build\/import-mode\/index\.js$/)
    )
  ) {
    delete transformOptions.customTransformOptions.asyncRoutes;
  }

  if (
    transformOptions.customTransformOptions?.clientBoundaries &&
    // The client boundaries are only used in `expo-router/virtual-client-boundaries.js` for production RSC exports.
    !filePath.match(/\/expo-router\/virtual-client-boundaries\.js$/)
  ) {
    delete transformOptions.customTransformOptions.clientBoundaries;
  }

  return transformOptions;
}

/**
 * Simplify and communicate if Metro is running without watching file updates,.
 * Exposed for testing.
 */
export function isWatchEnabled() {
  if (env.CI) {
    Log.log(
      chalk`Metro is running in CI mode, reloads are disabled. Remove {bold CI=true} to enable watch mode.`
    );
  }

  return !env.CI;
}
