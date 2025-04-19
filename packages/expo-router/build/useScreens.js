"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSortedScreens = useSortedScreens;
exports.screenOptionsFactory = screenOptionsFactory;
exports.routeToScreen = routeToScreen;
exports.getSingularId = getSingularId;
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const primitives_1 = require("./primitives");
const getRouteComponent_1 = require("./routes/getRouteComponent");
function getSortedChildren(children, order, initialRouteName) {
    if (!order?.length) {
        return children
            .sort((0, Route_1.sortRoutesWithInitial)(initialRouteName))
            .map((route) => ({ route, props: {} }));
    }
    const entries = [...children];
    const ordered = order
        .map(({ name, redirect, initialParams, listeners, options, getId, dangerouslySingular: singular, }) => {
        if (!entries.length) {
            console.warn(`[Layout children]: Too many screens defined. Route "${name}" is extraneous.`);
            return null;
        }
        const matchIndex = entries.findIndex((child) => child.route === name);
        if (matchIndex === -1) {
            console.warn(`[Layout children]: No route named "${name}" exists in nested children:`, children.map(({ route }) => route));
            return null;
        }
        else {
            // Get match and remove from entries
            const match = entries[matchIndex];
            entries.splice(matchIndex, 1);
            // Ensure to return null after removing from entries.
            if (redirect) {
                if (typeof redirect === 'string') {
                    throw new Error(`Redirecting to a specific route is not supported yet.`);
                }
                return null;
            }
            if (getId) {
                console.warn(`Deprecated: prop 'getId' on screen ${name} is deprecated. Please rename the prop to 'dangerouslySingular'`);
                if (singular) {
                    console.warn(`Screen ${name} cannot use both getId and dangerouslySingular together.`);
                }
            }
            else if (singular) {
                // If singular is set, use it as the getId function.
                if (typeof singular === 'string') {
                    getId = () => singular;
                }
                else if (typeof singular === 'function' && name) {
                    getId = (options) => singular(name, options.params || {});
                }
                else if (singular === true && name) {
                    getId = (options) => getSingularId(name, options);
                }
            }
            return {
                route: match,
                props: { initialParams, listeners, options, getId },
            };
        }
    })
        .filter(Boolean);
    // Add any remaining children
    ordered.push(...entries.sort((0, Route_1.sortRoutesWithInitial)(initialRouteName)).map((route) => ({ route, props: {} })));
    return ordered;
}
/**
 * @returns React Navigation screens sorted by the `route` property.
 */
function useSortedScreens(order) {
    const node = (0, Route_1.useRouteNode)();
    const sorted = node?.children?.length
        ? getSortedChildren(node.children, order, node.initialRouteName)
        : [];
    return react_1.default.useMemo(() => sorted.map((value) => routeToScreen(value.route, value.props)), [sorted]);
}
function screenOptionsFactory(route, options) {
    return (args) => {
        // Only eager load generated components
        const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
        const staticResult = typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
        const dynamicResult = typeof options === 'function' ? options?.(args) : options;
        const output = {
            ...staticResult,
            ...dynamicResult,
        };
        // Prevent generated screens from showing up in the tab bar.
        if (route.generated) {
            output.tabBarItemStyle = { display: 'none' };
            output.tabBarButton = () => null;
            // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
            output.drawerItemStyle = { height: 0, display: 'none' };
        }
        return output;
    };
}
function routeToScreen(route, { options, getId, ...props } = {}) {
    return (<primitives_1.Screen {...props} name={route.route} key={route.route} getId={getId} options={screenOptionsFactory(route, options)} getComponent={() => (0, getRouteComponent_1.getQualifiedRouteComponent)(route)}/>);
}
function getSingularId(name, options = {}) {
    return name
        .split('/')
        .map((segment) => {
        if (segment.startsWith('[...')) {
            return options.params?.[segment.slice(4, -1)]?.join('/') || segment;
        }
        else if (segment.startsWith('[')) {
            return options.params?.[segment.slice(1, -1)] || segment;
        }
        else {
            return segment;
        }
    })
        .join('/');
}
//# sourceMappingURL=useScreens.js.map