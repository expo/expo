'use client';
import * as React from 'react';

import { NavigationSyncStateContext } from '../../global-state/storeContext';
import { NavigationContext } from './NavigationContext';
import { NavigationIndependentTreeContext } from './NavigationIndependentTreeContext';
import { NavigationRouteContext } from './NavigationProvider';
import { IsFocusedContext } from './useIsFocused';

/**
 * Component to make the child navigation container independent of parent containers.
 */
export function NavigationIndependentTree({ children }: { children: React.ReactNode }) {
  return (
    // We need to clear any existing contexts for nested independent container to work correctly
    <NavigationRouteContext.Provider value={undefined}>
      <NavigationContext.Provider value={undefined}>
        <NavigationSyncStateContext.Provider value={null}>
          <IsFocusedContext.Provider value={undefined}>
            <NavigationIndependentTreeContext.Provider value>
              {children}
            </NavigationIndependentTreeContext.Provider>
          </IsFocusedContext.Provider>
        </NavigationSyncStateContext.Provider>
      </NavigationContext.Provider>
    </NavigationRouteContext.Provider>
  );
}
