import type { ComponentType } from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import type { Href } from '../types';
import * as SplashScreen from '../views/Splash';
import { defaultRouteInfo, getRouteInfoFromState, type UrlObject } from './getRouteInfoFromState';
import type { LinkToOptions, ReactNavigationState, StoreRedirects } from './types';

export type RouterStore = typeof store;

type StoreRef = {
  owner?: object;
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  routeNode: RouteNode | null;
  rootComponent: ComponentType<any>;
  state?: ReactNavigationState;
  linking?: ExpoLinkingOptions;
  // TODO(@ubax): dead code, remove in a follow-up. Written by useStore but never read.
  config: any;
  redirects: StoreRedirects[];
};

export const storeRef = {
  current: {} as StoreRef,
};

// TODO(temporary): remove once imperative consumers read the reducer state directly.
export function syncStoreNavigationState(state: ReactNavigationState) {
  storeRef.current.state = state;

  if (process.env.NODE_ENV === 'development') {
    let isStale: boolean | undefined = false;
    let focusedState: ReactNavigationState | undefined = state;

    while (!isStale && focusedState) {
      isStale = focusedState.stale;
      focusedState =
        focusedState.routes?.[
          'index' in focusedState && typeof focusedState.index === 'number'
            ? focusedState.index
            : focusedState.routes.length - 1
        ]?.state;
    }
    if (isStale) {
      console.error('Detected stale state. This is likely a bug in Expo Router.');
    }
  }
}

let splashScreenAnimationFrame: number | undefined;
let hasAttemptedToHideSplash = false;

export function getSplashScreenAnimationFrame() {
  return splashScreenAnimationFrame;
}

export function setSplashScreenAnimationFrame(value: number | undefined) {
  splashScreenAnimationFrame = value;
}

// TODO(@ubax): dead code, remove in a follow-up. The `export` is unnecessary; only self-consumed below.
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
  // TODO: Rename this to `rootRouteNode`; it represents the root node of the app's route tree.
  get routeNode() {
    return storeRef.current.routeNode;
  },
  getRouteInfo(): UrlObject {
    const state = storeRef.current.state;
    return state ? getRouteInfoFromState(state) : defaultRouteInfo;
  },
  get redirects() {
    return storeRef.current.redirects || [];
  },
  get rootComponent() {
    return storeRef.current.rootComponent;
  },
  getStateForHref(href: Href | string, options?: LinkToOptions) {
    href = resolveHref(href);

    href = resolveHrefStringWithSegments(href, store.getRouteInfo(), options);
    return this.linking?.getStateFromPath!(href, this.linking.config);
  },
  get linking() {
    return storeRef.current.linking;
  },
  // TODO(@ubax): Refactor onReady logic as it probably should live somewhere else then store
  onReady() {
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
  assertIsReady() {
    if (!storeRef.current.navigationRef.isReady()) {
      throw new Error(
        'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
      );
    }
  },
};
