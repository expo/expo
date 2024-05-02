import {
  NavigationContainerRefWithCurrent,
  getPathFromState,
  useNavigationContainerRef,
} from '@react-navigation/native';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { useSyncExternalStore, useMemo, ComponentType, Fragment } from 'react';
import { Platform } from 'react-native';

import {
  canGoBack,
  canDismiss,
  goBack,
  linkTo,
  navigate,
  dismiss,
  dismissAll,
  push,
  replace,
  setParams,
} from './routing';
import { getSortedRoutes } from './sort-routes';
import { UrlObject, getRouteInfoFromState } from '../LocationProvider';
import { RouteNode } from '../Route';
import { deepEqual, getPathDataFromState } from '../fork/getPathFromState';
import { ResultState } from '../fork/getStateFromPath';
import { ExpoLinkingOptions, LinkingConfigOptions, getLinkingConfig } from '../getLinkingConfig';
import { getRoutes } from '../getRoutes';
import { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';

/**
 * This is the global state for the router. It is used to keep track of the current route, and to provide a way to navigate to other routes.
 *
 * There should only be one instance of this class and be initialized via `useInitializeExpoRouter`
 */
export class RouterStore {
  routeNode!: RouteNode | null;
  rootComponent!: ComponentType;
  linking?: ExpoLinkingOptions;
  private hasAttemptedToHideSplash: boolean = false;

  initialState?: ResultState;
  rootState?: ResultState;
  nextState?: ResultState;
  routeInfo?: UrlObject;
  splashScreenAnimationFrame?: number;

  navigationRef!: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  navigationRefSubscription!: () => void;

  rootStateSubscribers = new Set<() => void>();
  storeSubscribers = new Set<() => void>();

  linkTo = linkTo.bind(this);
  getSortedRoutes = getSortedRoutes.bind(this);
  goBack = goBack.bind(this);
  canGoBack = canGoBack.bind(this);
  push = push.bind(this);
  dismiss = dismiss.bind(this);
  replace = replace.bind(this);
  dismissAll = dismissAll.bind(this);
  canDismiss = canDismiss.bind(this);
  setParams = setParams.bind(this);
  navigate = navigate.bind(this);

  initialize(
    context: RequireContext,
    navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
    linkingConfigOptions: LinkingConfigOptions = {}
  ) {
    // Clean up any previous state
    this.initialState = undefined;
    this.rootState = undefined;
    this.nextState = undefined;
    this.linking = undefined;
    this.navigationRefSubscription?.();
    this.rootStateSubscribers.clear();
    this.storeSubscribers.clear();

    this.routeNode = getRoutes(context, {
      ...Constants.expoConfig?.extra?.router,
      ignoreEntryPoints: true,
      platform: Platform.OS,
    });

    // We always needs routeInfo, even if there are no routes. This can happen if:
    //  - there are no routes (we are showing the onboarding screen)
    //  - getInitialURL() is async
    this.routeInfo = {
      unstable_globalHref: '',
      pathname: '',
      isIndex: false,
      params: {},
      segments: [],
    };

    if (this.routeNode) {
      // We have routes, so get the linking config and the root component
      this.linking = getLinkingConfig(this.routeNode, context, linkingConfigOptions);
      this.rootComponent = getQualifiedRouteComponent(this.routeNode);

      // By default React Navigation is async and does not render anything in the first pass as it waits for `getInitialURL`
      // This will cause static rendering to fail, which once performs a single pass.
      // If the initialURL is a string, we can preload the state and routeInfo, skipping React Navigation's async behavior.
      const initialURL = this.linking?.getInitialURL?.();
      if (typeof initialURL === 'string') {
        this.rootState = this.linking.getStateFromPath?.(initialURL, this.linking.config);
        this.initialState = this.rootState;
        if (this.rootState) {
          this.routeInfo = this.getRouteInfo(this.rootState);
        }
      }
    } else {
      // Only error in production, in development we will show the onboarding screen
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No routes found');
      }

      // In development, we will show the onboarding screen
      this.rootComponent = Fragment;
    }

    /**
     * Counter intuitively - this fires AFTER both React Navigation's state changes and the subsequent paint.
     * This poses a couple of issues for Expo Router,
     *   - Ensuring hooks (e.g. useSearchParams()) have data in the initial render
     *   - Reacting to state changes after a navigation event
     *
     * This is why the initial render renders a Fragment and we wait until `onReady()` is called
     * Additionally, some hooks compare the state from both the store and the navigationRef. If the store it stale,
     * that hooks will manually update the store.
     *
     */
    this.navigationRef = navigationRef;
    this.navigationRefSubscription = navigationRef.addListener('state', (data) => {
      const state = data.data.state as ResultState;

      if (!this.hasAttemptedToHideSplash) {
        this.hasAttemptedToHideSplash = true;
        // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
        this.splashScreenAnimationFrame = requestAnimationFrame(() => {
          // @ts-expect-error: This function is native-only and for internal-use only.
          SplashScreen._internal_maybeHideAsync?.();
        });
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

  updateState(state: ResultState, nextState = state) {
    store.rootState = state;
    store.nextState = nextState;

    const nextRouteInfo = store.getRouteInfo(state);

    if (!deepEqual(this.routeInfo, nextRouteInfo)) {
      store.routeInfo = nextRouteInfo;
    }
  }

  getRouteInfo(state: ResultState) {
    return getRouteInfoFromState(
      (state: Parameters<typeof getPathFromState>[0], asPath: boolean) => {
        return getPathDataFromState(state, {
          screens: {},
          ...this.linking?.config,
          preserveDynamicRoutes: asPath,
          preserveGroups: asPath,
        });
      },
      state
    );
  }

  // This is only used in development, to show the onboarding screen
  // In production we should have errored during the initialization
  shouldShowTutorial() {
    return !this.routeNode && process.env.NODE_ENV === 'development';
  }

  /** Make sure these are arrow functions so `this` is correctly bound */
  subscribeToRootState = (subscriber: () => void) => {
    this.rootStateSubscribers.add(subscriber);
    return () => this.rootStateSubscribers.delete(subscriber);
  };
  subscribeToStore = (subscriber: () => void) => {
    this.storeSubscribers.add(subscriber);
    return () => this.storeSubscribers.delete(subscriber);
  };
  snapshot = () => {
    return this;
  };
  rootStateSnapshot = () => {
    return this.rootState!;
  };
  routeInfoSnapshot = () => {
    return this.routeInfo!;
  };

  cleanup() {
    if (this.splashScreenAnimationFrame) {
      cancelAnimationFrame(this.splashScreenAnimationFrame);
    }
  }
}

export const store = new RouterStore();

export function useExpoRouter() {
  return useSyncExternalStore(store.subscribeToStore, store.snapshot, store.snapshot);
}

function syncStoreRootState() {
  if (store.navigationRef.isReady()) {
    const currentState = store.navigationRef.getRootState() as unknown as ResultState;

    if (store.rootState !== currentState) {
      store.updateState(currentState);
    }
  }
}

export function useStoreRootState() {
  syncStoreRootState();
  return useSyncExternalStore(
    store.subscribeToRootState,
    store.rootStateSnapshot,
    store.rootStateSnapshot
  );
}

export function useStoreRouteInfo() {
  syncStoreRootState();
  return useSyncExternalStore(
    store.subscribeToRootState,
    store.routeInfoSnapshot,
    store.routeInfoSnapshot
  );
}

export function useInitializeExpoRouter(context: RequireContext, options: LinkingConfigOptions) {
  const navigationRef = useNavigationContainerRef();
  useMemo(() => store.initialize(context, navigationRef, options), context.keys());
  useExpoRouter();
  return store;
}
