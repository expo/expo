import type { Manifest, MiddlewareInfo, RawManifest, Route } from '../../manifest';
import type { ServerRenderModule, SsrRenderFn } from '../../rendering';

function initManifestRegExp(manifest: RawManifest): Manifest {
  return {
    ...manifest,
    htmlRoutes: manifest.htmlRoutes.map((route) => ({
      ...route,
      namedRegex: new RegExp(route.namedRegex),
    })),
    apiRoutes: manifest.apiRoutes.map((route) => ({
      ...route,
      namedRegex: new RegExp(route.namedRegex),
    })),
    notFoundRoutes: manifest.notFoundRoutes.map((route) => ({
      ...route,
      namedRegex: new RegExp(route.namedRegex),
    })),
    redirects: manifest.redirects?.map((route) => ({
      ...route,
      namedRegex: new RegExp(route.namedRegex),
    })),
    rewrites: manifest.rewrites?.map((route) => ({
      ...route,
      namedRegex: new RegExp(route.namedRegex),
    })),
  };
}

interface EnvironmentInput {
  readText(request: string): Promise<string | null>;
  readJson(request: string): Promise<unknown>;
  loadModule(request: string): Promise<unknown>;
}

export function createEnvironment(input: EnvironmentInput) {
  // Cached manifest and SSR renderer, initialized on first request
  let cachedManifest: Manifest | null = null;
  let ssrRenderer: SsrRenderFn | null = null;

  async function getCachedRoutesManifest(): Promise<Manifest> {
    if (!cachedManifest) {
      const json = await input.readJson('_expo/routes.json');
      cachedManifest = initManifestRegExp(json as RawManifest);
    }
    return cachedManifest;
  }

  async function getServerRenderer(): Promise<SsrRenderFn | null> {
    if (ssrRenderer) {
      return ssrRenderer;
    }

    const manifest = await getCachedRoutesManifest();
    if (manifest.rendering?.mode !== 'ssr') {
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

    const assets = manifest.assets;
    ssrRenderer = async (request, options) => {
      const url = new URL(request.url);
      const location = new URL(url.pathname + url.search, url.origin);
      return ssrModule.getStaticContent(location, {
        loader: options?.loader,
        request,
        assets,
      });
    };
    return ssrRenderer;
  }

  return {
    async getRoutesManifest(): Promise<Manifest> {
      return getCachedRoutesManifest();
    },

    async getHtml(request: Request, route: Route): Promise<string | Response | null> {
      // SSR path: Render at runtime if SSR module is available
      const renderer = await getServerRenderer();
      if (renderer) {
        try {
          return await renderer(request);
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

    async getApiRoute(route: Route): Promise<unknown> {
      return input.loadModule(route.file);
    },

    async getMiddleware(middleware: MiddlewareInfo): Promise<any> {
      const mod = (await input.loadModule(middleware.file)) as any;
      if (typeof mod?.default !== 'function') {
        return null;
      }
      return mod;
    },
  };
}
