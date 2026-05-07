"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSortedScreens = useSortedScreens;
exports.getQualifiedRouteComponent = getQualifiedRouteComponent;
exports.screenOptionsFactory = screenOptionsFactory;
exports.routeToScreen = routeToScreen;
exports.getSingularId = getSingularId;
const react_1 = require("react");
const jsx_runtime_1 = require("react/jsx-runtime");
const react_2 = __importStar(require("react"));
const Route_1 = require("./Route");
const storeContext_1 = require("./global-state/storeContext");
const utils_1 = require("./global-state/utils");
const import_mode_1 = __importDefault(require("./import-mode"));
const ZoomTransitionEnabler_1 = require("./link/zoom/ZoomTransitionEnabler");
const zoom_transition_context_providers_1 = require("./link/zoom/zoom-transition-context-providers");
const navigationEvents_1 = require("./navigationEvents");
const utils_2 = require("./navigationEvents/utils");
const navigationParams_1 = require("./navigationParams");
const primitives_1 = require("./primitives");
const native_1 = require("./react-navigation/native");
const EmptyRoute_1 = require("./views/EmptyRoute");
const SuspenseFallback_1 = require("./views/SuspenseFallback");
const Try_1 = require("./views/Try");
function getSortedChildren(children, order = [], initialRouteName) {
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
        const matchIndex = entries.findIndex((child) => child.route === name || child.route === `${name}/index`);
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
function useSortedScreens(order, protectedScreens, useOnlyUserDefinedScreens = false) {
    const node = (0, Route_1.useRouteNode)();
    const nodeChildren = node?.children ?? [];
    const children = useOnlyUserDefinedScreens
        ? nodeChildren.filter((child) => order.some((userDefinedScreen) => userDefinedScreen.name === child.route ||
            `${userDefinedScreen.name}/index` === child.route))
        : nodeChildren;
    const sorted = children.length ? getSortedChildren(children, order, node?.initialRouteName) : [];
    return react_2.default.useMemo(() => sorted
        .filter((item) => {
        const route = item.route.route;
        return (!protectedScreens.has(route) && !protectedScreens.has(route.replace(/\/index$/, '')));
    })
        .map((value) => {
        return routeToScreen(value.route, value.props);
    }), [sorted, protectedScreens]);
}
function fromImport(value, { ErrorBoundary, SuspenseFallback, ...component }) {
    // If possible, add a more helpful display name for the component stack to improve debugging of React errors such as `Text strings must be rendered within a <Text> component.`.
    if (component?.default && __DEV__) {
        component.default.displayName ??= `${component.default.name ?? 'Route'}(${value.contextKey})`;
    }
    if (ErrorBoundary) {
        const Wrapped = react_2.default.forwardRef((props, ref) => {
            const children = react_2.default.createElement(component.default || EmptyRoute_1.EmptyRoute, {
                ...props,
                ref,
            });
            return (0, jsx_runtime_1.jsx)(Try_1.Try, { catch: ErrorBoundary, children: children });
        });
        if (__DEV__) {
            Wrapped.displayName = `ErrorBoundary(${value.contextKey})`;
        }
        return {
            default: Wrapped,
            SuspenseFallback,
        };
    }
    if (process.env.NODE_ENV !== 'production') {
        if (typeof component.default === 'object' &&
            component.default &&
            Object.keys(component.default).length === 0) {
            return { default: EmptyRoute_1.EmptyRoute, SuspenseFallback };
        }
    }
    return { default: component.default, SuspenseFallback };
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
    let LayoutSuspenseFallback;
    // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
    if (import_mode_1.default === 'lazy') {
        ScreenComponent = react_2.default.lazy(async () => {
            const res = value.loadRoute();
            return fromLoadedRoute(value, res);
        });
        if (__DEV__) {
            ScreenComponent.displayName = `AsyncRoute(${value.route})`;
        }
    }
    else {
        const res = value.loadRoute();
        const result = fromImport(value, res);
        ScreenComponent = result.default;
        LayoutSuspenseFallback = value.type === 'layout' ? result.SuspenseFallback : undefined;
    }
    const WrappedScreenComponent = (props) => {
        (0, utils_1.useColorSchemeChangesIfNeeded)();
        return (0, jsx_runtime_1.jsx)(ScreenComponent, { ...props });
    };
    function BaseRoute({ 
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route, navigation, 
    // Pass all other props to the component
    ...props }) {
        const stateForPath = (0, native_1.useStateForPath)();
        const isFocused = navigation.isFocused();
        const store = (0, storeContext_1.useExpoRouterStore)();
        const InheritedSuspenseFallback = (0, react_2.use)(Route_1.SuspenseFallbackContext);
        const ResolvedSuspenseFallback = import_mode_1.default === 'lazy'
            ? SuspenseFallback_1.SuspenseFallback
            : (LayoutSuspenseFallback ?? InheritedSuspenseFallback ?? SuspenseFallback_1.SuspenseFallback);
        const providedSuspenseFallback = value.type === 'layout'
            ? (LayoutSuspenseFallback ?? InheritedSuspenseFallback)
            : InheritedSuspenseFallback;
        if (isFocused) {
            const state = navigation.getState();
            const isLeaf = !(state && 'state' in state.routes[state.index]);
            if (isLeaf && stateForPath)
                store.setFocusedState(stateForPath);
        }
        (0, react_2.useEffect)(() => navigation.addListener('focus', () => {
            const state = navigation.getState();
            const isLeaf = !(state && 'state' in state.routes[state.index]);
            // Because setFocusedState caches the route info, this call will only trigger rerenders
            // if the component itself didn’t rerender and the route info changed.
            // Otherwise, the update from the `if` above will handle it,
            // and this won’t cause a redundant second update.
            if (isLeaf && stateForPath)
                store.setFocusedState(stateForPath);
        }), [navigation]);
        (0, react_2.useEffect)(() => {
            return navigation.addListener('transitionEnd', (e) => {
                if (!e?.data?.closing) {
                    // When navigating to a screen, remove the no animation param to re-enable animations
                    // Otherwise the navigation back would also have no animation
                    if ((0, navigationParams_1.hasParam)(route?.params, navigationParams_1.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME)) {
                        navigation.replaceParams((0, navigationParams_1.removeParams)(route?.params, [navigationParams_1.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]));
                    }
                }
            });
        }, [navigation]);
        const isRouteType = value.type === 'route';
        const hasRouteKey = !!route?.key;
        return ((0, jsx_runtime_1.jsx)(Route_1.Route, { node: value, params: route?.params, children: (0, jsx_runtime_1.jsxs)(Route_1.SuspenseFallbackContext, { value: providedSuspenseFallback, children: [navigationEvents_1.unstable_navigationEvents.isEnabled() && isRouteType && hasRouteKey && ((0, jsx_runtime_1.jsx)(AnalyticsListeners, { navigation: navigation, screenId: route.key })), (0, jsx_runtime_1.jsxs)(zoom_transition_context_providers_1.ZoomTransitionTargetContextProvider, { route: route, children: [(0, jsx_runtime_1.jsx)(ZoomTransitionEnabler_1.ZoomTransitionEnabler, { route: route }), (0, jsx_runtime_1.jsx)(react_2.default.Suspense, { name: route ? `Route(${route.name})` : undefined, fallback: (0, jsx_runtime_1.jsx)(ResolvedSuspenseFallback, { route: value.contextKey, params: (route?.params ?? {}) }), children: (0, jsx_runtime_1.jsx)(WrappedScreenComponent, { ...props, 
                                    // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
                                    // the intention is to make it possible to deduce shared routes.
                                    segment: value.route }) })] })] }) }));
    }
    if (__DEV__) {
        BaseRoute.displayName = `Route(${value.route})`;
    }
    qualifiedStore.set(value, BaseRoute);
    return BaseRoute;
}
function AnalyticsListeners({ navigation, screenId, }) {
    const stateForPath = (0, native_1.useStateForPath)();
    const isFirstRenderRef = react_2.default.useRef(true);
    const hasBlurredRef = react_2.default.useRef(true);
    const stringUrl = (0, react_2.useMemo)(() => (0, utils_2.generateStringUrlForState)(stateForPath), [stateForPath]);
    if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
        if (stringUrl) {
            navigationEvents_1.unstable_navigationEvents.emit('pageWillRender', {
                ...(0, utils_2.getPathAndParamsFromStringUrl)(stringUrl),
                screenId,
            });
        }
    }
    (0, react_2.useEffect)(() => {
        if (stringUrl) {
            return () => {
                navigationEvents_1.unstable_navigationEvents.emit('pageRemoved', {
                    ...(0, utils_2.getPathAndParamsFromStringUrl)(stringUrl),
                    screenId,
                });
            };
        }
        return () => { };
    }, [stringUrl, screenId]);
    const isFocused = navigation.isFocused();
    if (isFocused && stringUrl) {
        navigationEvents_1.unstable_navigationEvents.emit('pageFocused', {
            ...(0, utils_2.getPathAndParamsFromStringUrl)(stringUrl),
            screenId,
        });
        hasBlurredRef.current = false;
    }
    (0, react_2.useEffect)(() => {
        if (stringUrl) {
            const cleanFocus = navigation.addListener('focus', () => {
                // If the screen was not blurred, don't emit focused again
                // hasBlurredRef will be false when the screen was initially focused
                if (hasBlurredRef.current) {
                    navigationEvents_1.unstable_navigationEvents.emit('pageFocused', {
                        ...(0, utils_2.getPathAndParamsFromStringUrl)(stringUrl),
                        screenId,
                    });
                    hasBlurredRef.current = false;
                }
            });
            const cleanBlur = navigation.addListener('blur', () => {
                navigationEvents_1.unstable_navigationEvents.emit('pageBlurred', {
                    ...(0, utils_2.getPathAndParamsFromStringUrl)(stringUrl),
                    screenId,
                });
                hasBlurredRef.current = true;
            });
            return () => {
                cleanFocus();
                cleanBlur();
            };
        }
        return () => { };
    }, [navigation, stringUrl, screenId]);
    return null;
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
        if (route.internal) {
            output.tabBarItemStyle = { display: 'none' };
            output.tabBarButton = () => null;
            // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
            output.drawerItemStyle = { height: 0, display: 'none' };
        }
        return output;
    };
}
function routeToScreen(route, { options, getId, ...props } = {}) {
    return ((0, react_1.createElement)(primitives_1.Screen, { ...props, name: route.route, key: route.route, getId: getId, options: screenOptionsFactory(route, options), getComponent: () => getQualifiedRouteComponent(route) }));
}
function getSingularId(name, options = {}) {
    return name
        .split('/')
        .map((segment) => {
        if (segment.startsWith('[...')) {
            return options.params?.[segment.slice(4, -1)]?.join('/') || segment;
        }
        else if (segment.startsWith('[') && segment.endsWith(']')) {
            return options.params?.[segment.slice(1, -1)] || segment;
        }
        else {
            return segment;
        }
    })
        .join('/');
}
//# sourceMappingURL=useScreens.js.map