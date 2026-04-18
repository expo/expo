'use client';
import * as React from 'react';
import { use } from 'react';
import { NavigationContext } from './NavigationContext';
import { FocusedRouteKeyContext, IsFocusedContext } from './useIsFocused';
/**
 * Context which holds the route prop for a screen.
 */
export const NavigationRouteContext = React.createContext(undefined);
/**
 * Component to provide the navigation and route contexts to its children.
 */
export const NamedRouteContextListContext = React.createContext(undefined);
export function NavigationProvider({ route, navigation, children }) {
    const parentIsFocused = use(IsFocusedContext);
    const focusedRouteKey = use(FocusedRouteKeyContext);
    // Mark route as focused only if:
    // - It doesn't have a parent navigator
    // - Parent navigator is focused
    const isFocused = parentIsFocused == null || parentIsFocused ? focusedRouteKey === route.key : false;
    return (<NavigationRouteContext.Provider value={route}>
      <NavigationContext.Provider value={navigation}>
        <IsFocusedContext.Provider value={isFocused}>{children}</IsFocusedContext.Provider>
      </NavigationContext.Provider>
    </NavigationRouteContext.Provider>);
}
//# sourceMappingURL=NavigationProvider.js.map