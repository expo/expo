import type { RouteNode } from './Route';
import { getGroupAnchor } from './layoutAnchor';
import { matchDynamicName } from './matchers';

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
  const dynamicName = matchDynamicName(segment);
  if (dynamicName && !dynamicName.deep) {
    return `:${dynamicName.name}`;
  } else if (dynamicName?.deep) {
    return '*' + dynamicName.name;
  } else {
    return segment;
  }
}

export function parseRouteSegments(segments: string): string {
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

  // Only the anchor known without loading the layout ranks equally specific URL matches.
  const groupAnchor = getGroupAnchor(node);
  if (groupAnchor) {
    screen.initialRouteName = groupAnchor;
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

export function getReactNavigationConfig(routeTree: RouteNode | null, metaOnly: boolean) {
  return {
    initialRouteName: undefined,
    screens: routeTree ? getReactNavigationScreensConfig(routeTree.children, metaOnly) : {},
  };
}
