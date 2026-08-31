'use client';
import * as React from 'react';

import type { ParamListBase, Route } from '../routers';
import { NavigationContext } from './NavigationContext';
import type { NavigationProp } from './types';
import { IsFocusedContext, useIsRouteFocused } from './useIsFocused';

/**
 * Context which holds the route prop for a screen.
 */
export const NavigationRouteContext = React.createContext<Route<string> | undefined>(undefined);

type Props = {
  route: Route<string>;
  navigation: NavigationProp<ParamListBase>;
  children: React.ReactNode;
};

/**
 * Component to provide the navigation and route contexts to its children.
 */
export const NamedRouteContextListContext = React.createContext<
  Record<string, React.Context<Route<string>>> | undefined
>(undefined);

export function NavigationProvider({ route, navigation, children }: Props) {
  const isFocused = useIsRouteFocused(route.key);

  return (
    <NavigationRouteContext.Provider value={route}>
      <NavigationContext.Provider value={navigation}>
        <IsFocusedContext.Provider value={isFocused}>{children}</IsFocusedContext.Provider>
      </NavigationContext.Provider>
    </NavigationRouteContext.Provider>
  );
}
