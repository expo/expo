import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBrowserApp } from '@react-navigation/web';
import { Platform } from 'react-native';

import TestSuite from 'test-suite/AppNavigator';
import NativeComponentList from 'native-component-list/src/navigation/MainNavigators';

import Colors from './src/constants/Colors';

const MainNavigator = createBottomTabNavigator(
  {
    TestSuite: {
      screen: TestSuite,
      path: 'test-suite',
      navigationOptions: {
        tabBarIcon: ({ focused }: { focused: boolean }) => {
          const color = focused ? Colors.activeTintColor : Colors.inactiveTintColor;
          return <MaterialCommunityIcons name="format-list-checks" size={27} color={color} />;
        },
      },
    },
    ExpoApis: NativeComponentList.ExpoApis,
    ExpoComponents: NativeComponentList.ExpoComponents,
  },
  {
    initialRouteName: 'TestSuite',
    tabBarOptions: {
      labelStyle: {
        fontSize: 12,
      },
      activeTintColor: Colors.activeTintColor,
      inactiveTintColor: Colors.inactiveTintColor,
      safeAreaInset: {
        top: 5,
        right: 'always',
        bottom: 'always',
        left: 'always',
      },
    },
  }
);

const createApp = Platform.select({
  web: input => createBrowserApp(input, { history: 'hash' }),
  default: input => createAppContainer(input),
});

export default createApp(MainNavigator);
