import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import * as SplashScreen from '../views/Splash';
import { defaultRouteInfo, type UrlObject } from './getRouteInfoFromState';
import { getCachedRouteInfo, routeInfoSubscribers } from './routeInfoCache';
import type { FocusedRouteState, ReactNavigationState } from './types';

export type RouterStore = typeof store;

type StoreRef = {
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  routeNode: RouteNode | null;
  state?: ReactNavigationState;
  linking?: ExpoLinkingOptions;
  config: any;
  routeInfo?: UrlObject;
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

export function maybeHideSplashScreen() {
  if (!hasAttemptedToHideSplash) {
    setHasAttemptedToHideSplash(true);
    setSplashScreenAnimationFrame(
      requestAnimationFrame(() => {
        SplashScreen._internal_maybeHideAsync?.();
      })
    );
  }
}

export const store = {
  get state() {
    return storeRef.current.state;
  },
  get navigationRef() {
    return storeRef.current.navigationRef;
  },
  // TODO: Rename this to `rootRouteNode`; it represents the root node of the app's route tree.
  get routeNode() {
    return storeRef.current.routeNode;
  },
  getRouteInfo(): UrlObject {
    return storeRef.current.routeInfo || defaultRouteInfo;
  },
  get linking() {
    return storeRef.current.linking;
  },
  setFocusedState(state: FocusedRouteState) {
    const routeInfo = getCachedRouteInfo(state);
    storeRef.current.routeInfo = routeInfo;
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
};
