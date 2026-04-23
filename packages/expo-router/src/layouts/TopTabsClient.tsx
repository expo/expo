'use client';

import type { ComponentProps } from 'react';

import { withLayoutContext } from './withLayoutContext';
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '../react-navigation/material-top-tabs';
import { createMaterialTopTabNavigator } from '../react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';

const MaterialTopTabNavigator = createMaterialTopTabNavigator().Navigator;

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof MaterialTopTabNavigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(MaterialTopTabNavigator);

/**
 * Renders a material top tab navigator.
 *
 * @hideType
 */
const TopTabs = Object.assign(
  (props: ComponentProps<typeof MaterialTopTabs>) => {
    return <MaterialTopTabs {...props} />;
  },
  {
    Screen,
    Protected,
  }
);

export { TopTabs };

export default TopTabs;
