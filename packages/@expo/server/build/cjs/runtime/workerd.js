"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMiddleware = exports.getApiRoute = exports.getHtml = exports.getRoutesManifest = exports.handleRouteError = void 0;
const initManifestRegExp_1 = require("../utils/initManifestRegExp");
// TODO: Allow adding extra prod headers like Cache-Control...
const handleRouteError = () => async (error) => {
    throw error;
};
exports.handleRouteError = handleRouteError;
let _routes = null;
const getRoutesManifest = (dist) => async () => {
    if (_routes) {
        return _routes;
    }
    try {
        const routesMod = await import(`${dist}/_expo/routes.json`);
        // NOTE(@krystofwoldrich) Import should return parsed JSON, this seems like workerd specific behavior.
        const routesManifest = JSON.parse(routesMod.default);
        return (_routes = (0, initManifestRegExp_1.initManifestRegExp)(routesManifest));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }
    catch (error) {
        return (_routes = null);
    }
};
exports.getRoutesManifest = getRoutesManifest;
const getHtml = (dist) => async (_request, route) => {
    const html = (await importWithIndexFallback(`${dist}/${route.page}`, '.html')).default;
    return typeof html === 'string' ? html : null;
};
exports.getHtml = getHtml;
const getApiRoute = (dist) => async (route) => {
    const filePath = `${dist}/${route.file}`;
    return (await import(filePath)).default;
};
exports.getApiRoute = getApiRoute;
const getMiddleware = (dist) => async (middleware) => {
    const filePath = `${dist}/${middleware.file}`;
    return (await import(filePath)).default;
};
exports.getMiddleware = getMiddleware;
const _importCache = new Map();
async function importCached(target) {
    let result = _importCache.get(target);
    if (!result) {
        try {
            result = { type: 'success', value: await import(target) };
        }
        catch (error) {
            result = { type: 'error', value: error };
        }
        _importCache.set(target, result);
    }
    if (result.type === 'success') {
        return result.value;
    }
    else {
        throw result.value;
    }
}
async function importWithIndexFallback(target, filetype = '') {
    const INDEX_PATH = '/index';
    try {
        return await importCached(target + filetype);
    }
    catch (error) {
        if (target.endsWith(INDEX_PATH) && target.length > INDEX_PATH.length) {
            return await importWithIndexFallback(target.slice(0, -INDEX_PATH.length), filetype);
        }
        throw error;
    }
}
//# sourceMappingURL=workerd.js.map