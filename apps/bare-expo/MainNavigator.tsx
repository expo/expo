import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBrowserApp } from '@react-navigation/web';
import React from 'react';
import { Platform } from 'react-native';
import {
  createAppContainer,
  createSwitchNavigator,
  NavigationRouteConfigMap,
} from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import TestSuite from 'test-suite/AppNavigator';
import Colors from './src/constants/Colors';

type RoutesConfig = {
  TestSuite: NavigationRouteConfigMap;
  ExpoApis?: NavigationRouteConfigMap;
  ExpoComponents?: NavigationRouteConfigMap;
};

type NativeComponentListExportsType = null | {
  [routeName: string]: NavigationRouteConfigMap;
};

function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const routes: RoutesConfig = {
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
};

// We'd like to get rid of `native-component-list` being a part of the final bundle.
// Otherwise, some tests may fail due to timeouts (bundling takes significantly more time).
// See `babel.config.js` and `moduleResolvers/nullResolver.js` for more details.
const NativeComponentList: NativeComponentListExportsType = optionalRequire(() =>
  require('native-component-list/src/navigation/MainNavigators')
) as any;
const Redirect = optionalRequire(() =>
  require('native-component-list/src/screens/RedirectScreen')
) as any;

if (NativeComponentList) {
  routes.ExpoApis = NativeComponentList.ExpoApis;
  routes.ExpoComponents = NativeComponentList.ExpoComponents;
}

const MainNavigator = createBottomTabNavigator(routes, {
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
});

const switchRoutes: Record<string, any> = {
  main: { screen: MainNavigator, path: '' },
};

if (Redirect) {
  switchRoutes.redirect = Redirect;
}

const SwitchRedirectNavigator = createSwitchNavigator(switchRoutes);

const createApp = Platform.select({
  web: input => createBrowserApp(input),
  default: input => createAppContainer(input),
});

export default createApp(SwitchRedirectNavigator);
