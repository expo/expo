import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import * as React from 'react';

import RedirectScreen from '../screens/RedirectScreen';
import MainTabNavigator from './MainTabNavigator';

const Switch = createStackNavigator();

export const linking = {
  prefixes: [Linking.makeUrl('/')],
  config: {
    main: {
      path: '',
      initialRouteName: 'ExpoApis',
      screens: {
        apis: {
          initialRouteName: 'ExpoApis',
          screens: {
            ExpoApis: '',
          },
        },
        components: {
          initialRouteName: 'ExpoComponents',
          screens: {
            ExpoComponents: '',
            GL: '/gl',
            SVG: '/svg',
            SVGExample: '/svg/example',
          },
        },
        'react-native': {
          screens: {
            ReactNativeCore: '',
          },
        },
      },
    },
  },
};

export default () => (
  <NavigationContainer linking={linking}>
    <Switch.Navigator headerMode="none">
      <Switch.Screen name="main" component={MainTabNavigator} />
      <Switch.Screen name="redirect" component={RedirectScreen} />
    </Switch.Navigator>
  </NavigationContainer>
);
