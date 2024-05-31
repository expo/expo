"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTypedRoutesDeclarationFile = getTypedRoutesDeclarationFile;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _getRoutes() {
  const data = require("../getRoutes");
  _getRoutes = function () {
    return data;
  };
  return data;
}
function _matchers() {
  const data = require("../matchers");
  _matchers = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// /[...param1]/ - Match [...param1]
const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
const SLUG = /\[.+?\]/g;
function getTypedRoutesDeclarationFile(ctx) {
  const staticRoutes = new Set();
  const dynamicRoutes = new Set();
  const dynamicRouteContextKeys = new Set();
  walkRouteNode((0, _getRoutes().getRoutes)(ctx, {
    platformRoutes: false,
    // We don't need to generate platform specific routes
    ignoreEntryPoints: true,
    ignoreRequireErrors: true,
    importMode: 'async'
  }), staticRoutes, dynamicRoutes, dynamicRouteContextKeys);

  // If the user has expo-router v3+ installed, we can use the types from the package
  return _nodeFs().default.readFileSync(_path().default.join(require.resolve('expo-router/package.json'), '..', './types/expo-router.d.ts'), 'utf-8')
  // Swap from being a namespace to a module
  .replace('declare namespace ExpoRouter {', `declare module "expo-router" {`)
  // Add the route values
  .replace('type StaticRoutes = string;', `type StaticRoutes = ${setToUnionType(staticRoutes)};`).replace('type DynamicRoutes<T extends string> = string;', `type DynamicRoutes<T extends string> = ${setToUnionType(dynamicRoutes)};`).replace('type DynamicRouteTemplate = never;', `type DynamicRouteTemplate = ${setToUnionType(dynamicRouteContextKeys)};`);
}

/**
 * Walks a RouteNode tree and adds the routes to the provided sets
 */
function walkRouteNode(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys) {
  if (!routeNode) return;
  addRouteNode(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
  for (const child of routeNode.children) {
    walkRouteNode(child, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
  }
}

/**
 * Given a RouteNode, adds the route to the correct sets
 * Modifies the RouteNode.route to be a typed-route string
 */
function addRouteNode(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys) {
  if (!routeNode?.route) return;
  if (!(0, _matchers().isTypedRoute)(routeNode.route)) return;
  let routePath = `${(0, _matchers().removeSupportedExtensions)(routeNode.route).replace(/\/?index$/, '')}`; // replace /index with /

  if (!routePath.startsWith('/')) {
    routePath = `/${routePath}`;
  }
  if (routeNode.dynamic) {
    for (const path of generateCombinations(routePath)) {
      dynamicRouteContextKeys.add(path);
      dynamicRoutes.add(`${path.replaceAll(CATCH_ALL, '${CatchAllRoutePart<T>}').replaceAll(SLUG, '${SingleRoutePart<T>}')}`);
    }
  } else {
    for (const combination of generateCombinations(routePath)) {
      staticRoutes.add(combination);
    }
  }
}

/**
 * Converts a Set to a TypeScript union type
 */
const setToUnionType = set => {
  return set.size > 0 ? [...set].sort().map(s => `\`${s}\``).join(' | ') : 'never';
};
function generateCombinations(pathname) {
  const groups = pathname.split('/').filter(part => part.startsWith('(') && part.endsWith(')'));
  const combinations = [];
  function generate(currentIndex, currentPath) {
    if (currentIndex === groups.length) {
      combinations.push(currentPath.replace(/\/{2,}/g, '/'));
      return;
    }
    const group = groups[currentIndex];
    const withoutGroup = currentPath.replace(group, '');
    generate(currentIndex + 1, withoutGroup);
    generate(currentIndex + 1, currentPath);
  }
  generate(0, pathname);
  return combinations;
}
//# sourceMappingURL=generate.js.map