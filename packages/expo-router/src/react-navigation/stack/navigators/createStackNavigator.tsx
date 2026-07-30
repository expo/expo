'use client';
import * as React from 'react';

import {
  createNavigatorFactory,
  type EventArg,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  StackActions,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type TypedNavigator,
  useLocale,
  useNavigationBuilder,
  useStateForRouteNamesChange,
} from '../../native';
import type {
  StackNavigationEventMap,
  StackNavigationOptions,
  StackNavigationProp,
  StackNavigatorProps,
} from '../types';
import { StackView } from '../views/Stack/StackView';

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
  const { direction } = useLocale();

  const {
    state: builderState,
    descriptors,
    navigation,
    NavigationContent,
    routeNames,
  } = useNavigationBuilder<
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

  // Reconcile the state when the declared route names change (e.g. HMR); the view receives the
  // filtered display state while the `ROUTE_NAMES_CHANGED` dispatch commits.
  const state = useStateForRouteNamesChange({ state: builderState, routeNames, navigation });

  React.useEffect(
    () =>
      // @ts-expect-error: there may not be a tab navigator in parent
      navigation.addListener?.('tabPress', (e) => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (
            state.index > 0 &&
            isFocused &&
            !(e as unknown as EventArg<'tabPress', true>).defaultPrevented
          ) {
            // When user taps on already focused tab and we're inside the tab,
            // reset the stack to replicate native behaviour
            navigation.dispatch({
              ...StackActions.popToTop(),
              target: state.key,
            });
          }
        });
      }),
    [navigation, state.index, state.key]
  );

  return (
    <NavigationContent>
      <StackView
        {...rest}
        direction={direction}
        state={state}
        descriptors={descriptors}
        navigation={navigation}
      />
    </NavigationContent>
  );
}

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
