/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import * as runtimeEnv from '@expo/env';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import chalk from 'chalk';
import { AssetData } from 'metro';
import fetch from 'node-fetch';
import path from 'path';

import { bundleApiRoute, invalidateApiRouteCache } from './bundleApiRoutes';
import { createRouteHandlerMiddleware } from './createServerRouteMiddleware';
import { ExpoRouterServerManifestV1, fetchManifest } from './fetchRouterManifest';
import { instantiateMetroAsync } from './instantiateMetro';
import { metroWatchTypeScriptFiles } from './metroWatchTypeScriptFiles';
import {
  getRouterDirectoryModuleIdWithManifest,
  hasWarnedAboutApiRoutes,
  isApiRouteConvention,
  warnInvalidWebOutput,
} from './router';
import { serializeHtmlWithAssets } from './serializeHtml';
import { observeAnyFileChanges, observeFileChanges } from './waitForMetroToObserveTypeScriptFile';
import { ExportAssetMap } from '../../../export/saveAssets';
import { Log } from '../../../log';
import getDevClientProperties from '../../../utils/analytics/getDevClientProperties';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { CommandError } from '../../../utils/errors';
import { getFreePortAsync } from '../../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { getStaticRenderFunctions } from '../getStaticRenderFunctions';
import { ContextModuleSourceMapsMiddleware } from '../middleware/ContextModuleSourceMapsMiddleware';
import { CreateFileMiddleware } from '../middleware/CreateFileMiddleware';
import { DevToolsPluginMiddleware } from '../middleware/DevToolsPluginMiddleware';
import { FaviconMiddleware } from '../middleware/FaviconMiddleware';
import { HistoryFallbackMiddleware } from '../middleware/HistoryFallbackMiddleware';
import { InterstitialPageMiddleware } from '../middleware/InterstitialPageMiddleware';
import { resolveMainModuleName } from '../middleware/ManifestMiddleware';
import { ReactDevToolsPageMiddleware } from '../middleware/ReactDevToolsPageMiddleware';
import {
  DeepLinkHandler,
  RuntimeRedirectMiddleware,
} from '../middleware/RuntimeRedirectMiddleware';
import { ServeStaticMiddleware } from '../middleware/ServeStaticMiddleware';
import {
  shouldEnableAsyncImports,
  createBundleUrlPath,
  getBaseUrlFromExpoConfig,
  getAsyncRoutesFromExpoConfig,
} from '../middleware/metroOptions';
import { prependMiddleware } from '../middleware/mutations';
import { startTypescriptTypeGenerationAsync } from '../type-generation/startTypescriptTypeGeneration';

export type ExpoRouterRuntimeManifest = Awaited<
  ReturnType<typeof import('expo-router/build/static/renderStaticContent').getManifest>
>;

