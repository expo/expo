"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggersToScreens = exports.PressableSlot = exports.ViewSlot = void 0;
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
exports.PressableSlot = react_slot_1.Slot;
function triggersToScreens(triggers, layoutRouteNode, linking, initialRouteName) {
    const configs = [];
    const triggerMap = new Map();
    for (const trigger of triggers) {
        let state = linking.getStateFromPath?.((0, href_1.resolveHref)(trigger.href), linking.config)?.routes[0];
        if (!state) {
            continue;
        }
        triggerMap.set(trigger.name, {
            navigate: stateToActionPayload(state, layoutRouteNode.route),
            switch: stateToActionPayload(state, layoutRouteNode.route, { depth: 1 }),
        });
        if (layoutRouteNode.route) {
            while (state?.state) {
                const previousState = state;
                state = state.state.routes[state.state.index ?? state.state.routes.length - 1];
                if (previousState.name === layoutRouteNode.route)
                    break;
            }
        }
        const routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);
        if (!routeNode) {
            continue;
        }
        if (routeNode.generated && routeNode.internal && routeNode.route.includes('+not-found')) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Tab trigger '${trigger.name}' has the href '${trigger.href}' which points to a +not-found route.`);
            }
            continue;
        }
        configs.push({ routeNode });
    }
    const sortFn = (0, sortRoutes_1.sortRoutesWithInitial)(initialRouteName);
    const children = configs
        .sort((a, b) => sortFn(a.routeNode, b.routeNode))
        .map(({ routeNode }) => (<Screen key={routeNode.route} name={routeNode.route} getId={(0, useScreens_1.createGetIdForRoute)(routeNode)} getComponent={() => (0, useScreens_1.getQualifiedRouteComponent)(routeNode)} options={(0, useScreens_1.screenOptionsFactory)(routeNode)}/>));
    return {
        children,
        triggerMap,
    };
}
exports.triggersToScreens = triggersToScreens;
function stateToActionPayload(state, startAtRoute, { depth = Infinity } = {}) {
    const rootPayload = {};
    let payload = rootPayload;
    let foundStartingPoint = false;
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
            if (state.name === startAtRoute || !startAtRoute) {
                foundStartingPoint = true;
            }
            const nextState = state.state?.routes[state.state?.routes.length - 1];
            if (nextState) {
                state = nextState;
            }
        }
    }
    return {
        payload: rootPayload,
    };
}
//# sourceMappingURL=common.js.map