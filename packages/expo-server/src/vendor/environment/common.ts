import type { Manifest, MiddlewareInfo, RawManifest, Route } from '../../manifest';

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

export interface AssetManifest {
  js: string[];
  css: string[];
}

interface EnvironmentInput {
  readText(request: string): Promise<string | null>;
  readJson(request: string): Promise<unknown>;
  loadModule(request: string): Promise<unknown>;
}

export function createEnvironment(input: EnvironmentInput) {
  // Lazy SSR renderer detection, determined on first request
  // NOTE(@hassankhan): Maybe we could declare this in `routes.json` so we know ahead of time if a
  // server should be in SSG/SSR mode
  let ssrRenderer:
    | ((request: Request, options?: RenderOptions) => Promise<string>)
    | null
    | undefined;

  async function getServerRenderer() {
    if (ssrRenderer === undefined) {
      try {
        const mod = await input.loadModule('_expo/server/render.js');
        const assets = (await input.readJson('_expo/assets.json')) as AssetManifest | null;

        if (mod && typeof (mod as any).getStaticContent === 'function' && assets) {
          // Create renderer that passes assets to getStaticContent
          ssrRenderer = async (request: Request, options?: RenderOptions) => {
            const url = new URL(request.url);
            const location = new URL(url.pathname + url.search, url.origin);
            return (mod as any).getStaticContent(location, {
              loader: options?.loader,
              request,
              assets,
            });
          };
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
      const json = await input.readJson('_expo/routes.json');
      return initManifestRegExp(json as RawManifest);
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
