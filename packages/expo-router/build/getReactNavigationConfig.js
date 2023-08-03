import { matchDeepDynamicRouteName, matchDynamicName } from './matchers';
// `[page]` -> `:page`
// `page` -> `page`
function convertDynamicRouteToReactNavigation(segment) {
    // NOTE(EvanBacon): To support shared routes we preserve group segments.
    if (segment === 'index') {
        return '';
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
function parseRouteSegments(segments) {
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
        .join('/'));
}
function convertRouteNodeToScreen(node, metaOnly) {
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
    const screen = {
        path,
        screens,
        // NOTE(EvanBacon): This is bad because it forces all Layout Routes
        // to be loaded into memory. We should move towards a system where
        // the initial route name is either loaded asynchronously in the Layout Route
        // or defined via a file system convention.
        initialRouteName: node.initialRouteName,
    };
    if (!metaOnly) {
        screen._route = node;
    }
    return screen;
}
export function getReactNavigationScreensConfig(nodes, metaOnly) {
    return Object.fromEntries(nodes.map((node) => [node.route, convertRouteNodeToScreen(node, metaOnly)]));
}
export function getReactNavigationConfig(routes, metaOnly) {
    return {
        initialRouteName: routes.initialRouteName,
        screens: getReactNavigationScreensConfig(routes.children, metaOnly),
    };
}
//# sourceMappingURL=getReactNavigationConfig.js.map