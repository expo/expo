import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import MainNavigators from './MainNavigators';
import MainTabNavigator from './MainTabNavigator';
import { useTheme } from '../../../common/ThemeProvider';
import RedirectScreen from '../screens/RedirectScreen';
import SearchScreen from '../screens/SearchScreen';

const Switch = createNativeStackNavigator();

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
  const { name: themeName } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        linking={linking}
        fallback={<Text>Loading…</Text>}
        theme={themeName === 'dark' ? DarkTheme : DefaultTheme}>
        <Switch.Navigator screenOptions={{ presentation: 'modal', headerShown: false }}>
          <Switch.Screen name="main" component={MainTabNavigator} />
          <Switch.Screen name="redirect" component={RedirectScreen} />
          <Switch.Screen name="searchNavigator" component={SearchScreen} />
        </Switch.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
