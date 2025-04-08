"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRouteSegments = parseRouteSegments;
exports.getReactNavigationScreensConfig = getReactNavigationScreensConfig;
exports.getReactNavigationConfig = getReactNavigationConfig;
const matchers_1 = require("./matchers");
// `[page]` -> `:page`
// `page` -> `page`
function convertDynamicRouteToReactNavigation(segment) {
    // NOTE(EvanBacon): To support shared routes we preserve group segments.
    if (segment === 'index') {
        return '';
    }
    if (segment === '+not-found') {
        return '*not-found';
    }
    const rest = (0, matchers_1.matchDeepDynamicRouteName)(segment);
    if (rest != null) {
        return '*' + rest;
    }
    const dynamicName = (0, matchers_1.matchDynamicName)(segment);
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
function getReactNavigationScreensConfig(nodes, metaOnly) {
    return Object.fromEntries(nodes.map((node) => [node.route, convertRouteNodeToScreen(node, metaOnly)]));
}
function getReactNavigationConfig(routes, metaOnly) {
    const config = {
        initialRouteName: undefined,
        screens: getReactNavigationScreensConfig(routes.children, metaOnly),
    };
    if (routes.initialRouteName) {
        // We're using LinkingOptions the generic type is `object` instead of a proper ParamList.
        // So we need to cast the initialRouteName to `any` to avoid type errors.
        config.initialRouteName = routes.initialRouteName;
    }
    return config;
}
//# sourceMappingURL=getReactNavigationConfig.js.map