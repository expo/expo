'use client';

import type { ComponentProps } from 'react';

import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import { StackRouter } from '../react-navigation/native';
import {
  createStandardStackNavigator,
  type StackNavigationOptions,
} from '../react-navigation/stack';
import type { StandardStackNavigationEventMap } from '../react-navigation/stack/navigators/createStackNavigator';
import type {
  StackNavigationConfig,
  StackNavigationHelpers,
} from '../react-navigation/stack/types';
import { unstable_integrateWithRouter } from '../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../standard-navigation/subscribePopToTopOnParentTabPress';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
const JSStack = unstable_integrateWithRouter<
  StackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardStackNavigationEventMap,
  StackNavigationConfig,
  object,
  {
    navigation: StackNavigationHelpers;
    stackState: StackNavigationState<ParamListBase>;
    subscribePopToTopOnParentTabPress: () => (() => void) | undefined;
  }
>(createStandardStackNavigator, StackRouter, {
  createProps: ({ navigation, state }) => ({
    // `useNavigationBuilder` returns base helpers, while StackView needs stack helpers at runtime.
    navigation: navigation as StackNavigationHelpers,
    stackState: state,
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
