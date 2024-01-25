import { ExpoConfig, getConfig } from '@expo/config';
import { getDefaultConfig, LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import { Server as ConnectServer } from 'connect';
import fs from 'fs';
import http from 'http';
import type Metro from 'metro';
import { loadConfig, resolveConfig, ConfigT } from 'metro-config';
import { Terminal } from 'metro-core';
import semver from 'semver';
import { URL } from 'url';

import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { createDebugMiddleware } from './debugging/createDebugMiddleware';
import { runServer } from './runServer-fork';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';
import { MetroDevServerOptions } from '../../../export/fork-bundleAsync';
import { Log } from '../../../log';
import { getMetroProperties } from '../../../utils/analytics/getMetroProperties';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { env } from '../../../utils/env';
import { createCorsMiddleware } from '../middleware/CorsMiddleware';
import { getMetroServerRoot } from '../middleware/ManifestMiddleware';
import { createJsInspectorMiddleware } from '../middleware/inspector/createJsInspectorMiddleware';
import { prependMiddleware, replaceMiddlewareWith } from '../middleware/mutations';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import { suppressRemoteDebuggingErrorMiddleware } from '../middleware/suppressErrorMiddleware';
import { getPlatformBundlers } from '../platformBundlers';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

function gteSdkVersion(exp: Pick<ExpoConfig, 'sdkVersion'>, sdkVersion: string): boolean {
  if (!exp.sdkVersion) {
    return false;
  }

  if (exp.sdkVersion === 'UNVERSIONED') {
    return true;
  }

  try {
    return semver.gte(exp.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}

export async function loadMetroConfigAsync(
  projectRoot: string,
  options: LoadOptions,
  {
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
    isExporting,
    onStats,
  }: { exp?: ExpoConfig; isExporting: boolean; onStats?: StatsCallback }
) {
  let reportEvent: ((event: any) => void) | undefined;
  const serverRoot = getMetroServerRoot(projectRoot);

  const terminal = new Terminal(process.stdout);
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

  if (
    // Requires SDK 50 for expo-assets hashAssetPlugin change.
    !exp.sdkVersion ||
    gteSdkVersion(exp, '50.0.0')
  ) {
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
  } else {
    if (isExporting && exp.experiments?.baseUrl) {
      // This token will be used in the asset plugin to ensure the path is correct for writing locally.
      // @ts-expect-error: typed as readonly.
      config.transformer.publicPath = exp.experiments?.baseUrl;
    }
  }

  const platformBundlers = getPlatformBundlers(projectRoot, exp);

  config = await withMetroMultiPlatformAsync(projectRoot, {
    config,
    exp,
    platformBundlers,
    isTsconfigPathsEnabled: exp.experiments?.tsconfigPaths ?? true,
    webOutput: exp.web?.output ?? 'single',
    isFastResolverEnabled: env.EXPO_USE_FAST_RESOLVER,
    isExporting,
  });

  if (process.env.NODE_ENV !== 'test') {
    logEventAsync('metro config', getMetroProperties(projectRoot, exp, config));
  }

  const original = config.serializer.customSerializer;

  const stats: MetroRequestStats[] = [];

  config.serializer.customSerializer = (
    entryPoint: string,
    preModules: any, //ReadonlyArray<Module>,
    graph: any, // ReadOnlyGraph,
    options: any // SerializerOptions,
  ) => {
    if (!isExporting || !!onStats) {
      const statsJson = toJson(projectRoot, entryPoint, preModules, graph, options);
      onStats?.(statsJson);
      // console.log('push bundle', entryPoint);
      stats.push(statsJson);
    }
    return original(entryPoint, preModules, graph, options);
  };

  return {
    config,
    setEventReporter: (logger: (event: any) => void) => (reportEvent = logger),
    reporter: terminalReporter,
    stats,
  };
}

export type StatsCallback = (stats: MetroRequestStats) => void;

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  metroBundler: MetroBundlerDevServer,
  options: Omit<MetroDevServerOptions, 'logger'>,
  { isExporting, onStats }: { isExporting: boolean; onStats?: StatsCallback }
): Promise<{
  metro: Metro.Server;
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  const projectRoot = metroBundler.projectRoot;

  // TODO: When we bring expo/metro-config into the expo/expo repo, then we can upstream this.
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
  });

  const {
    config: metroConfig,
    setEventReporter,
    stats,
  } = await loadMetroConfigAsync(projectRoot, options, { exp, isExporting, onStats });

  const { createDevServerMiddleware, securityHeadersMiddleware } =
    require('@react-native-community/cli-server-api') as typeof import('@react-native-community/cli-server-api');

  const { middleware, messageSocketEndpoint, eventsSocketEndpoint, websocketEndpoints } =
    createDevServerMiddleware({
      port: metroConfig.server.port,
      watchFolders: metroConfig.watchFolders,
    });

  // The `securityHeadersMiddleware` does not support cross-origin requests, we replace with the enhanced version.
  replaceMiddlewareWith(
    middleware as ConnectServer,
    securityHeadersMiddleware,
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

  function allowCrossOrigin(req: ServerRequest, res: ServerResponse) {
    const origin = (() => {
      if (req.headers['origin']) {
        return req.headers['origin'];
      }

      if (req.headers['referer']) {
        return req.headers['referer'];
      }

      try {
        return new URL(req.url!).origin;
      } catch {
        return null;
      }
    })();

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  middleware.use(
    // Current Metro stats for devtools endpoint
    '/_expo/last-metro-stats',
    async (req, res, next) => {
      if (!stats.length) {
        // Not found
        res.statusCode = 404;

        res.end();
        return;
      }

      try {
        allowCrossOrigin(req, res);

        const jsonResults = JSON.stringify(
          {
            version: 1,
            graphs: stats.slice(0, 1).map((bundle) => bundle),
          },
          null,
          2
        );
        // console.log(jsonResults);
        res.setHeader('Content-Type', 'application/json');
        res.end(jsonResults);
        return;
      } catch (error) {
        console.log('ERROR:', error);
        res.statusCode = 500;
        res.end();
        return;
      }
    }
  );

  // middleware.use(
  //   // Given a bundle ID and absolute path, return the full dependency object.
  //   '/_expo/metro-dependency',
  //   async (req, res, next) => {
  //     if (!stats.length) {
  //       // Not found
  //       res.statusCode = 404;

  //       res.end();
  //       return;
  //     }

  //     const { bundleId, path } = req.query;
  //     if (!bundleId || !path) {
  //       res.statusCode = 400;
  //       res.end();
  //       return;
  //     }

  //     try {
  //       allowCrossOrigin(req, res);

  //       const bundle = stats.find((bundle) => bundle[0] === bundleId);
  //       if (!bundle) {
  //         res.statusCode = 404;
  //         res.end();
  //         return;
  //       }

  //       const dep = bundle[2].dependencies.find((dep) => dep.path === path) ?? bundle[1].find((dep) => dep.path === path);
  //       if (!dep) {
  //         res.statusCode = 404;
  //         res.end();
  //         return;
  //       }

  //       const jsonResults = JSON.stringify(dep, null, 2);
  //       // console.log(jsonResults);
  //       res.setHeader('Content-Type', 'application/json');
  //       res.end(jsonResults);
  //       return;
  //     } catch (error) {
  //       console.log('ERROR:', error);
  //       res.statusCode = 500;
  //       res.end();
  //       return;
  //     }
  //   }
  // );

  middleware.use(createDebuggerTelemetryMiddleware(projectRoot, exp));

  // Initialize all React Native debug features
  const { debugMiddleware, debugWebsocketEndpoints } = createDebugMiddleware(metroBundler);
  prependMiddleware(middleware, debugMiddleware);
  middleware.use('/_expo/debugger', createJsInspectorMiddleware());

  const { server, metro } = await runServer(metroBundler, metroConfig, {
    // @ts-expect-error: Inconsistent `websocketEndpoints` type between metro and @react-native-community/cli-server-api
    websocketEndpoints: {
      ...websocketEndpoints,
      ...debugWebsocketEndpoints,
    },
    watch: !isExporting && isWatchEnabled(),
  });

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
    server,
    middleware,
    messageSocket: messageSocketEndpoint,
  };
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

const sourceMapString = require('metro/src/DeltaBundler/Serializers/sourceMapString');
import path from 'path';
import { Graph, Module, ReadOnlyGraph, SerializerOptions } from 'metro';

// function storeFixture(name: string, obj: any) {
//   const filePath = path.join(
//     __dirname.replace('metro-config/build/', 'metro-config/src/'),
//     `${name}.json`
//   );
//   fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
// }

type MetroJsonDependencyStats = {
  dependencies: string[];
  getSource: string;
  size: number;
  inverseDependencies: string[];
  path: string;
  output: {
    type: string;
    data: {
      map: any[];
      code: string;
      functionMap?: {};
    };
  }[];
  absolutePath: string;
  isNodeModule: boolean;
  nodeModuleName: string;
  isEntry: boolean;
};

type MetroRequestStats = [
  string,
  MetroJsonDependencyStats[],
  {
    dependencies: MetroJsonDependencyStats[];
    entryPoints: any[];
    transformOptions: Graph['transformOptions'];
  },
  {
    processModuleFilter: any;
    createModuleId: any;
    getRunModuleStatement: any;
    shouldAddToIgnoreList: any;
  },
];

const cache = new Map<string, string>();
function getNodeModuleNameForPath(path: string) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  // pop up to the parent directory to match the node module
  const parts = path.split('/');

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === 'node_modules') {
      // If the next part is a scoped module, we need to include it in the name
      let name = parts[i + 1];

      if (name.startsWith('@') && i + 2 < parts.length) {
        name += '/' + parts[i + 2];
      }

      cache.set(path, name);
      return name;
    }
  }
}

