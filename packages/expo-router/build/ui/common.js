"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggersToScreens = exports.ViewSlot = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const native_1 = require("@react-navigation/native");
const href_1 = require("../link/href");
const sortRoutes_1 = require("../sortRoutes");
const useScreens_1 = require("../useScreens");
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = (0, native_1.createNavigatorFactory)({})();
// Fix the TypeScript types for <Slot />. It complains about the ViewProps["style"]
exports.ViewSlot = react_slot_1.Slot;
function triggersToScreens(triggers, layoutRouteNode, linking, initialRouteName) {
    const configs = [];
    for (const trigger of triggers) {
        if (trigger.type === 'external') {
            configs.push(trigger);
            continue;
        }
        let state = linking.getStateFromPath?.((0, href_1.resolveHref)(trigger.href), linking.config)?.routes[0];
        if (!state) {
            // This shouldn't occur, as you should get the global +not-found
            console.warn(`Unable to find screen for trigger ${JSON.stringify(trigger)}. Does this point to a valid screen?`);
            continue;
        }
        let routeState = state;
        // The state object is the current state from the rootNavigator
        // We need to work out the state for just this trigger
        if (layoutRouteNode.route) {
            while (state?.state) {
                const previousState = state;
                if (previousState.name === layoutRouteNode.route)
                    break;
                state = state.state.routes[state.state.index ?? state.state.routes.length - 1];
            }
            routeState = state.state?.routes[state.state.index ?? state.state.routes.length - 1] || state;
        }
        const routeNode = layoutRouteNode.children.find((child) => child.route === routeState?.name);
        if (!routeNode) {
            console.warn(`Unable to find routeNode for trigger ${JSON.stringify(trigger)}. This might be a bug with Expo Router`);
            continue;
        }
        if (routeNode.generated && routeNode.internal && routeNode.route.includes('+not-found')) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Tab trigger '${trigger.name}' has the href '${trigger.href}' which points to a +not-found route.`);
            }
            continue;
        }
        configs.push({
            ...trigger,
            routeNode,
            action: stateToAction(state, layoutRouteNode.route),
        });
    }
    const sortFn = (0, sortRoutes_1.sortRoutesWithInitial)(initialRouteName);
    const sortedConfigs = configs.sort((a, b) => {
        // External routes should be last. They will eventually be dropped
        if (a.type === 'external' && b.type === 'external') {
            return 0;
        }
        else if (a.type === 'external') {
            return 1;
        }
        else if (b.type === 'external') {
            return -1;
        }
        return sortFn(a.routeNode, b.routeNode);
    });
    const children = [];
    const triggerMap = {};
    for (const [index, config] of sortedConfigs.entries()) {
        triggerMap[config.name] = { ...config, index };
        if (config.type === 'internal') {
            children.push(<Screen key={config.routeNode.route} name={config.routeNode.route} getId={(0, useScreens_1.createGetIdForRoute)(config.routeNode)} getComponent={() => (0, useScreens_1.getQualifiedRouteComponent)(config.routeNode)} options={(0, useScreens_1.screenOptionsFactory)(config.routeNode)}/>);
        }
    }
    return {
        children,
        triggerMap,
    };
}
exports.triggersToScreens = triggersToScreens;
function stateToAction(state, startAtRoute, { depth = Infinity } = {}) {
    const rootPayload = {};
    let payload = rootPayload;
    let foundStartingPoint = !startAtRoute;
    while (state) {
        if (foundStartingPoint) {
            if (depth === 0)
                break;
            depth--;
            if (payload === rootPayload) {
                payload.name = state.name;
            }
            else {
                payload.screen = state.name;
            }
            payload.params = state.params ? { ...state.params } : {};
            state = state.state?.routes[state.state?.routes.length - 1];
            if (state) {
                payload.params ??= {};
                payload = payload.params;
            }
        }
        else {
            if (state.name === startAtRoute) {
                foundStartingPoint = true;
            }
            const nextState = state.state?.routes[state.state?.routes.length - 1];
            if (nextState) {
                state = nextState;
            }
        }
    }
    return {
        type: 'JUMP_TO',
        payload: rootPayload,
    };
}
//# sourceMappingURL=common.js.map