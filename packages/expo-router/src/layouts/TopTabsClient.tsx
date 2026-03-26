'use client';

import React, { ComponentProps } from 'react';

import { withLayoutContext } from './withLayoutContext';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '../react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '../react-navigation/native';
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
