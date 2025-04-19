"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQualifiedRouteComponent = getQualifiedRouteComponent;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const Route_1 = require("../Route");
const storeContext_1 = require("../global-state/storeContext");
const import_mode_1 = __importDefault(require("../import-mode"));
const EmptyRoute_1 = require("../views/EmptyRoute");
const SuspenseFallback_1 = require("../views/SuspenseFallback");
const Try_1 = require("../views/Try");
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
        const stateForPath = (0, native_1.useStateForPath)();
        const isFocused = (0, native_1.useIsFocused)();
        const store = (0, storeContext_1.useExpoRouterStore)();
        if (isFocused) {
            const state = navigation.getState();
            const isLeaf = !('state' in state.routes[state.index]);
            if (isLeaf && stateForPath)
                store.setFocusedState(stateForPath);
        }
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
function fromLoadedRoute(value, res) {
    if (!(res instanceof Promise)) {
        return fromImport(value, res);
    }
    return res.then(fromImport.bind(null, value));
}
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
//# sourceMappingURL=getRouteComponent.js.map