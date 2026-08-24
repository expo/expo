'use client';
import { createContext, use } from 'react';
import type { ComponentType } from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
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

export const useExpoRouterStore = () => use(StoreContext)!;
export const useOptionalExpoRouterStore = () => use(StoreContext);
