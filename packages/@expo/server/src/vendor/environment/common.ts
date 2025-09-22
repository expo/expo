import type { Manifest, Middleware, RawManifest, Route } from '../../types';
import { initManifestRegExp } from '../../utils/initManifestRegExp';

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

    async getMiddleware(middleware: Middleware): Promise<unknown> {
      return input.loadModule(middleware.file);
    },

    handleRouteError(error: Error): Promise<Response> {
      throw error;
    },
  };
}
