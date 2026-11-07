'use client';
import * as React from 'react';
import { useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';

import {
  CompositionContext,
  mergeOptions,
  useCompositionRegistry,
} from '../../fork/native-stack/composition-options';
import type { NavigatorContentProps, StandardNavigator } from '../../standard-navigation/types';
import { useClearGuardedRoutes } from '../useClearGuardedRoutes';
import { ExperimentalStackView } from './ExperimentalStackView';
import type {
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationOptions,
} from './types';

export interface ExperimentalStackNavigatorCreateProps {
  isPreloaded: (key: string) => boolean;
  isRemovalPrevented: (key: string) => boolean;
  pop: (count: number, sourceRouteKey: string) => void;
  removeRoutes: (routeNames: string[]) => void;
  subscribePopToTopOnParentTabPress: () => (() => void) | undefined;
}

export type StandardExperimentalStackNavigationEventMap = {
  [Event in keyof ExperimentalStackNavigationEventMap]: ExperimentalStackNavigationEventMap[Event] & {
    canPreventDefault: false;
  };
};

type ExperimentalStackNavigatorContentProps = NavigatorContentProps<
  ExperimentalStackNavigationOptions,
  StandardExperimentalStackNavigationEventMap,
  object,
  ExperimentalStackNavigatorCreateProps
>;

function ExperimentalStackNavigatorContent({
  state,
  descriptors,
  emitter,
  isPreloaded,
  isRemovalPrevented,
  pop,
  removeRoutes,
  subscribePopToTopOnParentTabPress,
}: ExperimentalStackNavigatorContentProps) {
  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = useMemo(
    () => mergeOptions(descriptors, registry, state),
    [descriptors, registry, state]
  );

  useClearGuardedRoutes(removeRoutes);
  React.useEffect(() => subscribePopToTopOnParentTabPress(), [subscribePopToTopOnParentTabPress]);

  return (
    <CompositionContext value={contextValue}>
      <ExperimentalStackView
        state={state}
        emit={emitter.emit}
        isPreloaded={isPreloaded}
        isRemovalPrevented={isRemovalPrevented}
        pop={pop}
        descriptors={mergedDescriptors}
      />
    </CompositionContext>
  );
}

// An explicit `StandardNavigator` annotation keeps its type parameters in scope in the published
// declarations. The inferred return type prints `NavigatorOptions` and `NavigatorEventMap` unbound.
export const createStandardExperimentalStackNavigator: StandardNavigator<
  ExperimentalStackNavigationOptions,
  StandardExperimentalStackNavigationEventMap,
  ExperimentalStackNavigatorCreateProps
> = createStandardNavigator<
  ExperimentalStackNavigationOptions,
  StandardExperimentalStackNavigationEventMap,
  ExperimentalStackNavigatorCreateProps
>(ExperimentalStackNavigatorContent);
