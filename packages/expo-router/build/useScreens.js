'use client';
import React from 'react';
import { Route, sortRoutesWithInitial, useRouteNode, } from './Route';
import EXPO_ROUTER_IMPORT_MODE from './import-mode';
import { Screen } from './primitives';
import { EmptyRoute } from './views/EmptyRoute';
import { SuspenseFallback } from './views/SuspenseFallback';
import { Try } from './views/Try';
function getSortedChildren(children, order, initialRouteName) {
    if (!order?.length) {
        return children
            .sort(sortRoutesWithInitial(initialRouteName))
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
    ordered.push(...entries.sort(sortRoutesWithInitial(initialRouteName)).map((route) => ({ route, props: {} })));
    return ordered;
}
/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export function useSortedScreens(order) {
    const node = useRouteNode();
    const sorted = node?.children?.length
        ? getSortedChildren(node.children, order, node.initialRouteName)
        : [];
    return React.useMemo(() => sorted.map((value) => routeToScreen(value.route, value.props)), [sorted]);
}
function fromImport({ ErrorBoundary, ...component }) {
    if (ErrorBoundary) {
        return {
            default: React.forwardRef((props, ref) => {
                const children = React.createElement(component.default || EmptyRoute, {
                    ...props,
                    ref,
                });
                return <Try catch={ErrorBoundary}>{children}</Try>;
            }),
        };
    }
    if (process.env.NODE_ENV !== 'production') {
        if (typeof component.default === 'object' &&
            component.default &&
            Object.keys(component.default).length === 0) {
            return { default: EmptyRoute };
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
export function getQualifiedRouteComponent(value) {
    if (qualifiedStore.has(value)) {
        return qualifiedStore.get(value);
    }
    let ScreenComponent;
    // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
    if (EXPO_ROUTER_IMPORT_MODE === 'lazy') {
        ScreenComponent = React.lazy(async () => {
            const res = value.loadRoute();
            return fromLoadedRoute(res);
        });
    }
    else {
        const res = value.loadRoute();
        const Component = fromImport(res).default;
        ScreenComponent = React.forwardRef((props, ref) => {
            return <Component {...props} ref={ref}/>;
        });
    }
    const getLoadable = (props, ref) => (<React.Suspense fallback={<SuspenseFallback route={value}/>}>
      <ScreenComponent {...{
        ...props,
        ref,
        // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
        // the intention is to make it possible to deduce shared routes.
        segment: value.route,
    }}/>
    </React.Suspense>);
    const QualifiedRoute = React.forwardRef(({ 
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route, navigation, 
    // Pass all other props to the component
    ...props }, ref) => {
        const loadable = getLoadable(props, ref);
        return (<Route node={value} route={route}>
          {loadable}
        </Route>);
    });
    QualifiedRoute.displayName = `Route(${value.route})`;
    qualifiedStore.set(value, QualifiedRoute);
    return QualifiedRoute;
}
/**
 * @param getId Override that will be wrapped to remove __EXPO_ROUTER_key which is added by PUSH
 * @returns a function which provides a screen id that matches the dynamic route name in params. */
export function createGetIdForRoute(route, getId) {
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
export function screenOptionsFactory(route, options) {
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
export function routeToScreen(route, { options, getId, ...props } = {}) {
    return (<Screen {...props} getId={createGetIdForRoute(route, getId)} name={route.route} key={route.route} options={screenOptionsFactory(route, options)} getComponent={() => getQualifiedRouteComponent(route)}/>);
}
//# sourceMappingURL=useScreens.js.map