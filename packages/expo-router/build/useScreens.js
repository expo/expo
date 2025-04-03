'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingularId = exports.routeToScreen = exports.screenOptionsFactory = exports.getQualifiedRouteComponent = exports.useSortedScreens = void 0;
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
exports.useSortedScreens = useSortedScreens;
function fromImport(value, { ErrorBoundary, ...component }) {
    // If possible, add a more helpful display name for the component stack to improve debugging of React errors such as `Text strings must be rendered within a <Text> component.`.
    if (component?.default && __DEV__) {
        component.default.displayName ??= `${component.default.name ?? 'Route'}(${value.contextKey})`;
    }
    if (ErrorBoundary) {
        const Wrapped = react_1.default.forwardRef((props, ref) => {
            const children = react_1.default.createElement(component.default || EmptyRoute_1.EmptyRoute, {
                ...props,
                ref,
            });
            return <Try_1.Try catch={ErrorBoundary}>{children}</Try_1.Try>;
        });
        if (__DEV__) {
            Wrapped.displayName = `ErrorBoundary(${value.contextKey})`;
        }
        return {
            default: Wrapped,
        };
    }
    if (process.env.NODE_ENV !== 'production') {
        if (typeof component.default === 'object' &&
            component.default &&
            Object.keys(component.default).length === 0) {
            return { default: EmptyRoute_1.EmptyRoute };
        }
    }
    return { default: component.default };
}
function fromLoadedRoute(value, res) {
    if (!(res instanceof Promise)) {
        return fromImport(value, res);
    }
    return res.then(fromImport.bind(null, value));
}
// TODO: Maybe there's a more React-y way to do this?
// Without this store, the process enters a recursive loop.
const qualifiedStore = new WeakMap();
/** Wrap the component with various enhancements and add access to child routes. */
function getQualifiedRouteComponent(value) {
    if (qualifiedStore.has(value)) {
        return qualifiedStore.get(value);
    }
    let ScreenComponent;
    // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
    if (import_mode_1.default === 'lazy') {
        ScreenComponent = react_1.default.lazy(async () => {
            const res = value.loadRoute();
            return fromLoadedRoute(value, res);
        });
        if (__DEV__) {
            ScreenComponent.displayName = `AsyncRoute(${value.route})`;
        }
    }
    else {
        const res = value.loadRoute();
        ScreenComponent = fromImport(value, res).default;
    }
    function BaseRoute({ 
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route, navigation, 
    // Pass all other props to the component
    ...props }) {
        return (<Route_1.Route node={value} route={route}>
        <react_1.default.Suspense fallback={<SuspenseFallback_1.SuspenseFallback route={value}/>}>
          <ScreenComponent {...props} 
        // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
        // the intention is to make it possible to deduce shared routes.
        segment={value.route}/>
        </react_1.default.Suspense>
      </Route_1.Route>);
    }
    if (__DEV__) {
        BaseRoute.displayName = `Route(${value.route})`;
    }
    qualifiedStore.set(value, BaseRoute);
    return BaseRoute;
}
exports.getQualifiedRouteComponent = getQualifiedRouteComponent;
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
exports.screenOptionsFactory = screenOptionsFactory;
function routeToScreen(route, { options, getId, ...props } = {}) {
    return (<primitives_1.Screen {...props} name={route.route} key={route.route} getId={getId} options={screenOptionsFactory(route, options)} getComponent={() => getQualifiedRouteComponent(route)}/>);
}
exports.routeToScreen = routeToScreen;
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
exports.getSingularId = getSingularId;
//# sourceMappingURL=useScreens.js.map