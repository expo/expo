'use client';

import React, { ComponentProps } from 'react';

import { withLayoutContext } from './withLayoutContext';
import { ParamListBase, StackNavigationState } from '../react-navigation/native';
import {
  createStackNavigator,
  StackNavigationEventMap,
  StackNavigationOptions,
} from '../react-navigation/stack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';

const JSStackNavigator = createStackNavigator().Navigator;

const JSStack = withLayoutContext<
  StackNavigationOptions,
  typeof JSStackNavigator,
  StackNavigationState<ParamListBase>,
  StackNavigationEventMap
>(JSStackNavigator);

/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign(
  (props: ComponentProps<typeof JSStack>) => {
    return <JSStack {...props} />;
  },
  {
    Screen,
    Protected,
  }
);

export { Stack };

export default Stack;
