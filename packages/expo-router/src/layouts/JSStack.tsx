'use client';

import type { ComponentProps, ComponentType } from 'react';

import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import { StackRouter } from '../react-navigation/native';
import {
  type StackNavigationConfig,
  type StackNavigatorCreateProps,
  type StackNavigationOptions,
  type StandardStackNavigationEventMap,
  unstable_createStandardStackNavigator,
} from '../react-navigation/stack';
import { makeRestoreRouteAction } from '../react-navigation/stack/utils/makeRestoreRouteAction';
import { unstable_integrateWithRouter } from '../standard-navigation';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import { createBaseStackProps } from './stack-utils/createBaseStackProps';

export * from '../react-navigation/stack';

/**
 * Creates the adapter props required to integrate the JavaScript stack with Expo Router.
 */
export function unstable_createPropsForJSStack(
  args: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>
): StackNavigatorCreateProps {
  return {
    ...createBaseStackProps(args),
    removeRoutes: (routeNames) => args.dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
    restoreRoute: makeRestoreRouteAction(args.dispatchSync, args.state),
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
