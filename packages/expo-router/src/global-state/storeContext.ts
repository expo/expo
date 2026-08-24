'use client';
import { createContext } from 'react';
import type { ComponentType } from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import { store } from './store';
import type { ReactNavigationState, StoreRedirects } from './types';

export type StoreContextValue = {
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  linking: ExpoLinkingOptions | undefined;
  initialState: ReactNavigationState | undefined;
  rootComponent: ComponentType<any>;
  routeNode: RouteNode | null;
  redirects: StoreRedirects[];
};

export const StoreContext = createContext<StoreContextValue | null>(null);

// The branch's fork consumers read the global store singleton; the React context above carries
// the per-root configuration. There is a single router root, so both refer to the same data.
export const useExpoRouterStore = () => store;
