"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGroupNavigatorChildren = void 0;
const react_1 = require("react");
const Route_1 = require("../Route");
const sortRoutes_1 = require("../sortRoutes");
const useScreens_1 = require("../useScreens");
const Screen_1 = require("../views/Screen");
const ScreenRedirect_1 = require("../views/ScreenRedirect");
/**
 * Groups a navigator's children into screens and custom children.
 */
function useGroupNavigatorChildren(children, { isCustomNavigator, contextKey, processor, } = {}) {
    const node = (0, Route_1.useRouteNode)();
    return (0, react_1.useMemo)(() => {
        const customChildren = [];
        const redirects = new Map();
        let userScreenOrder = react_1.Children.map(children, (child) => {
            if (!(0, react_1.isValidElement)(child) || !child) {
                if (isCustomNavigator) {
                    customChildren.push(child);
                    return null;
                }
                else {
                    warnLayoutChildren(contextKey);
                    return null;
                }
            }
            if (child.type === Screen_1.Screen) {
                if (!assertNameInProps(child)) {
                    return errorMissingName('Screen', contextKey);
                }
                if (process.env.NODE_ENV !== 'production') {
                    if (['children', 'component', 'getComponent'].some((key) => child.props && typeof child.props === 'object' && key in child.props)) {
                        throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
                    }
                    return child.props;
                }
            }
            if (child.type === ScreenRedirect_1.ScreenRedirect) {
                if (!assertNameInProps(child)) {
                    return errorMissingName('Screen', contextKey);
                }
                redirects.set(child.props.name, child.props);
            }
            warnLayoutChildren(contextKey);
            return null;
        });
        // Add an assertion for development
        if (process.env.NODE_ENV !== 'production') {
            if (userScreenOrder) {
                // Assert if names are not unique
                const seen = new Set();
                for (const screen of userScreenOrder) {
                    if (seen.has(screen.name)) {
                        throw new Error(`Screen names must be unique: ${screen.name}`);
                    }
                    seen.add(screen.name);
                }
            }
        }
        userScreenOrder ||= [];
        if (processor) {
            userScreenOrder = processor(userScreenOrder);
        }
        const screens = getScreens(node, userScreenOrder, redirects);
        return {
            screens,
            children: customChildren,
        };
    }, [children, processor, node]);
}
exports.useGroupNavigatorChildren = useGroupNavigatorChildren;
function getScreens(node, order, redirects) {
    const children = node.children;
    const anchor = node.initialRouteName;
    // If there is no specific order, return the children in the order they were defined
    if (!order.length && !redirects.size) {
        return children.sort((0, sortRoutes_1.sortRoutesWithAnchor)(anchor)).map((route) => (0, useScreens_1.routeToScreen)(route));
    }
    const childrenNodeMap = new Map(children.map((child) => [child.route, child]));
    const screens = [];
    for (const { name, redirect, ...props } of order) {
        const route = childrenNodeMap.get(name);
        if (!route) {
            console.warn(`[Layout children]: No route named "${name}" exists in nested children:`, ...childrenNodeMap.keys());
            continue;
        }
        // Ensure to return null after removing from entries.
        if (redirect) {
            throw new Error(`Please use <Screen.Redirect /> to declare a redirect.`);
        }
        // Remove from the children so it doesn't get added again
        childrenNodeMap.delete(name);
        // Ensure the anchor is at the start
        if (name === anchor) {
            screens.unshift((0, useScreens_1.routeToScreen)(route, props));
        }
        else {
            screens.push((0, useScreens_1.routeToScreen)(route, props));
        }
    }
    // If there is an anchor, add it to the start
    if (anchor) {
        const anchorRoute = childrenNodeMap.get(anchor);
        if (anchorRoute) {
            screens.unshift((0, useScreens_1.routeToScreen)(anchorRoute));
            childrenNodeMap.delete(anchor);
        }
    }
    // The remaining nodes where not in the order, so sort them and add them to the end
    const sortedScreens = Array.from(childrenNodeMap.values())
        .sort(sortRoutes_1.sortRoutes)
        .map((route) => (0, useScreens_1.routeToScreen)(route));
    // Add the remaining screens
    screens.push(...sortedScreens);
    return screens;
}
const warnLayoutChildren = (contextKey) => {
    console.warn(`Layout children must be of type Screen, ScreenRedirect or ScreenRewrite. All other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`);
};
const assertNameInProps = (child) => {
    return Boolean(child &&
        typeof child === 'object' &&
        'props' in child &&
        typeof child.props === 'object' &&
        child.props &&
        'name' in child.props &&
        typeof child.props.name === 'string' &&
        child.props.name);
};
const errorMissingName = (type, contextKey) => {
    throw new Error(`<${type} /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
};
//# sourceMappingURL=useGroupNavigatorChildren.js.map