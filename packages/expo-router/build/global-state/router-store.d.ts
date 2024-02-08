import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { ComponentType } from 'react';
import { UrlObject } from '../LocationProvider';
import { RouteNode } from '../Route';
import { ResultState } from '../fork/getStateFromPath';
import { ExpoLinkingOptions } from '../getLinkingConfig';
import { RequireContext } from '../types';
/**
 * This is the global state for the router. It is used to keep track of the current route, and to provide a way to navigate to other routes.
 *
 * There should only be one instance of this class and be initialized via `useInitializeExpoRouter`
 */
export declare class RouterStore {
    routeNode: RouteNode | null;
    rootComponent: ComponentType;
    linking: ExpoLinkingOptions | undefined;
    private hasAttemptedToHideSplash;
    initialState: ResultState | undefined;
    rootState: ResultState | undefined;
    nextState: ResultState | undefined;
    routeInfo?: UrlObject | undefined;
    navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    navigationRefSubscription: () => void;
    rootStateSubscribers: Set<() => void>;
    storeSubscribers: Set<() => void>;
    linkTo: any;
    getSortedRoutes: any;
    goBack: any;
    canGoBack: any;
    push: any;
    dismiss: any;
    replace: any;
    dismissAll: any;
    canDismiss: any;
    setParams: any;
    navigate: any;
    initialize(context: RequireContext, navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>, initialLocation?: URL): void;
    updateState(state: ResultState, nextState?: ResultState): void;
    getRouteInfo(state: ResultState): UrlObject;
    shouldShowTutorial(): boolean;
    /** Make sure these are arrow functions so `this` is correctly bound */
    subscribeToRootState: (subscriber: () => void) => () => boolean;
    subscribeToStore: (subscriber: () => void) => () => boolean;
    snapshot: () => this;
    rootStateSnapshot: () => ResultState;
    routeInfoSnapshot: () => UrlObject;
}
export declare const store: RouterStore;
export declare function useExpoRouter(): RouterStore;
export declare function useStoreRootState(): ResultState;
export declare function useStoreRouteInfo(): UrlObject;
export declare function useInitializeExpoRouter(context: RequireContext, initialLocation: URL | undefined): RouterStore;
//# sourceMappingURL=router-store.d.ts.map