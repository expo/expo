import React from 'react';

import TabIcon from '../components/TabIcon';
import ExpoApisStackNavigator from './ExpoApisStackNavigator';
import ExpoComponentsStackNavigator from './ExpoComponentsStackNavigator';
import ReactNativeCoreStackNavigator from './ReactNativeCoreStackNavigator';

// @tsapeta: These navigators are being used by `bare-expo` app,
// so make sure they still work there once you change something here.

const ExpoApis = {
  screen: ExpoApisStackNavigator,
  path: 'apis',
  navigationOptions: {
    title: 'Expo APIs',
    tabBarLabel: 'APIs',
    tabBarIcon: ({ focused }: { focused: boolean }) => {
      return <TabIcon name="exponent-box" focused={focused} />;
    },
  },
};

const ExpoComponents = {
  screen: ExpoComponentsStackNavigator,
  path: 'components',
  navigationOptions: {
    title: 'Expo Components',
    tabBarLabel: 'Components',
    tabBarIcon: ({ focused }: { focused: boolean }) => {
      return <TabIcon name="cards-playing-outline" focused={focused} />;
    },
  },
};

const ReactNativeCore = {
  screen: ReactNativeCoreStackNavigator,
  path: 'react-native',
  navigationOptions: {
    title: 'React Native Core',
    tabBarLabel: 'React Native',
    tabBarIcon: ({ focused }: { focused: boolean }) => {
      return <TabIcon name="react" focused={focused} />;
    },
  },
};

export default {
  ExpoApis,
  ExpoComponents,
  ReactNativeCore,
};
