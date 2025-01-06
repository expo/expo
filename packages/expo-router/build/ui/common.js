"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateToAction = exports.triggersToScreens = exports.SafeAreaViewSlot = exports.ViewSlot = void 0;
const href_1 = require("../link/href");
const sortRoutes_1 = require("../sortRoutes");
const useScreens_1 = require("../useScreens");
const Slot_1 = require("./Slot");
// Fix the TypeScript types for <Slot />. It complains about the ViewProps["style"]
exports.ViewSlot = Slot_1.Slot;
exports.SafeAreaViewSlot = Slot_1.Slot;
function triggersToScreens(triggers, layoutRouteNode, linking, initialRouteName, parentTriggerMap, routeInfo, contextKey) {
    const configs = [];
    for (const trigger of triggers) {
        if (trigger.name in parentTriggerMap) {
            const parentTrigger = parentTriggerMap[trigger.name];
            throw new Error(`Trigger ${JSON.stringify({
                name: trigger.name,
                href: trigger.href,
            })} has the same name as parent trigger ${JSON.stringify({
                name: parentTrigger.name,
                href: parentTrigger.href,
            })}. Triggers must have unique names.`);
        }
        if (trigger.type === 'external') {
            configs.push(trigger);
            continue;
        }
        let resolvedHref = (0, href_1.resolveHref)(trigger.href);
        if (resolvedHref.startsWith('../')) {
            throw new Error('Trigger href cannot link to a parent directory');
        }
        const segmentsWithoutGroups = contextKey.split('/').filter((segment) => {
            return !(segment.startsWith('(') && segment.endsWith(')'));
        });
        resolvedHref = (0, href_1.resolveHrefStringWithSegments)(resolvedHref, {
            ...routeInfo,
            segments: segmentsWithoutGroups,
        }, { relativeToDirectory: true });
        let state = linking.getStateFromPath?.(resolvedHref, linking.config)?.routes[0];
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
        const duplicateTrigger = trigger.type === 'internal' &&
            configs.find((config) => {
                if (config.type === 'external') {
                    return false;
                }
                return config.routeNode.route === routeNode.route;
            });
        if (duplicateTrigger) {
            const duplicateTriggerText = `${JSON.stringify({ name: duplicateTrigger.name, href: duplicateTrigger.href })} and ${JSON.stringify({ name: trigger.name, href: trigger.href })}`;
            throw new Error(`A navigator cannot contain multiple trigger components that map to the same sub-segment. Consider adding a shared group and assigning a group to each trigger. Conflicting triggers:\n\t${duplicateTriggerText}.\nBoth triggers map to route ${routeNode.route}.`);
        }
        configs.push({
            ...trigger,
            href: resolvedHref,
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
    const triggerMap = { ...parentTriggerMap };
    for (const [index, config] of sortedConfigs.entries()) {
        triggerMap[config.name] = { ...config, index };
        if (config.type === 'internal') {
            children.push((0, useScreens_1.routeToScreen)(config.routeNode));
        }
    }
    return {
        children,
        triggerMap,
    };
}
exports.triggersToScreens = triggersToScreens;
function stateToAction(state, startAtRoute) {
    const rootPayload = {};
    let payload = rootPayload;
    let foundStartingPoint = !startAtRoute || !state?.state;
    while (state) {
        if (foundStartingPoint) {
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
exports.stateToAction = stateToAction;
//# sourceMappingURL=common.js.map