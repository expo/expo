"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTabNavigationEvents = exports.withNavigationEvents = void 0;
exports.appendRouteToFocusedState = appendRouteToFocusedState;
exports.mergeListeners = mergeListeners;
exports.buildStackListeners = buildStackListeners;
exports.buildTabListeners = buildTabListeners;
exports.buildScreenListeners = buildScreenListeners;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const index_1 = require("./index");
const utils_1 = require("./utils");
const native_1 = require("../react-navigation/native");
// TODO(@ubax): extract this function to common util for SceneView and this component
/**
 * Append a route to the innermost level of `parent`. Mirrors how
 * SceneView builds the focused-route state when entering a child navigator.
 *
 * If the appended route's params describe a nested navigation in React
 * Navigation's `{ screen, params }` shape, expand them recursively into nested
 * `state` so `getPathFromState` can resolve the full focused path even when the
 * route does not yet expose a resolved nested state.
 *
 * @internal Exposed for unit testing only.
 */
function appendRouteToFocusedState(parent, route) {
    const leaf = buildLeafFromRoute({
        key: route.key,
        name: route.name,
        params: route.params,
        path: route.path,
    });
    const addState = (current) => {
        if (!current)
            return leaf;
        const head = current.routes[0];
        return {
            routes: [{ ...head, state: addState(head.state) }],
        };
    };
    return addState(parent);
}
function buildLeafFromRoute(route) {
    const params = route.params;
    if (params && typeof params.screen === 'string') {
        return {
            routes: [
                {
                    key: route.key,
                    name: route.name,
                    params: route.params,
                    path: route.path,
                    state: buildLeafFromRoute({
                        name: params.screen,
                        params: params.params,
                    }),
                },
            ],
        };
    }
    return {
        routes: [
            {
                key: route.key,
                name: route.name,
                params: route.params,
                path: route.path,
            },
        ],
    };
}
function emitFor(type, parentStateForPath, route) {
    const composed = appendRouteToFocusedState(parentStateForPath, route);
    const stringUrl = (0, utils_1.generateStringUrlForState)(composed);
    if (!stringUrl)
        return;
    (0, index_1.emit)(type, {
        ...(0, utils_1.getPathAndParamsFromStringUrl)(stringUrl),
        screenId: route.key,
    });
}
/**
 * @internal Exposed for unit testing only.
 */
function mergeListeners(theirs, ours) {
    return ({ route, navigation, }) => {
        const user = typeof theirs === 'function' ? theirs({ route, navigation }) : (theirs ?? {});
        const merged = { ...user };
        for (const key of Object.keys(ours)) {
            const userFn = user[key];
            const ourFn = ours[key];
            // Already assigned via spread above
            if (!ourFn)
                continue;
            const combined = userFn
                ? (e) => {
                    userFn(e);
                    ourFn(e);
                }
                : ourFn;
            merged[key] = combined;
        }
        return merged;
    };
}
/**
 * @internal Exposed for unit testing only.
 */
function buildStackListeners(parentStateForPathRef, route) {
    const callbacks = {
        transitionStart: (e) => {
            if (!index_1.unstable_navigationEvents.isEnabled())
                return;
            const type = e?.data?.closing ? 'pageWillDisappear' : 'pageWillAppear';
            emitFor(type, parentStateForPathRef.current, route);
        },
        transitionEnd: (e) => {
            if (!index_1.unstable_navigationEvents.isEnabled())
                return;
            const type = e?.data?.closing ? 'pageDisappeared' : 'pageAppeared';
            emitFor(type, parentStateForPathRef.current, route);
        },
    };
    return callbacks;
}
/**
 * @internal Exposed for unit testing only.
 */
function buildTabListeners(parentStateForPathRef, route) {
    const callbacks = {
        focus: () => {
            if (!index_1.unstable_navigationEvents.isEnabled())
                return;
            emitFor('pageAppeared', parentStateForPathRef.current, route);
        },
        blur: () => {
            if (!index_1.unstable_navigationEvents.isEnabled())
                return;
            emitFor('pageDisappeared', parentStateForPathRef.current, route);
        },
    };
    return callbacks;
}
/**
 * @internal Exposed for unit testing only.
 */
function buildScreenListeners(mode, parentStateForPathRef, userScreenListeners) {
    return ({ route, navigation, }) => {
        const ours = mode === 'stack'
            ? buildStackListeners(parentStateForPathRef, route)
            : buildTabListeners(parentStateForPathRef, route);
        return mergeListeners(userScreenListeners, ours)({ route, navigation });
    };
}
function makeWithNavigationEvents(mode) {
    return function withNav(create) {
        const wrappedFactory = (config) => {
            const factory = create(config);
            const Original = factory.Navigator;
            const Wrapped = (0, react_1.forwardRef)(function NavigationEventsNavigator({ screenListeners: userScreenListeners, ...rest }, ref) {
                // Snapshot the navigation state above this navigator. Each screen's
                // path is computed lazily inside the listener by appending its route
                // to this snapshot. The ref keeps screenListeners' identity stable
                // across parent re-renders so React Navigation does not re-attach
                // listeners on every navigation tick.
                const parentStateForPath = (0, native_1.useStateForPath)();
                const parentStateForPathRef = (0, react_1.useRef)(parentStateForPath);
                parentStateForPathRef.current = parentStateForPath;
                const screenListeners = (0, react_1.useMemo)(() => buildScreenListeners(mode, parentStateForPathRef, userScreenListeners), [userScreenListeners]);
                return (0, jsx_runtime_1.jsx)(Original, { ...rest, ref: ref, screenListeners: screenListeners });
            });
            return { ...factory, Navigator: Wrapped };
        };
        return wrappedFactory;
    };
}
/**
 * Wraps a stack-style React Navigation factory so every screen rendered by it
 * emits `pageWillAppear`/`pageAppeared`/`pageWillDisappear`/`pageDisappeared`
 * via `unstable_navigationEvents` based on `transitionStart`/`transitionEnd`.
 */
exports.withNavigationEvents = makeWithNavigationEvents('stack');
/**
 * Wraps a tab/drawer React Navigation factory so every screen emits only
 * `pageAppeared` (on focus) and `pageDisappeared` (on blur).
 */
exports.withTabNavigationEvents = makeWithNavigationEvents('tab');
//# sourceMappingURL=withNavigationEvents.js.map