import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../../common/ThemeProvider';
import {
  AppIntentsNavigationProvider,
  AppIntentsNavigationHandler,
  navigateToInitialAppScreen,
  navigateToAppIntentScreen,
  type AppIntentNavigationTarget,
} from '../screens/AppIntents/AppIntentsNavigationHandler';
import RedirectScreen from '../screens/RedirectScreen';
import SearchScreen from '../screens/SearchScreen';
import MainNavigators from './MainNavigators';
import MainTabNavigator from './MainTabNavigator';

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
  const navigationRef = React.useRef<NavigationContainerRef<object>>(null);
  const [isNavigationReady, setNavigationReady] = React.useState(false);
  const navigateToAppIntent = React.useCallback((target: AppIntentNavigationTarget) => {
    return navigateToAppIntentScreen(navigationRef.current, target);
  }, []);
  const navigateToInitialScreen = React.useCallback(() => {
    return navigateToInitialAppScreen(navigationRef.current);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        fallback={<Text>Loading…</Text>}
        onReady={() => setNavigationReady(true)}
        theme={themeName === 'dark' ? DarkTheme : DefaultTheme}>
        <AppIntentsNavigationProvider navigateToInitialAppScreen={navigateToInitialScreen}>
          <AppIntentsNavigationHandler
            isNavigationReady={isNavigationReady}
            navigateToAppIntent={navigateToAppIntent}
          />
          <Switch.Navigator screenOptions={{ presentation: 'modal', headerShown: false }}>
            <Switch.Screen name="main" component={MainTabNavigator} />
            <Switch.Screen name="redirect" component={RedirectScreen} />
            <Switch.Screen name="searchNavigator" component={SearchScreen} />
          </Switch.Navigator>
        </AppIntentsNavigationProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
