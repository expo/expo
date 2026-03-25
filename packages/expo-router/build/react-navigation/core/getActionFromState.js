"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionFromState = getActionFromState;
function getActionFromState(state, options) {
    // Create a normalized configs object which will be easier to use
    const normalizedConfig = options
        ? createNormalizedConfigItem(options)
        : {};
    const routes = state.index != null ? state.routes.slice(0, state.index + 1) : state.routes;
    if (routes.length === 0) {
        return undefined;
    }
    if (!((routes.length === 1 && routes[0].key === undefined) ||
        (routes.length === 2 &&
            routes[0].key === undefined &&
            routes[0].name === normalizedConfig?.initialRouteName &&
            routes[1].key === undefined))) {
        return {
            type: 'RESET',
            payload: state,
        };
    }
    const route = state.routes[state.index ?? state.routes.length - 1];
    let current = route?.state;
    let config = normalizedConfig?.screens?.[route?.name];
    let params = { ...route.params };
    const payload = route ? { name: route.name, path: route.path, params } : undefined;
    // If the screen contains a navigator, pop other screens to navigate to it
    // This avoid pushing multiple instances of navigators onto a stack
    //
    // For example:
    // - RootStack
    //   - BottomTabs
    //   - SomeScreen
    //
    // In this case, if deep linking to `BottomTabs`, we should pop `SomeScreen`
    // Otherwise, we'll end up with 2 instances of `BottomTabs` in the stack
    //
    // There are 2 ways we can detect if a screen contains a navigator:
    // - The route contains nested state in `route.state`
    // - Nested screens are defined in the config
    if (payload && config?.screens && Object.keys(config.screens).length) {
        payload.pop = true;
    }
    while (current) {
        if (current.routes.length === 0) {
            return undefined;
        }
        const routes = current.index != null ? current.routes.slice(0, current.index + 1) : current.routes;
        const route = routes[routes.length - 1];
        // Explicitly set to override existing value when merging params
        Object.assign(params, {
            initial: undefined,
            screen: undefined,
            params: undefined,
            state: undefined,
        });
        if (routes.length === 1 && routes[0].key === undefined) {
            params.initial = true;
            params.screen = route.name;
        }
        else if (routes.length === 2 &&
            routes[0].key === undefined &&
            routes[0].name === config?.initialRouteName &&
            routes[1].key === undefined) {
            params.initial = false;
            params.screen = route.name;
        }
        else {
            params.state = current;
            break;
        }
        if (route.state) {
            params.params = { ...route.params };
            params.pop = true;
            params = params.params;
        }
        else {
            params.path = route.path;
            params.params = route.params;
        }
        current = route.state;
        config = config?.screens?.[route.name];
        if (config?.screens && Object.keys(config.screens).length) {
            params.pop = true;
        }
    }
    if (payload?.params.screen || payload?.params.state) {
        payload.pop = true;
    }
    if (!payload) {
        return;
    }
    // Try to construct payload for a `NAVIGATE` action from the state
    // This lets us preserve the navigation state and not lose it
    return {
        type: 'NAVIGATE',
        payload,
    };
}
const createNormalizedConfigItem = (config) => typeof config === 'object' && config != null
    ? {
        initialRouteName: config.initialRouteName,
        screens: config.screens != null ? createNormalizedConfigs(config.screens) : undefined,
    }
    : {};
const createNormalizedConfigs = (options) => Object.entries(options).reduce((acc, [k, v]) => {
    acc[k] = createNormalizedConfigItem(v);
    return acc;
}, {});
//# sourceMappingURL=getActionFromState.js.map