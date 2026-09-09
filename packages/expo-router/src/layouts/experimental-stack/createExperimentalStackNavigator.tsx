'use client';
import * as React from 'react';
import { useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';

import {
  CompositionContext,
  mergeOptions,
  useCompositionRegistry,
} from '../../fork/native-stack/composition-options';
import type { NavigatorContentProps } from '../../standard-navigation';
import { ExperimentalStackView } from './ExperimentalStackView';
import type {
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationOptions,
} from './types';

export interface ExperimentalStackNavigatorCreateProps {
  pop: (count: number, sourceRouteKey: string) => void;
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
  pop,
  subscribePopToTopOnParentTabPress,
}: ExperimentalStackNavigatorContentProps) {
  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = useMemo(
    () => mergeOptions(descriptors, registry, state),
    [descriptors, registry, state]
  );

  React.useEffect(() => subscribePopToTopOnParentTabPress(), [subscribePopToTopOnParentTabPress]);

  return (
    <CompositionContext value={contextValue}>
      <ExperimentalStackView
        state={state}
        emit={emitter.emit}
        pop={pop}
        descriptors={mergedDescriptors}
      />
    </CompositionContext>
  );
}

export const createStandardExperimentalStackNavigator = createStandardNavigator<
  ExperimentalStackNavigationOptions,
  StandardExperimentalStackNavigationEventMap,
  ExperimentalStackNavigatorCreateProps
>(ExperimentalStackNavigatorContent);
