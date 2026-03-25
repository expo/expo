"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabActions = void 0;
exports.TabRouter = TabRouter;
const non_secure_1 = require("nanoid/non-secure");
const BaseRouter_1 = require("./BaseRouter");
const createParamsFromAction_1 = require("./createParamsFromAction");
const TYPE_ROUTE = 'route';
exports.TabActions = {
    jumpTo(name, params) {
        return {
            type: 'JUMP_TO',
            payload: { name, params },
        };
    },
};
const getRouteHistory = (routes, index, backBehavior, initialRouteName) => {
    const history = [
        {
            type: TYPE_ROUTE,
            key: routes[index].key,
        },
    ];
    let initialRouteIndex;
    switch (backBehavior) {
        case 'order':
            for (let i = index; i > 0; i--) {
                history.unshift({
                    type: TYPE_ROUTE,
                    key: routes[i - 1].key,
                });
            }
            break;
        case 'firstRoute':
            if (index !== 0) {
                history.unshift({
                    type: TYPE_ROUTE,
                    key: routes[0].key,
                });
            }
            break;
        case 'initialRoute':
            initialRouteIndex = routes.findIndex((route) => route.name === initialRouteName);
            initialRouteIndex = initialRouteIndex === -1 ? 0 : initialRouteIndex;
            if (index !== initialRouteIndex) {
                history.unshift({
                    type: TYPE_ROUTE,
                    key: routes[initialRouteIndex].key,
                });
            }
            break;
        case 'history':
        case 'fullHistory':
            // The history will fill up on navigation
            break;
    }
    return history;
};
const changeIndex = (state, index, backBehavior, initialRouteName) => {
    let history = state.history;
    if (backBehavior === 'history' || backBehavior === 'fullHistory') {
        const currentRoute = state.routes[index];
        if (backBehavior === 'history') {
            // Remove the existing key from the history to de-duplicate it
            history = history.filter((it) => (it.type === 'route' ? it.key !== currentRoute.key : false));
        }
        else if (backBehavior === 'fullHistory') {
            const lastHistoryRouteItemIndex = history.findLastIndex((item) => item.type === 'route');
            if (currentRoute.key === history[lastHistoryRouteItemIndex]?.key) {
                // For full-history, only remove if it matches the last route
                // Useful for drawer, if current route was in history, then drawer state changed
                // Then we only need to move the route to the front
                history = [
                    ...history.slice(0, lastHistoryRouteItemIndex),
                    ...history.slice(lastHistoryRouteItemIndex + 1),
                ];
            }
        }
        history = history.concat({
            type: TYPE_ROUTE,
            key: currentRoute.key,
            params: backBehavior === 'fullHistory' ? currentRoute.params : undefined,
        });
    }
    else {
        history = getRouteHistory(state.routes, index, backBehavior, initialRouteName);
    }
    return {
        ...state,
        index,
        history,
    };
};
function TabRouter({ initialRouteName, backBehavior = 'firstRoute' }) {
    const router = {
        ...BaseRouter_1.BaseRouter,
        type: 'tab',
        getInitialState({ routeNames, routeParamList }) {
            const index = initialRouteName !== undefined && routeNames.includes(initialRouteName)
                ? routeNames.indexOf(initialRouteName)
                : 0;
            const routes = routeNames.map((name) => ({
                name,
                key: `${name}-${(0, non_secure_1.nanoid)()}`,
                params: routeParamList[name],
            }));
            const history = getRouteHistory(routes, index, backBehavior, initialRouteName);
            return {
                stale: false,
                type: 'tab',
                key: `tab-${(0, non_secure_1.nanoid)()}`,
                index,
                routeNames,
                history,
                routes,
                preloadedRouteKeys: [],
            };
        },
        getRehydratedState(partialState, { routeNames, routeParamList }) {
            const state = partialState;
            if (state.stale === false) {
                return state;
            }
            const routes = routeNames.map((name) => {
                const route = state.routes.find((r) => r.name === name);
                return {
                    ...route,
                    name,
                    key: route && route.name === name && route.key ? route.key : `${name}-${(0, non_secure_1.nanoid)()}`,
                    params: routeParamList[name] !== undefined
                        ? {
                            ...routeParamList[name],
                            ...(route ? route.params : undefined),
                        }
                        : route
                            ? route.params
                            : undefined,
                };
            });
            const index = Math.min(Math.max(routeNames.indexOf(state.routes[state?.index ?? 0]?.name), 0), routes.length - 1);
            const routeKeys = routes.map((route) => route.key);
            const history = state.history?.filter((it) => routeKeys.includes(it.key)) ?? [];
            return changeIndex({
                stale: false,
                type: 'tab',
                key: `tab-${(0, non_secure_1.nanoid)()}`,
                index,
                routeNames,
                history,
                routes,
                preloadedRouteKeys: state.preloadedRouteKeys?.filter((key) => routeKeys.includes(key)) ?? [],
            }, index, backBehavior, initialRouteName);
        },
        getStateForRouteNamesChange(state, { routeNames, routeParamList, routeKeyChanges }) {
            const routes = routeNames.map((name) => state.routes.find((r) => r.name === name && !routeKeyChanges.includes(r.name)) || {
                name,
                key: `${name}-${(0, non_secure_1.nanoid)()}`,
                params: routeParamList[name],
            });
            const index = Math.max(0, routeNames.indexOf(state.routes[state.index].name));
            let history = state.history.filter(
            // Type will always be 'route' for tabs, but could be different in a router extending this (e.g. drawer)
            (it) => it.type !== 'route' || routes.find((r) => r.key === it.key));
            if (!history.length) {
                history = getRouteHistory(routes, index, backBehavior, initialRouteName);
            }
            return {
                ...state,
                history,
                routeNames,
                routes,
                index,
            };
        },
        getStateForRouteFocus(state, key) {
            const index = state.routes.findIndex((r) => r.key === key);
            if (index === -1 || index === state.index) {
                return state;
            }
            return changeIndex(state, index, backBehavior, initialRouteName);
        },
        getStateForAction(state, action, { routeParamList, routeGetIdList }) {
            switch (action.type) {
                case 'JUMP_TO':
                case 'NAVIGATE':
                case 'NAVIGATE_DEPRECATED': {
                    const index = state.routes.findIndex((route) => route.name === action.payload.name);
                    if (index === -1) {
                        return null;
                    }
                    const updatedState = changeIndex({
                        ...state,
                        routes: state.routes.map((route) => {
                            if (route.name !== action.payload.name) {
                                return route;
                            }
                            const getId = routeGetIdList[route.name];
                            const currentId = getId?.({ params: route.params });
                            const nextId = getId?.({ params: action.payload.params });
                            const key = currentId === nextId ? route.key : `${route.name}-${(0, non_secure_1.nanoid)()}`;
                            let params;
                            if ((action.type === 'NAVIGATE' || action.type === 'NAVIGATE_DEPRECATED') &&
                                action.payload.merge &&
                                currentId === nextId) {
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
                            const path = action.type === 'NAVIGATE' && action.payload.path != null
                                ? action.payload.path
                                : route.path;
                            return params !== route.params || path !== route.path
                                ? { ...route, key, path, params }
                                : route;
                        }),
                    }, index, backBehavior, initialRouteName);
                    return {
                        ...updatedState,
                        preloadedRouteKeys: updatedState.preloadedRouteKeys.filter((key) => key !== state.routes[updatedState.index].key),
                    };
                }
                case 'SET_PARAMS':
                case 'REPLACE_PARAMS': {
                    const nextState = BaseRouter_1.BaseRouter.getStateForAction(state, action);
                    if (nextState !== null) {
                        const index = nextState.index;
                        if (index != null) {
                            const focusedRoute = nextState.routes[index];
                            const historyItemIndex = state.history.findLastIndex((item) => item.key === focusedRoute.key);
                            let updatedHistory = state.history;
                            if (historyItemIndex !== -1) {
                                updatedHistory = [...state.history];
                                updatedHistory[historyItemIndex] = {
                                    ...updatedHistory[historyItemIndex],
                                    params: focusedRoute.params,
                                };
                            }
                            return {
                                ...nextState,
                                history: updatedHistory,
                            };
                        }
                    }
                    return nextState;
                }
                case 'GO_BACK': {
                    if (state.history.length === 1) {
                        return null;
                    }
                    const previousHistoryItem = state.history[state.history.length - 2];
                    const previousKey = previousHistoryItem?.key;
                    const index = state.routes.findLastIndex((route) => route.key === previousKey);
                    if (index === -1) {
                        return null;
                    }
                    let routes = state.routes;
                    if (backBehavior === 'fullHistory' &&
                        routes[index].params !== previousHistoryItem.params) {
                        routes = [...state.routes];
                        routes[index] = {
                            ...routes[index],
                            params: previousHistoryItem.params,
                        };
                    }
                    return {
                        ...state,
                        routes,
                        preloadedRouteKeys: state.preloadedRouteKeys.filter((key) => key !== state.routes[index].key),
                        history: state.history.slice(0, -1),
                        index,
                    };
                }
                case 'PRELOAD': {
                    const routeIndex = state.routes.findIndex((route) => route.name === action.payload.name);
                    if (routeIndex === -1) {
                        return null;
                    }
                    const route = state.routes[routeIndex];
                    const getId = routeGetIdList[route.name];
                    const currentId = getId?.({ params: route.params });
                    const nextId = getId?.({ params: action.payload.params });
                    const key = currentId === nextId ? route.key : `${route.name}-${(0, non_secure_1.nanoid)()}`;
                    const params = (0, createParamsFromAction_1.createParamsFromAction)({ action, routeParamList });
                    const newRoute = params !== route.params ? { ...route, key, params } : route;
                    return {
                        ...state,
                        preloadedRouteKeys: state.preloadedRouteKeys
                            .filter((key) => key !== route.key)
                            .concat(newRoute.key),
                        routes: state.routes.map((route, index) => (index === routeIndex ? newRoute : route)),
                        history: key === route.key
                            ? state.history
                            : state.history.filter((record) => record.key !== route.key),
                    };
                }
                default:
                    return BaseRouter_1.BaseRouter.getStateForAction(state, action);
            }
        },
        actionCreators: exports.TabActions,
    };
    return router;
}
//# sourceMappingURL=TabRouter.js.map