import { Manifest, Middleware, RawManifest, Route } from '../types';
import { initManifestRegExp } from '../utils/initManifestRegExp';

// TODO: Allow adding extra prod headers like Cache-Control...

export const handleRouteError = () => async (error: Error) => {
  throw error;
};

let _routes: Manifest | null = null;
export const getRoutesManifest = (dist: string) => async (): Promise<Manifest | null> => {
  if (_routes) {
    return _routes;
  }

  try {
    const routesMod = await import(`${dist}/_expo/routes.json`);
    // NOTE(@krystofwoldrich) Import should return parsed JSON, this seems like workerd specific behavior.
    const routesManifest: RawManifest = JSON.parse(routesMod.default);
    return (_routes = initManifestRegExp(routesManifest));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return (_routes = null);
  }
};

export const getHtml =
  (dist: string) =>
  async (_request: Request, route: Route): Promise<string | null> => {
    const html = (await importWithIndexFallback(`${dist}/${route.page}`, '.html')).default;
    return typeof html === 'string' ? html : null;
  };

export const getApiRoute =
  (dist: string) =>
  async (route: Route): Promise<any> => {
    const filePath = `${dist}/${route.file}`;
    return (await import(filePath)).default;
  };

export const getMiddleware =
  (dist: string) =>
  async (middleware: Middleware): Promise<any> => {
    const filePath = `${dist}/${middleware.file}`;
    return (await import(filePath)).default;
  };

const _importCache = new Map();
async function importCached(target: string): Promise<any> {
  let result = _importCache.get(target);
  if (!result) {
    try {
      result = { type: 'success', value: await import(target) };
    } catch (error) {
      result = { type: 'error', value: error };
    }
    _importCache.set(target, result);
  }

  if (result.type === 'success') {
    return result.value;
  } else {
    throw result.value;
  }
}

async function importWithIndexFallback(target: string, filetype = '') {
  const INDEX_PATH = '/index';
  try {
    return await importCached(target + filetype);
  } catch (error) {
    if (target.endsWith(INDEX_PATH) && target.length > INDEX_PATH.length) {
      return await importWithIndexFallback(target.slice(0, -INDEX_PATH.length), filetype);
    }
    throw error;
  }
}
