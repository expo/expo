"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabRouter = void 0;
const native_1 = require("@react-navigation/native");
function TabRouter(routerOptions) {
    const router = (0, native_1.TabRouter)(routerOptions);
    const type = 'expo-tab';
    const key = routerOptions.key;
    return {
        ...router,
        type: 'expo-tab',
        getInitialState(options) {
            const nextState = router.getInitialState(options);
            return {
                ...nextState,
                type,
                key,
                routes: nextState.routes.map((route) => {
                    return {
                        ...route,
                    };
                }),
            };
        },
        getRehydratedState(state, options) {
            return {
                ...router.getRehydratedState(state, options),
                type,
                key,
            };
        },
        getStateForRouteNamesChange(state, options) {
            return {
                ...router.getStateForRouteNamesChange(state, options),
                type,
                key,
            };
        },
        getStateForRouteFocus(state, key) {
            return {
                ...router.getStateForRouteFocus(state, key),
                type,
                key,
            };
        },
        getStateForAction(state, action, options) {
            if ('payload' in action && action.payload) {
                const payload = action.payload;
                if ('name' in payload && payload.name) {
                    const name = payload.name;
                    if (!options.routeNames.includes(name)) {
                        const nextName = options.routeNames.find((routeName) => {
                            return routeName.startsWith(`${name}#`);
                        });
                        if (nextName) {
                            payload.name = nextName;
                        }
                    }
                }
            }
            const nextState = router.getStateForAction(state, action, options);
            return nextState === null
                ? nextState
                : {
                    ...nextState,
                    type,
                    key,
                };
        },
    };
}
exports.TabRouter = TabRouter;
//# sourceMappingURL=Tabs.router.js.map