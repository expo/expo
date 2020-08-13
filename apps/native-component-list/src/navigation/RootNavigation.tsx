import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { Text } from 'react-native';

import RedirectScreen from '../screens/RedirectScreen';
import MainNavigators from './MainNavigators';
import MainTabNavigator from './MainTabNavigator';

const Switch = createStackNavigator();

export const linking = {
  prefixes: [Linking.makeUrl('/')],
  config: {
    screens: {
      main: {
        initialRouteName: 'apis',
        screens: {
          apis: MainNavigators.apis.linking,
          components: MainNavigators.components.linking,
        },
      },
    },
  },
};

export default function RootNavigation() {
  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading…</Text>}>
      <Switch.Navigator headerMode="none">
        <Switch.Screen name="main" component={MainTabNavigator} />
        <Switch.Screen name="redirect" component={RedirectScreen} />
      </Switch.Navigator>
    </NavigationContainer>
  );
}
