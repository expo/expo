'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeToScreen = exports.screenOptionsFactory = exports.createGetIdForRoute = exports.getQualifiedRouteComponent = void 0;
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const import_mode_1 = __importDefault(require("./import-mode"));
const primitives_1 = require("./primitives");
const EmptyRoute_1 = require("./views/EmptyRoute");
const SuspenseFallback_1 = require("./views/SuspenseFallback");
const Try_1 = require("./views/Try");
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
    return { default: component.default };
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
    let ScreenComponent;
    // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
    if (import_mode_1.default === 'lazy') {
        ScreenComponent = react_1.default.lazy(async () => {
            const res = value.loadRoute();
            return fromLoadedRoute(res);
        });
    }
    else {
        const res = value.loadRoute();
        const Component = fromImport(res).default;
        ScreenComponent = react_1.default.forwardRef((props, ref) => {
            return <Component {...props} ref={ref}/>;
        });
    }
    const getLoadable = (props, ref) => (<react_1.default.Suspense fallback={<SuspenseFallback_1.SuspenseFallback route={value}/>}>
      <ScreenComponent {...{
        ...props,
        ref,
        // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
        // the intention is to make it possible to deduce shared routes.
        segment: value.route,
    }}/>
    </react_1.default.Suspense>);
    const QualifiedRoute = react_1.default.forwardRef(({ 
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route, navigation, 
    // Pass all other props to the component
    ...props }, ref) => {
        const loadable = getLoadable(props, ref);
        return (<Route_1.Route node={value} route={route}>
          {loadable}
        </Route_1.Route>);
    });
    QualifiedRoute.displayName = `Route(${value.route})`;
    qualifiedStore.set(value, QualifiedRoute);
    return QualifiedRoute;
}
exports.getQualifiedRouteComponent = getQualifiedRouteComponent;
/**
 * @param getId Override that will be wrapped to remove __EXPO_ROUTER_key which is added by PUSH
 * @returns a function which provides a screen id that matches the dynamic route name in params. */
function createGetIdForRoute(route, getId) {
    const include = new Map();
    if (route.dynamic) {
        for (const segment of route.dynamic) {
            include.set(segment.name, segment);
        }
    }
    return (options = {}) => {
        const { params = {} } = options;
        if (params.__EXPO_ROUTER_key) {
            const key = params.__EXPO_ROUTER_key;
            delete params.__EXPO_ROUTER_key;
            if (getId == null) {
                return key;
            }
        }
        if (getId != null) {
            return getId(options);
        }
        const segments = [];
        for (const dynamic of include.values()) {
            const value = params?.[dynamic.name];
            if (Array.isArray(value) && value.length > 0) {
                // If we are an array with a value
                segments.push(value.join('/'));
            }
            else if (value && !Array.isArray(value)) {
                // If we have a value and not an empty array
                segments.push(value);
            }
            else if (dynamic.deep) {
                segments.push(`[...${dynamic.name}]`);
            }
            else {
                segments.push(`[${dynamic.name}]`);
            }
        }
        return segments.join('/') ?? route.contextKey;
    };
}
exports.createGetIdForRoute = createGetIdForRoute;
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
    return (<primitives_1.Screen {...props} getId={createGetIdForRoute(route, getId)} name={route.route} key={route.route} options={screenOptionsFactory(route, options)} getComponent={() => getQualifiedRouteComponent(route)}/>);
}
exports.routeToScreen = routeToScreen;
//# sourceMappingURL=useScreens.js.map