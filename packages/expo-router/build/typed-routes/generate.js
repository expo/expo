"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypedRoutesDeclarationFile = void 0;
const getRoutes_1 = require("../getRoutes");
const matchers_1 = require("../matchers");
// /[...param1]/ - Match [...param1]
const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
const SLUG = /\[.+?\]/g;
function getTypedRoutesDeclarationFile(ctx) {
    const staticRoutes = new Set();
    const dynamicRoutes = new Set();
    const dynamicRouteContextKeys = new Set();
    walkRouteNode((0, getRoutes_1.getRoutes)(ctx, {
        platformRoutes: false,
        ignoreEntryPoints: true,
        ignoreRequireErrors: true,
        importMode: 'async',
    }), '', staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
    return `/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: ${setToUnionType(staticRoutes)};
      DynamicRoutes: ${setToUnionType(dynamicRoutes)};
      DynamicRouteTemplate: ${setToUnionType(dynamicRouteContextKeys)};
    }
  }
}
`;
}
exports.getTypedRoutesDeclarationFile = getTypedRoutesDeclarationFile;
/**
 * Walks a RouteNode tree and adds the routes to the provided sets
 */
function walkRouteNode(routeNode, parentRoutePath, staticRoutes, dynamicRoutes, dynamicRouteContextKeys) {
    if (!routeNode)
        return;
    addRouteNode(routeNode, parentRoutePath, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
    parentRoutePath = `${(0, matchers_1.removeSupportedExtensions)(`${parentRoutePath}/${routeNode.route}`).replace(/\/?index$/, '')}`; // replace /index with /
    for (const child of routeNode.children) {
        walkRouteNode(child, parentRoutePath, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
    }
}
/**
 * Given a RouteNode, adds the route to the correct sets
 * Modifies the RouteNode.route to be a typed-route string
 */
function addRouteNode(routeNode, parentRoutePath, staticRoutes, dynamicRoutes, dynamicRouteContextKeys) {
    if (!routeNode?.route)
        return;
    if (!(0, matchers_1.isTypedRoute)(routeNode.route))
        return;
    let routePath = `${parentRoutePath}/${(0, matchers_1.removeSupportedExtensions)(routeNode.route).replace(/\/?index$/, '')}`; // replace /index with /
    if (!routePath.startsWith('/')) {
        routePath = `/${routePath}`;
    }
    if (routeNode.dynamic) {
        for (const path of generateCombinations(routePath)) {
            dynamicRouteContextKeys.add(path);
            dynamicRoutes.add(`${path.replaceAll(CATCH_ALL, '${string}').replaceAll(SLUG, '${Router.SingleRoutePart<T>}')}`);
        }
    }
    else {
        for (const combination of generateCombinations(routePath)) {
            staticRoutes.add(combination);
        }
    }
}
/**
 * Converts a Set to a TypeScript union type
 */
const setToUnionType = (set) => {
    return set.size > 0
        ? [...set]
            .sort()
            .map((s) => `\`${s}\``)
            .join(' | ')
        : 'never';
};
function generateCombinations(pathname) {
    const groups = pathname.split('/').filter((part) => part.startsWith('(') && part.endsWith(')'));
    const combinations = [];
    function generate(currentIndex, currentPath) {
        if (currentIndex === groups.length) {
            combinations.push(currentPath.replace(/\/{2,}/g, '/'));
            return;
        }
        const group = groups[currentIndex];
        const withoutGroup = currentPath.replace(`/${group}`, '');
        generate(currentIndex + 1, withoutGroup);
        generate(currentIndex + 1, currentPath);
    }
    generate(0, pathname);
    return combinations;
}
//# sourceMappingURL=generate.js.map