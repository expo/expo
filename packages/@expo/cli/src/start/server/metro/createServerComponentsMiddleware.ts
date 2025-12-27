/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getMetroServerRoot } from '@expo/config/paths';
import { getFilePathByStableId } from '@expo/metro-config/build/rscRegistry';
import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import type { EntriesDev } from '@expo/router-server/build/rsc/server';
import assert from 'assert';
import { getRscMiddleware } from 'expo-server/private';
import path from 'node:path';
import url from 'node:url';

import { IS_METRO_BUNDLE_ERROR_SYMBOL, logMetroError } from './metroErrorInterface';
import { isPossiblyUnableToResolveError } from '../../../export/embed/xcodeCompilerLogger';
import type { ExportAssetMap } from '../../../export/saveAssets';
import { stripAnsi } from '../../../utils/ansi';
import { toPosixPath } from '../../../utils/filePath';
import { memoize } from '../../../utils/fn';
import { getIpAddress } from '../../../utils/ip';
import { streamToStringAsync } from '../../../utils/stream';
import { createBuiltinAPIRequestHandler } from '../middleware/createBuiltinAPIRequestHandler';
import {
  createBundleUrlSearchParams,
  type ExpoMetroOptions,
  getMetroOptionsFromUrl,
} from '../middleware/metroOptions';

const debug = require('debug')('expo:rsc') as typeof console.log;

type SSRLoadModuleArtifactsFunc = (
  filePath: string,
  specificOptions?: Partial<ExpoMetroOptions>
) => Promise<{ artifacts: SerialAsset[]; src: string }>;

