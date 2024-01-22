"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypedRoutesDeclarationFile = exports.SLUG = exports.CATCH_ALL = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const path_1 = __importDefault(require("path"));
const getRoutes_1 = require("../getRoutes");
const matchers_1 = require("../matchers");
// /[...param1]/ - Match [...param1]
exports.CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
exports.SLUG = /\[.+?\]/g;
function getTypedRoutesDeclarationFile(context) {
    const staticRoutes = new Set();
    const dynamicRoutes = new Set();
    const dynamicRouteContextKeys = new Set();
    walkRoutes((0, getRoutes_1.getRoutes)(context, {
        ignoreEntryPoints: true,
        ignoreRequireErrors: true,
    }), staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
    // If the user has expo-router v3+ installed, we can use the types from the package
    return (node_fs_1.default
        .readFileSync(path_1.default.join(__dirname, '../../types/expo-router.d.ts'), 'utf-8')
        // Swap from being a namespace to a module
        .replace('declare namespace ExpoRouter {', `declare module "expo-router" {`)
        // Add the route values
        .replace('type StaticRoutes = string;', `type StaticRoutes = ${setToUnionType(staticRoutes)};`)
        .replace('type DynamicRoutes<T extends string> = string;', `type DynamicRoutes<T extends string> = ${setToUnionType(dynamicRoutes)};`)
        .replace('type DynamicRouteTemplate = never;', `type DynamicRouteTemplate = ${setToUnionType(dynamicRouteContextKeys)};`));
}
exports.getTypedRoutesDeclarationFile = getTypedRoutesDeclarationFile;
function walkRoutes(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys) {
    if (!routeNode)
        return;
    addRoute(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
    for (const child of routeNode.children) {
        walkRoutes(child, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
    }
}
const setToUnionType = (set) => {
    return set.size > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';
};
function addRoute(route, staticRoutes, dynamicRoutes, dynamicRouteContextKeys) {
    if (!route)
        return;
    if (!(0, matchers_1.isTypedRoutesFilename)(route.contextKey))
        return;
    let routePath = (0, matchers_1.removeSupportedExtensions)(route.contextKey)
        .replace(/^\./, '') // Remove the leading ./
        .replace(/\/?index$/, ''); // replace /index with /
    routePath ||= '/'; // or default to '/'
    if (route.dynamic) {
        dynamicRouteContextKeys.add(routePath);
        dynamicRoutes.add(`${routePath
            .replaceAll(exports.CATCH_ALL, '${CatchAllRoutePart<T>}')
            .replaceAll(exports.SLUG, '${SingleRoutePart<T>}')}`);
    }
    else {
        staticRoutes.add(routePath);
    }
}
//# sourceMappingURL=generate.js.map