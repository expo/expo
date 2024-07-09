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

import { logMetroError } from './metroErrorInterface';
import { stripAnsi } from '../../../utils/ansi';
import { getMetroServerRoot } from '../middleware/ManifestMiddleware';
import { createBuiltinAPIRequestHandler } from '../middleware/createBuiltinAPIRequestHandler';
import { createBundleUrlSearchParams, ExpoMetroOptions } from '../middleware/metroOptions';

type SSRLoadModuleFunc = <T extends Record<string, any>>(
  filePath: string,
  specificOptions?: Partial<ExpoMetroOptions>,
  extras?: { hot?: boolean }
) => Promise<T>;

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
    // TODO: Memoize this
    const serverRoot = getMetroServerRoot(projectRoot);

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

        // TODO:
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
      const id = clientReferenceUrl.pathname + clientReferenceUrl.search; // + clientReferenceUrl.hash;

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
      },
      {
        // hot: true,
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
      },
      {
        isExporting: false,
        resolveClientEntry: getResolveClientEntry({ platform, engine }),
        // @ts-expect-error: TODO
        entries: await getExpoRouterRscEntriesGetterAsync({ platform }),
      }
    );
  }

  return {
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

const getFullUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (error: any) {
    if (error.code === 'ERR_INVALID_URL') {
      return new URL(url, 'http://localhost:0');
    }
    throw error;
  }
};

const fileURLToFilePath = (fileURL: string) => {
  if (!fileURL.startsWith('file://')) {
    throw new Error('Not a file URL');
  }
  return decodeURI(fileURL.slice('file://'.length));
};
