import fs from 'node:fs';
import path from 'node:path';

import { RawManifest, Manifest, Route, Middleware } from '../types';
import { initManifestRegExp } from '../utils/initManifestRegExp';

const debug =
  process.env.NODE_ENV === 'development'
    ? (require('debug')('expo:server') as typeof console.log)
    : () => {};

export const handleRouteError = () => async (error: Error) => {
  throw error;
};

export const getRoutesManifest = (dist: string) => async (): Promise<Manifest> => {
  const raw = path.join(dist, '_expo/routes.json');
  // TODO: JSON Schema for validation
  const manifest = JSON.parse(fs.readFileSync(raw, 'utf-8')) as RawManifest;
  return initManifestRegExp(manifest);
};

export const getHtml =
  (dist: string) =>
  async (_request: Request, route: Route): Promise<string | null> => {
    // Serve a static file by exact route name
    const filePath = path.join(dist, route.page + '.html');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    // Serve a static file by route name with hoisted index
    // See: https://github.com/expo/expo/pull/27935
    const hoistedFilePath = route.page.match(/\/index$/)
      ? path.join(dist, route.page.replace(/\/index$/, '') + '.html')
      : null;
    if (hoistedFilePath && fs.existsSync(hoistedFilePath)) {
      return fs.readFileSync(hoistedFilePath, 'utf-8');
    }

    return null;
  };

export const getApiRoute = (dist: string) => async (route: Route) => {
  debug(`Handling API route: ${route.page}: ${route.file}`);
  return loadServerModule(dist, route);
};

export const getMiddleware = (dist: string) => async (middleware: Middleware) => {
  return loadServerModule(dist, middleware);
};

async function loadServerModule(dist: string, mod: { file: string }): Promise<any> {
  const filePath = path.join(dist, mod.file);

  // TODO: What's the standard behavior for malformed projects?
  if (!fs.existsSync(filePath)) {
    return null;
  }

  if (/\.c?js$/.test(filePath)) {
    return require(filePath);
  }
  return import(filePath);
}
