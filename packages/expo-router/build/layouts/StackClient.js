'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackRouter = exports.stackRouterOverride = void 0;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const withLayoutContext_1 = require("./withLayoutContext");
const useScreens_1 = require("../useScreens");
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
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a unique id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the unique screen logic.
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
            // The dynamic getId added to an action, `router.push('screen', { unique: true })`
            const actionGetId = action.payload && 'unique' in action.payload
                ? action.payload.unique
                : undefined;
            // Handle if 'getID' or 'unique' is set.
            function getIdFunction(fn) {
                // Actions can be fired by the user, so we do need to validate their structure.
                if (!('payload' in action) ||
                    !action.payload ||
                    !('name' in action.payload) ||
                    typeof action.payload.name !== 'string') {
                    return;
                }
                const name = action.payload.name;
                // The static getId added as a prop to `<Screen unique />` or `<Screen getId={} />`
                const screenGetId = options.routeGetIdList[name];
                // If the navigation action has a unique id function, use it.
                return getActionUniqueIdFn(actionGetId, name) || screenGetId || fn;
            }
            switch (action.type) {
                case 'PUSH': {
                    /**
                     * PUSH should always push
                     *
                     * If 'getID' or 'unique' is set and a match is found, instead of pushing a new screen,
                     * the existing screen will be moved to the HEAD of the stack. If there are multiple matches, the rest will be removed.
                     */
                    const nextState = original.getStateForAction(state, action, {
                        ...options,
                        routeGetIdList: {
                            ...options.routeGetIdList,
                            [action.payload.name]: getIdFunction(),
                        },
                    });
                    return filterUnique(nextState, actionGetId);
                }
                case 'NAVIGATE': {
                    /**
                     * NAVIGATE should push unless the current name & route params of the current and target screen match.
                     * Search params and hashes should be ignored.
                     *
                     * If the name, route params & search params match, no action is taken.
                     * If both the name and route params match, the screen is replaced.
                     * If the name / route params do not match, the screen is pushed.
                     *
                     * If 'getID' or 'unique' is set and a match is found, instead of pushing a new screen,
                     * the existing screen will be moved to the HEAD of the stack. If there are multiple matches, the rest will be removed.
                     */
                    const nextState = original.getStateForAction(state, action, {
                        ...options,
                        routeGetIdList: {
                            ...options.routeGetIdList,
                            [action.payload.name]: getIdFunction((options) => {
                                return (0, useScreens_1.getUniqueId)(action.payload.name, options);
                            }),
                        },
                    });
                    return filterUnique(nextState, actionGetId);
                }
                default: {
                    return original.getStateForAction(state, action, options);
                }
            }
        },
    };
};
exports.stackRouterOverride = stackRouterOverride;
function getActionUniqueIdFn(actionGetId, name) {
    if (typeof actionGetId === 'function') {
        return actionGetId;
    }
    else if (actionGetId === true) {
        return (options) => (0, useScreens_1.getUniqueId)(name, options);
    }
    return undefined;
}
/**
 * If there is a dynamic unique on an action, then we need to filter the state to only have unique screens.
 * As multiples may have been added before we did the unique navigation.
 */
function filterUnique(state, unique) {
    if (!state || !unique) {
        return state;
    }
    if (!state.routes) {
        return state;
    }
    const currentIndex = state.index || state.routes.length - 1;
    const current = state.routes[currentIndex];
    const name = current.name;
    const getId = getActionUniqueIdFn(unique, name);
    if (!getId) {
        return state;
    }
    const id = getId({ params: current.params });
    // TypeScript needs a type assertion here for the filter to work.
    let routes = state.routes;
    routes = routes.filter((route, index) => {
        // If the route is the current route, keep it.
        if (index === currentIndex) {
            return true;
        }
        // Remove all other routes with the same name and id.
        return name !== route.name || id !== getId({ params: route.params });
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