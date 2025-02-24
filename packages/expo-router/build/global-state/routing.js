import { StackActions } from '@react-navigation/native';
import { IS_DOM } from 'expo/dom';
import * as Linking from 'expo-linking';
import { nanoid } from 'nanoid/non-secure';
import { Platform } from 'react-native';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import { emitDomDismiss, emitDomDismissAll, emitDomGoBack, emitDomLinkEvent, emitDomSetParams, } from '../link/useDomComponentNavigation';
import { matchDynamicName } from '../matchers';
import { shouldLinkExternally } from '../utils/url';
function assertIsReady(store) {
    if (!store.navigationRef.isReady()) {
        throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
    }
}
export function navigate(url, options) {
    return this.linkTo(resolveHref(url), { ...options, event: 'NAVIGATE' });
}
export function reload() {
    // TODO(EvanBacon): add `reload` support.
    throw new Error('The reload method is not implemented in the client-side router yet.');
}
export function push(url, options) {
    return this.linkTo(resolveHref(url), { ...options, event: 'PUSH' });
}
export function dismiss(count) {
    if (emitDomDismiss(count)) {
        return;
    }
    this.navigationRef?.dispatch(StackActions.pop(count));
}
export function dismissTo(href, options) {
    return this.linkTo(resolveHref(href), { ...options, event: 'POP_TO' });
}
export function replace(url, options) {
    return this.linkTo(resolveHref(url), { ...options, event: 'REPLACE' });
}
export function dismissAll() {
    if (emitDomDismissAll()) {
        return;
    }
    this.navigationRef?.dispatch(StackActions.popToTop());
}
export function goBack() {
    if (emitDomGoBack()) {
        return;
    }
    assertIsReady(this);
    this.navigationRef?.current?.goBack();
}
export function canGoBack() {
    if (IS_DOM) {
        throw new Error('canGoBack imperative method is not supported. Pass the property to the DOM component instead.');
    }
    // Return a default value here if the navigation hasn't mounted yet.
    // This can happen if the user calls `canGoBack` from the Root Layout route
    // before mounting a navigator. This behavior exists due to React Navigation being dynamically
    // constructed at runtime. We can get rid of this in the future if we use
    // the static configuration internally.
    if (!this.navigationRef.isReady()) {
        return false;
    }
    return this.navigationRef?.current?.canGoBack() ?? false;
}
export function canDismiss() {
    if (IS_DOM) {
        throw new Error('canDismiss imperative method is not supported. Pass the property to the DOM component instead.');
    }
    let state = this.rootState;
    // Keep traversing down the state tree until we find a stack navigator that we can pop
    while (state) {
        if (state.type === 'stack' && state.routes.length > 1) {
            return true;
        }
        if (state.index === undefined)
            return false;
        state = state.routes?.[state.index]?.state;
    }
    return false;
}
export function setParams(params = {}) {
    if (emitDomSetParams(params)) {
        return;
    }
    assertIsReady(this);
    return (this.navigationRef?.current?.setParams)(params);
}
export function linkTo(href, options = {}) {
    if (emitDomLinkEvent(href, options)) {
        return;
    }
    if (shouldLinkExternally(href)) {
        if (href.startsWith('//') && Platform.OS !== 'web') {
            href = `https:${href}`;
        }
        Linking.openURL(href);
        return;
    }
    assertIsReady(this);
    const navigationRef = this.navigationRef.current;
    if (navigationRef == null) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    if (!this.linking) {
        throw new Error('Attempted to link to route when no routes are present');
    }
    if (href === '..' || href === '../') {
        navigationRef.goBack();
        return;
    }
    const rootState = navigationRef.getRootState();
    href = resolveHrefStringWithSegments(href, this.routeInfo, options);
    const state = this.linking.getStateFromPath(href, this.linking.config);
    if (!state || state.routes.length === 0) {
        console.error('Could not generate a valid navigation state for the given path: ' + href);
        return;
    }
    return navigationRef.dispatch(getNavigateAction(state, rootState, options.event, options.withAnchor));
}
function getNavigateAction(actionState, navigationState, type = 'NAVIGATE', withAnchor) {
    /**
     * We need to find the deepest navigator where the action and current state diverge, If they do not diverge, the
     * lowest navigator is the target.
     *
     * By default React Navigation will target the current navigator, but this doesn't work for all actions
     * For example:
     *  - /deeply/nested/route -> /top-level-route the target needs to be the top-level navigator
     *  - /stack/nestedStack/page -> /stack1/nestedStack/other-page needs to target the nestedStack navigator
     *
     * This matching needs to done by comparing the route names and the dynamic path, for example
     * - /1/page -> /2/anotherPage needs to target the /[id] navigator
     *
     * Other parameters such as search params and hash are not evaluated.
     */
    let actionStateRoute;
    // Traverse the state tree comparing the current state and the action state until we find where they diverge
    while (actionState && navigationState) {
        const stateRoute = navigationState.routes[navigationState.index];
        actionStateRoute = actionState.routes[actionState.routes.length - 1];
        const childState = actionStateRoute.state;
        const nextNavigationState = stateRoute.state;
        const dynamicName = matchDynamicName(actionStateRoute.name);
        const didActionAndCurrentStateDiverge = actionStateRoute.name !== stateRoute.name ||
            !childState ||
            !nextNavigationState ||
            (dynamicName && actionStateRoute.params?.[dynamicName] !== stateRoute.params?.[dynamicName]);
        if (didActionAndCurrentStateDiverge) {
            break;
        }
        actionState = childState;
        navigationState = nextNavigationState;
    }
    /*
     * We found the target navigator, but the payload is in the incorrect format
     * We need to convert the action state to a payload that can be dispatched
     */
    const rootPayload = { params: {} };
    let payload = rootPayload;
    let params = payload.params;
    // The root level of payload is a bit weird, its params are in the child object
    while (actionStateRoute) {
        Object.assign(params, { ...payload.params, ...actionStateRoute.params });
        // Assign the screen name to the payload
        payload.screen = actionStateRoute.name;
        // Merge the params, ensuring that we create a new object
        payload.params = { ...params };
        // Params don't include the screen, thats a separate attribute
        delete payload.params['screen'];
        // Continue down the payload tree
        // Initially these values are separate, but React Nav merges them after the first layer
        payload = payload.params;
        params = payload;
        actionStateRoute = actionStateRoute.state?.routes[actionStateRoute.state?.routes.length - 1];
    }
    // Expo Router uses only three actions, but these don't directly translate to all navigator actions
    if (type === 'PUSH') {
        // Only stack navigators have a push action, and even then we want to use NAVIGATE (see below)
        type = 'NAVIGATE';
        /*
         * The StackAction.PUSH does not work correctly with Expo Router.
         *
         * Expo Router provides a getId() function for every route, altering how React Navigation handles stack routing.
         * Ordinarily, PUSH always adds a new screen to the stack. However, with getId() present, it navigates to the screen with the matching ID instead (by moving the screen to the top of the stack)
         * When you try and push to a screen with the same ID, no navigation will occur
         * Refer to: https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L279-L290
         *
         * Expo Router needs to retain the default behavior of PUSH, consistently adding new screens to the stack, even if their IDs are identical.
         *
         * To resolve this issue, we switch to using a NAVIGATE action with a new key. In the navigate action, screens are matched by either key or getId() function.
         * By generating a unique new key, we ensure that the screen is always pushed onto the stack.
         *
         */
        if (navigationState.type === 'stack') {
            rootPayload.params.__EXPO_ROUTER_key = `${rootPayload.name}-${nanoid()}`; // @see https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L406-L407
        }
    }
    if (navigationState.type === 'expo-tab') {
        type = 'JUMP_TO';
    }
    if (type === 'REPLACE' && (navigationState.type === 'tab' || navigationState.type === 'drawer')) {
        type = 'JUMP_TO';
    }
    if (withAnchor !== undefined) {
        if (rootPayload.params.initial) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`The parameter 'initial' is a reserved parameter name in React Navigation`);
            }
        }
        /*
         * The logic for initial can seen backwards depending on your perspective
         *   True: The initialRouteName is not loaded. The incoming screen is the initial screen (default)
         *   False: The initialRouteName is loaded. THe incoming screen is placed after the initialRouteName
         *
         * withAnchor flips the perspective.
         *   True: You want the initialRouteName to load.
         *   False: You do not want the initialRouteName to load.
         */
        rootPayload.params.initial = !withAnchor;
    }
    return {
        type,
        target: navigationState.key,
        payload: {
            // key: rootPayload.key,
            name: rootPayload.screen,
            params: rootPayload.params,
        },
    };
}
//# sourceMappingURL=routing.js.map