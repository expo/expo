import {
  NavigationContainerRefWithCurrent,
  NavigationRouteContext,
  ParamListBase,
  RouteProp,
} from '@react-navigation/native';
import React from 'react';

import { UrlObject } from './LocationProvider';
import { RouteNode } from './Route';
import { ResultState } from './fork/getStateFromPath';
import { ExpoLinkingOptions } from './getLinkingConfig';

type SearchParams = Record<string, string | string[]>;

export type ExpoRouterContextType = {
  routeNode: RouteNode;
  linking: ExpoLinkingOptions;
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  initialState: ResultState | undefined;
  getRouteInfo: (state: ResultState) => UrlObject;
};

// If there is no routeNode we should show the onboarding screen
export type OnboardingExpoRouterContextType = Omit<ExpoRouterContextType, 'routeNode'> & {
  routeNode: null;
};

export const ExpoRouterContext = React.createContext<ExpoRouterContextType | undefined>(undefined);

export type RootStateContextType = {
  state?: ResultState;
  routeInfo?: UrlObject;
};

export const RootStateContext = React.createContext<RootStateContextType>({});

export function useRootNavigationState() {
  return React.useContext(RootStateContext);
}

export function useRouteInfo() {
  return React.useContext(RootStateContext).routeInfo!;
}

export function useExpoRouterContext() {
  return React.useContext(ExpoRouterContext)!;
}

export function useRootNavigation() {
  const { navigationRef } = useExpoRouterContext();
  return navigationRef.current;
}

export function useLinkingContext() {
  return useExpoRouterContext().linking;
}

/**
 * @private
 * @returns the current global pathname with query params attached. This may change in the future to include the hostname from a predefined universal link, i.e. `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`
 */
export function useUnstableGlobalHref(): string {
  return useRouteInfo().unstable_globalHref;
}

export function useSegments() {
  return useRouteInfo().segments;
}

export function usePathname() {
  return useRouteInfo().pathname;
}

export function useSearchParams() {
  return useRouteInfo().params;
}

export function useLocalSearchParams<
  TParams extends SearchParams = SearchParams
>(): Partial<TParams> {
  return (useOptionalLocalRoute()?.params ?? ({} as any)) as Partial<TParams>;
}

function useOptionalLocalRoute<T extends RouteProp<ParamListBase>>(): T | undefined {
  const route = React.useContext(NavigationRouteContext);
  return route as T | undefined;
}
