'use client';
import * as React from 'react';
import { createStandardNavigator } from 'standard-navigation';

import type { NavigatorContentProps } from '../../../standard-navigation';
import { type Route, useLocale } from '../../native';
import type {
  StackNavigationEventMap,
  StackDescriptorMap,
  StackNavigationConfig,
  StackNavigationOptions,
} from '../types';
import { StackView } from '../views/Stack/StackView';

export interface StackNavigatorCreateProps {
  pop: (count: number, sourceRouteKey: string) => void;
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
  pop,
  restoreRoute,
  subscribePopToTopOnParentTabPress,
  ...rest
}: StackNavigatorContentProps) {
  const { direction } = useLocale();

  React.useEffect(() => subscribePopToTopOnParentTabPress(), [subscribePopToTopOnParentTabPress]);

  if (state.routes.length === 0) {
    return null;
  }

  return (
    <StackView
      {...rest}
      direction={direction}
      state={state}
      // Standard descriptors have the same runtime shape as stack descriptors.
      descriptors={descriptors as unknown as StackDescriptorMap}
      emit={emitter.emit}
      pop={pop}
      restoreRoute={restoreRoute}
    />
  );
}

export const createStandardStackNavigator = createStandardNavigator<
  StackNavigationOptions,
  StandardStackNavigationEventMap,
  StackNavigatorCreateProps
>(StackNavigatorContent);
