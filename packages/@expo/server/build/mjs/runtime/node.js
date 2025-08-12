import fs from 'node:fs';
import path from 'node:path';
import { initManifestRegExp } from '../utils/initManifestRegExp';
const debug = process.env.NODE_ENV === 'development'
    ? require('debug')('expo:server')
    : () => { };
export const handleRouteError = () => async (error) => {
    throw error;
};
export const getRoutesManifest = (dist) => async () => {
    const raw = path.join(dist, '_expo/routes.json');
    // TODO: JSON Schema for validation
    const manifest = JSON.parse(fs.readFileSync(raw, 'utf-8'));
    return initManifestRegExp(manifest);
};
export const getHtml = (dist) => async (_request, route) => {
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
export const getApiRoute = (dist) => async (route) => {
    debug(`Handling API route: ${route.page}: ${route.file}`);
    return loadServerModule(dist, route);
};
export const getMiddleware = (dist) => async (middleware) => {
    return loadServerModule(dist, middleware);
};
async function loadServerModule(dist, mod) {
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
//# sourceMappingURL=node.js.map