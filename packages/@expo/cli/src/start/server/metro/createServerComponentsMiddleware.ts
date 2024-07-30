/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getRscMiddleware } from '@expo/server/build/middleware/rsc';
import assert from 'assert';
import path from 'path';
import resolveFrom from 'resolve-from';

import { ExportAssetMap } from '../../../export/saveAssets';
import { stripAnsi } from '../../../utils/ansi';
import { CommandError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';
import { streamToStringAsync } from '../../../utils/stream';
import { createBuiltinAPIRequestHandler } from '../middleware/createBuiltinAPIRequestHandler';
import { getMetroServerRoot } from '../middleware/ManifestMiddleware';
import { createBundleUrlSearchParams, ExpoMetroOptions } from '../middleware/metroOptions';
import { logMetroError } from './metroErrorInterface';

const debug = require('debug')('expo:rsc') as typeof console.log;

type SSRLoadModuleFunc = <T extends Record<string, any>>(
  filePath: string,
  specificOptions?: Partial<ExpoMetroOptions>,
  extras?: { hot?: boolean }
) => Promise<T>;

const getMetroServerRootMemo = memoize(getMetroServerRoot);

export function createServerComponentsMiddleware(
  projectRoot: string,
  {
    rscPath,
    instanceMetroOptions,
    ssrLoadModule,
    getServerUrl,
  }: {
    rscPath: string;
    instanceMetroOptions: Partial<ExpoMetroOptions>;
    ssrLoadModule: SSRLoadModuleFunc;
    getServerUrl: () => string;
  }
) {
  const rscMiddleware = getRscMiddleware({
    config: {},
    // Disabled in development
    baseUrl: '',
    rscPath,
    renderRsc: async (args) => {
      // Dev server-only implementation.
      try {
        return await renderRscToReadableStream({
          ...args,
          body: args.body!,
        });
      } catch (error: any) {
        // If you get a codeFrame error during SSR like when using a Class component in React Server Components, then this
        // will throw with:
        // {
        //   rawObject: {
        //     type: 'TransformError',
        //     lineNumber: 0,
        //     errors: [ [Object] ],
        //     name: 'SyntaxError',
        //     message: '...',
        //   }
        // }

        // TODO: Revisit all error handling now that we do direct metro bundling...
        await logMetroError(projectRoot, { error });

        const sanitizedServerMessage = stripAnsi(error.message) ?? error.message;
        throw new Response(sanitizedServerMessage, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
    },
  });

  let rscPathPrefix = rscPath;
  if (rscPathPrefix !== '/') {
    rscPathPrefix += '/';
  }

  async function getExpoRouterRscEntriesGetterAsync({ platform }: { platform: string }) {
    return ssrLoadModule<typeof import('expo-router/build/rsc/router/expo-definedRouter')>(
      resolveFrom(projectRoot, 'expo-router/src/rsc/router/expo-definedRouter.ts'),
      {
        environment: 'react-server',
        platform,
      },
      {
        hot: true,
      }
    );
  }

  function getResolveClientEntry(context: { platform: string; engine?: 'hermes' | null }) {
    const serverRoot = getMetroServerRootMemo(projectRoot);

    const {
      mode,
      minify = false,
      isExporting,
      baseUrl,
      routerRoot,
      asyncRoutes,
      preserveEnvVars,
      reactCompiler,
      lazy,
    } = instanceMetroOptions;

    assert(
      isExporting != null &&
        baseUrl != null &&
        mode != null &&
        routerRoot != null &&
        asyncRoutes != null,
      `The server must be started. (isExporting: ${isExporting}, baseUrl: ${baseUrl}, mode: ${mode}, routerRoot: ${routerRoot}, asyncRoutes: ${asyncRoutes})`
    );

    return (file: string) => {
      if (isExporting) {
        const relativeFilePath = path.relative(serverRoot, file);
        return {
          id: relativeFilePath,
          chunks: [
            // TODO: Add a lookup later which reads from the SSR manifest to get the correct chunk.
            'chunk:' + relativeFilePath,
          ],
        };
      }

      const searchParams = createBundleUrlSearchParams({
        mainModuleName: '',
        platform: context.platform,
        mode,
        minify,
        lazy,
        preserveEnvVars,
        asyncRoutes,
        baseUrl,
        routerRoot,
        isExporting,
        reactCompiler: !!reactCompiler,
        engine: context.engine ?? undefined,
        bytecode: false,
        clientBoundaries: [],
        inlineSourceMap: false,
      });

      searchParams.set('dev', String(__DEV__));
      searchParams.set('resolver.clientboundary', String(true));
      searchParams.set('modulesOnly', String(true));
      searchParams.set('runModule', String(false));

      const clientReferenceUrl = new URL(getServerUrl());

      // TICKLE: Handshake 1
      searchParams.set('xRSC', '1');

      clientReferenceUrl.search = searchParams.toString();

      const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
      const relativeFilePath = path.relative(serverRoot, filePath);

      clientReferenceUrl.pathname = relativeFilePath;

      // Ensure url.pathname ends with '.bundle'
      if (!clientReferenceUrl.pathname.endsWith('.bundle')) {
        clientReferenceUrl.pathname += '.bundle';
      }

      // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
      const id = clientReferenceUrl.pathname + clientReferenceUrl.search;

      return { id: relativeFilePath, chunks: [id] };
    };
  }

  const rscRendererCache = new Map<string, typeof import('expo-router/src/rsc/rsc-renderer')>();

  async function getRscRendererAsync(platform: string) {
    // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
    if (rscRendererCache.has(platform)) {
      return rscRendererCache.get(platform)!;
    }

    // TODO: Extract CSS Modules / Assets from the bundler process
    const renderer = await ssrLoadModule<typeof import('expo-router/src/rsc/rsc-renderer')>(
      'expo-router/src/rsc/rsc-renderer.ts',
      {
        environment: 'react-server',
        platform,
      }
    );

    rscRendererCache.set(platform, renderer);
    return renderer;
  }

  const rscRenderContext = new Map<string, any>();

  function getRscRenderContext(platform: string) {
    // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
    if (rscRenderContext.has(platform)) {
      return rscRenderContext.get(platform)!;
    }

    const context = {};

    rscRenderContext.set(platform, context);
    return context;
  }

  const clientModuleMap = new Map<string, Map<string, Set<string>>>();

  async function renderRscToReadableStream(
    {
      input,
      searchParams,
      method,
      platform,
      body,
      engine,
      contentType,
    }: {
      input: string;
      searchParams: URLSearchParams;
      method: 'POST' | 'GET';
      platform: string;
      body?: ReadableStream<Uint8Array>;
      engine?: 'hermes' | null;
      contentType?: string;
    },
    isExporting: boolean | undefined = instanceMetroOptions.isExporting
  ) {
    assert(isExporting != null, 'The server must be started before calling ssrLoadModule.');

    if (method === 'POST') {
      assert(body, 'Server request must be provided when method is POST (server actions)');
    }

    const { renderRsc } = await getRscRendererAsync(platform);

    return renderRsc(
      {
        body,
        searchParams,
        context: getRscRenderContext(platform),
        config: {},
        method,
        input,
        contentType,
        moduleIdCallback: !isExporting
          ? undefined
          : (moduleInfo: { id: string; chunks: string[]; name: string; async: boolean }) => {
              let platformSet = clientModuleMap.get(platform);
              if (!platformSet) {
                platformSet = new Map();
                clientModuleMap.set(platform, platformSet);
              }
              //TODO: This isn't right
              const normalizedRouteKey = (
                require('expo-router/build/matchers') as typeof import('expo-router/build/matchers')
              ).getNameFromFilePath(input);

              // Collect the client boundaries while rendering the server components.
              // Indexed by routes.
              let idSet = platformSet.get(normalizedRouteKey);
              if (!idSet) {
                idSet = new Set();
                platformSet.set(normalizedRouteKey, idSet);
              }
              idSet.add(moduleInfo.id);
            },
      },
      {
        isExporting,
        entries: await getExpoRouterRscEntriesGetterAsync({ platform }),
        resolveClientEntry: getResolveClientEntry({ platform, engine }),
      }
    );
  }

  const getClientModules = (platform: string, input: string) => {
    const key = (
      require('expo-router/build/matchers') as typeof import('expo-router/build/matchers')
    ).getNameFromFilePath(input);

    const platformSet = clientModuleMap.get(platform);
    if (!platformSet) {
      throw new CommandError(
        `No client modules found for platform "${platform}". Expected one of: ${Array.from(
          clientModuleMap.keys()
        ).join(', ')}`
      );
    }

    if (!platformSet.has(key)) {
      throw new CommandError(
        `No client modules found for "${key}". Expected one of: ${Array.from(
          platformSet.keys()
        ).join(', ')}`
      );
    }
    const idSet = platformSet.get(key);
    return Array.from(idSet || []);
  };

  return {
    exportPathsWithChunks: async (
      payloads: RscExportPayload[],
      moduleIdToSplitBundle: Record<string, string>,
      files: ExportAssetMap
    ) => {
      payloads.forEach(({ rsc, input, path }) => {
        let contents = rsc;

        // TODO: Flight files need to be platform-segmented.
        // HACK: This basically just replaces the module ID in the manifest with the new module ID since we don't know until after the server bundle has run.

        console.log('Updating RSC:', input, rsc);
        for (const match of contents.matchAll(/"(chunk:([^"]+))"/g)) {
          const [_, moduleIdPlaceholder] = match;
          console.log('- Match:', moduleIdPlaceholder);
          const moduleId = moduleIdPlaceholder.replace(/^chunk:/, '');
          if (moduleId in moduleIdToSplitBundle) {
            console.log('- Match+bundle:', moduleIdToSplitBundle[moduleIdPlaceholder]);
            const newModuleId = moduleIdToSplitBundle[moduleId];
            if (newModuleId) {
              console.log('Replacing', moduleId, 'with', newModuleId);
              contents = contents.replace(moduleIdPlaceholder, newModuleId);
            } else {
              console.log('Removing', moduleId);
              contents = contents.replace(`"${moduleIdPlaceholder}"`, '');
            }
          } else {
            // Can occur on iOS where there is no bundle splitting.
            console.warn('Removing missing', moduleId, Object.keys(moduleIdToSplitBundle));
            contents = contents.replace(`"${moduleIdPlaceholder}"`, '');
            // Remove the `"chunk:..."` entry from the manifest.
            // contents = contents.replace(`"${moduleId}"`, '');
          }
        }

        files.set(path, {
          contents,
          targetDomain: 'client',
          rscId: input,
        });
      });
    },

    async exportRoutesAsync({ platform }: { platform: string }) {
      const payloads: RscExportPayload[] = [];

      // TODO: Extract CSS Modules / Assets from the bundler process
      const { getBuildConfig } = (await getExpoRouterRscEntriesGetterAsync({ platform })).default;

      // Get all the routes to render.
      const buildConfig = await getBuildConfig!(async () =>
        // TODO: Rework prefetching code to use Metro runtime.
        []
      );

      const clientModules = new Set<string>();

      await Promise.all(
        Array.from(buildConfig).map(async ({ entries }) => {
          for (const { input } of entries || []) {
            const destRscFile = path.join('_flight', encodeInput(input));

            // TODO: Expose via middleware
            const pipe = await renderRscToReadableStream(
              {
                input,
                method: 'GET',
                platform,
                searchParams: new URLSearchParams(),
              },
              true
            );

            const rsc = await streamToStringAsync(pipe);
            debug('RSC Payload', { platform, input, rsc });

            payloads.push({
              path: destRscFile,
              rsc,
              input,
            });

            const clientBoundaries = getClientModules(platform, input);
            for (const clientBoundary of clientBoundaries) {
              clientModules.add(clientBoundary);
            }
          }
        })
      );
      return { clientBoundaries: Array.from(clientModules), payloads };
    },

    middleware: createBuiltinAPIRequestHandler(
      // Match `/_flight/[...path]`
      (req) => {
        return getFullUrl(req.url).pathname.startsWith(rscPathPrefix);
      },
      rscMiddleware
    ),
    onReloadRscEvent: () => {
      // NOTE: We cannot clear the renderer context because it would break the mounted context state.

      // Clear the render context to ensure that the next render is a fresh start.
      rscRenderContext.clear();
    },
  };
}

type RscExportPayload = {
  rsc: string;
  input: string;
  path: string;
};

const getFullUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return new URL(url, 'http://localhost:0');
  }
};

const fileURLToFilePath = (fileURL: string) => {
  if (!fileURL.startsWith('file://')) {
    throw new Error('Not a file URL');
  }
  return decodeURI(fileURL.slice('file://'.length));
};

const encodeInput = (input: string) => {
  if (input === '') {
    return 'index.txt';
  }
  if (input === 'index') {
    throw new Error('Input should not be `index`');
  }
  if (input.startsWith('/')) {
    throw new Error('Input should not start with `/`');
  }
  if (input.endsWith('/')) {
    throw new Error('Input should not end with `/`');
  }
  return input + '.txt';
};
