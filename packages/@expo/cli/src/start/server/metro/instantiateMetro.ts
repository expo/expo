import { ExpoConfig, getConfig } from '@expo/config';
import { getMetroServerRoot } from '@expo/config/paths';
import { getDefaultConfig, LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import http from 'http';
import type Metro from 'metro';
import Bundler from 'metro/src/Bundler';
import type { TransformOptions } from 'metro/src/DeltaBundler/Worker';
import MetroHmrServer from 'metro/src/HmrServer';
import { loadConfig, resolveConfig, ConfigT } from 'metro-config';
import { Terminal } from 'metro-core';
import util from 'node:util';

import { createDevToolsPluginWebsocketEndpoint } from './DevToolsPluginWebsocketEndpoint';
import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { attachAtlasAsync } from './debugging/attachAtlas';
import { createDebugMiddleware } from './debugging/createDebugMiddleware';
import { createMetroMiddleware } from './dev-server/createMetroMiddleware';
import { runServer } from './runServer-fork';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';
import { Log } from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { createCorsMiddleware } from '../middleware/CorsMiddleware';
import { createJsInspectorMiddleware } from '../middleware/inspector/createJsInspectorMiddleware';
import { prependMiddleware } from '../middleware/mutations';
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
      this._logLines.push(
        // format args like console.log
        util.format(...args)
      );
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

  const serverActionsEnabled =
    exp.experiments?.reactServerFunctions ?? env.EXPO_UNSTABLE_SERVER_FUNCTIONS;

  if (serverActionsEnabled) {
    process.env.EXPO_UNSTABLE_SERVER_FUNCTIONS = '1';
  }

  // NOTE: Enable all the experimental Metro flags when RSC is enabled.
  if (exp.experiments?.reactServerComponentRoutes || serverActionsEnabled) {
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

  // @ts-expect-error: Set the global require cycle ignore patterns for SSR bundles. This won't work with custom global prefixes, but we don't use those.
  globalThis.__requireCycleIgnorePatterns = config.resolver?.requireCycleIgnorePatterns;

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

  if (serverActionsEnabled) {
    Log.warn(
      `Experimental React Server Functions are enabled. Production exports are not supported yet.`
    );
    if (!exp.experiments?.reactServerComponentRoutes) {
      Log.warn(
        `- React Server Components are NOT enabled. Routes will render in client-only mode.`
      );
    }
  }

  config = await withMetroMultiPlatformAsync(projectRoot, {
    config,
    exp,
    platformBundlers,
    isTsconfigPathsEnabled: exp.experiments?.tsconfigPaths ?? true,
    isFastResolverEnabled: env.EXPO_USE_FAST_RESOLVER,
    isExporting,
    isReactCanaryEnabled:
      (exp.experiments?.reactServerComponentRoutes ||
        serverActionsEnabled ||
        exp.experiments?.reactCanary) ??
      false,
    isNamedRequiresEnabled: env.EXPO_USE_METRO_REQUIRE,
    isReactServerComponentsEnabled: !!exp.experiments?.reactServerComponentRoutes,
    getMetroBundler,
  });

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

  // Create the core middleware stack for Metro, including websocket listeners
  const { middleware, messagesSocket, eventsSocket, websocketEndpoints } =
    createMetroMiddleware(metroConfig);

  if (!isExporting) {
    // Enable correct CORS headers for Expo Router features
    prependMiddleware(middleware, createCorsMiddleware(exp));

    // Enable debug middleware for CDP-related debugging
    const { debugMiddleware, debugWebsocketEndpoints } = createDebugMiddleware(metroBundler);
    Object.assign(websocketEndpoints, debugWebsocketEndpoints);
    middleware.use(debugMiddleware);
    middleware.use('/_expo/debugger', createJsInspectorMiddleware());

    // TODO(cedric): `enhanceMiddleware` is deprecated, but is currently used to unify the middleware stacks
    // See: https://github.com/facebook/metro/commit/22e85fde85ec454792a1b70eba4253747a2587a9
    // See: https://github.com/facebook/metro/commit/d0d554381f119bb80ab09dbd6a1d310b54737e52
    const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
    // @ts-expect-error: can't mutate readonly config
    metroConfig.server.enhanceMiddleware = (metroMiddleware: any, server: Metro.Server) => {
      if (customEnhanceMiddleware) {
        metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
      }
      return middleware.use(metroMiddleware);
    };
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
      websocketEndpoints: {
        ...websocketEndpoints,
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

  setEventReporter(eventsSocket.reportMetroEvent);

  return {
    metro,
    hmrServer,
    server,
    middleware,
    messageSocket: messagesSocket,
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
    !(filePath.match(/\/expo-router\/_ctx/) || filePath.match(/\/expo-router\/build\//))
  ) {
    delete transformOptions.customTransformOptions.asyncRoutes;
  }

  if (
    transformOptions.customTransformOptions?.clientBoundaries &&
    // The client boundaries are only used in `@expo/metro-runtime/src/virtual.js` for production RSC exports.
    !filePath.match(/\/@expo\/metro-runtime\/rsc\/virtual\.js$/)
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
