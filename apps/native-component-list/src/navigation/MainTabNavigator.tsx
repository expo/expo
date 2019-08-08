import React from 'react';
import { StyleSheet } from 'react-native';

import TabIcon from '../components/TabIcon';
import { Colors, Layout } from '../constants';
import createTabNavigator from './createTabNavigator';
import ExpoApisStackNavigator from './ExpoApisStackNavigator';
import ExpoComponentsStackNavigator from './ExpoComponentsStackNavigator';
import ReactNativeCoreStackNavigator from './ReactNativeCoreStackNavigator';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
  },
});

// @ts-ignore
ExpoApisStackNavigator.path = 'API';
ExpoApisStackNavigator.navigationOptions = {
  title: 'Expo API',
};

// @ts-ignore
ExpoComponentsStackNavigator.path = 'Components';
ExpoComponentsStackNavigator.navigationOptions = {
  title: 'Expo Components',
};

// @ts-ignore
ReactNativeCoreStackNavigator.path = 'ReactNative';
ReactNativeCoreStackNavigator.navigationOptions = {
  title: 'React Native Core',
};

const MainTabNavigator = createTabNavigator(
  {
    ExpoApis: ExpoApisStackNavigator,
    ExpoComponents: ExpoComponentsStackNavigator,
    ReactNativeCore: ReactNativeCoreStackNavigator,
  },
  {
    defaultNavigationOptions: ({ navigation }) => {
      let tabBarLabel;
      const { routeName } = navigation.state;
      if (routeName === 'ReactNativeCore') {
        tabBarLabel = Layout.isSmallDevice ? 'RN Core' : 'React Native Core';
      } else if (routeName === 'ExpoComponents') {
        tabBarLabel = Layout.isSmallDevice ? 'Components' : 'Expo Components';
      } else if (routeName === 'ExpoApis') {
        tabBarLabel = Layout.isSmallDevice ? 'APIs' : 'Expo APIs';
      }

      return {
        header: null,
        tabBarLabel,
        tabBarIcon: ({ focused }: { focused: boolean }) => {
          const { routeName } = navigation.state;
          switch (routeName) {
            case 'ReactNativeCore':
              return <TabIcon name="react" focused={focused} />;
            case 'ExpoComponents':
              return <TabIcon name="cards-playing-outline" focused={focused} />;
            case 'ExpoApis':
            default:
              return <TabIcon name="exponent-box" focused={focused} />;
          }
        },
      };
    },
    // @ts-ignore
    resetOnBlur: true,
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
      style: styles.tabBar,
      activeTintColor: Colors.tabIconSelected,
      inactiveTintColor: Colors.tabIconDefault,
    },
  }
);

// @ts-ignore
MainTabNavigator.path = '';
MainTabNavigator.navigationOptions = {
  title: 'Native Component List',
};

export default MainTabNavigator;
