/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import { prependMiddleware } from '@expo/dev-server';
import * as runtimeEnv from '@expo/env';
import assert from 'assert';
import chalk from 'chalk';
import path from 'path';
import resolveFrom from 'resolve-from';

import {
  createBundleAsyncFunctionAsync,
  HelperOptions,
  SerialAsset,
} from '../../../export/fork-bundleAsync';
import { Log } from '../../../log';
import getDevClientProperties from '../../../utils/analytics/getDevClientProperties';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { CommandError } from '../../../utils/errors';
import { getFreePortAsync } from '../../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import {
  evalStaticRenderFunctionsBundle,
  stripProcess,
  wrapBundle,
} from '../getStaticRenderFunctions';
import { ContextModuleSourceMapsMiddleware } from '../middleware/ContextModuleSourceMapsMiddleware';
import { CreateFileMiddleware } from '../middleware/CreateFileMiddleware';
import { FaviconMiddleware } from '../middleware/FaviconMiddleware';
import { HistoryFallbackMiddleware } from '../middleware/HistoryFallbackMiddleware';
import { InterstitialPageMiddleware } from '../middleware/InterstitialPageMiddleware';
import {
  createBundleUrlPath,
  getEntryWithServerRoot,
  resolveMainModuleName,
  shouldEnableAsyncImports,
} from '../middleware/ManifestMiddleware';
import { ReactDevToolsPageMiddleware } from '../middleware/ReactDevToolsPageMiddleware';
import {
  DeepLinkHandler,
  RuntimeRedirectMiddleware,
} from '../middleware/RuntimeRedirectMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import { ServeStaticMiddleware } from '../middleware/ServeStaticMiddleware';
import { startTypescriptTypeGenerationAsync } from '../type-generation/startTypescriptTypeGeneration';
import { instantiateMetroAsync } from './instantiateMetro';
import { getErrorOverlayHtmlAsync } from './metroErrorInterface';
import { metroWatchTypeScriptFiles } from './metroWatchTypeScriptFiles';
import { observeFileChanges } from './waitForMetroToObserveTypeScriptFile';

// TODO(EvanBacon): Group all the code together and version.
const getRenderModuleId = (projectRoot: string): string => {
  const moduleId = resolveFrom.silent(projectRoot, 'expo-router/node/render.js');
  if (!moduleId) {
    throw new Error(
      `A version of expo-router with Node.js support is not installed in the project.`
    );
  }

  return moduleId;
};

class ForwardHtmlError extends CommandError {
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
  private metroBuildAsync: ReturnType<typeof createBundleAsyncFunctionAsync> | null = null;

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

    const { getStaticContent, getManifest } = await this.metroRequireStaticRenderFunctionsAsync({
      dev: mode !== 'production',
      minify,
    });
    return {
      // Get routes from Expo Router.
      manifest: await getManifest({ fetchData: true }),
      // Get route generating function
      async renderAsync(path: string) {
        return await getStaticContent(new URL(path, url));
      },
    };
  }

  /** Returns a list of static assets that must be added to the HTML files in order to be preloaded on web. */
  async getStaticResourcesAsync({
    mode,
    minify = mode !== 'development',
  }: {
    mode: string;
    minify?: boolean;
  }) {
    const metroBuildAsync = this.metroBuildAsync;
    assert(metroBuildAsync, 'Dev server must be started');

    const { artifacts } = await metroBuildAsync(
      {
        // customResolverOptions: {
        //   environment: 'client',
        // },
        // // @ts-expect-error
        // customTransformOptions: {
        //   environment: 'client',
        // },
        entryFile: getEntryWithServerRoot(this.projectRoot, getConfig(this.projectRoot), 'web'),
        dev: mode !== 'production',
        platform: 'web',
        minify,
        hot: false,
        lazy: shouldEnableAsyncImports(this.projectRoot),
      },
      {
        css: true,
        assets: false,
        hermes: false,
      }
    );

    return artifacts!;
  }

  private async renderStaticErrorAsync(error: Error) {
    return getErrorOverlayHtmlAsync({
      error,
      projectRoot: this.projectRoot,
    });
  }

  private async metroRequireStaticRenderFunctionsAsync(
    options: Omit<HelperOptions, 'platform' | 'entryFile'>
  ) {
    const code = await this.buildForNodeAsync({
      ...options,
      entryFile: getRenderModuleId(this.projectRoot),
    });

    return evalStaticRenderFunctionsBundle(this.projectRoot, code);
  }

  /** @returns the js file contents required to generate the static generation function. */
  private async buildForNodeAsync(options: Omit<HelperOptions, 'platform'>): Promise<string> {
    const metroBuildAsync = this.metroBuildAsync;
    assert(metroBuildAsync, 'Dev server must be started');
    const { code } = await metroBuildAsync(
      {
        customResolverOptions: {
          environment: 'node',
          ...options.customResolverOptions,
        },
        // @ts-expect-error
        customTransformOptions: {
          environment: 'node',
          ...options.customTransformOptions,
        },
        ...options,
        platform: 'web',
        hot: false,
        lazy: false,
      },
      {
        css: false,
        assets: false,
        hermes: false,
      }
    );

    let bun = wrapBundle(code);

    // This exposes the entire environment to the bundle.
    // if (props.environment === 'node') {
    bun = stripProcess(bun);

    return bun;
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
      lazy: shouldEnableAsyncImports(this.projectRoot),
    });

    const bundleStaticHtml = async (): Promise<string> => {
      const { getStaticContent } = await this.metroRequireStaticRenderFunctionsAsync({
        minify: false,
        dev: mode !== 'production',
      });

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

    const { metro, server, middleware, messageSocket, buildAsync } = await instantiateMetroAsync(
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

          try {
            const { content } = await this.getStaticPageAsync(req.url, {
              mode: options.mode ?? 'development',
            });

            res.setHeader('Content-Type', 'text/html');
            res.end(content);
          } catch (error: any) {
            res.setHeader('Content-Type', 'text/html');
            // Forward the Metro server response as-is. It won't be pretty, but at least it will be accurate.
            if (error instanceof ForwardHtmlError) {
              res.statusCode = error.statusCode;
              res.end(error.html);
              return;
            }
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
        this.metroBuildAsync = null;
        callback?.(err);
      });
    };

    this.metro = metro;
    this.metroBuildAsync = buildAsync;
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
