import { useNavigationContainerRef, } from '@react-navigation/native';
import { useSyncExternalStore, useMemo, Fragment } from 'react';
import { canGoBack, goBack, linkTo, push, replace, setParams } from './routing';
import { getSortedRoutes } from './sort-routes';
import { getRouteInfoFromState } from '../LocationProvider';
import { deepEqual, getPathDataFromState } from '../fork/getPathFromState';
import { getLinkingConfig } from '../getLinkingConfig';
import { getRoutes } from '../getRoutes';
import { getQualifiedRouteComponent } from '../useScreens';
import { _internal_maybeHideAsync } from '../views/Splash';
/**
 * This is the global state for the router. It is used to keep track of the current route, and to provide a way to navigate to other routes.
 *
 * There should only be one instance of this class and be initialized via `useInitializeExpoRouter`
 */
export class RouterStore {
    routeNode;
    rootComponent;
    linking;
    hasAttemptedToHideSplash = false;
    initialState;
    rootState;
    nextState;
    routeInfo;
    navigationRef;
    navigationRefSubscription;
    rootStateSubscribers = new Set();
    storeSubscribers = new Set();
    linkTo = linkTo.bind(this);
    getSortedRoutes = getSortedRoutes.bind(this);
    goBack = goBack.bind(this);
    canGoBack = canGoBack.bind(this);
    push = push.bind(this);
    replace = replace.bind(this);
    setParams = setParams.bind(this);
    initialize(context, navigationRef, initialLocation) {
        // Clean up any previous state
        this.initialState = undefined;
        this.rootState = undefined;
        this.nextState = undefined;
        this.routeInfo = undefined;
        this.linking = undefined;
        this.navigationRefSubscription?.();
        this.rootStateSubscribers.clear();
        this.storeSubscribers.clear();
        this.routeNode = getRoutes(context);
        this.rootComponent = this.routeNode ? getQualifiedRouteComponent(this.routeNode) : Fragment;
        // Only error in production, in development we will show the onboarding screen
        if (!this.routeNode && process.env.NODE_ENV === 'production') {
            throw new Error('No routes found');
        }
        this.navigationRef = navigationRef;
        if (this.routeNode) {
            this.linking = getLinkingConfig(this.routeNode);
            if (initialLocation) {
                this.linking.getInitialURL = () => initialLocation.toString();
                this.initialState = this.linking.getStateFromPath?.(initialLocation.pathname + initialLocation.search, this.linking.config);
            }
        }
        // There is no routeNode, so we will be showing the onboarding screen
        // In the meantime, just mock the routeInfo
        if (this.initialState) {
            this.rootState = this.initialState;
            this.routeInfo = this.getRouteInfo(this.initialState);
        }
        else {
            this.routeInfo = {
                unstable_globalHref: '',
                pathname: '',
                params: {},
                segments: [],
            };
        }
        /**
         * Counter intuitively - this fires AFTER both React Navigations state change and the subsequent paint.
         * This poses a couple of issues for Expo Router,
         *   - Ensuring hooks (e.g. useSearchParams()) have data in the initial render
         *   - Reacting to state changes after a navigation event
         *
         * This is why the initial render renders a Fragment and we wait until `onReady()` is called
         * Additionally, some hooks compare the state from both the store and the navigationRef. If the store it stale,
         * that hooks will manually update the store.
         *
         */
        this.navigationRefSubscription = navigationRef.addListener('state', (data) => {
            const state = data.data.state;
            if (!this.hasAttemptedToHideSplash) {
                this.hasAttemptedToHideSplash = true;
                // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
                requestAnimationFrame(() => _internal_maybeHideAsync());
            }
            let shouldUpdateSubscribers = this.nextState === state;
            this.nextState = undefined;
            // This can sometimes be undefined when an error is thrown in the Root Layout Route.
            // Additionally that state may already equal the rootState if it was updated within a hook
            if (state && state !== this.rootState) {
                store.updateState(state, undefined);
                shouldUpdateSubscribers = true;
            }
            // If the state has changed, or was changed inside a hook we need to update the subscribers
            if (shouldUpdateSubscribers) {
                for (const subscriber of this.rootStateSubscribers) {
                    subscriber();
                }
            }
        });
        for (const subscriber of this.storeSubscribers) {
            subscriber();
        }
    }
    updateState(state, nextState = state) {
        store.rootState = state;
        store.nextState = nextState;
        const nextRouteInfo = store.getRouteInfo(state);
        if (!deepEqual(this.routeInfo, nextRouteInfo)) {
            store.routeInfo = nextRouteInfo;
        }
    }
    getRouteInfo(state) {
        return getRouteInfoFromState((state, asPath) => {
            return getPathDataFromState(state, {
                screens: [],
                ...this.linking?.config,
                preserveDynamicRoutes: asPath,
                preserveGroups: asPath,
            });
        }, state);
    }
    // This is only used in development, to show the onboarding screen
    // In production we should have errored during the initialization
    shouldShowTutorial() {
        return !this.routeNode && process.env.NODE_ENV === 'development';
    }
    /** Make sure these are arrow functions so `this` is correctly bound */
    subscribeToRootState = (subscriber) => {
        this.rootStateSubscribers.add(subscriber);
        return () => this.rootStateSubscribers.delete(subscriber);
    };
    subscribeToStore = (subscriber) => {
        this.storeSubscribers.add(subscriber);
        return () => this.storeSubscribers.delete(subscriber);
    };
    snapshot = () => {
        return this;
    };
    rootStateSnapshot = () => {
        return this.rootState;
    };
    routeInfoSnapshot = () => {
        return this.routeInfo;
    };
}
export const store = new RouterStore();
export function useExpoRouter() {
    return useSyncExternalStore(store.subscribeToStore, store.snapshot, store.snapshot);
}
function syncStoreRootState() {
    if (store.navigationRef.isReady()) {
        const currentState = store.navigationRef.getRootState();
        if (store.rootState !== currentState) {
            store.updateState(currentState);
        }
    }
}
export function useStoreRootState() {
    syncStoreRootState();
    return useSyncExternalStore(store.subscribeToRootState, store.rootStateSnapshot, store.rootStateSnapshot);
}
export function useStoreRouteInfo() {
    syncStoreRootState();
    return useSyncExternalStore(store.subscribeToRootState, store.routeInfoSnapshot, store.routeInfoSnapshot);
}
export function useInitializeExpoRouter(context, initialLocation) {
    const navigationRef = useNavigationContainerRef();
    useMemo(() => store.initialize(context, navigationRef, initialLocation), [context, initialLocation]);
    useExpoRouter();
    return store;
}
//# sourceMappingURL=router-store.js.map