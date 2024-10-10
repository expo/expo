import type { RouteNode } from './Route';
import { matchDeepDynamicRouteName, matchDynamicName } from './matchers';

export type Screen =
  | string
  | {
      path: string;
      screens: Record<string, Screen>;
      _route?: RouteNode;
      initialRouteName?: string;
    };

// `[page]` -> `:page`
// `page` -> `page`
function convertDynamicRouteToReactNavigation(segment: string): string {
  // NOTE(EvanBacon): To support shared routes we preserve group segments.
  if (segment === 'index') {
    return '';
  }
  if (segment === '+not-found') {
    return '*not-found';
  }

  const rest = matchDeepDynamicRouteName(segment);
  if (rest != null) {
    return '*' + rest;
  }
  const dynamicName = matchDynamicName(segment);

  if (dynamicName != null) {
    return `:${dynamicName}`;
  }

  return segment;
}

function parseRouteSegments(segments: string): string {
  return (
    // NOTE(EvanBacon): When there are nested routes without layouts
    // the node.route will be something like `app/home/index`
    // this needs to be split to ensure each segment is parsed correctly.
    segments
      .split('/')
      // Convert each segment to a React Navigation format.
      .map(convertDynamicRouteToReactNavigation)
      // Remove any empty paths from groups or index routes.
      .filter(Boolean)
      // Join to return as a path.
      .join('/')
  );
}

function convertRouteNodeToScreen(node: RouteNode, metaOnly: boolean): Screen {
  const path = parseRouteSegments(node.route);
  if (!node.children.length) {
    if (!metaOnly) {
      return {
        path,
        screens: {},
        _route: node,
      };
    }
    return path;
  }
  const screens = getReactNavigationScreensConfig(node.children, metaOnly);

  const screen: Screen = {
    path,
    screens,
  };

  if (node.initialRouteName) {
    // NOTE(EvanBacon): This is bad because it forces all Layout Routes
    // to be loaded into memory. We should move towards a system where
    // the initial route name is either loaded asynchronously in the Layout Route
    // or defined via a file system convention.
    screen.initialRouteName = node.initialRouteName;
  }

  if (!metaOnly) {
    screen._route = node;
  }

  return screen;
}

export function getReactNavigationScreensConfig(
  nodes: RouteNode[],
  metaOnly: boolean
): Record<string, Screen> {
  return Object.fromEntries(
    nodes.map((node) => [node.route, convertRouteNodeToScreen(node, metaOnly)] as const)
  );
}

export function getReactNavigationConfig(routes: RouteNode, metaOnly: boolean) {
  const config = {
    initialRouteName: undefined,
    screens: getReactNavigationScreensConfig(routes.children, metaOnly),
  };

  if (routes.initialRouteName) {
    // We're using LinkingOptions the generic type is `object` instead of a proper ParamList.
    // So we need to cast the initialRouteName to `any` to avoid type errors.
    config.initialRouteName = routes.initialRouteName as any;
  }
  return config;
}
