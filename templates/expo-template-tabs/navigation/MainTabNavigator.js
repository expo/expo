import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import LinksScreen from '../screens/LinksScreen';
import SettingsScreen from '../screens/SettingsScreen';

const HomeStack = createStackNavigator({
  Home: HomeScreen,
});

const components = [
  {
    component: HomeScreen,
    icon: 'information-circle',
    tabBarLabel: 'Home',

  },
  {
    component: LinksScreen,
    icon: 'link',
    tabBarLabel: 'Links',

  },
  {
    component: SettingsScreen,
    icon: 'options',
    tabBarLabel: 'Settings',

  },

]
const stacks = {}
components.forEach((item) => {
  let stack = createStackNavigator({
    [item.tabBarLabel]: item.component,
  })
  stack.navigationOptions = {
    tabBarLabel: item.tabBarLabel,
    tabBarIcon: ({ focused }) => (
      <TabBarIcon
        focused={focused}
        name={
          Platform.OS === 'ios'
            ? `ios-${item.icon}`
            : `md-${item.icon}`
        }
      />
    )
  }
  stacks[item.tabBarLabel] = stack
})

export default createBottomTabNavigator(stacks);