type SSRLoadModuleFunc = <T extends Record<string, any>>(
  filePath: string | null,
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
    routerOptions,
    clientBoundaries,
  }: {
    rscPath: string;
    instanceMetroOptions: Partial<ExpoMetroOptions>;
    ssrLoadModule: SSRLoadModuleFunc;
    ssrLoadModuleArtifacts: SSRLoadModuleArtifactsFunc;
    useClientRouter: boolean;
    routerOptions: Record<string, any>;
    /** Pre-scanned client boundaries for dev mode (files with "use client" directive) */
    clientBoundaries?: string[];
  }
) {
  const routerModule = useClientRouter
    ? '@expo/router-server/build/rsc/router/noopRouter'
    : '@expo/router-server/build/rsc/router/expo-definedRouter';

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
          routerOptions,
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

        if (error[IS_METRO_BUNDLE_ERROR_SYMBOL]) {
          throw new Response(JSON.stringify(error), {
            status: isPossiblyUnableToResolveError(error) ? 404 : 500,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

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
    const manifest: Record<string, [string, string]> = {};
    const nestedClientBoundaries: string[] = [];
    const nestedServerBoundaries: string[] = [];
    const processedEntryPoints = new Set<string>();

    // Helper to convert stable ID to file path for bundling
    // Stable IDs are relative paths from project root (e.g., "./src/file.ts" or "./node_modules/pkg/file.js")
    function stableIdToFilePath(stableId: string): string {
      if (stableId.startsWith('./')) {
        // Relative path from project root - convert to absolute path
        return path.join(projectRoot, stableId);
      }
      // Shouldn't happen with new format, but fallback to direct use
      return stableId;
    }

    async function processEntryPoint(entryPoint: string) {
      processedEntryPoints.add(entryPoint);

      // Convert stable ID to file path for Metro bundling
      const filePath = stableIdToFilePath(entryPoint);

      const contents = await ssrLoadModuleArtifacts(filePath, {
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
        .metadata.reactClientReferences?.map((ref) => toStableId(ref, projectRoot));

      if (reactClientReferences) {
        nestedClientBoundaries.push(...reactClientReferences!);
      }
      const reactServerReferences = contents.artifacts
        .filter((a) => a.type === 'js')[0]
        .metadata.reactServerReferences?.map((ref) => toStableId(ref, projectRoot));

      if (reactServerReferences) {
        nestedServerBoundaries.push(...reactServerReferences!);
      }

      // Naive check to ensure the module runtime is not included in the server action bundle.
      if (contents.src.includes('The experimental Metro feature')) {
        throw new Error(
          'Internal error: module runtime should not be included in server action bundles: ' +
            entryPoint
        );
      }

      const jsArtifact = contents.artifacts.find((a) => a.type === 'js')!;
      const safeName = path.basename(jsArtifact.filename!);

      // For server action manifests, the module ID must match what the server bundle uses.
      // All RSC references now use stable IDs (resolved by the serializer).
      const stableIdToModuleId = jsArtifact.metadata.stableIdToModuleId ?? {};

      const outputName = `_expo/rsc/${platform}/${safeName}`;
      // While we're here, export the router for the server to dynamically render RSC.
      // Pass stableIdToModuleId and platform so the bundle registers mappings for __webpack_require__
      files.set(outputName, {
        targetDomain: 'server',
        contents: wrapBundle(contents.src, stableIdToModuleId, platform),
      });

      // Match babel plugin stable ID format.
      // If entryPoint is already a stable ID (not absolute path), use as-is.
      // Otherwise, compute relative path.
      const isStableId = !path.isAbsolute(entryPoint) && !entryPoint.startsWith('file://');
      const publicModuleId = isStableId
        ? entryPoint
        : './' + toPosixPath(path.relative(projectRoot, entryPoint));
      if (!isStableId) {
        throw new Error(
          `Expected stable ID but got file path "${entryPoint}". ` +
            `All RSC references should be stable IDs after serialization.`
        );
      }
      if (!(entryPoint in stableIdToModuleId)) {
        throw new Error(
          `Cannot find module ID for stable ID "${entryPoint}". ` +
            `Available mappings: ${Object.keys(stableIdToModuleId).join(', ') || '(none)'}`
        );
      }
      const moduleId = stableIdToModuleId[entryPoint];

      // Import relative to `dist/server/_expo/rsc/web/router.js`
      manifest[publicModuleId] = [String(moduleId), outputName];
    }

    async function processEntryPoints(entryPoints: string[], recursions = 0) {
      // Arbitrary recursion limit to prevent infinite loops.
      if (recursions > 10) {
        throw new Error('Recursion limit exceeded while processing server boundaries');
      }

      for (const entryPoint of entryPoints) {
        await processEntryPoint(entryPoint);
      }

      // When a server action has other server actions inside of it, we need to process those as well to ensure all entry points are in the manifest and accounted for.
      let uniqueNestedServerBoundaries = [...new Set(nestedServerBoundaries)];
      // Filter out values that have already been processed.
      uniqueNestedServerBoundaries = uniqueNestedServerBoundaries.filter(
        (value) => !processedEntryPoints.has(value)
      );
      if (uniqueNestedServerBoundaries.length) {
        debug('bundling nested server action boundaries', uniqueNestedServerBoundaries);
        return processEntryPoints(uniqueNestedServerBoundaries, recursions + 1);
      }
    }

    await processEntryPoints(uniqueEntryPoints);

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
    reactClientReferenceMap: Record<string, string>;
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

    const jsArtifact = contents.artifacts.filter((a) => a.type === 'js')[0];

    const reactServerReferences = jsArtifact.metadata.reactServerReferences?.map((ref) =>
      toStableId(ref, projectRoot)
    );

    if (!reactServerReferences) {
      throw new Error(
        'Static server action references were not returned from the Metro SSR bundle for definedRouter'
      );
    }
    debug('React server boundaries:', reactServerReferences);

    const reactClientReferences = jsArtifact.metadata.reactClientReferences?.map((ref) =>
      toStableId(ref, projectRoot)
    );

    if (!reactClientReferences) {
      throw new Error(
        'Static client references were not returned from the Metro SSR bundle for definedRouter'
      );
    }
    debug('React client boundaries:', reactClientReferences);

    // Extract the stable ID → file path mapping from the server bundle.
    // This is needed for assets which have reactClientReference in server bundle but not client bundle.
    const reactClientReferenceMap = jsArtifact.metadata.reactClientReferenceMap ?? {};

    // While we're here, export the router for the server to dynamically render RSC.
    files.set(`_expo/rsc/${platform}/router.js`, {
      targetDomain: 'server',
      contents: wrapBundle(contents.src),
    });

    return { reactClientReferences, reactServerReferences, reactClientReferenceMap, cssModules };
  }

  const routerCache = new Map<string, EntriesDev>();

  // Cache for prefetched client boundaries per platform
  const prefetchedClientBoundaries = new Map<string, string[]>();

  async function getExpoRouterRscEntriesGetterAsync({
    platform,
    routerOptions,
  }: {
    platform: string;
    routerOptions: Record<string, any>;
  }) {
    await ensureMemo();
    // We can only cache this if we're using the client router since it doesn't change or use HMR
    if (routerCache.has(platform) && useClientRouter) {
      return routerCache.get(platform)!;
    }

    const router = await ssrLoadModule<
      typeof import('@expo/router-server/build/rsc/router/expo-definedRouter')
    >(
      routerModule,
      {
        environment: 'react-server',
        modulesOnly: true,
        platform,
      },
      {
        hot: !useClientRouter,
      }
    );

    const entries = router.default({
      redirects: routerOptions?.redirects,
      rewrites: routerOptions?.rewrites,
    });

    routerCache.set(platform, entries);
    return entries;
  }

  function getResolveClientEntry(context: {
    platform: string;
    engine?: 'hermes' | null;
    // SSR manifest maps stable ID -> chunk
    ssrManifest?: Map<string, string | null>;
  }): (
    file: string,
    isServer: boolean
  ) => {
    id: string;
    chunks: string[];
  } {
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
      // Handle stable IDs (e.g., "pkg/client" or "./relative/path.js")
      // vs legacy file URLs (e.g., "file:///path/to/file.js")
      const isStableId = !file.startsWith('file://') && !path.isAbsolute(file);

      // For stable IDs, use directly for manifest lookup
      // For file paths, convert to relative for backward compatibility
      const filePath = isStableId
        ? file
        : path.join(projectRoot, file.startsWith('file://') ? fileURLToFilePath(file) : file);

      if (isExporting) {
        assert(context.ssrManifest, 'SSR manifest must exist when exporting');

        // Use stable ID directly if available, otherwise compute relative path
        // MUST use projectRoot (not serverRoot) to match how manifest keys are created in MetroBundlerDevServer
        const manifestKey = isStableId
          ? file
          : './' + toPosixPath(path.relative(projectRoot, filePath));

        assert(
          context.ssrManifest.has(manifestKey),
          `SSR manifest is missing client boundary "${manifestKey}"`
        );

        // SSR manifest entry is just the chunk (or null)
        const chunk = context.ssrManifest.get(manifestKey)!;

        return {
          id: manifestKey,
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
        clientBoundaries: clientBoundaries || [],
        inlineSourceMap: false,
        environment,
        modulesOnly: true,
        runModule: false,
      });

      searchParams.set('resolver.clientboundary', String(true));

      const clientReferenceUrl = new URL('http://a');

      // TICKLE: Handshake 1
      searchParams.set('xRSC', '1');

      // For stable IDs (package specifiers), lookup file path from registry
      // For file paths, use directly
      let bundleFilePath: string;
      if (isStableId) {
        // Lookup file path from registry (reverse: stableId → filePath)
        const registryFilePath = getFilePathByStableId(file);
        if (registryFilePath) {
          bundleFilePath = registryFilePath;
        } else if (file.startsWith('./')) {
          // Relative path stable ID - resolve from project root
          bundleFilePath = path.join(projectRoot, file);
        } else {
          // No fallback - if the stable ID is not in registry, it's a build error
          throw new Error(
            `[RSC] Stable ID not found in registry: "${file}". ` +
              `This is a build error - ensure the module is properly bundled with RSC support.`
          );
        }
        // Add stable ID to URL so the serializer can register it dynamically
        searchParams.set('rscStableId', file);
      } else {
        bundleFilePath = filePath;
      }

      clientReferenceUrl.search = searchParams.toString();

      const relativeFilePath = path.relative(serverRoot, bundleFilePath);
      clientReferenceUrl.pathname = relativeFilePath;

      // Ensure url.pathname ends with '.bundle'
      if (!clientReferenceUrl.pathname.endsWith('.bundle')) {
        clientReferenceUrl.pathname += '.bundle';
      }

      // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
      const chunkName = clientReferenceUrl.pathname + clientReferenceUrl.search;

      // All RSC references now use stable IDs (resolved by the serializer)
      if (!isStableId) {
        throw new Error(
          `Expected stable ID but got file path "${file}". ` +
            `All RSC references should be stable IDs.`
        );
      }
      const moduleId = file;

      return {
        id: String(moduleId),
        chunks: [chunkName],
      };
    };
  }

  const rscRendererCache = new Map<
    string,
    typeof import('@expo/router-server/build/rsc/rsc-renderer')
  >();

  let ensurePromise: Promise<unknown> | null = null;
  async function ensureSSRReady() {
    // TODO: Extract CSS Modules / Assets from the bundler process
    await ssrLoadModule(null, {
      environment: 'react-server',
      platform: 'web',
    });
  }
  const ensureMemo = () => {
    ensurePromise ??= ensureSSRReady();
    return ensurePromise;
  };

  async function getRscRendererAsync(platform: string) {
    await ensureMemo();
    // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
    if (rscRendererCache.has(platform)) {
      return rscRendererCache.get(platform)!;
    }

    // TODO: Extract CSS Modules / Assets from the bundler process
    const renderer = await ssrLoadModule<
      typeof import('@expo/router-server/build/rsc/rsc-renderer')
    >('@expo/router-server/build/rsc/rsc-renderer', {
      environment: 'react-server',
      platform,
    });

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
      routerOptions,
    }: {
      input: string;
      headers: Headers;
      method: 'POST' | 'GET';
      platform: string;
      body?: ReadableStream<Uint8Array>;
      engine?: 'hermes' | null;
      contentType?: string;
      // SSR manifest maps stable ID -> chunk
      ssrManifest?: Map<string, string | null>;
      decodedBody?: unknown;
      routerOptions: Record<string, any>;
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
        entries: await getExpoRouterRscEntriesGetterAsync({ platform, routerOptions }),
        resolveClientEntry: getResolveClientEntry({ platform, engine, ssrManifest }),
        async loadServerModuleRsc(urlFragment) {
          const serverRoot = getMetroServerRootMemo(projectRoot);

          debug('[SSR] loadServerModuleRsc:', urlFragment);

          const options = getMetroOptionsFromUrl(urlFragment);

          // Resolve module path from URL pathname
          // URL pathname is relative to serverRoot (with leading /)
          // Examples:
          // - "/apps/router-e2e/app/index.tsx" -> serverRoot/apps/router-e2e/app/index.tsx
          // - "/node_modules/pkg/client.js" -> serverRoot/node_modules/pkg/client.js
          let modulePath: string;
          if (options.mainModuleName.startsWith('/')) {
            // URL pathname - remove leading / and join with serverRoot
            modulePath = path.join(serverRoot, options.mainModuleName.slice(1));
          } else {
            // Package specifier without leading / - join with serverRoot
            modulePath = path.join(serverRoot, options.mainModuleName);
          }

          return ssrLoadModule(modulePath, options, {
            hot: true,
          });
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
        routerOptions,
      }: {
        platform: string;
        // SSR manifest maps stable ID -> chunk
        ssrManifest: Map<string, string | null>;
        routerOptions: Record<string, any>;
      },
      files: ExportAssetMap
    ) {
      // TODO: When we add web SSR support, we need to extract CSS Modules / Assets from the bundler process to prevent FLOUC.
      const { getBuildConfig } = (
        await getExpoRouterRscEntriesGetterAsync({ platform, routerOptions })
      ).default;

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
                routerOptions,
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
    onReloadRscEvent: (platform: string) => {
      // NOTE: We cannot clear the renderer context because it would break the mounted context state.

      rscRendererCache.delete(platform);
      routerCache.delete(platform);
      // Clear cached client boundaries so they're re-fetched on next request
      prefetchedClientBoundaries.delete(platform);
    },
    /**
     * Pre-fetch client boundaries from the server graph.
     * This builds the server bundle and extracts reactClientReferences metadata.
     * Call this early to ensure client bundles include all necessary modules.
     */
    async prefetchClientBoundaries(platform: string): Promise<string[]> {
      // Return cached boundaries if available
      if (prefetchedClientBoundaries.has(platform)) {
        return prefetchedClientBoundaries.get(platform)!;
      }

      await ensureMemo();

      try {
        const contents = await ssrLoadModuleArtifacts(routerModule, {
          environment: 'react-server',
          platform,
          modulesOnly: true,
        });

        const reactClientReferences =
          contents.artifacts
            .filter((a) => a.type === 'js')[0]
            ?.metadata.reactClientReferences?.map((ref) => toStableId(ref, projectRoot)) || [];

        debug(
          '[RSC] Prefetched client boundaries from server graph:',
          reactClientReferences.length
        );
        prefetchedClientBoundaries.set(platform, reactClientReferences);
        return reactClientReferences;
      } catch (error) {
        debug('[RSC] Failed to prefetch client boundaries:', error);
        return [];
      }
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
  // Handle relative paths (e.g., ./path/to/file.js) for portability across build environments
  if (!fileURL.startsWith('file://')) {
    return fileURL;
  }
  try {
    return url.fileURLToPath(fileURL);
  } catch (error) {
    if (error instanceof TypeError) {
      throw Error(`Invalid URL: ${fileURL}`, { cause: error });
    }
    throw error;
  }
};

/**
 * Convert file:// URL or file path to stable ID (relative path from project root).
 * Used for RSC boundary references which need stable IDs for the module maps.
 */
export function toStableId(ref: string, projectRoot: string): string {
  // Already a stable ID (relative path)
  if (ref.startsWith('./')) {
    return ref;
  }

  // Convert file:// URL to file path first
  let filePath: string;
  if (ref.startsWith('file://')) {
    filePath = url.fileURLToPath(ref);
  } else {
    filePath = ref;
  }

  // Convert to relative path and normalize for pnpm
  let relativePath = path.relative(projectRoot, filePath);

  // pnpm normalization: .pnpm/pkg@1.0.0/node_modules/pkg/... → node_modules/pkg/...
  relativePath = relativePath.replace(
    /node_modules\/\.pnpm\/[^/]+\/node_modules\//g,
    'node_modules/'
  );

  return './' + toPosixPath(relativePath);
}

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

function wrapBundle(
  str: string,
  stableIdToModuleId?: Record<string, string | number>,
  platform?: string
) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  // Use gm to apply to the last require line. This is needed when the bundle has side-effects.
  let result = str.replace(/^(__r\(.*\);)$/gm, 'module.exports = $1');

  // Add stable ID registrations for __webpack_require__ to use
  // This registers the mapping from stable IDs to Metro module IDs
  // Note: The module IDs in the bundle have query params (e.g., ?platform=web&env=react-server)
  // so we need to append them to match what __d() uses
  if (stableIdToModuleId && Object.keys(stableIdToModuleId).length > 0) {
    const querySuffix = platform ? `?platform=${platform}&env=react-server` : '';
    const registrations = Object.entries(stableIdToModuleId)
      .map(([stableId, moduleId]) => {
        // Append query params to match the module ID format used by __d()
        const fullModuleId = String(moduleId) + querySuffix;
        return `if(typeof __expo_rsc_register__==='function')__expo_rsc_register__(${JSON.stringify(stableId)},${JSON.stringify(fullModuleId)});`;
      })
      .join('\n');
    result = registrations + '\n' + result;
  }

  return result;
}
