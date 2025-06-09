"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackRouter = exports.stackRouterOverride = void 0;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const non_secure_1 = require("nanoid/non-secure");
const withLayoutContext_1 = require("./withLayoutContext");
const useScreens_1 = require("../useScreens");
const Protected_1 = require("../views/Protected");
const NativeStackNavigator = (0, native_stack_1.createNativeStackNavigator)().Navigator;
const RNStack = (0, withLayoutContext_1.withLayoutContext)(NativeStackNavigator);
function isStackAction(action) {
    return (action.type === 'PUSH' ||
        action.type === 'NAVIGATE' ||
        action.type === 'POP' ||
        action.type === 'POP_TO_TOP' ||
        action.type === 'REPLACE');
}
/**
 * React Navigation matches a screen by its name or a 'getID' function that uniquely identifies a screen.
 * When a screen has been uniquely identified, the Stack can only have one instance of that screen.
 *
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a singular id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the singular screen logic.
 *
 */
const stackRouterOverride = (original) => {
    return {
        getStateForAction: (state, action, options) => {
            if (action.target && action.target !== state.key) {
                return null;
            }
            if (!isStackAction(action)) {
                return original.getStateForAction(state, action, options);
            }
            // The dynamic getId added to an action, `router.push('screen', { singular: true })`
            const actionSingularOptions = action.payload && 'singular' in action.payload
                ? action.payload.singular
                : undefined;
            // Handle if 'getID' or 'singular' is set.
            function getIdFunction() {
                // Actions can be fired by the user, so we do need to validate their structure.
                if (!('payload' in action) ||
                    !action.payload ||
                    !('name' in action.payload) ||
                    typeof action.payload.name !== 'string') {
                    return;
                }
                const actionName = action.payload.name;
                return (
                // The dynamic singular added to an action, `router.push('screen', { singular: () => 'id' })`
                getActionSingularIdFn(actionSingularOptions, actionName) ||
                    // The static getId added as a prop to `<Screen singular />` or `<Screen getId={} />`
                    options.routeGetIdList[actionName]);
            }
            const { routeParamList } = options;
            switch (action.type) {
                case 'PUSH':
                case 'NAVIGATE': {
                    if (!state.routeNames.includes(action.payload.name)) {
                        return null;
                    }
                    // START FORK
                    const getId = getIdFunction();
                    // const getId = options.routeGetIdList[action.payload.name];
                    // END FORK
                    const id = getId?.({ params: action.payload.params });
                    let route;
                    if (id !== undefined) {
                        route = state.routes.findLast((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                    }
                    else if (action.type === 'NAVIGATE') {
                        const currentRoute = state.routes[state.index];
                        // If the route matches the current one, then navigate to it
                        if (action.payload.name === currentRoute.name) {
                            route = currentRoute;
                        }
                        else if (action.payload.pop) {
                            route = state.routes.findLast((route) => route.name === action.payload.name);
                        }
                    }
                    if (!route) {
                        route = state.preloadedRoutes.find((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                    }
                    let params;
                    if (action.type === 'NAVIGATE' && action.payload.merge && route) {
                        params =
                            action.payload.params !== undefined ||
                                routeParamList[action.payload.name] !== undefined
                                ? {
                                    ...routeParamList[action.payload.name],
                                    ...route.params,
                                    ...action.payload.params,
                                }
                                : route.params;
                    }
                    else {
                        params =
                            routeParamList[action.payload.name] !== undefined
                                ? {
                                    ...routeParamList[action.payload.name],
                                    ...action.payload.params,
                                }
                                : action.payload.params;
                    }
                    let routes;
                    if (route) {
                        if (action.type === 'NAVIGATE' && action.payload.pop) {
                            routes = [];
                            // Get all routes until the matching one
                            for (const r of state.routes) {
                                if (r.key === route.key) {
                                    routes.push({
                                        ...route,
                                        path: action.payload.path !== undefined ? action.payload.path : route.path,
                                        params,
                                    });
                                    break;
                                }
                                routes.push(r);
                            }
                        }
                        else {
                            // START FORK
                            // If there is an id, then filter out the existing route with the same id.
                            // THIS ACTION IS DANGEROUS. This can cause React Native Screens to freeze
                            if (id !== undefined) {
                                routes = state.routes.filter((r) => r.key !== route.key);
                            }
                            else if (action.type === 'NAVIGATE' && state.routes.length > 0) {
                                // The navigation action should only replace the last route if it has the same name and path params.
                                const lastRoute = state.routes[state.routes.length - 1];
                                if ((0, useScreens_1.getSingularId)(lastRoute.name, { params: lastRoute.params }) ===
                                    (0, useScreens_1.getSingularId)(route.name, { params })) {
                                    routes = state.routes.slice(0, -1);
                                }
                                else {
                                    routes = [...state.routes];
                                }
                            }
                            else {
                                routes = [...state.routes];
                            }
                            // If the routes length is the same as the state routes length, then we are navigating to a new route.
                            // Otherwise we are replacing an existing route.
                            const key = routes.length === state.routes.length
                                ? `${action.payload.name}-${(0, non_secure_1.nanoid)()}`
                                : route.key;
                            routes.push({
                                ...route,
                                key,
                                path: action.type === 'NAVIGATE' && action.payload.path !== undefined
                                    ? action.payload.path
                                    : route.path,
                                params,
                            });
                            // routes = state.routes.filter((r) => r.key !== route.key);
                            // routes.push({
                            //   ...route,
                            //   path:
                            //     action.type === 'NAVIGATE' && action.payload.path !== undefined
                            //       ? action.payload.path
                            //       : route.path,
                            //   params,
                            // });
                            // END FORK
                        }
                    }
                    else {
                        routes = [
                            ...state.routes,
                            {
                                key: `${action.payload.name}-${(0, non_secure_1.nanoid)()}`,
                                name: action.payload.name,
                                path: action.type === 'NAVIGATE' ? action.payload.path : undefined,
                                params,
                            },
                        ];
                    }
                    // START FORK
                    // return filterSingular(
                    const result = {
                        ...state,
                        index: routes.length - 1,
                        preloadedRoutes: state.preloadedRoutes.filter((route) => routes[routes.length - 1].key !== route.key),
                        routes,
                    };
                    if (actionSingularOptions) {
                        return filterSingular(result, getId);
                    }
                    return result;
                    // return {
                    //   ...state,
                    //   index: routes.length - 1,
                    //   preloadedRoutes: state.preloadedRoutes.filter(
                    //     (route) => routes[routes.length - 1].key !== route.key
                    //   ),
                    //   routes,
                    // };
                    // END FORK
                }
                default: {
                    return original.getStateForAction(state, action, options);
                }
            }
        },
    };
};
exports.stackRouterOverride = stackRouterOverride;
function getActionSingularIdFn(actionGetId, name) {
    if (typeof actionGetId === 'function') {
        return (options) => actionGetId(name, options.params ?? {});
    }
    else if (actionGetId === true) {
        return (options) => (0, useScreens_1.getSingularId)(name, options);
    }
    return undefined;
}
/**
 * If there is a dynamic singular on an action, then we need to filter the state to only have singular screens.
 * As multiples may have been added before we did the singular navigation.
 */
function filterSingular(state, getId) {
    if (!state) {
        return state;
    }
    if (!state.routes) {
        return state;
    }
    const currentIndex = state.index || state.routes.length - 1;
    const current = state.routes[currentIndex];
    const name = current.name;
    const id = getId?.({ params: current.params });
    if (!id) {
        return state;
    }
    // TypeScript needs a type assertion here for the filter to work.
    let routes = state.routes;
    routes = routes.filter((route, index) => {
        // If the route is the current route, keep it.
        if (index === currentIndex) {
            return true;
        }
        // Remove all other routes with the same name and id.
        return name !== route.name || id !== getId?.({ params: route.params });
    });
    return {
        ...state,
        index: routes.length - 1,
        routes,
    };
}
const Stack = Object.assign((props) => {
    return <RNStack {...props} UNSTABLE_router={exports.stackRouterOverride}/>;
}, {
    Screen: RNStack.Screen,
    Protected: Protected_1.Protected,
});
exports.default = Stack;
const StackRouter = (options) => {
    const router = (0, native_1.StackRouter)(options);
    return {
        ...router,
        ...(0, exports.stackRouterOverride)(router),
    };
};
exports.StackRouter = StackRouter;
//# sourceMappingURL=StackClient.js.map