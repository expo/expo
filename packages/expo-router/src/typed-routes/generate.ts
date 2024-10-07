import Constants from 'expo-constants';

import { RouteNode } from '../Route';
import { getRoutes } from '../getRoutes';
import { matchDynamicName, removeSupportedExtensions } from '../matchers';
import { RequireContext } from '../types';

// /[...param1]/ - Match [...param1]
const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
const SLUG = /\[.+?\]/g;
// /(group)/path/(group2)/route - Match [(group), (group2)]
const GROUP = /(?:^|\/)\(.*?\)/g;

export function getTypedRoutesDeclarationFile(ctx: RequireContext) {
  let routeNode: RouteNode | null = null;

  const partialTypedGroups: boolean =
    Constants.expoConfig?.extra?.router.partialTypedGroups || true;

  try {
    routeNode = getRoutes(ctx, {
      ignore: [/_layout\.[tj]sx?$/], // Skip layout files
      platformRoutes: false, // We don't need to generate platform specific routes
      notFound: false, // We don't need +not-found routes either
      ignoreEntryPoints: true,
      ignoreRequireErrors: true,
      importMode: 'async', // Don't load the file
    });
  } catch {
    // Ignore errors from `getRoutes`. This is also called inside the app, which has
    // a nicer UX for showing error messages
  }

  const groupedNodes = groupRouteNodes(routeNode);
  const staticRoutesStrings: string[] = [];
  const staticRoutesObjects: string[] = [];

  for (const type of groupedNodes.static) {
    staticRoutesStrings.push(
      contextKeyToType(type + "${`?${string}` | `#${string}` | ''}", partialTypedGroups)
    );
    staticRoutesObjects.push(
      `{ pathname: ${contextKeyToType(type, partialTypedGroups)}; params?: UnknownInputParams | never; }`
    );
  }

  const staticRoutes = [
    'Router.RelativePathString',
    'Router.ExternalPathString',
    ...staticRoutesStrings,
    ...staticRoutesObjects,
  ];

  const dynamicRouteTypes: string[] = [];
  const dynamicRouteTemplateTypes: string[] = [];
  const hrefParamsEntries: [string, string][] = [];

  for (const [dynamicRouteTemplate, paramsNames] of groupedNodes.dynamic) {
    const params = paramsNames
      .map((param) => {
        const key = matchDynamicName(param);
        const value = param.startsWith('[...') ? '(string | number)[]' : 'string | number';
        return `${key}: ${value};`;
      })
      .join('');

    let paramsString = '';
    if (params.length) {
      paramsString = ` & { ${params} }`;
      hrefParamsEntries.push([
        contextKeyToType(dynamicRouteTemplate, partialTypedGroups),
        paramsString,
      ]);
    }

    dynamicRouteTypes.push(
      contextKeyToType(
        dynamicRouteTemplate
          .replaceAll(CATCH_ALL, '${string}')
          .replaceAll(SLUG, '${Router.SingleRoutePart<T>}'),
        partialTypedGroups
      )
    );

    dynamicRouteTemplateTypes.push(
      `{ pathname: ${contextKeyToType(dynamicRouteTemplate, partialTypedGroups)}, params: Router.UnknownInputParams${paramsString} }`
    );
  }

  const hrefParams = hrefParamsEntries
    .map(([key, value]) => {
      return `Record<${key}, ${value}>`;
    })
    .join(' | ');

  return `/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      HrefParams: ${hrefParams};
      Href: ${[...staticRoutes, ...dynamicRouteTypes, ...dynamicRouteTemplateTypes].join(' | ')};
    }
  }
}
`;
}

function groupRouteNodes(
  routeNode: RouteNode | null,
  groupedContextKeys = {
    static: new Set<string>(),
    dynamic: new Map<string, string[]>(),
  }
) {
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

  let routeKey: string;

  if (routeNode.generated) {
    // Some routes like the root _layout, _sitemap, +not-found are generated.
    // We cannot use the contextKey, as their context key does not specify a route
    routeKey = routeNode.route;
  } else {
    routeKey = removeSupportedExtensions(routeNode.contextKey)
      .replace(/\/index$/, '') // Remove any trailing /index
      .replace(/^\./, ''); // Remove any leading .
  }

  routeKey ||= '/'; // A routeKey may be empty for contextKey '' or './index.js'

  if (!routeKey.startsWith('/')) {
    // Not all generated files will have the `/` prefix
    routeKey = `/${routeKey}`;
  }

  if (routeNode.dynamic) {
    groupedContextKeys.dynamic.set(
      routeKey,
      routeKey.split('/').filter((segment) => {
        return segment.startsWith('[') && segment.endsWith(']');
      })
    );
  } else {
    groupedContextKeys.static.add(routeKey);
  }

  for (const child of routeNode.children) {
    groupRouteNodes(child, groupedContextKeys);
  }

  return groupedContextKeys;
}

function contextKeyToType(contextKey: string, partialTypedGroups: boolean) {
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
    } else {
      return match;
    }
  });

  const typeWithoutGroups = contextKey.replaceAll(GROUP, '');

  return `\`${typeWithGroups}\` | ${typeWithoutGroups}`;
}
