/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import { prependMiddleware } from '@expo/dev-server';
import * as runtimeEnv from '@expo/env';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import assert from 'assert';
import chalk from 'chalk';
import fetch from 'node-fetch';
import path from 'path';
import { sync as globSync } from 'glob';
import requireString from 'require-from-string';
import resolve from 'resolve';
import resolveFrom from 'resolve-from';
import { promisify } from 'util';

import { Log } from '../../../log';
import getDevClientProperties from '../../../utils/analytics/getDevClientProperties';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { getFreePortAsync } from '../../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import {
  getStaticRenderFunctions,
  requireFileContentsWithMetro,
  requireWithMetro,
} from '../getStaticRenderFunctions';
import { ContextModuleSourceMapsMiddleware } from '../middleware/ContextModuleSourceMapsMiddleware';
import { CreateFileMiddleware } from '../middleware/CreateFileMiddleware';
import { FaviconMiddleware } from '../middleware/FaviconMiddleware';
import { HistoryFallbackMiddleware } from '../middleware/HistoryFallbackMiddleware';
import { InterstitialPageMiddleware } from '../middleware/InterstitialPageMiddleware';
import { createBundleUrlPath, resolveMainModuleName } from '../middleware/ManifestMiddleware';
import { ReactDevToolsPageMiddleware } from '../middleware/ReactDevToolsPageMiddleware';
import {
  DeepLinkHandler,
  RuntimeRedirectMiddleware,
} from '../middleware/RuntimeRedirectMiddleware';
import { ServeStaticMiddleware } from '../middleware/ServeStaticMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import { startTypescriptTypeGenerationAsync } from '../type-generation/startTypescriptTypeGeneration';
import { instantiateMetroAsync } from './instantiateMetro';
import { getErrorOverlayHtmlAsync } from './metroErrorInterface';
import { metroWatchTypeScriptFiles } from './metroWatchTypeScriptFiles';
import { observeApiRouteChanges, observeFileChanges } from './waitForMetroToObserveTypeScriptFile';
import { env } from '../../../utils/env';

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 8081;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

const resolveAsync = promisify(resolve) as any as (
  id: string,
  opts: resolve.AsyncOpts
) => Promise<string | null>;

async function getExpoRouteManifestBuilderAsync(
  projectRoot: string,
  {
    devServerUrl,
    minify,
    dev,
  }: {
    devServerUrl: string;
    minify: boolean;
    dev: boolean;
  }
) {
  const matchNodePath = path.join(
    resolveFrom(projectRoot, 'expo-router/package.json'),
    '../routes-manifest.ts'
  );
  const { createRoutesManifest } = await requireWithMetro<{
    createRoutesManifest: () => Promise<any>;
  }>(projectRoot, devServerUrl, matchNodePath, {
    minify,
    dev,

    // Ensure the API Routes are included
    environment: 'node',
  });
  return createRoutesManifest;
}

const manifestOperation = new Map<string, Promise<any>>();

async function refetchManifest(projectRoot: string, options: { mode?: string; port?: number }) {
  manifestOperation.delete('manifest');
  return fetchManifest(projectRoot, options);
}

type ExpoRouterServerManifestV1Route<TType> = {
  dynamic: any;
  generated: boolean;
  type: TType;
  file: string;
  regex: RegExp;
  src: string;
};
type ExpoRouterServerManifestV1 = {
  staticHtmlPaths: string[];
  staticHtml: ExpoRouterServerManifestV1Route<'static'>[];
  functions: ExpoRouterServerManifestV1Route<'dynamic'>[];
};

