'use client';
import * as React from 'react';
import { createStandardNavigator } from 'standard-navigation';

import { useClearGuardedRoutes } from '../../../layouts/useClearGuardedRoutes';
import type { NavigatorContentProps, StandardNavigator } from '../../../standard-navigation/types';
import { type Route, useLocale } from '../../native';
import type {
  StackNavigationEventMap,
  StackNavigationConfig,
  StackNavigationOptions,
} from '../types';
import { StackView } from '../views/Stack/StackView';

export interface StackNavigatorCreateProps {
  isPreloaded: (key: string) => boolean;
  isRemovalPrevented: (key: string) => boolean;
  pop: (count: number, sourceRouteKey: string) => void;
  removeRoutes: (routeNames: string[]) => void;
  restoreRoute: (route: Route<string>) => boolean;
  subscribePopToTopOnParentTabPress: () => (() => void) | undefined;
}

export type StandardStackNavigationEventMap = {
  [Event in keyof StackNavigationEventMap]: StackNavigationEventMap[Event] & {
    canPreventDefault: false;
  };
};

type StackNavigatorContentProps = NavigatorContentProps<
  StackNavigationOptions,
  StandardStackNavigationEventMap,
  StackNavigationConfig,
  StackNavigatorCreateProps
>;

function StackNavigatorContent({
  state,
  descriptors,
  emitter,
  isPreloaded,
  isRemovalPrevented: _isRemovalPrevented,
  pop,
  removeRoutes,
  restoreRoute,
  subscribePopToTopOnParentTabPress,
  ...rest
}: StackNavigatorContentProps) {
  const { direction } = useLocale();

  useClearGuardedRoutes(removeRoutes);
  React.useEffect(() => subscribePopToTopOnParentTabPress(), [subscribePopToTopOnParentTabPress]);

  if (state.routes.length === 0) {
    return null;
  }

  return (
    <StackView
      {...rest}
      direction={direction}
      state={state}
      descriptors={descriptors}
      emit={emitter.emit}
      isPreloaded={isPreloaded}
      pop={pop}
      restoreRoute={restoreRoute}
    />
  );
}

/**
 * Creates a JavaScript stack navigator compatible with `standard-navigation`.
 */
// An explicit `StandardNavigator` annotation keeps its type parameters in scope in the published
// declarations. The inferred return type prints `NavigatorOptions` and `NavigatorEventMap` unbound.
export const unstable_createStandardStackNavigator: StandardNavigator<
  StackNavigationOptions,
  StandardStackNavigationEventMap,
  StackNavigatorCreateProps
> = createStandardNavigator<
  StackNavigationOptions,
  StandardStackNavigationEventMap,
  StackNavigatorCreateProps
>(StackNavigatorContent);
