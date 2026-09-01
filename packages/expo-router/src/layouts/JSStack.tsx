'use client';

import type { ComponentProps } from 'react';

import { getValidInitialRouteName, useRouteNode } from '../Route';
import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import type { StackNavigationEventMap, StackNavigationOptions } from '../react-navigation/stack';
import { createStackNavigator } from '../react-navigation/stack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import { withLayoutContext } from './withLayoutContext';

const JSStackNavigator = createStackNavigator().Navigator;

// TODO(@ubax): Update docs/pages/router/migrate/from-react-navigation.mdx:387 for the removed prop.
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
  (props: Omit<ComponentProps<typeof JSStack>, 'initialRouteName'>) => {
    const routeNode = useRouteNode();
    return <JSStack {...props} initialRouteName={getValidInitialRouteName(routeNode)} />;
  },
  {
    Screen,
    Protected,
  }
);

export { Stack };

export default Stack;
