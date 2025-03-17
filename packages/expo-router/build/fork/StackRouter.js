"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackRouter = void 0;
const native_1 = require("@react-navigation/native");
const non_secure_1 = require("nanoid/non-secure");
function StackRouter(options) {
    const stackRouter = (0, native_1.StackRouter)(options);
    const router = {
        ...stackRouter,
        getStateForAction(state, action, options) {
            const { routeParamList } = options;
            switch (action.type) {
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
                            /**
                             * React Navigation causes navigation events to behave differently when 'getID()' is used.
                             *
                             * Default behavior (without 'getID()'):
                             *  - 'navigate': If the route is the current route, the params are updated; else the new route is pushed
                             *                onto the stack.
                             *  - 'push': The new route is pushed onto the stack.
                             *
                             * getID() behavior:
                             *  - 'navigate':
                             *       If the route is the current route, the params are updated;
                             *       Else if the route is within the history, the history is rearranged to make the route the current route with
                             *            the new params;
                             *       Else the screen is pushed
                             *  - 'push': Same as `navigate`
                             *
                             *
                             * The purpose of this fork is to maintain the default behavior of navigation events when 'getID()' is used.
                             */
                            // START FORK
                            // routes = state.routes.filter((r) => r.key !== route!.key);
                            routes =
                                action.type === 'NAVIGATE' && state.routes[state.index].key === route.key
                                    ? state.routes.slice(0, -1)
                                    : [...state.routes];
                            // END FORK
                            routes.push({
                                ...route,
                                key: action.type === 'NAVIGATE' ? route.key : `${action.payload.name}-${(0, non_secure_1.nanoid)()}`,
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
                default:
                    return stackRouter.getStateForAction(state, action, options);
            }
        },
    };
    return router;
}
exports.StackRouter = StackRouter;
//# sourceMappingURL=StackRouter.js.map