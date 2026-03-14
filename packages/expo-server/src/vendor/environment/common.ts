import { ImmutableRequest } from '../../ImmutableRequest';
import type { AssetInfo, Manifest, MiddlewareInfo, RawManifest, Route } from '../../manifest';
import type { LoaderModule, RenderOptions, ServerRenderModule, SsrRenderFn } from '../../rendering';
import { isResponse, parseParams, resolveLoaderContextKey } from '../../utils/matchers';

function initManifestRegExp(manifest: RawManifest): Manifest {
  return {
    ...manifest,
    htmlRoutes:
      manifest.htmlRoutes?.map((route) => ({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })) ?? [],
    apiRoutes:
      manifest.apiRoutes?.map((route) => ({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })) ?? [],
    notFoundRoutes:
      manifest.notFoundRoutes?.map((route) => ({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })) ?? [],
    redirects:
      manifest.redirects?.map((route) => ({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })) ?? [],
    rewrites:
      manifest.rewrites?.map((route) => ({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })) ?? [],
  };
}

interface EnvironmentInput {
  readText(request: string): Promise<string | null>;
  readJson(request: string): Promise<unknown>;
  loadModule(request: string): Promise<unknown>;
  isDevelopment: boolean;
}

export interface CommonEnvironment {
  getRoutesManifest(): Promise<Manifest | null>;
  getHtml(request: Request, route: Route): Promise<string | Response | null>;
  getApiRoute(route: Route): Promise<unknown>;
  getMiddleware(middleware: MiddlewareInfo): Promise<any>;
  getLoaderData(request: Request, route: Route): Promise<Response>;
  preload(): Promise<void>;
}

export function createEnvironment(input: EnvironmentInput): CommonEnvironment {
  // Cached manifest and SSR renderer, initialized on first request
  let cachedManifest: Manifest | null | undefined;
  let ssrRenderer: SsrRenderFn | null = null;

  async function getRoutesManifest(): Promise<Manifest | null> {
    if (cachedManifest === undefined || input.isDevelopment) {
      const json = await input.readJson('_expo/routes.json');
      cachedManifest = json ? initManifestRegExp(json as RawManifest) : null;
    }
    return cachedManifest;
  }

  async function getServerRenderer(): Promise<SsrRenderFn | null> {
    if (ssrRenderer && !input.isDevelopment) {
      return ssrRenderer;
    }

    const manifest = await getRoutesManifest();
    if (manifest?.rendering?.mode !== 'ssr') {
      return null;
    }

    // If `manifest.rendering.mode === 'ssr'`, we always expect the SSR rendering module to be
    // available
    const ssrModule = (await input.loadModule(
      manifest.rendering.file
    )) as ServerRenderModule | null;

    if (!ssrModule) {
      throw new Error(`SSR module not found at: ${manifest.rendering.file}`);
    }

    const topLevelAssets = manifest.assets;
    ssrRenderer = async (request, options) => {
      const url = new URL(request.url);
      const location = new URL(url.pathname + url.search, url.origin);
      const assets = mergeAssets(topLevelAssets, options?.assets);

      return ssrModule.getStaticContent(location, {
        loader: options?.loader,
        request,
        assets,
      });
    };
    return ssrRenderer;
  }

  async function executeLoader(
    request: Request,
    route: Route,
    params: Record<string, string>
  ): Promise<unknown> {
    if (!route.loader) {
      return undefined;
    }

    const loaderModule = (await input.loadModule(route.loader)) as LoaderModule | null;
    if (!loaderModule) {
      throw new Error(`Loader module not found at: ${route.loader}`);
    }

    return loaderModule.loader(new ImmutableRequest(request), params);
  }

  return {
    getRoutesManifest,

    async getHtml(request, route) {
      // SSR path: Render at runtime if SSR module is available
      const renderer = await getServerRenderer();
      if (renderer) {
        let renderOptions: RenderOptions = { assets: route.assets };

        try {
          if (route.loader) {
            const params = parseParams(request, route);
            const result = await executeLoader(request, route, params);
            const data = isResponse(result) ? await result.json() : result;
            renderOptions = {
              assets: route.assets,
              loader: {
                data: data ?? null,
                key: resolveLoaderContextKey(route.page, params),
              },
            };
          }
          return await renderer(request, renderOptions);
        } catch (error) {
          console.error('SSR render error:', error);
          throw error;
        }
      }

      // SSG fallback: Read pre-rendered HTML from disk
      let html: string | null;
      if ((html = await input.readText(route.page + '.html')) != null) {
        return html;
      }
      // Serve a static file by route name with hoisted index
      // See: https://github.com/expo/expo/pull/27935
      const INDEX_PATH = '/index';
      if (route.page.endsWith(INDEX_PATH) && route.page.length > INDEX_PATH.length) {
        const page = route.page.slice(0, -INDEX_PATH.length);
        if ((html = await input.readText(page + '.html')) != null) {
          return html;
        }
      }
      return null;
    },

    async getApiRoute(route) {
      return input.loadModule(route.file);
    },

    async getMiddleware(middleware) {
      const mod = (await input.loadModule(middleware.file)) as any;
      if (typeof mod?.default !== 'function') {
        return null;
      }
      return mod;
    },

    async getLoaderData(request, route) {
      const params = parseParams(request, route);
      const result = await executeLoader(request, route, params);

      if (isResponse(result)) {
        return result;
      }

      return Response.json(result ?? null);
    },

    async preload() {
      if (input.isDevelopment) {
        return;
      }
      const manifest = await getRoutesManifest();
      if (manifest) {
        const requests: string[] = [];
        if (manifest.middleware) requests.push(manifest.middleware.file);
        if (manifest.rendering) requests.push(manifest.rendering.file);
        for (const apiRoute of manifest.apiRoutes) requests.push(apiRoute.file);
        for (const htmlRoute of manifest.htmlRoutes) {
          if (htmlRoute.loader) requests.push(htmlRoute.loader);
        }
        await Promise.all(requests.map((request) => input.loadModule(request)));
      }
    },
  };
}

/**
 * Merges top-level assets with per-route async chunk assets. Top-level assets come first
 */
function mergeAssets(topLevel?: AssetInfo, routeLevel?: AssetInfo): AssetInfo {
  return {
    css: [...(topLevel?.css ?? []), ...(routeLevel?.css ?? [])],
    js: [...(topLevel?.js ?? []), ...(routeLevel?.js ?? [])],
  };
}