async function fetchManifest(
  projectRoot: string,
  options: { mode?: string; port?: number }
): Promise<null | ExpoRouterServerManifestV1> {
  if (manifestOperation.has('manifest')) {
    return manifestOperation.get('manifest');
  }

  const devServerUrl = `http://localhost:${options.port}`;

  async function bundleAsync(): Promise<null | ExpoRouterServerManifestV1> {
    // TODO: Update eagerly when files change
    const getManifest = await getExpoRouteManifestBuilderAsync(projectRoot, {
      devServerUrl,
      minify: options.mode === 'production',
      dev: options.mode !== 'production',
    });
    // Get the serialized manifest
    const results = await getManifest();

    if (!results) {
      return null;
    }

    if (!results.staticHtml || !results.functions) {
      throw new Error('Routes manifest is malformed: ' + JSON.stringify(results, null, 2));
    }

    results.staticHtml = results.staticHtml?.map((value: any) => {
      return {
        ...value,
        regex: new RegExp(value.regex),
      };
    });
    results.functions = results.functions?.map((value: any) => {
      return {
        ...value,
        regex: new RegExp(value.regex),
      };
    });
    console.log('manifest', results);
    return results;
  }

  const manifest = bundleAsync();
  if (manifest) {
    manifestOperation.set('manifest', manifest);
  }
  return manifest;
}

const pendingRouteOperations = new Map<string, Promise<string>>();

async function rebundleApiRoute(
  projectRoot: string,
  filepath: string,
  options: { mode?: string; port?: number }
) {
  pendingRouteOperations.delete(filepath);
  return bundleApiRoute(projectRoot, filepath, options);
}
async function bundleApiRoute(
  projectRoot: string,
  filepath: string,
  options: { mode?: string; port?: number }
) {
  if (pendingRouteOperations.has(filepath)) {
    return pendingRouteOperations.get(filepath);
  }

  const devServerUrl = `http://localhost:${options.port}`;

  async function bundleAsync() {
    try {
      debug('Check API route:', path.join(projectRoot, 'app'), filepath);

      const middleware = await requireFileContentsWithMetro(projectRoot, devServerUrl, filepath, {
        minify: options.mode === 'production',
        dev: options.mode !== 'production',
        // Ensure Node.js
        environment: 'node',
      });

      return middleware;
    } finally {
      // pendingRouteOperations.delete(filepath);
    }
  }
  const route = bundleAsync();
  pendingRouteOperations.set(filepath, route);
  return route;
}

async function eagerBundleApiRoutes(
  projectRoot: string,
  options: { mode?: string; port?: number }
) {
  const appDir = path.join(
    projectRoot,
    // TODO: Support other directories via app.json
    'app'
  );

  const routes = globSync('**/*+api.@(ts|tsx|js|jsx)', {
    cwd: appDir,
    absolute: true,
  });

  const promises = routes.map(async (filepath) => bundleApiRoute(projectRoot, filepath, options));

  await Promise.all(promises);
}

