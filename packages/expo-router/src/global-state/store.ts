import type { ComponentType } from 'react';

import { defaultRouteInfo, type UrlObject } from './getRouteInfoFromState';
import { getCachedRouteInfo, routeInfoSubscribers } from './routeInfoCache';
import type {
  FocusedRouteState,
  LinkToOptions,
  ReactNavigationState,
  StoreRedirects,
} from './types';
import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import { handleNavigationOnReady } from '../navigationEvents/navigation';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import type { RequireContext, Href } from '../types';
import * as SplashScreen from '../views/Splash';

export type RouterStore = typeof store;

type StoreRef = {
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  routeNode: RouteNode | null;
  rootComponent: ComponentType<any>;
  state?: ReactNavigationState;
  linking?: ExpoLinkingOptions;
  config: any;
  redirects: StoreRedirects[];
  routeInfo?: UrlObject;
  context?: RequireContext;
};

export const storeRef = {
  current: {} as StoreRef,
};

let splashScreenAnimationFrame: number | undefined;
let hasAttemptedToHideSplash = false;

export function getSplashScreenAnimationFrame() {
  return splashScreenAnimationFrame;
}

export function setSplashScreenAnimationFrame(value: number | undefined) {
  splashScreenAnimationFrame = value;
}

export function setHasAttemptedToHideSplash(value: boolean) {
  hasAttemptedToHideSplash = value;
}

export const store = {
  shouldShowTutorial() {
    return !storeRef.current.routeNode && process.env.NODE_ENV === 'development';
  },
  get state() {
    return storeRef.current.state;
  },
  get navigationRef() {
    return storeRef.current.navigationRef;
  },
  get routeNode() {
    return storeRef.current.routeNode;
  },
  getRouteInfo(): UrlObject {
    return storeRef.current.routeInfo || defaultRouteInfo;
  },
  get redirects() {
    return storeRef.current.redirects || [];
  },
  get rootComponent() {
    return storeRef.current.rootComponent;
  },
  getStateForHref(href: Href, options?: LinkToOptions) {
    href = resolveHref(href);

    href = resolveHrefStringWithSegments(href, store.getRouteInfo(), options);
    return this.linking?.getStateFromPath!(href, this.linking.config);
  },
  get linking() {
    return storeRef.current.linking;
  },
  setFocusedState(state: FocusedRouteState) {
    const routeInfo = getCachedRouteInfo(state);
    storeRef.current.routeInfo = routeInfo;
  },
  onReady() {
    handleNavigationOnReady();
    if (!hasAttemptedToHideSplash) {
      setHasAttemptedToHideSplash(true);
      // NOTE(EvanBacon): `navigationRef.isReady` is sometimes not true when state is called initially.
      setSplashScreenAnimationFrame(
        requestAnimationFrame(() => {
          SplashScreen._internal_maybeHideAsync?.();
        })
      );
    }
  },
  onStateChange(newState: ReactNavigationState | undefined) {
    if (!newState) {
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      let isStale: boolean | undefined = false;
      let state: ReactNavigationState | undefined = newState;

      while (!isStale && state) {
        isStale = state.stale;
        state =
          state.routes?.[
            'index' in state && typeof state.index === 'number'
              ? state.index
              : state.routes.length - 1
          ]?.state;
      }
      if (isStale) {
        // This should never happen, as onStateChange should provide a full state. However, adding this check to catch any undocumented behavior.
        console.error(
          'Detected stale state in onStateChange. This is likely a bug in Expo Router.'
        );
      }
    }

    storeRef.current.state = newState;

    storeRef.current.routeInfo = getCachedRouteInfo(newState);

    for (const callback of routeInfoSubscribers) {
      callback();
    }
  },
  assertIsReady() {
    if (!storeRef.current.navigationRef.isReady()) {
      throw new Error(
        'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
      );
    }
  },
};
