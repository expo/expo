"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetIdForRoute = exports.getQualifiedRouteComponent = exports.useSortedScreens = void 0;
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const import_mode_1 = __importDefault(require("./import-mode"));
const primitives_1 = require("./primitives");
const EmptyRoute_1 = require("./views/EmptyRoute");
const SuspenseFallback_1 = require("./views/SuspenseFallback");
const Try_1 = require("./views/Try");
function getSortedChildren(children, order, initialRouteName) {
    if (!order?.length) {
        return children
            .sort((0, Route_1.sortRoutesWithInitial)(initialRouteName))
            .map((route) => ({ route, props: {} }));
    }
    const entries = [...children];
    const ordered = order
        .map(({ name, redirect, initialParams, listeners, options, getId }) => {
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
exports.useSortedScreens = useSortedScreens;
function fromImport({ ErrorBoundary, ...component }) {
    if (ErrorBoundary) {
        return {
            default: react_1.default.forwardRef((props, ref) => {
                const children = react_1.default.createElement(component.default || EmptyRoute_1.EmptyRoute, {
                    ...props,
                    ref,
                });
                return <Try_1.Try catch={ErrorBoundary}>{children}</Try_1.Try>;
            }),
        };
    }
    if (process.env.NODE_ENV !== 'production') {
        if (typeof component.default === 'object' &&
            component.default &&
            Object.keys(component.default).length === 0) {
            return { default: EmptyRoute_1.EmptyRoute };
        }
    }
    return { default: component.default || EmptyRoute_1.EmptyRoute };
}
function fromLoadedRoute(res) {
    if (!(res instanceof Promise)) {
        return fromImport(res);
    }
    return res.then(fromImport);
}
// TODO: Maybe there's a more React-y way to do this?
// Without this store, the process enters a recursive loop.
const qualifiedStore = new WeakMap();
/** Wrap the component with various enhancements and add access to child routes. */
function getQualifiedRouteComponent(value) {
    if (qualifiedStore.has(value)) {
        return qualifiedStore.get(value);
    }
    let getLoadable;
    // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
    if (import_mode_1.default === 'lazy') {
        const AsyncComponent = react_1.default.lazy(async () => {
            const res = value.loadRoute();
            return fromLoadedRoute(res);
        });
        getLoadable = (props, ref) => (<react_1.default.Suspense fallback={<SuspenseFallback_1.SuspenseFallback route={value}/>}>
        <AsyncComponent {...{
            ...props,
            ref,
            // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
            // the intention is to make it possible to deduce shared routes.
            segment: value.route,
        }}/>
      </react_1.default.Suspense>);
    }
    else {
        const res = value.loadRoute();
        const Component = fromImport(res).default;
        const SyncComponent = react_1.default.forwardRef((props, ref) => {
            return <Component {...props} ref={ref}/>;
        });
        getLoadable = (props, ref) => (<SyncComponent {...{
            ...props,
            ref,
            // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
            // the intention is to make it possible to deduce shared routes.
            segment: value.route,
        }}/>);
    }
    const QualifiedRoute = react_1.default.forwardRef(({ 
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route, navigation, 
    // Pass all other props to the component
    ...props }, ref) => {
        const loadable = getLoadable(props, ref);
        return <Route_1.Route node={value}>{loadable}</Route_1.Route>;
    });
    QualifiedRoute.displayName = `Route(${value.route})`;
    qualifiedStore.set(value, QualifiedRoute);
    return QualifiedRoute;
}
exports.getQualifiedRouteComponent = getQualifiedRouteComponent;
/** @returns a function which provides a screen id that matches the dynamic route name in params. */
function createGetIdForRoute(route) {
    if (!route.dynamic?.length) {
        return undefined;
    }
    return ({ params }) => {
        const getPreferredId = (segment) => {
            // Params can be undefined when there are no params in the route.
            const preferredId = params?.[segment.name];
            // If the route has a dynamic segment, use the matching parameter
            // as the screen id. This enables pushing a screen like `/[user]` multiple times
            // when the user is different.
            if (preferredId) {
                if (!Array.isArray(preferredId)) {
                    return preferredId;
                }
                else if (preferredId.length) {
                    // Deep dynamic routes will return as an array, so we'll join them to create a
                    // fully qualified string.
                    return preferredId.join('/');
                }
                // Empty arrays...
            }
            return segment.deep ? `[...${segment.name}]` : `[${segment.name}]`;
        };
        return route.dynamic?.map((segment) => getPreferredId(segment)).join('/');
    };
}
exports.createGetIdForRoute = createGetIdForRoute;
function routeToScreen(route, { options, ...props } = {}) {
    return (<primitives_1.Screen 
    // Users can override the screen getId function.
    getId={createGetIdForRoute(route)} {...props} name={route.route} key={route.route} options={(args) => {
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
                output.tabBarButton = () => null;
                // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
                output.drawerItemStyle = { height: 0, display: 'none' };
            }
            return output;
        }} getComponent={() => getQualifiedRouteComponent(route)}/>);
}
//# sourceMappingURL=useScreens.js.map