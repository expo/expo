'use client';
import * as React from 'react';
import { createStandardNavigator } from 'standard-navigation';

import type { NavigatorContentProps } from '../../../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../../../standard-navigation/subscribePopToTopOnParentTabPress';
import {
  createNavigatorFactory,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type TypedNavigator,
  useLocale,
  useNavigationBuilder,
} from '../../native';
import type {
  StackNavigationEventMap,
  StackDescriptorMap,
  StackNavigationConfig,
  StackNavigationHelpers,
  StackNavigationOptions,
  StackNavigationProp,
  StackNavigatorProps,
} from '../types';
import { StackView } from '../views/Stack/StackView';

export interface StackNavigatorCreateProps {
  navigation: StackNavigationHelpers;
  stackState: StackNavigationState<ParamListBase>;
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
  stackState,
  descriptors,
  navigation,
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
      state={stackState}
      descriptors={descriptors as unknown as StackDescriptorMap}
      navigation={navigation}
    />
  );
}

const LegacyStackNavigatorContent = StackNavigatorContent as React.ComponentType<
  Omit<StackNavigatorContentProps, 'actions' | 'emitter'>
>;

function StackNavigator({
  id,
  initialRouteName,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: StackNavigatorProps) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    StackNavigationOptions,
    StackNavigationEventMap
  >(StackRouter, {
    id,
    initialRouteName,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  return (
    <NavigationContent>
      <LegacyStackNavigatorContent
        {...rest}
        // Standard-navigation state carries the same runtime shape as the builder state.
        state={state as unknown as StackNavigatorContentProps['state']}
        stackState={state}
        descriptors={descriptors}
        navigation={navigation}
        subscribePopToTopOnParentTabPress={() =>
          subscribePopToTopOnParentTabPress(navigation, state)
        }
      />
    </NavigationContent>
  );
}

export const createStandardStackNavigator = createStandardNavigator<
  StackNavigationOptions,
  StandardStackNavigationEventMap,
  StackNavigatorCreateProps
>(StackNavigatorContent);

export function createStackNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: StackNavigationOptions;
    EventMap: StackNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: StackNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof StackNavigator;
  },
>(): TypedNavigator<TypeBag> {
  return createNavigatorFactory(StackNavigator)();
}
