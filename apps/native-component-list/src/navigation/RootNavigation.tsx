import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import MainNavigators from './MainNavigators';
import MainTabNavigator from './MainTabNavigator';
import RedirectScreen from '../screens/RedirectScreen';
import SearchScreen from '../screens/SearchScreen';

const Switch = createStackNavigator();

export const linking: LinkingOptions<object> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      main: {
        initialRouteName: 'apis',
        screens: {
          apis: MainNavigators.apis.linking,
          components: MainNavigators.components.linking,
        },
      },
      search: {
        screens: {
          search: 'search',
        },
      },
    },
  },
};

export default function RootNavigation() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer linking={linking} fallback={<Text>Loading…</Text>}>
        <Switch.Navigator screenOptions={{ presentation: 'modal', headerShown: false }}>
          <Switch.Screen name="main" component={MainTabNavigator} />
          <Switch.Screen name="redirect" component={RedirectScreen} />
          <Switch.Screen
            name="searchNavigator"
            component={SearchScreen}
            options={{ cardStyle: { backgroundColor: 'transparent' } }}
          />
        </Switch.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
