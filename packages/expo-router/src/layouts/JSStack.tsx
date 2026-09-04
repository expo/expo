'use client';

import type { ComponentProps } from 'react';

import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import { StackRouter } from '../react-navigation/native';
import { makePopAction } from '../react-navigation/native-stack';
import {
  createStandardStackNavigator,
  type StackNavigationOptions,
} from '../react-navigation/stack';
import type {
  StackNavigatorCreateProps,
  StandardStackNavigationEventMap,
} from '../react-navigation/stack/navigators/createStackNavigator';
import type { StackNavigationConfig } from '../react-navigation/stack/types';
import { makeRestoreRouteAction } from '../react-navigation/stack/utils/makeRestoreRouteAction';
import { unstable_integrateWithRouter } from '../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../standard-navigation/subscribePopToTopOnParentTabPress';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';

export * from '../react-navigation/stack';

// TODO(@ubax): Update docs/pages/router/migrate/from-react-navigation.mdx:387 for the removed prop.
const JSStack = unstable_integrateWithRouter<
  StackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardStackNavigationEventMap,
  StackNavigationConfig,
  object,
  StackNavigatorCreateProps
>(createStandardStackNavigator, StackRouter, {
  createProps: ({ dispatchSync, navigation, state }) => ({
    pop: makePopAction(dispatchSync, state.key),
    restoreRoute: makeRestoreRouteAction(dispatchSync, state),
    subscribePopToTopOnParentTabPress: () => subscribePopToTopOnParentTabPress(navigation, state),
  }),
});

/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign(
  (props: Omit<ComponentProps<typeof JSStack>, 'initialRouteName'>) => <JSStack {...props} />,
  {
    Screen,
    Protected,
  }
);

export { Stack };

export default Stack;
