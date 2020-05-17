import { StyleSheet } from 'react-native';

import { Colors } from '../constants';
import Screens from './MainNavigators';
import createTabNavigator from './createTabNavigator';

const MainTabNavigator = createTabNavigator(Screens, {
  // @ts-ignore
  resetOnBlur: false,
  /* Below applies to material bottom tab navigator */
  activeTintColor: Colors.tabIconSelected,
  inactiveTintColor: Colors.tabIconDefault,
  shifting: true,
  barStyle: {
    backgroundColor: Colors.tabBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.tabIconDefault,
  },
  /* Below applies to bottom tab navigator */
  tabBarOptions: {
    style: {
      backgroundColor: Colors.tabBar,
    },
    activeTintColor: Colors.tabIconSelected,
    inactiveTintColor: Colors.tabIconDefault,
  },
});

export default MainTabNavigator;
