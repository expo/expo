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
 * Creates the props required to integrate Expo Router's JavaScript stack navigator.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The JavaScript stack navigator props.
 */
export function createJSStackProps({
  dispatchSync,
  navigation,
  state,
}: Pick<
  StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>,
  'dispatchSync' | 'navigation' | 'state'
>): StackNavigatorCreateProps {
  return {
    ...createBaseStackProps({ dispatchSync, navigation, state }),
    restoreRoute: makeRestoreRouteAction(dispatchSync, state),
  };
}

/**
 * @deprecated Use `createJSStackProps` instead.
 */
export const unstable_createPropsForJSStack = createJSStackProps;

// TODO(@ubax): Update docs/pages/router/migrate/from-react-navigation.mdx:387 for the removed prop.
const JSStack = unstable_integrateWithRouter<
  StackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardStackNavigationEventMap,
  StackNavigationConfig,
  object,
  StackNavigatorCreateProps
>(unstable_createStandardStackNavigator, StackRouter, {
  createProps: createJSStackProps,
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
