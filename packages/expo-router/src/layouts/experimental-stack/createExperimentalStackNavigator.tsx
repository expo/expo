'use client';
import * as React from 'react';
import { use, useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';

import {
  CompositionContext,
  mergeOptions,
  useCompositionRegistry,
} from '../../fork/native-stack/composition-options';
import { NavigationMetaContext } from '../../react-navigation/native';
import type { NavigatorContentProps } from '../../standard-navigation';
import { ExperimentalStackView } from './ExperimentalStackView';
import type {
  ExperimentalStackNavigationEventMap,
  ExperimentalStackDescriptorMap,
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigatorProps,
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
  Omit<ExperimentalStackNavigatorProps, 'children' | 'id' | 'initialRouteName'>,
  ExperimentalStackNavigatorCreateProps
>;

function ExperimentalStackNavigatorContent({
  state,
  descriptors,
  emitter,
  pop,
  subscribePopToTopOnParentTabPress,
  ...rest
}: ExperimentalStackNavigatorContentProps) {
  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = useMemo(
    () => mergeOptions(descriptors, registry, state),
    [descriptors, registry, state]
  );

  const meta = use(NavigationMetaContext);

  React.useEffect(() => {
    if (meta && 'type' in meta && meta.type === 'native-tabs') {
      // Inside native tabs, popToTop is handled natively.
      return;
    }
    return subscribePopToTopOnParentTabPress();
  }, [meta, subscribePopToTopOnParentTabPress]);

  return (
    <CompositionContext value={contextValue}>
      <ExperimentalStackView
        {...rest}
        state={state}
        emit={emitter.emit}
        pop={pop}
        // Standard descriptors have the same runtime shape as experimental stack descriptors.
        descriptors={mergedDescriptors as unknown as ExperimentalStackDescriptorMap}
      />
    </CompositionContext>
  );
}

export const createStandardExperimentalStackNavigator = createStandardNavigator<
  ExperimentalStackNavigationOptions,
  StandardExperimentalStackNavigationEventMap,
  ExperimentalStackNavigatorCreateProps
>(ExperimentalStackNavigatorContent);
