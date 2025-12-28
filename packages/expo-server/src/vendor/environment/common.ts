import type {
  Manifest,
  MiddlewareInfo,
  RawManifest,
  Route,
  ServerRenderModule,
} from '../../manifest';

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

export interface RenderOptions {
  loader?: { data: unknown };
}

interface EnvironmentInput {
  readText(request: string): Promise<string | null>;
  readJson(request: string): Promise<unknown>;
  loadModule(request: string): Promise<unknown>;
}

export function createEnvironment(input: EnvironmentInput) {
  // Cached manifest and SSR renderer, initialized on first request
  let cachedManifest: Manifest | null = null;
  let ssrRenderer:
    | ((request: Request, options?: RenderOptions) => Promise<string>)
    | null
    | undefined;

  async function getCachedRoutesManifest(): Promise<Manifest> {
    if (!cachedManifest) {
      const json = await input.readJson('_expo/routes.json');
      cachedManifest = initManifestRegExp(json as RawManifest);
    }
    return cachedManifest;
  }

  async function getServerRenderer() {
    if (ssrRenderer === undefined) {
      try {
        const manifest = await getCachedRoutesManifest();

        // Check if SSR rendering mode is declared in manifest
        if (manifest.rendering?.mode === 'ssr') {
          const serverRenderingModule = (await input.loadModule(
            manifest.rendering.file
          )) as ServerRenderModule | null;

          if (serverRenderingModule) {
            const assets = manifest.assets;
            // Create renderer that passes assets to `getStaticContent()`
            ssrRenderer = async (request: Request, options?: RenderOptions) => {
              const url = new URL(request.url);
              const location = new URL(url.pathname + url.search, url.origin);
              return serverRenderingModule.getStaticContent(location, {
                loader: options?.loader,
                request,
                assets,
              });
            };
          } else {
            ssrRenderer = null;
          }
        } else {
          ssrRenderer = null;
        }
      } catch {
        ssrRenderer = null; // Module doesn't exist, use SSG fallback
      }
    }
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
