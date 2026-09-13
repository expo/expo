'use client';

import type { ComponentProps, ComponentType } from 'react';

import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import { StackRouter } from '../react-navigation/native';
import { makePopAction } from '../react-navigation/native-stack/utils/makePopAction';
import {
  type StackNavigationConfig,
  type StackNavigatorCreateProps,
  type StackNavigationOptions,
  type StandardStackNavigationEventMap,
  unstable_createStandardStackNavigator,
} from '../react-navigation/stack';
import { makeRestoreRouteAction } from '../react-navigation/stack/utils/makeRestoreRouteAction';
import { unstable_integrateWithRouter } from '../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../standard-navigation/subscribePopToTopOnParentTabPress';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';

export * from '../react-navigation/stack';

/**
 * Creates the adapter props required to integrate the JavaScript stack with Expo Router.
 */
export function unstable_createPropsForJSStack({
  dispatch,
  dispatchSync,
  navigation,
  state,
}: StandardNavigatorCreatePropsFactoryDeps<
  StackNavigationState<ParamListBase>
>): StackNavigatorCreateProps {
  return {
    pop: makePopAction(dispatchSync, state.key),
    removeRoutes: (routeNames) => dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
    restoreRoute: makeRestoreRouteAction(dispatchSync, state),
    subscribePopToTopOnParentTabPress: () => subscribePopToTopOnParentTabPress(navigation, state),
  };
}

// TODO(@ubax): Update docs/pages/router/migrate/from-react-navigation.mdx:387 for the removed prop.
const JSStack = unstable_integrateWithRouter<
  StackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardStackNavigationEventMap,
  StackNavigationConfig,
  object,
  StackNavigatorCreateProps
>(unstable_createStandardStackNavigator, StackRouter, {
  activityDefaultThreshold: 2,
  createProps: unstable_createPropsForJSStack,
});

/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign(
  // `initialRouteName` is configured from the route node by the integration, not by layout props.
  JSStack as ComponentType<Omit<ComponentProps<typeof JSStack>, 'initialRouteName'>>,
  {
    Screen,
    Protected,
  }
);

export { Stack };

export default Stack;
