'use client';
import * as React from 'react';
import { use, useMemo } from 'react';

import { ExperimentalStackView } from './ExperimentalStackView';
import type {
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationProp,
  ExperimentalStackNavigatorProps,
} from './types';
import {
  CompositionContext,
  mergeOptions,
  useCompositionRegistry,
} from '../../fork/native-stack/composition-options';
import type { NativeStackDescriptorMap } from '../../fork/native-stack/descriptors-context';
import {
  createNavigatorFactory,
  type EventArg,
  NavigationMetaContext,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  StackActions,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type StaticConfig,
  type TypedNavigator,
  useNavigationBuilder,
} from '../../react-navigation/native';

function ExperimentalStackNavigator({
  id,
  initialRouteName,
  UNSTABLE_routeNamesChangeBehavior,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: ExperimentalStackNavigatorProps) {
  const { state, describe, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    ExperimentalStackNavigationOptions,
    ExperimentalStackNavigationEventMap
  >(StackRouter, {
    id,
    initialRouteName,
    UNSTABLE_routeNamesChangeBehavior,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = useMemo(
    // TODO(@ubax): implement properly when more stack options are available
    () => mergeOptions(descriptors as NativeStackDescriptorMap, registry, state),
    [descriptors, registry, state]
  );

  const meta = use(NavigationMetaContext);

  React.useEffect(() => {
    if (meta && 'type' in meta && meta.type === 'native-tabs') {
      // Inside native tabs, popToTop is handled natively.
      return;
    }

    // @ts-expect-error: there may not be a tab navigator in parent
    return navigation?.addListener?.('tabPress', (e: any) => {
      const isFocused = navigation.isFocused();

      requestAnimationFrame(() => {
        if (state.index > 0 && isFocused && !(e as EventArg<'tabPress', true>).defaultPrevented) {
          navigation.dispatch({
            ...StackActions.popToTop(),
            target: state.key,
          });
        }
      });
    });
  }, [meta, navigation, state.index, state.key]);

  return (
    <NavigationContent>
      <CompositionContext value={contextValue}>
        <ExperimentalStackView
          {...rest}
          state={state}
          navigation={navigation}
          descriptors={mergedDescriptors}
          describe={describe}
        />
      </CompositionContext>
    </NavigationContent>
  );
}

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
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(ExperimentalStackNavigator)(config);
}
