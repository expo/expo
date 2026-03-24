"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackActions = void 0;
exports.StackRouter = StackRouter;
const non_secure_1 = require("nanoid/non-secure");
const BaseRouter_1 = require("./BaseRouter");
const createParamsFromAction_1 = require("./createParamsFromAction");
const createRouteFromAction_1 = require("./createRouteFromAction");
exports.StackActions = {
    replace(name, params) {
        return {
            type: 'REPLACE',
            payload: { name, params },
        };
    },
    push(name, params) {
        return {
            type: 'PUSH',
            payload: { name, params },
        };
    },
    pop(count = 1) {
        return {
            type: 'POP',
            payload: { count },
        };
    },
    popToTop() {
        return { type: 'POP_TO_TOP' };
    },
    popTo(name, params, options) {
        if (typeof options === 'boolean') {
            console.warn(`Passing a boolean as the third argument to 'popTo' is deprecated. Pass '{ merge: true }' instead.`);
        }
        return {
            type: 'POP_TO',
            payload: {
                name,
                params,
                merge: typeof options === 'boolean' ? options : options?.merge,
            },
        };
    },
};
function StackRouter(options) {
    const router = {
        ...BaseRouter_1.BaseRouter,
        type: 'stack',
        getInitialState({ routeNames, routeParamList }) {
            const initialRouteName = options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName)
                ? options.initialRouteName
                : routeNames[0];
            return {
                stale: false,
                type: 'stack',
                key: `stack-${(0, non_secure_1.nanoid)()}`,
                index: 0,
                routeNames,
                preloadedRoutes: [],
                routes: [
                    {
                        key: `${initialRouteName}-${(0, non_secure_1.nanoid)()}`,
                        name: initialRouteName,
                        params: routeParamList[initialRouteName],
                    },
                ],
            };
        },
        getRehydratedState(partialState, { routeNames, routeParamList }) {
            const state = partialState;
            if (state.stale === false) {
                return state;
            }
            const routes = state.routes
                .filter((route) => routeNames.includes(route.name))
                .map((route) => ({
                ...route,
                key: route.key || `${route.name}-${(0, non_secure_1.nanoid)()}`,
                params: routeParamList[route.name] !== undefined
                    ? {
                        ...routeParamList[route.name],
                        ...route.params,
                    }
                    : route.params,
            }));
            const preloadedRoutes = state.preloadedRoutes
                ?.filter((route) => routeNames.includes(route.name))
                .map((route) => ({
                ...route,
                key: route.key || `${route.name}-${(0, non_secure_1.nanoid)()}`,
                params: routeParamList[route.name] !== undefined
                    ? {
                        ...routeParamList[route.name],
                        ...route.params,
                    }
                    : route.params,
            })) ?? [];
            if (routes.length === 0) {
                const initialRouteName = options.initialRouteName !== undefined ? options.initialRouteName : routeNames[0];
                routes.push({
                    key: `${initialRouteName}-${(0, non_secure_1.nanoid)()}`,
                    name: initialRouteName,
                    params: routeParamList[initialRouteName],
                });
            }
            return {
                stale: false,
                type: 'stack',
                key: `stack-${(0, non_secure_1.nanoid)()}`,
                index: routes.length - 1,
                routeNames,
                routes,
                preloadedRoutes,
            };
        },
        getStateForRouteNamesChange(state, { routeNames, routeParamList, routeKeyChanges }) {
            const routes = state.routes.filter((route) => routeNames.includes(route.name) && !routeKeyChanges.includes(route.name));
            if (routes.length === 0) {
                const initialRouteName = options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName)
                    ? options.initialRouteName
                    : routeNames[0];
                routes.push({
                    key: `${initialRouteName}-${(0, non_secure_1.nanoid)()}`,
                    name: initialRouteName,
                    params: routeParamList[initialRouteName],
                });
            }
            return {
                ...state,
                routeNames,
                routes,
                index: Math.min(state.index, routes.length - 1),
            };
        },
        getStateForRouteFocus(state, key) {
            const index = state.routes.findIndex((r) => r.key === key);
            if (index === -1 || index === state.index) {
                return state;
            }
            return {
                ...state,
                index,
                routes: state.routes.slice(0, index + 1),
            };
        },
        getStateForAction(state, action, options) {
            const { routeParamList } = options;
            switch (action.type) {
                case 'REPLACE': {
                    const currentIndex = action.target === state.key && action.source
                        ? state.routes.findIndex((r) => r.key === action.source)
                        : state.index;
                    if (currentIndex === -1) {
                        return null;
                    }
                    if (!state.routeNames.includes(action.payload.name)) {
                        return null;
                    }
                    const getId = options.routeGetIdList[action.payload.name];
                    const id = getId?.({ params: action.payload.params });
                    // Re-use preloaded route if available
                    let route = state.preloadedRoutes.find((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                    if (!route) {
                        route = (0, createRouteFromAction_1.createRouteFromAction)({ action, routeParamList });
                    }
                    return {
                        ...state,
                        routes: state.routes.map((r, i) => (i === currentIndex ? route : r)),
                        preloadedRoutes: state.preloadedRoutes.filter((r) => r.key !== route.key),
                    };
                }
                case 'PUSH':
                case 'NAVIGATE': {
                    if (!state.routeNames.includes(action.payload.name)) {
                        return null;
                    }
                    const getId = options.routeGetIdList[action.payload.name];
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
                        params = (0, createParamsFromAction_1.createParamsFromAction)({ action, routeParamList });
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
                            routes = state.routes.filter((r) => r.key !== route.key);
                            routes.push({
                                ...route,
                                path: action.type === 'NAVIGATE' && action.payload.path !== undefined
                                    ? action.payload.path
                                    : route.path,
                                params,
                            });
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
                    return {
                        ...state,
                        index: routes.length - 1,
                        preloadedRoutes: state.preloadedRoutes.filter((route) => routes[routes.length - 1].key !== route.key),
                        routes,
                    };
                }
                case 'NAVIGATE_DEPRECATED': {
                    if (!state.routeNames.includes(action.payload.name)) {
                        return null;
                    }
                    if (state.preloadedRoutes.find((route) => route.name === action.payload.name && id === getId?.({ params: route.params }))) {
                        return null;
                    }
                    // If the route already exists, navigate to that
                    let index = -1;
                    const getId = options.routeGetIdList[action.payload.name];
                    const id = getId?.({ params: action.payload.params });
                    if (id !== undefined) {
                        index = state.routes.findIndex((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                    }
                    else if (state.routes[state.index].name === action.payload.name) {
                        index = state.index;
                    }
                    else {
                        index = state.routes.findLastIndex((route) => route.name === action.payload.name);
                    }
                    if (index === -1) {
                        const routes = [...state.routes, (0, createRouteFromAction_1.createRouteFromAction)({ action, routeParamList })];
                        return {
                            ...state,
                            routes,
                            index: routes.length - 1,
                        };
                    }
                    const route = state.routes[index];
                    let params;
                    if (action.payload.merge) {
                        params =
                            action.payload.params !== undefined || routeParamList[route.name] !== undefined
                                ? {
                                    ...routeParamList[route.name],
                                    ...route.params,
                                    ...action.payload.params,
                                }
                                : route.params;
                    }
                    else {
                        params = (0, createParamsFromAction_1.createParamsFromAction)({ action, routeParamList });
                    }
                    return {
                        ...state,
                        index,
                        routes: [
                            ...state.routes.slice(0, index),
                            params !== route.params ? { ...route, params } : state.routes[index],
                        ],
                    };
                }
                case 'POP': {
                    const currentIndex = action.target === state.key && action.source
                        ? state.routes.findIndex((r) => r.key === action.source)
                        : state.index;
                    if (currentIndex > 0) {
                        const count = Math.max(currentIndex - action.payload.count + 1, 1);
                        const routes = state.routes
                            .slice(0, count)
                            .concat(state.routes.slice(currentIndex + 1));
                        return {
                            ...state,
                            index: routes.length - 1,
                            routes,
                        };
                    }
                    return null;
                }
                case 'POP_TO_TOP':
                    return router.getStateForAction(state, {
                        type: 'POP',
                        payload: { count: state.routes.length - 1 },
                    }, options);
                case 'POP_TO': {
                    const currentIndex = action.target === state.key && action.source
                        ? state.routes.findLastIndex((r) => r.key === action.source)
                        : state.index;
                    if (currentIndex === -1) {
                        return null;
                    }
                    if (!state.routeNames.includes(action.payload.name)) {
                        return null;
                    }
                    // If the route already exists, navigate to it
                    let index = -1;
                    const getId = options.routeGetIdList[action.payload.name];
                    const id = getId?.({ params: action.payload.params });
                    if (id !== undefined) {
                        index = state.routes.findIndex((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                    }
                    else if (state.routes[currentIndex].name === action.payload.name) {
                        index = currentIndex;
                    }
                    else {
                        for (let i = currentIndex; i >= 0; i--) {
                            if (state.routes[i].name === action.payload.name) {
                                index = i;
                                break;
                            }
                        }
                    }
                    // If the route doesn't exist, remove the current route and add the new one
                    if (index === -1) {
                        // Re-use preloaded route if available
                        let route = state.preloadedRoutes.find((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                        if (!route) {
                            route = (0, createRouteFromAction_1.createRouteFromAction)({ action, routeParamList });
                        }
                        const routes = state.routes.slice(0, currentIndex).concat(route);
                        return {
                            ...state,
                            index: routes.length - 1,
                            routes,
                            preloadedRoutes: state.preloadedRoutes.filter((r) => r.key !== route.key),
                        };
                    }
                    const route = state.routes[index];
                    let params;
                    if (action.payload.merge) {
                        params =
                            action.payload.params !== undefined || routeParamList[route.name] !== undefined
                                ? {
                                    ...routeParamList[route.name],
                                    ...route.params,
                                    ...action.payload.params,
                                }
                                : route.params;
                    }
                    else {
                        params = (0, createParamsFromAction_1.createParamsFromAction)({ action, routeParamList });
                    }
                    return {
                        ...state,
                        index,
                        routes: [
                            ...state.routes.slice(0, index),
                            params !== route.params ? { ...route, params } : state.routes[index],
                        ],
                    };
                }
                case 'GO_BACK':
                    if (state.index > 0) {
                        return router.getStateForAction(state, {
                            type: 'POP',
                            payload: { count: 1 },
                            target: action.target,
                            source: action.source,
                        }, options);
                    }
                    return null;
                case 'PRELOAD': {
                    const getId = options.routeGetIdList[action.payload.name];
                    const id = getId?.({ params: action.payload.params });
                    let route;
                    if (id !== undefined) {
                        route = state.routes.find((route) => route.name === action.payload.name && id === getId?.({ params: route.params }));
                    }
                    if (route) {
                        return {
                            ...state,
                            routes: state.routes.map((r) => {
                                if (r.key !== route?.key) {
                                    return r;
                                }
                                return {
                                    ...r,
                                    params: (0, createParamsFromAction_1.createParamsFromAction)({ action, routeParamList }),
                                };
                            }),
                        };
                    }
                    else {
                        return {
                            ...state,
                            preloadedRoutes: state.preloadedRoutes
                                .filter((r) => r.name !== action.payload.name || id !== getId?.({ params: r.params }))
                                .concat((0, createRouteFromAction_1.createRouteFromAction)({ action, routeParamList })),
                        };
                    }
                }
                default:
                    return BaseRouter_1.BaseRouter.getStateForAction(state, action);
            }
        },
        actionCreators: exports.StackActions,
    };
    return router;
}
//# sourceMappingURL=StackRouter.js.map