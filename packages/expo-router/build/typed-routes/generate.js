"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypedRoutesDeclarationFile = void 0;
const getRoutes_1 = require("../getRoutes");
const matchers_1 = require("../matchers");
// /[...param1]/ - Match [...param1]
const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
const SLUG = /\[.+?\]/g;
// /(group)/path/(group2)/route - Match [(group), (group2)]
const GROUP = /(?:^|\/)\(.*?\)/g;
function getTypedRoutesDeclarationFile(ctx, { partialTypedGroups = false, testIgnoreComments = false, } = {}) {
    let routeNode = null;
    try {
        routeNode = (0, getRoutes_1.getRoutes)(ctx, {
            ignore: [/_layout\.[tj]sx?$/],
            platformRoutes: false,
            notFound: false,
            ignoreEntryPoints: true,
            ignoreRequireErrors: true,
            importMode: 'async', // Don't load the file
        });
    }
    catch {
        // Ignore errors from `getRoutes`. This is also called inside the app, which has
        // a nicer UX for showing error messages
    }
    const groupedNodes = groupRouteNodes(routeNode);
    const staticRoutesStrings = ['Router.RelativePathString', 'Router.ExternalPathString'];
    const staticRouteInputObjects = [
        '{ pathname: Router.RelativePathString, params?: Router.UnknownInputParams }',
        '{ pathname: Router.ExternalPathString, params?: Router.UnknownInputParams }',
    ];
    const staticRouteOutputObjects = [
        '{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams }',
        '{ pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams }',
    ];
    for (const type of groupedNodes.static) {
        staticRoutesStrings.push(contextKeyToType(type + "${`?${string}` | `#${string}` | ''}", partialTypedGroups));
        staticRouteInputObjects.push(`{ pathname: ${contextKeyToType(type, partialTypedGroups)}; params?: Router.UnknownInputParams; }`);
        staticRouteOutputObjects.push(`{ pathname: ${contextKeyToType(type, partialTypedGroups)}; params?: Router.UnknownOutputParams; }`);
    }
    const dynamicRouteStrings = [];
    const dynamicRouteInputObjects = [];
    const dynamicRouteOutputObjects = [];
    for (const [dynamicRouteTemplate, paramsNames] of groupedNodes.dynamic) {
        const inputParams = paramsNames
            .map((param) => {
            const key = param.startsWith('...') ? param.slice(3) : param;
            const value = param.startsWith('...') ? '(string | number)[]' : 'string | number';
            return `${key}: ${value};`;
        })
            .join('');
        const outputParams = paramsNames
            .map((param) => {
            const key = param.startsWith('...') ? param.slice(3) : param;
            const value = param.startsWith('...') ? 'string[]' : 'string';
            return `${key}: ${value};`;
        })
            .join('');
        dynamicRouteStrings.push(contextKeyToType(dynamicRouteTemplate
            .replaceAll(CATCH_ALL, '${string}')
            .replaceAll(SLUG, '${Router.SingleRoutePart<T>}'), partialTypedGroups));
        dynamicRouteInputObjects.push(`{ pathname: ${contextKeyToType(dynamicRouteTemplate, partialTypedGroups)}, params: Router.UnknownInputParams & { ${inputParams} } }`);
        dynamicRouteOutputObjects.push(`{ pathname: ${contextKeyToType(dynamicRouteTemplate, partialTypedGroups)}, params: Router.UnknownOutputParams & { ${outputParams} } }`);
    }
    const href = [
        ...staticRoutesStrings,
        ...staticRouteInputObjects,
        ...dynamicRouteStrings,
        ...dynamicRouteInputObjects,
    ].join(' | ');
    const hrefInputParams = [...staticRouteInputObjects, ...dynamicRouteInputObjects].join(' | ');
    const hrefOutputParams = [...staticRouteOutputObjects, ...dynamicRouteOutputObjects].join(' | ');
    const tsExpectError = testIgnoreComments
        ? '// @ts-ignore-error -- During tests we need to ignore the "duplicate" declaration error, as multiple fixture declare types \n      '
        : '';
    return `/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      ${tsExpectError}hrefInputParams: ${hrefInputParams};
      ${tsExpectError}hrefOutputParams: ${hrefOutputParams};
      ${tsExpectError}href: ${href};
    }
  }
}
`;
}
exports.getTypedRoutesDeclarationFile = getTypedRoutesDeclarationFile;
function groupRouteNodes(routeNode, groupedContextKeys = {
    static: new Set(),
    dynamic: new Map(),
}) {
    if (!routeNode) {
        return groupedContextKeys;
    }
    // Skip non-route files
    if (routeNode.type !== 'route') {
        // Except the root layout
        if (routeNode.route === '') {
            for (const child of routeNode.children) {
                groupRouteNodes(child, groupedContextKeys);
            }
            return groupedContextKeys;
        }
        return groupedContextKeys;
    }
    let routeKey;
    if (routeNode.generated) {
        // Some routes like the root _layout, _sitemap, +not-found are generated.
        // We cannot use the contextKey, as their context key does not specify a route
        routeKey = routeNode.route;
    }
    else {
        routeKey = (0, matchers_1.removeSupportedExtensions)(routeNode.contextKey)
            .replace(/\/index$/, '') // Remove any trailing /index
            .replace(/^\./, ''); // Remove any leading .
    }
    routeKey ||= '/'; // A routeKey may be empty for contextKey '' or './index.js'
    if (!routeKey.startsWith('/')) {
        // Not all generated files will have the `/` prefix
        routeKey = `/${routeKey}`;
    }
    if (routeNode.dynamic) {
        groupedContextKeys.dynamic.set(routeKey, routeKey
            .split('/')
            .filter((segment) => {
            return segment.startsWith('[') && segment.endsWith(']');
        })
            .map((segment) => {
            return segment.slice(1, -1);
        }));
    }
    else {
        groupedContextKeys.static.add(routeKey);
    }
    for (const child of routeNode.children) {
        groupRouteNodes(child, groupedContextKeys);
    }
    return groupedContextKeys;
}
function contextKeyToType(contextKey, partialTypedGroups) {
    // If the route has groups, turn them into template strings
    const typeWithGroups = contextKey.replaceAll(GROUP, (match) => {
        const groups = match.slice(2, -1); // Remove the leading ( and the trailing )
        // When `partialRoutes` is enabled, we always change a group to a template
        if (groups.length > 1 || partialTypedGroups) {
            // Ensure each group has the trailing slash
            const groupsAsType = groups.split(',').map((group) => `'/(${group})'`);
            // `partialRoutes` allow you to skip a group
            if (partialTypedGroups) {
                groupsAsType.push("''");
            }
            // Combine together into a union
            return `\${${groupsAsType.join(' | ')}}`;
        }
        else {
            return match;
        }
    });
    const typeWithoutGroups = contextKey.replaceAll(GROUP, '');
    if (typeWithGroups === typeWithoutGroups) {
        return `\`${typeWithGroups}\``;
    }
    else {
        return `\`${typeWithGroups}\` | \`${typeWithoutGroups}\``;
    }
}
//# sourceMappingURL=generate.js.map