function createRouteHandlerMiddleware(
  projectRoot: string,
  options: { mode?: string; port?: number; getWebBundleUrl: () => string }
) {
  // Install Node.js browser polyfills and source map support
  require(resolveFrom(projectRoot, '@expo/server/install'));

  const { convertRequest, respond } = require(resolveFrom(
    projectRoot,
    '@expo/server/build/vendor/http'
  ));

  // don't await
  eagerBundleApiRoutes(projectRoot, options);
  refetchManifest(projectRoot, options);

  const devServerUrl = `http://localhost:${options.port}`;

  const appDir = path.join(
    projectRoot,
    // TODO: Support other directories via app.json
    'app'
  );

  return async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
    if (!req?.url || !req.method) {
      return next();
    }
    const manifest = await fetchManifest(projectRoot, options);
    // NOTE: no app dir
    if (!manifest) {
      // TODO: Redirect to 404 page
      return next();
    }

    const location = new URL(req.url, 'https://example.dev');

    // 1. Get pathname, e.g. `/thing`
    const pathname = location.pathname?.replace(/\/$/, '');
    const sanitizedPathname = pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

    let functionRoute: ExpoRouterServerManifestV1Route<'dynamic'> | null = null;

    const staticManifest = manifest?.staticHtml;
    const dynamicManifest = manifest?.functions;

    for (const route of dynamicManifest) {
      if (route.regex.test(sanitizedPathname)) {
        functionRoute = route;
        break;
      }
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      for (const route of staticManifest) {
        if (route.regex.test(sanitizedPathname)) {
          if (
            // Skip the 404 page if there's a function
            route.generated &&
            route.file.match(/^\.\/\[\.\.\.404]\.[jt]sx?$/)
          ) {
            if (functionRoute) {
              continue;
            }
          }

          console.log('Using:', route.src, sanitizedPathname, route.regex);
          try {
            const { getStaticContent } = await getStaticRenderFunctions(projectRoot, devServerUrl, {
              minify: options.mode === 'production',
              dev: options.mode !== 'production',
              // Ensure the API Routes are included
              environment: 'node',
            });

            let content = await getStaticContent(location);

            //TODO: Not this -- disable injection some other way
            if (options.mode !== 'production') {
              // Add scripts for rehydration
              // TODO: bundle split
              content = content.replace(
                '</body>',
                [`<script src="${options.getWebBundleUrl()}" defer></script>`].join('\n') +
                  '</body>'
              );
            }

            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          } catch (error: any) {
            res.setHeader('Content-Type', 'text/html');
            try {
              res.end(
                await getErrorOverlayHtmlAsync({
                  error,
                  projectRoot: projectRoot,
                })
              );
            } catch (staticError: any) {
              // Fallback error for when Expo Router is misconfigured in the project.
              res.end(
                '<span><h3>Internal Error:</h3><b>Project is not setup correctly for static rendering (check terminal for more info):</b><br/>' +
                  error.message +
                  '<br/><br/>' +
                  staticError.message +
                  '</span>'
              );
            }
          }
          return;
        }
      }
    }

    if (!functionRoute) {
      return next();
    }
    const resolvedFunctionPath = await resolveAsync(functionRoute.file, {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      basedir: appDir,
    });

    const middlewareContents = await bundleApiRoute(projectRoot, resolvedFunctionPath!, options);
    if (!middlewareContents) {
      return next();
    }

    const middleware = requireString(middlewareContents);

    debug(`Supported methods (API route exports):`, Object.keys(middleware), ' -> ', req.method);

    // Interop default
    const func = middleware[req.method];

    if (!func) {
      res.statusCode = 405;
      return res.end('Method not allowed');
    }

    const expoRequest = convertRequest(req, res, functionRoute);

    try {
      // 4. Execute.
      const response = await func?.(expoRequest);

      // 5. Respond
      if (response) {
        await respond(res, response);
      } else {
        // TODO: Not sure what to do here yet
        res.statusCode = 500;
        res.end();
      }
    } catch (error) {
      // TODO: Symbolicate error stack
      console.error(error);
      res.statusCode = 500;
      res.end();
    }
  };
}