function findUpPackageJsonDir(dir: string): string | null {
  const packageJson = path.join(dir, 'package.json');
  if (fs.existsSync(packageJson)) {
    return packageJson;
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    return null;
  }
  return findUpPackageJsonDir(parent);
}

function toJson(
  projectRoot: string,
  entryFile: string,
  preModules: Module[],
  graph: ReadOnlyGraph,
  options: SerializerOptions
): MetroRequestStats {
  const dropSource = false;

  function modifyDep(mod: Module): MetroJsonDependencyStats {
    // if (!mod.path.match(/src\/app\/_layout/)) {
    //   return null;
    // }

    // TODO: Cache this operation.
    let nodeModuleName = getNodeModuleNameForPath(mod.path);
    let isNodeModule = !!nodeModuleName;
    if (!nodeModuleName) {
      const pkgDir = findUpPackageJsonDir(mod.path);
      if (pkgDir) {
        const pkg = JSON.parse(fs.readFileSync(pkgDir, 'utf8'));
        nodeModuleName = pkg.name;
        const isRootApp = pkgDir === path.join(projectRoot, 'package.json');
        isNodeModule = !isRootApp;
      } else {
        // Not sure when this would happen, maybe virtual modules.
      }
    }

    nodeModuleName ??= '[unknown]';

    return {
      dependencies: [...mod.dependencies.entries()].map(([key, value]) => {
        return path.relative(projectRoot, value.absolutePath);
      }),
      // dependencies: Object.fromEntries(
      //   [...mod.dependencies.entries()].map(([key, value]) => {
      //     return [key, value];
      //   })
      // ),
      getSource: mod.getSource().toString(),
      size: mod.output.reduce((acc, { data }) => acc + data.code.length, 0),
      inverseDependencies: Array.from(mod.inverseDependencies)
        .filter((fp) => {
          return graph.dependencies.get(fp) != null;
        })
        .map((fp) => path.relative(projectRoot, fp)),
      path: path.relative(projectRoot, mod.path),
      output: mod.output.map((output) => ({
        type: output.type,
        data: {
          ...output.data,
          ...(dropSource
            ? { map: [], code: '...', functionMap: {} }
            : {
                map: sourceMapString([mod], {
                  processModuleFilter: () => true,
                  excludeSource: false,
                  shouldAddToIgnoreList: options.shouldAddToIgnoreList,
                }),
              }),
        },
      })),

      nodeModuleName,
      absolutePath: mod.path,
      isNodeModule,
      isEntry: entryFile === mod.path || options.runBeforeMainModule.includes(mod.path) || false,
    };
  }

  function simplifyGraph({ ...graph }) {
    // console.log('transformOptions', graph.transformOptions);
    return {
      ...graph,

      dependencies: [...graph.dependencies.entries()].map(([key, value]) => {
        return modifyDep(value);
      }),
      entryPoints: [...graph.entryPoints.entries()],
    };
  }

  return [
    entryFile,
    preModules.map((mod) => modifyDep(mod)),
    simplifyGraph(graph),
    {
      ...options,
      processModuleFilter: undefined,
      createModuleId: undefined,
      getRunModuleStatement: undefined,
      shouldAddToIgnoreList: undefined,
    },
  ];
}