export class ForwardHtmlError extends CommandError {
  constructor(
    message: string,
    public html: string,
    public statusCode: number
  ) {
    super(message);
  }
}

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 8081;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

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

  async exportExpoRouterApiRoutesAsync({
    mode,
    outputDir,
    prerenderManifest,
    baseUrl,
    routerRoot,
  }: {
    mode: 'development' | 'production';
    outputDir: string;
    // This does not contain the API routes info.
    prerenderManifest: ExpoRouterServerManifestV1;
    baseUrl: string;
    routerRoot: string;
  }): Promise<{ files: ExportAssetMap; manifest: ExpoRouterServerManifestV1<string> }> {
    const appDir = path.join(this.projectRoot, routerRoot);
    const manifest = await this.getExpoRouterRoutesManifestAsync({ appDir });

    const files: ExportAssetMap = new Map();

    for (const route of manifest.apiRoutes) {
      const filepath = path.join(appDir, route.file);
      const contents = await bundleApiRoute(this.projectRoot, filepath, {
        mode,
        routerRoot,
        port: this.getInstance()?.location.port,
        shouldThrow: true,
        baseUrl,
      });
      const artifactFilename = path.join(
        outputDir,
        path.relative(appDir, filepath.replace(/\.[tj]sx?$/, '.js'))
      );
      if (contents) {
        files.set(artifactFilename, {
          contents: contents.src,
          targetDomain: 'server',
        });
      }
      // Remap the manifest files to represent the output files.
      route.file = artifactFilename;
    }

    return {
      manifest: {
        ...manifest,
        htmlRoutes: prerenderManifest.htmlRoutes,
      },
      files,
    };
  }

  async getExpoRouterRoutesManifestAsync({ appDir }: { appDir: string }) {
    // getBuiltTimeServerManifest
    const manifest = await fetchManifest(this.projectRoot, {
      asJson: true,
      appDir,
    });

    if (!manifest) {
      throw new CommandError(
        'EXPO_ROUTER_SERVER_MANIFEST',
        'Unexpected error: server manifest could not be fetched.'
      );
    }

    return manifest;
  }

  async getStaticRenderFunctionAsync({
    mode,
    minify = mode !== 'development',
    baseUrl,
    routerRoot,
  }: {
    mode: 'development' | 'production';
    minify?: boolean;
    baseUrl: string;
    routerRoot: string;
  }): Promise<{
    serverManifest: ExpoRouterServerManifestV1;
    manifest: ExpoRouterRuntimeManifest;
    renderAsync: (path: string) => Promise<string>;
  }> {
    const url = this.getDevServerUrl()!;

    const { getStaticContent, getManifest, getBuildTimeServerManifestAsync } =
      await getStaticRenderFunctions(this.projectRoot, url, {
        minify,
        dev: mode !== 'production',
        // Ensure the API Routes are included
        environment: 'node',
        baseUrl,
        routerRoot,
      });

    return {
      serverManifest: await getBuildTimeServerManifestAsync(),
      // Get routes from Expo Router.
      manifest: await getManifest({ fetchData: true, preserveApiRoutes: false }),
      // Get route generating function
      async renderAsync(path: string) {
        return await getStaticContent(new URL(path, url));
      },
    };
  }

  async getStaticResourcesAsync({
    mode,
    minify = mode !== 'development',
    includeSourceMaps,
    baseUrl,
    mainModuleName,
    isExporting,
    asyncRoutes,
    routerRoot,
  }: {
    isExporting: boolean;
    mode: string;
    minify?: boolean;
    includeSourceMaps?: boolean;
    baseUrl?: string;
    mainModuleName?: string;
    asyncRoutes: boolean;
    routerRoot: string;
  }): Promise<{ artifacts: SerialAsset[]; assets?: AssetData[] }> {
    const devBundleUrlPathname = createBundleUrlPath({
      platform: 'web',
      mode,
      minify,
      environment: 'client',
      serializerOutput: 'static',
      serializerIncludeMaps: includeSourceMaps,
      mainModuleName:
        mainModuleName ?? resolveMainModuleName(this.projectRoot, { platform: 'web' }),
      lazy: shouldEnableAsyncImports(this.projectRoot),
      asyncRoutes,
      baseUrl,
      isExporting,
      routerRoot,
      bytecode: false,
    });

    const bundleUrl = new URL(devBundleUrlPathname, this.getDevServerUrl()!);

    // Fetch the generated HTML from our custom Metro serializer
    const results = await fetch(bundleUrl.toString());

    const txt = await results.text();

    let data: any;
    try {
      data = JSON.parse(txt);
    } catch (error: any) {
      debug(txt);

      // Metro can throw this error when the initial module id cannot be resolved.
      if (!results.ok && txt.startsWith('<!DOCTYPE html>')) {
        throw new ForwardHtmlError(
          `Metro failed to bundle the project. Check the console for more information.`,
          txt,
          results.status
        );
      }

      Log.error(
        'Failed to generate resources with Metro, the Metro config may not be using the correct serializer. Ensure the metro.config.js is extending the expo/metro-config and is not overriding the serializer.'
      );
      throw error;
    }

    // NOTE: This could potentially need more validation in the future.
    if ('artifacts' in data && Array.isArray(data.artifacts)) {
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

  private async getStaticPageAsync(
    pathname: string,
    {
      mode,
      minify = mode !== 'development',
      baseUrl,
      routerRoot,
      isExporting,
      asyncRoutes,
    }: {
      isExporting: boolean;
      mode: 'development' | 'production';
      minify?: boolean;
      baseUrl: string;
      asyncRoutes: boolean;
      routerRoot: string;
    }
  ) {
    const devBundleUrlPathname = createBundleUrlPath({
      platform: 'web',
      mode,
      environment: 'client',
      mainModuleName: resolveMainModuleName(this.projectRoot, { platform: 'web' }),
      lazy: shouldEnableAsyncImports(this.projectRoot),
      baseUrl,
      isExporting,
      asyncRoutes,
      routerRoot,
      bytecode: false,
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
          baseUrl,
          routerRoot,
        }
      );

      const location = new URL(pathname, this.getDevServerUrl()!);
      return await getStaticContent(location);
    };

    const [{ artifacts: resources }, staticHtml] = await Promise.all([
      this.getStaticResourcesAsync({ isExporting, mode, minify, baseUrl, asyncRoutes, routerRoot }),
      bundleStaticHtml(),
    ]);
    const content = serializeHtmlWithAssets({
      mode,
      resources,
      template: staticHtml,
      devBundleUrl: devBundleUrlPathname,
      baseUrl,
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
    };

    // Required for symbolication:
    process.env.EXPO_DEV_SERVER_ORIGIN = `http://localhost:${options.port}`;

    const { metro, server, middleware, messageSocket } = await instantiateMetroAsync(
      this,
      parsedOptions,
      {
        isExporting: !!options.isExporting,
      }
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
    middleware.use(
      new DevToolsPluginMiddleware(this.projectRoot, this.devToolsPluginManager).getHandler()
    );

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
      const config = getConfig(this.projectRoot, { skipSDKVersionRequirement: true });
      const { exp } = config;
      const useServerRendering = ['static', 'server'].includes(exp.web?.output ?? '');

      // This MUST be after the manifest middleware so it doesn't have a chance to serve the template `public/index.html`.
      middleware.use(new ServeStaticMiddleware(this.projectRoot).getHandler());

      // This should come after the static middleware so it doesn't serve the favicon from `public/favicon.ico`.
      middleware.use(new FaviconMiddleware(this.projectRoot).getHandler());

      if (useServerRendering) {
        const baseUrl = getBaseUrlFromExpoConfig(exp);
        const asyncRoutes = getAsyncRoutesFromExpoConfig(exp, options.mode ?? 'development', 'web');
        const routerRoot = getRouterDirectoryModuleIdWithManifest(this.projectRoot, exp);
        const appDir = path.join(this.projectRoot, routerRoot);
        middleware.use(
          createRouteHandlerMiddleware(this.projectRoot, {
            ...options,
            appDir,
            baseUrl,
            routerRoot,
            config,
            getWebBundleUrl: manifestMiddleware.getWebBundleUrl.bind(manifestMiddleware),
            getStaticPageAsync: (pathname) => {
              return this.getStaticPageAsync(pathname, {
                isExporting: !!options.isExporting,
                mode: options.mode ?? 'development',
                minify: options.minify,
                baseUrl,
                asyncRoutes,
                routerRoot,
              });
            },
          })
        );

        observeAnyFileChanges(
          {
            metro,
            server,
          },
          (events) => {
            if (exp.web?.output === 'server') {
              // NOTE(EvanBacon): We aren't sure what files the API routes are using so we'll just invalidate
              // aggressively to ensure we always have the latest. The only caching we really get here is for
              // cases where the user is making subsequent requests to the same API route without changing anything.
              // This is useful for testing but pretty suboptimal. Luckily our caching is pretty aggressive so it makes
              // up for a lot of the overhead.
              invalidateApiRouteCache();
            } else if (!hasWarnedAboutApiRoutes()) {
              for (const event of events) {
                if (
                  // If the user did not delete a file that matches the Expo Router API Route convention, then we should warn that
                  // API Routes are not enabled in the project.
                  event.metadata?.type !== 'd' &&
                  // Ensure the file is in the project's routes directory to prevent false positives in monorepos.
                  event.filePath.startsWith(appDir) &&
                  isApiRouteConvention(event.filePath)
                ) {
                  warnInvalidWebOutput();
                }
              }
            }
          }
        );
      } else {
        // This MUST run last since it's the fallback.
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
            '../../doctor/typescript/TypeScriptProjectPrerequisite.js'
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
    return startTypescriptTypeGenerationAsync({
      server: this.instance?.server,
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