export class MetroBundlerDevServer extends BundlerDevServer {
  private metro: import('metro').Server | null = null;

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
        : // Otherwise (running in Expo Go) use a free port that falls back on the classic 8081 port.
          await getFreePortAsync(EXPO_GO_METRO_PORT));

    return port;
  }

  async getFunctionsAsync({ mode }: { mode: 'development' | 'production' }) {
    const devServerUrl = `http://localhost:${this.getInstance()?.location.port}`;

    const appDir = path.join(
      this.projectRoot,
      // TODO: Support other directories via app.json
      'app'
    );

    function getRouteFiles() {
      // TODO: Cache this
      return globSync('**/*+api.@(ts|tsx|js|jsx)', {
        cwd: appDir,
        absolute: true,
      });
    }

    const files = getRouteFiles();

    const output: Record<string, string> = {};

    const getManifest = await getExpoRouteManifestBuilderAsync(this.projectRoot, {
      devServerUrl,
      minify: mode === 'production',
      dev: mode !== 'production',
    });

    const manifest = await getManifest();

    for (const file of files) {
      console.log('file', devServerUrl, file);
      const middleware = await requireFileContentsWithMetro(this.projectRoot, devServerUrl, file, {
        minify: mode === 'production',
        dev: mode !== 'production',
        environment: 'node',
      });
      output[path.relative(appDir, file)] = middleware;
    }

    return [manifest, output];
  }

  /** Get routes from Expo Router. */
  async getRoutesAsync() {
    const url = this.getDevServerUrl();
    assert(url, 'Dev server must be started');
    const { getManifest } = await getStaticRenderFunctions(this.projectRoot, url, {
      // Ensure the API Routes are included
      environment: 'node',
    });

    return getManifest({ fetchData: true });
  }

  async composeResourcesWithHtml({
    mode,
    resources,
    template,
    devBundleUrl,
  }: {
    mode: 'development' | 'production';
    resources: SerialAsset[];
    template: string;
    devBundleUrl?: string;
  }): Promise<string> {
    if (!resources) {
      return '';
    }
    const isDev = mode === 'development';
    return htmlFromSerialAssets(resources, {
      dev: isDev,
      template,
      bundleUrl: isDev ? devBundleUrl : undefined,
    });
  }

  async getStaticRenderFunctionAsync({
    mode,
    minify = mode !== 'development',
  }: {
    mode: 'development' | 'production';
    minify?: boolean;
  }) {
    const url = this.getDevServerUrl()!;

    const { getStaticContent } = await getStaticRenderFunctions(this.projectRoot, url, {
      minify,
      dev: mode !== 'production',
      // Ensure the API Routes are included
      environment: 'node',
    });
    return async (path: string) => {
      return await getStaticContent(new URL(path, url));
    };
  }

  async getStaticResourcesAsync({
    mode,
    minify = mode !== 'development',
  }: {
    mode: string;
    minify?: boolean;
  }): Promise<SerialAsset[]> {
    const devBundleUrlPathname = createBundleUrlPath({
      platform: 'web',
      mode,
      minify,
      environment: 'client',
      serializerOutput: 'static',
      mainModuleName: resolveMainModuleName(this.projectRoot, getConfig(this.projectRoot), 'web'),
    });

    const bundleUrl = new URL(devBundleUrlPathname, this.getDevServerUrl()!);

    // Fetch the generated HTML from our custom Metro serializer
    const results = await fetch(bundleUrl.toString());

    const txt = await results.text();

    let data: any;
    try {
      data = JSON.parse(txt);
    } catch (error: any) {
      Log.error(
        'Failed to generate resources with Metro, the Metro config may not be using the correct serializer. Ensure the metro.config.js is extending the expo/metro-config and is not overriding the serializer.'
      );
      debug(txt);
      throw error;
    }

    // NOTE: This could potentially need more validation in the future.
    if (Array.isArray(data)) {
      return data;
    }

    if (data != null && (data.errors || data.type?.match(/.*Error$/))) {
      // {
      //   type: 'InternalError',
      //   errors: [],
      //   message: 'Metro has encountered an error: While trying to resolve module `stylis` from file `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js`, the package `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/package.json` was successfully found. However, this package itself specifies a `main` module field that could not be resolved (`/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs`. Indeed, none of these files exist:\n' +
      //     '\n' +
      //     '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css)\n' +
      //     '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs/index(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css): /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/metro/src/node-haste/DependencyGraph.js (289:17)\n' +
      //     '\n' +
      //     '\x1B[0m \x1B[90m 287 |\x1B[39m         }\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 288 |\x1B[39m         \x1B[36mif\x1B[39m (error \x1B[36minstanceof\x1B[39m \x1B[33mInvalidPackageError\x1B[39m) {\x1B[0m\n' +
      //     '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 289 |\x1B[39m           \x1B[36mthrow\x1B[39m \x1B[36mnew\x1B[39m \x1B[33mPackageResolutionError\x1B[39m({\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m     |\x1B[39m                 \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 290 |\x1B[39m             packageError\x1B[33m:\x1B[39m error\x1B[33m,\x1B[39m\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 291 |\x1B[39m             originModulePath\x1B[33m:\x1B[39m \x1B[36mfrom\x1B[39m\x1B[33m,\x1B[39m\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 292 |\x1B[39m             targetModuleName\x1B[33m:\x1B[39m to\x1B[33m,\x1B[39m\x1B[0m'
      // }
      // The Metro logger already showed this error.
      throw new Error(data.message);
    }

    throw new Error(
      'Invalid resources returned from the Metro serializer. Expected array, found: ' + data
    );
  }

  private async renderStaticErrorAsync(error: Error) {
    return getErrorOverlayHtmlAsync({
      error,
      projectRoot: this.projectRoot,
    });
  }

  async getStaticPageAsync(
    pathname: string,
    {
      mode,
      minify = mode !== 'development',
    }: {
      mode: 'development' | 'production';
      minify?: boolean;
    }
  ) {
    const devBundleUrlPathname = createBundleUrlPath({
      platform: 'web',
      mode,
      environment: 'client',
      mainModuleName: resolveMainModuleName(this.projectRoot, getConfig(this.projectRoot), 'web'),
    });

    const bundleStaticHtml = async (): Promise<string> => {
      const { getStaticContent } = await getStaticRenderFunctions(
        this.projectRoot,
        this.getDevServerUrl()!,
        {
          minify: false,
          dev: mode !== 'production',
          // Ensure the API Routes are included
          environment: 'node',
        }
      );

      const location = new URL(pathname, this.getDevServerUrl()!);
      return await getStaticContent(location);
    };

    const [resources, staticHtml] = await Promise.all([
      this.getStaticResourcesAsync({ mode, minify }),
      bundleStaticHtml(),
    ]);
    const content = await this.composeResourcesWithHtml({
      mode,
      resources,
      template: staticHtml,
      devBundleUrl: devBundleUrlPathname,
    });
    return {
      content,
      resources,
    };
  }

  async watchEnvironmentVariables() {
    if (!this.instance) {
      throw new Error(
        'Cannot observe environment variable changes without a running Metro instance.'
      );
    }
    if (!this.metro) {
      // This can happen when the run command is used and the server is already running in another
      // process.
      debug('Skipping Environment Variable observation because Metro is not running (headless).');
      return;
    }

    const envFiles = runtimeEnv
      .getFiles(process.env.NODE_ENV)
      .map((fileName) => path.join(this.projectRoot, fileName));

    observeFileChanges(
      {
        metro: this.metro,
        server: this.instance.server,
      },
      envFiles,
      () => {
        debug('Reloading environment variables...');
        // Force reload the environment variables.
        runtimeEnv.load(this.projectRoot, { force: true });
      }
    );
  }

  protected async startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance> {
    options.port = await this.resolvePortAsync(options);
    this.urlCreator = this.getUrlCreator(options);

    const parsedOptions = {
      port: options.port,
      maxWorkers: options.maxWorkers,
      resetCache: options.resetDevServer,

      // Use the unversioned metro config.
      // TODO: Deprecate this property when expo-cli goes away.
      unversioned: false,
    };

    // Required for symbolication:
    process.env.EXPO_DEV_SERVER_ORIGIN = `http://localhost:${options.port}`;

    const { metro, server, middleware, messageSocket } = await instantiateMetroAsync(
      this,
      parsedOptions
    );

    const manifestMiddleware = await this.getManifestMiddlewareAsync(options);

    // Important that we noop source maps for context modules as soon as possible.
    prependMiddleware(middleware, new ContextModuleSourceMapsMiddleware().getHandler());

    // We need the manifest handler to be the first middleware to run so our
    // routes take precedence over static files. For example, the manifest is
    // served from '/' and if the user has an index.html file in their project
    // then the manifest handler will never run, the static middleware will run
    // and serve index.html instead of the manifest.
    // https://github.com/expo/expo/issues/13114
    prependMiddleware(middleware, manifestMiddleware.getHandler());

    middleware.use(
      new InterstitialPageMiddleware(this.projectRoot, {
        // TODO: Prevent this from becoming stale.
        scheme: options.location.scheme ?? null,
      }).getHandler()
    );
    middleware.use(new ReactDevToolsPageMiddleware(this.projectRoot).getHandler());

    const deepLinkMiddleware = new RuntimeRedirectMiddleware(this.projectRoot, {
      onDeepLink: getDeepLinkHandler(this.projectRoot),
      getLocation: ({ runtime }) => {
        if (runtime === 'custom') {
          return this.urlCreator?.constructDevClientUrl();
        } else {
          return this.urlCreator?.constructUrl({
            scheme: 'exp',
          });
        }
      },
    });
    middleware.use(deepLinkMiddleware.getHandler());

    middleware.use(new CreateFileMiddleware(this.projectRoot).getHandler());

    // Append support for redirecting unhandled requests to the index.html page on web.
    if (this.isTargetingWeb()) {
      const { exp } = getConfig(this.projectRoot, { skipSDKVersionRequirement: true });
      const useWebSSG = exp.web?.output === 'static';

      // This MUST be after the manifest middleware so it doesn't have a chance to serve the template `public/index.html`.
      middleware.use(new ServeStaticMiddleware(this.projectRoot).getHandler());

      if (env.EXPO_USE_ROUTE_HANDLERS) {
        // Middleware for hosting middleware
        middleware.use(
          createRouteHandlerMiddleware(this.projectRoot, {
            ...options,
            getWebBundleUrl: manifestMiddleware.getWebBundleUrl.bind(manifestMiddleware),
          })
        );

        observeApiRouteChanges(
          this.projectRoot,
          {
            metro,
            server,
          },
          async (filepath, op) => {
            const isApiRoute = filepath.match(/\+api\.[tj]sx?$/);
            if (op === 'delete') {
              // update manifest
              console.log('update manifest');
              await refetchManifest(this.projectRoot, options);
            } else if (op === 'add' || (op === 'change' && !isApiRoute)) {
              console.log('invalidate manifest');
              // The manifest won't be fresh instantly so we should just clear it to ensure the next request will get the latest.
              manifestOperation.delete('manifest');
            }

            if (isApiRoute) {
              console.log(`[expo-cli] ${op} ${filepath}`);
              if (op === 'change' || op === 'add') {
                rebundleApiRoute(this.projectRoot, filepath, options);
              }

              if (op === 'delete') {
                // TODO: Cancel the bundling of the deleted route.
              }
            }
          }
        );
      }

      // This should come after the static middleware so it doesn't serve the favicon from `public/favicon.ico`.
      middleware.use(new FaviconMiddleware(this.projectRoot).getHandler());

      if (useWebSSG) {
        middleware.use(async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
          if (!req?.url) {
            return next();
          }

          // TODO: Formal manifest for allowed paths
          if (req.url.endsWith('.ico')) {
            return next();
          }
          if (req.url.includes('serializer.output=static')) {
            return next();
          }

          try {
            const { content } = await this.getStaticPageAsync(req.url, {
              mode: options.mode ?? 'development',
            });

            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          } catch (error: any) {
            res.setHeader('Content-Type', 'text/html');
            try {
              res.end(await this.renderStaticErrorAsync(error));
            } catch (staticError: any) {
              // Fallback error for when Expo Router is misconfigured in the project.
              res.end(
                '<span><h3>Internal Error:</h3><b>Project is not setup correctly for static rendering (check terminal for more info):</b><br/>' +
                  error.message +
                  '<br/><br/>' +
                  staticError.message +
                  '</span>'
              );
            }
          }
        });
      }

      // This MUST run last since it's the fallback.
      if (!useWebSSG) {
        middleware.use(
          new HistoryFallbackMiddleware(manifestMiddleware.getHandler().internal).getHandler()
        );
      }
    }
    // Extend the close method to ensure that we clean up the local info.
    const originalClose = server.close.bind(server);

    server.close = (callback?: (err?: Error) => void) => {
      return originalClose((err?: Error) => {
        this.instance = null;
        this.metro = null;
        callback?.(err);
      });
    };

    this.metro = metro;
    return {
      server,
      location: {
        // The port is the main thing we want to send back.
        port: options.port,
        // localhost isn't always correct.
        host: 'localhost',
        // http is the only supported protocol on native.
        url: `http://localhost:${options.port}`,
        protocol: 'http',
      },
      middleware,
      messageSocket,
    };
  }

  public async waitForTypeScriptAsync(): Promise<boolean> {
    if (!this.instance) {
      throw new Error('Cannot wait for TypeScript without a running server.');
    }

    return new Promise<boolean>((resolve) => {
      if (!this.metro) {
        // This can happen when the run command is used and the server is already running in another
        // process. In this case we can't wait for the TypeScript check to complete because we don't
        // have access to the Metro server.
        debug('Skipping TypeScript check because Metro is not running (headless).');
        return resolve(false);
      }

      const off = metroWatchTypeScriptFiles({
        projectRoot: this.projectRoot,
        server: this.instance!.server,
        metro: this.metro,
        tsconfig: true,
        throttle: true,
        eventTypes: ['change', 'add'],
        callback: async () => {
          // Run once, this prevents the TypeScript project prerequisite from running on every file change.
          off();
          const { TypeScriptProjectPrerequisite } = await import(
            '../../doctor/typescript/TypeScriptProjectPrerequisite'
          );

          try {
            const req = new TypeScriptProjectPrerequisite(this.projectRoot);
            await req.bootstrapAsync();
            resolve(true);
          } catch (error: any) {
            // Ensure the process doesn't fail if the TypeScript check fails.
            // This could happen during the install.
            Log.log();
            Log.error(
              chalk.red`Failed to automatically setup TypeScript for your project. Try restarting the dev server to fix.`
            );
            Log.exception(error);
            resolve(false);
          }
        },
      });
    });
  }

  public async startTypeScriptServices() {
    startTypescriptTypeGenerationAsync({
      server: this.instance!.server,
      metro: this.metro,
      projectRoot: this.projectRoot,
    });
  }

  protected getConfigModuleIds(): string[] {
    return ['./metro.config.js', './metro.config.json', './rn-cli.config.js'];
  }
}

