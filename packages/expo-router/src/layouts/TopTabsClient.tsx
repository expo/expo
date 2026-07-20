'use client';

import type { ComponentProps } from 'react';

import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '../react-navigation/material-top-tabs';
import { createMaterialTopTabNavigator } from '../react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import { attachPreloadHrefs } from './preloadHref';
import { withLayoutContext } from './withLayoutContext';

const MaterialTopTabNavigator = createMaterialTopTabNavigator().Navigator;

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof MaterialTopTabNavigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(MaterialTopTabNavigator, attachPreloadHrefs);

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
