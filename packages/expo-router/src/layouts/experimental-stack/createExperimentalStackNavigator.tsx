'use client';
import * as React from 'react';
import { use, useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';

import { getValidInitialRouteName, useRouteNode } from '../../Route';
import {
  CompositionContext,
  mergeOptions,
  useCompositionRegistry,
} from '../../fork/native-stack/composition-options';
import {
  createNavigatorFactory,
  NavigationMetaContext,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type TypedNavigator,
  useNavigationBuilder,
} from '../../react-navigation/native';
import type { NavigatorContentProps } from '../../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../../standard-navigation/subscribePopToTopOnParentTabPress';
import { ExperimentalStackView } from './ExperimentalStackView';
import type {
  ExperimentalStackNavigationEventMap,
  ExperimentalStackDescriptorMap,
  ExperimentalStackNavigationHelpers,
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationProp,
  ExperimentalStackNavigatorProps,
} from './types';

export interface ExperimentalStackNavigatorCreateProps {
  navigation: ExperimentalStackNavigationHelpers;
  stackState: StackNavigationState<ParamListBase>;
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
  stackState,
  descriptors,
  navigation,
  subscribePopToTopOnParentTabPress,
  ...rest
}: ExperimentalStackNavigatorContentProps) {
  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = useMemo(
    () => mergeOptions(descriptors, registry, stackState),
    [descriptors, registry, stackState]
  );

  const meta = use(NavigationMetaContext);

  React.useEffect(() => {
    if (meta && 'type' in meta && meta.type === 'native-tabs') {
      return;
    }
    return subscribePopToTopOnParentTabPress();
  }, [meta, subscribePopToTopOnParentTabPress]);

  return (
    <CompositionContext value={contextValue}>
      <ExperimentalStackView
        {...rest}
        state={stackState}
        navigation={navigation}
        descriptors={mergedDescriptors as unknown as ExperimentalStackDescriptorMap}
      />
    </CompositionContext>
  );
}

const LegacyExperimentalStackNavigatorContent =
  ExperimentalStackNavigatorContent as React.ComponentType<
    Omit<ExperimentalStackNavigatorContentProps, 'actions' | 'emitter'>
  >;

function ExperimentalStackNavigator({
  id,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: ExperimentalStackNavigatorProps) {
  const routeNode = useRouteNode();
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    ExperimentalStackNavigationOptions,
    ExperimentalStackNavigationEventMap
  >(StackRouter, {
    id,
    initialRouteName: getValidInitialRouteName(routeNode),
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  return (
    <NavigationContent>
      <LegacyExperimentalStackNavigatorContent
        {...rest}
        // Standard-navigation state carries the same runtime shape as the builder state.
        state={state as unknown as ExperimentalStackNavigatorContentProps['state']}
        stackState={state}
        // The builder creates the full event-emitting stack navigation object at runtime.
        navigation={navigation as unknown as ExperimentalStackNavigationHelpers}
        descriptors={descriptors}
        subscribePopToTopOnParentTabPress={() =>
          subscribePopToTopOnParentTabPress(navigation, state)
        }
      />
    </NavigationContent>
  );
}

export const createStandardExperimentalStackNavigator = createStandardNavigator<
  ExperimentalStackNavigationOptions,
  StandardExperimentalStackNavigationEventMap,
  ExperimentalStackNavigatorCreateProps
>(ExperimentalStackNavigatorContent);

export function createExperimentalStackNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: ExperimentalStackNavigationOptions;
    EventMap: ExperimentalStackNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: ExperimentalStackNavigationProp<
        ParamList,
        RouteName,
        NavigatorID
      >;
    };
    Navigator: typeof ExperimentalStackNavigator;
  },
>(): TypedNavigator<TypeBag> {
  return createNavigatorFactory(ExperimentalStackNavigator)();
}
