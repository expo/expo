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

interface EnvironmentInput {
  readText(request: string): Promise<string | null>;
  readJson(request: string): Promise<unknown>;
  loadModule(request: string): Promise<unknown>;
}

export function createEnvironment(input: EnvironmentInput) {
  return {
    async getRoutesManifest(): Promise<Manifest> {
      const json = await input.readJson('_expo/routes.json');
      return initManifestRegExp(json as RawManifest);
    },

    async getHtml(_request: Request, route: Route): Promise<string | Response | null> {
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
