'use client';

import {
  NavigationContainerRefWithCurrent,
  NavigationState,
  PartialState,
  useNavigationContainerRef,
  useStateForPath,
} from '@react-navigation/native';
import Constants from 'expo-constants';
import { ComponentType, Fragment, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { RouteNode } from '../Route';
import { routePatternToRegex } from '../fork/getStateFromPath-forks';
import { ExpoLinkingOptions, LinkingConfigOptions, getLinkingConfig } from '../getLinkingConfig';
import { parseRouteSegments } from '../getReactNavigationConfig';
import { getRoutes } from '../getRoutes';
import { RedirectConfig } from '../getRoutesCore';
import { defaultRouteInfo, getRouteInfoFromState, UrlObject } from './routeInfo';
import { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';
import { shouldLinkExternally } from '../utils/url';
import * as SplashScreen from '../views/Splash';

export type StoreRedirects = readonly [RegExp, RedirectConfig, boolean];
export type ReactNavigationState = NavigationState | PartialState<NavigationState>;
export type FocusedRouteState = NonNullable<ReturnType<typeof useStateForPath>>;

export type RouterStore = typeof store;

type StoreRef = {
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  routeNode: RouteNode | null;
  rootComponent: ComponentType<any>;
  state?: ReactNavigationState;
  focusedState?: FocusedRouteState;
  linking?: ExpoLinkingOptions;
  config: any;
  redirects: StoreRedirects[];
};

const storeRef = {
  current: {} as StoreRef,
};

const routeInfoCache = new WeakMap<FocusedRouteState | ReactNavigationState, UrlObject>();

let splashScreenAnimationFrame: number | undefined;
let hasAttemptedToHideSplash = false;

export const store = {
  shouldShowTutorial() {
    return !storeRef.current.routeNode && process.env.NODE_ENV === 'development';
  },
  get state() {
    return storeRef.current.state;
  },
  get focusedState() {
    return storeRef.current.focusedState;
  },
  get navigationRef() {
    return storeRef.current.navigationRef;
  },
  get routeNode() {
    return storeRef.current.routeNode;
  },
  getRouteInfo(
    state: FocusedRouteState | ReactNavigationState | undefined = storeRef.current.focusedState
  ): UrlObject {
    if (!state) {
      return defaultRouteInfo;
    }

    let routeInfo = routeInfoCache.get(state);

    if (!routeInfo) {
      routeInfo = getRouteInfoFromState(state);
      routeInfoCache.set(state, routeInfo);
    }

    return routeInfo;
  },
  get redirects() {
    return storeRef.current.redirects || [];
  },
  get rootComponent() {
    return storeRef.current.rootComponent;
  },
  get linking() {
    return storeRef.current.linking;
  },
  setFocusedState(state: FocusedRouteState) {
    storeRef.current.focusedState = state;
  },
  onReady() {
    if (!hasAttemptedToHideSplash) {
      hasAttemptedToHideSplash = true;
      // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
      splashScreenAnimationFrame = requestAnimationFrame(() => {
        SplashScreen._internal_maybeHideAsync?.();
      });
    }

    storeRef.current.navigationRef.addListener('state', (e) => {
      if (e.data.state) {
        storeRef.current.state = e.data.state;
      }

      for (const callback of routeInfoSubscribers) {
        callback();
      }
    });
  },
  assertIsReady() {
    if (!storeRef.current.navigationRef.isReady()) {
      throw new Error(
        'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
      );
    }
  },
};

export function useStore(
  context: RequireContext,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl?: string
) {
  const navigationRef = useNavigationContainerRef();
  const config = Constants.expoConfig?.extra?.router;

  let linking: ExpoLinkingOptions | undefined;
  let rootComponent: ComponentType<any> = Fragment;
  let initialState: ReactNavigationState | undefined;

  const routeNode = getRoutes(context, {
    ...config,
    ignoreEntryPoints: true,
    platform: Platform.OS,
  });

  const redirects: StoreRedirects[] = [config?.redirects, config?.rewrites]
    .filter(Boolean)
    .flat()
    .map((route) => {
      return [
        routePatternToRegex(parseRouteSegments(route.source)),
        route,
        shouldLinkExternally(route.destination),
      ];
    });

  if (routeNode) {
    // We have routes, so get the linking config and the root component
    linking = getLinkingConfig(routeNode, context, () => store.getRouteInfo(), {
      metaOnly: linkingConfigOptions.metaOnly,
      serverUrl,
      redirects,
    });
    rootComponent = getQualifiedRouteComponent(routeNode);

    // By default React Navigation is async and does not render anything in the first pass as it waits for `getInitialURL`
    // This will cause static rendering to fail, which once performs a single pass.
    // If the initialURL is a string, we can prefetch the state and routeInfo, skipping React Navigation's async behavior.
    const initialURL = linking?.getInitialURL?.();
    if (typeof initialURL === 'string') {
      initialState = linking.getStateFromPath(initialURL, linking.config);
      const initialRouteInfo = getRouteInfoFromState(initialState);
      routeInfoCache.set(initialState as any, initialRouteInfo);
    }
  } else {
    // Only error in production, in development we will show the onboarding screen
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No routes found');
    }

    // In development, we will show the onboarding screen
    rootComponent = Fragment;
  }

  storeRef.current = {
    navigationRef,
    routeNode,
    config,
    rootComponent,
    linking,
    redirects,
    state: initialState,
  };

  if (initialState) {
    storeRef.current.focusedState = initialState as FocusedRouteState;
  }

  useEffect(() => {
    return () => {
      // listener();

      if (splashScreenAnimationFrame) {
        cancelAnimationFrame(splashScreenAnimationFrame);
        splashScreenAnimationFrame = undefined;
      }
    };
  });

  return store;
}

const routeInfoSubscribers = new Set<() => void>();
const routeInfoSubscribe = (callback: () => void) => {
  routeInfoSubscribers.add(callback);
  return () => {
    routeInfoSubscribers.delete(callback);
  };
};

export function useRouteInfo() {
  return useSyncExternalStore(routeInfoSubscribe, store.getRouteInfo, store.getRouteInfo);
}
