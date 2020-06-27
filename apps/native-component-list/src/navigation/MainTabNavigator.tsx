import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Colors } from '../constants';
import Screens from './MainNavigators';
import createTabNavigator from './createTabNavigator';

const Tab = createTabNavigator();

export default () => (
  <Tab.Navigator
    shifting
    activeTintColor={Colors.tabIconSelected}
    inactiveTintColor={Colors.tabIconDefault}
    barStyle={{
      backgroundColor: Colors.tabBar,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.tabIconDefault,
    }}
    tabBarOptions={{
      style: {
        backgroundColor: Colors.tabBar,
      },
      activeTintColor: Colors.tabIconSelected,
      inactiveTintColor: Colors.tabIconDefault,
    }}>
    {Object.keys(Screens).map(name => (
      <Tab.Screen
        name={name}
        key={name}
        component={Screens[name].navigator}
        options={Screens[name].navigator.navigationOptions}
      />
    ))}
  </Tab.Navigator>
);