export function getDeepLinkHandler(projectRoot: string): DeepLinkHandler {
  return async ({ runtime }) => {
    if (runtime === 'expo') return;
    const { exp } = getConfig(projectRoot);
    await logEventAsync('dev client start command', {
      status: 'started',
      ...getDevClientProperties(projectRoot, exp),
    });
  };
}

function htmlFromSerialAssets(
  assets: SerialAsset[],
  { dev, template, bundleUrl }: { dev: boolean; template: string; bundleUrl?: string }
) {
  // Combine the CSS modules into tags that have hot refresh data attributes.
  const styleString = assets
    .filter((asset) => asset.type === 'css')
    .map(({ metadata, filename, source }) => {
      if (dev) {
        return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + '\n</style>';
      } else {
        return [
          `<link rel="preload" href="/${filename}" as="style">`,
          `<link rel="stylesheet" href="/${filename}">`,
        ].join('');
      }
    })
    .join('');

  const jsAssets = assets.filter((asset) => asset.type === 'js');

  const scripts = bundleUrl
    ? `<script src="${bundleUrl}" defer></script>`
    : jsAssets
        .map(({ filename }) => {
          return `<script src="/${filename}" defer></script>`;
        })
        .join('');

  return template
    .replace('</head>', `${styleString}</head>`)
    .replace('</body>', `${scripts}\n</body>`);
}
