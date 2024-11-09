/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getMetroServerRoot } from '@expo/config/paths';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import { getRscMiddleware } from '@expo/server/build/middleware/rsc';
import assert from 'assert';
import path from 'path';

import { logMetroError } from './metroErrorInterface';
import { ExportAssetMap } from '../../../export/saveAssets';
import { stripAnsi } from '../../../utils/ansi';
import { memoize } from '../../../utils/fn';
import { getIpAddress } from '../../../utils/ip';
import { streamToStringAsync } from '../../../utils/stream';
import { createBuiltinAPIRequestHandler } from '../middleware/createBuiltinAPIRequestHandler';
import {
  createBundleUrlSearchParams,
  ExpoMetroOptions,
  getMetroOptionsFromUrl,
} from '../middleware/metroOptions';

const debug = require('debug')('expo:rsc') as typeof console.log;

type SSRLoadModuleArtifactsFunc = (
  filePath: string,
  specificOptions?: Partial<ExpoMetroOptions>
) => Promise<{ artifacts: SerialAsset[]; src: string }>;

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
    ssrLoadModuleArtifacts,
    useClientRouter,
    createModuleId,
  }: {
    rscPath: string;
    instanceMetroOptions: Partial<ExpoMetroOptions>;
    ssrLoadModule: SSRLoadModuleFunc;
    ssrLoadModuleArtifacts: SSRLoadModuleArtifactsFunc;
    useClientRouter: boolean;
    createModuleId: (
      filePath: string,
      context: { platform: string; environment: string }
    ) => string;
  }
) {
  const routerModule = useClientRouter
    ? 'expo-router/build/rsc/router/noopRouter'
    : 'expo-router/build/rsc/router/expo-definedRouter';

  const rscMiddleware = getRscMiddleware({
    config: {},
    // Disabled in development
    baseUrl: '',
    rscPath,
    onError: console.error,
    renderRsc: async (args) => {
      // In development we should add simulated versions of common production headers.
      if (args.headers['x-real-ip'] == null) {
        args.headers['x-real-ip'] = getIpAddress();
      }
      if (args.headers['x-forwarded-for'] == null) {
        args.headers['x-forwarded-for'] = args.headers['x-real-ip'];
      }
      if (args.headers['x-forwarded-proto'] == null) {
        args.headers['x-forwarded-proto'] = 'http';
      }

      // Dev server-only implementation.
      try {
        return await renderRscToReadableStream({
          ...args,
          headers: new Headers(args.headers),
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

  async function exportServerActionsAsync(
    {
      platform,
      entryPoints,
      domRoot,
    }: { platform: string; entryPoints: string[]; domRoot?: string },
    files: ExportAssetMap
  ): Promise<{
    clientBoundaries: string[];
    manifest: Record<string, [string, string]>;
  }> {
    const uniqueEntryPoints = [...new Set(entryPoints)];
    // TODO: Support multiple entry points in a single split server bundle...
    const serverRoot = getMetroServerRootMemo(projectRoot);

    const manifest: Record<string, [string, string]> = {};
    const nestedClientBoundaries: string[] = [];

    for (const entryPoint of uniqueEntryPoints) {
      const contents = await ssrLoadModuleArtifacts(entryPoint, {
        environment: 'react-server',
        platform,
        // Ignore the metro runtime to avoid overwriting the original in the API route.
        modulesOnly: true,
        // Required
        runModule: true,
        // Required to ensure assets load as client boundaries.
        domRoot,
      });

      const reactClientReferences = contents.artifacts
        .filter((a) => a.type === 'js')[0]
        .metadata.reactClientReferences?.map((ref) => fileURLToFilePath(ref));

      if (reactClientReferences) {
        nestedClientBoundaries.push(...reactClientReferences!);
      }

      // Naive check to ensure the module runtime is not included in the server action bundle.
      if (contents.src.includes('The experimental Metro feature')) {
        throw new Error(
          'Internal error: module runtime should not be included in server action bundles: ' +
            entryPoint
        );
      }

      const relativeName = createModuleId(entryPoint, {
        platform,
        environment: 'react-server',
      });
      const safeName = path.basename(contents.artifacts.find((a) => a.type === 'js')!.filename!);

      const outputName = `_expo/rsc/${platform}/${safeName}`;
      // While we're here, export the router for the server to dynamically render RSC.
      files.set(outputName, {
        targetDomain: 'server',
        contents: wrapBundle(contents.src),
      });

      // Import relative to `dist/server/_expo/rsc/web/router.js`
      manifest[entryPoint] = [relativeName, outputName];
    }

    // Save the SSR manifest so we can perform more replacements in the server renderer and with server actions.
    files.set(`_expo/rsc/${platform}/action-manifest.js`, {
      targetDomain: 'server',
      contents: 'module.exports = ' + JSON.stringify(manifest),
    });

    return { manifest, clientBoundaries: nestedClientBoundaries };
  }

  async function getExpoRouterClientReferencesAsync(
    { platform, domRoot }: { platform: string; domRoot?: string },
    files: ExportAssetMap
  ): Promise<{
    reactClientReferences: string[];
    reactServerReferences: string[];
    cssModules: SerialAsset[];
  }> {
    const contents = await ssrLoadModuleArtifacts(routerModule, {
      environment: 'react-server',
      platform,
      modulesOnly: true,
      domRoot,
    });

    // Extract the global CSS modules that are imported from the router.
    // These will be injected in the head of the HTML document for the website.
    const cssModules = contents.artifacts.filter((a) => a.type.startsWith('css'));

    const reactServerReferences = contents.artifacts
      .filter((a) => a.type === 'js')[0]
      .metadata.reactServerReferences?.map((ref) => fileURLToFilePath(ref));

    if (!reactServerReferences) {
      throw new Error(
        'Static server action references were not returned from the Metro SSR bundle for definedRouter'
      );
    }
    debug('React client boundaries:', reactServerReferences);

    const reactClientReferences = contents.artifacts
      .filter((a) => a.type === 'js')[0]
      .metadata.reactClientReferences?.map((ref) => fileURLToFilePath(ref));

    if (!reactClientReferences) {
      throw new Error(
        'Static client references were not returned from the Metro SSR bundle for definedRouter'
      );
    }
    debug('React client boundaries:', reactClientReferences);

    // While we're here, export the router for the server to dynamically render RSC.
    files.set(`_expo/rsc/${platform}/router.js`, {
      targetDomain: 'server',
      contents: wrapBundle(contents.src),
    });

    return { reactClientReferences, reactServerReferences, cssModules };
  }

  async function getExpoRouterRscEntriesGetterAsync({ platform }: { platform: string }) {
    return ssrLoadModule<typeof import('expo-router/build/rsc/router/expo-definedRouter')>(
      routerModule,
      {
        environment: 'react-server',
        platform,
      },
      {
        hot: true,
      }
    );
  }

  function getResolveClientEntry(context: {
    platform: string;
    engine?: 'hermes' | null;
    ssrManifest?: Map<string, string>;
  }) {
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

    return (file: string, isServer: boolean) => {
      if (isExporting) {
        assert(context.ssrManifest, 'SSR manifest must exist when exporting');
        const relativeFilePath = path.relative(serverRoot, file);

        assert(
          context.ssrManifest.has(relativeFilePath),
          `SSR manifest is missing client boundary "${relativeFilePath}"`
        );

        const chunk = context.ssrManifest.get(relativeFilePath);

        return {
          id: createModuleId(file, { platform: context.platform, environment: 'client' }),
          chunks: chunk != null ? [chunk] : [],
        };
      }

      const environment = isServer ? 'react-server' : 'client';
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
        environment,
        modulesOnly: true,
        runModule: false,
      });

      searchParams.set('resolver.clientboundary', String(true));

      const clientReferenceUrl = new URL('http://a');

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
      const chunkName = clientReferenceUrl.pathname + clientReferenceUrl.search;

      return {
        id: createModuleId(filePath, { platform: context.platform, environment }),
        chunks: [chunkName],
      };
    };
  }

  const rscRendererCache = new Map<string, typeof import('expo-router/build/rsc/rsc-renderer')>();

  async function getRscRendererAsync(platform: string) {
    // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
    if (rscRendererCache.has(platform)) {
      return rscRendererCache.get(platform)!;
    }

    // TODO: Extract CSS Modules / Assets from the bundler process
    const renderer = await ssrLoadModule<typeof import('expo-router/build/rsc/rsc-renderer')>(
      'expo-router/build/rsc/rsc-renderer',
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

  async function renderRscToReadableStream(
    {
      input,
      headers,
      method,
      platform,
      body,
      engine,
      contentType,
      ssrManifest,
      decodedBody,
    }: {
      input: string;
      headers: Headers;
      method: 'POST' | 'GET';
      platform: string;
      body?: ReadableStream<Uint8Array>;
      engine?: 'hermes' | null;
      contentType?: string;
      ssrManifest?: Map<string, string>;
      decodedBody?: unknown;
    },
    isExporting: boolean | undefined = instanceMetroOptions.isExporting
  ) {
    assert(
      isExporting != null,
      'The server must be started before calling renderRscToReadableStream.'
    );

    if (method === 'POST') {
      assert(body, 'Server request must be provided when method is POST (server actions)');
    }

    const context = getRscRenderContext(platform);

    context['__expo_requestHeaders'] = headers;

    const { renderRsc } = await getRscRendererAsync(platform);

    return renderRsc(
      {
        body,
        decodedBody,
        context,
        config: {},
        input,
        contentType,
      },
      {
        isExporting,
        entries: await getExpoRouterRscEntriesGetterAsync({ platform }),
        resolveClientEntry: getResolveClientEntry({ platform, engine, ssrManifest }),
        async loadServerModuleRsc(urlFragment) {
          const serverRoot = getMetroServerRootMemo(projectRoot);

          debug('[SSR] loadServerModuleRsc:', urlFragment);

          const options = getMetroOptionsFromUrl(urlFragment);

          return ssrLoadModule(path.join(serverRoot, options.mainModuleName), options);
        },
      }
    );
  }

  return {
    // Get the static client boundaries (no dead code elimination allowed) for the production export.
    getExpoRouterClientReferencesAsync,
    exportServerActionsAsync,

    async exportRoutesAsync(
      {
        platform,
        ssrManifest,
      }: {
        platform: string;
        ssrManifest: Map<string, string>;
      },
      files: ExportAssetMap
    ) {
      // TODO: When we add web SSR support, we need to extract CSS Modules / Assets from the bundler process to prevent FLOUC.
      const { getBuildConfig } = (await getExpoRouterRscEntriesGetterAsync({ platform })).default;

      // Get all the routes to render.
      const buildConfig = await getBuildConfig!(async () =>
        // TODO: Rework prefetching code to use Metro runtime.
        []
      );

      await Promise.all(
        Array.from(buildConfig).map(async ({ entries }) => {
          for (const { input, isStatic } of entries || []) {
            if (!isStatic) {
              debug('Skipping static export for route', { input });
              continue;
            }
            const destRscFile = path.join('_flight', platform, encodeInput(input));

            const pipe = await renderRscToReadableStream(
              {
                input,
                method: 'GET',
                platform,
                headers: new Headers(),
                ssrManifest,
              },
              true
            );

            const rsc = await streamToStringAsync(pipe);
            debug('RSC Payload', { platform, input, rsc });

            files.set(destRscFile, {
              contents: rsc,
              targetDomain: 'client',
              rscId: input,
            });
          }
        })
      );
    },

    middleware: createBuiltinAPIRequestHandler(
      // Match `/_flight/[platform]/[...path]`
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
  } catch {
    return new URL(url, 'http://localhost:0');
  }
};

export const fileURLToFilePath = (fileURL: string) => {
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

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  // Use gm to apply to the last require line. This is needed when the bundle has side-effects.
  return str.replace(/^(__r\(.*\);)$/gm, 'module.exports = $1');
}
