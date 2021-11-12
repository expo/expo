import { HomeFilledIcon, SettingsFilledIcon } from '@expo/styleguide-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import { AppProviders } from './components/AppProviders';
import { AccountSelectorScreen } from './screens/AccountSelectorScreen';
import { AuthenticationScreen } from './screens/AuthenticationScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type LauncherAppProps = {
  isSimulator?: boolean;
};

export function App(props: LauncherAppProps) {
  return (
    <AppProviders>
      <Stack.Navigator initialRouteName="Authentication Screen">
        <Stack.Screen name="Main" component={Main} options={{ header: () => null }} />

        <Stack.Screen
          name="Select Account"
          component={AccountSelectorScreen}
          options={{ presentation: 'modal', header: () => null }}
        />

        <Stack.Screen
          name="Authentication"
          component={AuthenticationScreen}
          options={{ presentation: 'modal', header: () => null }}
        />
      </Stack.Navigator>
    </AppProviders>
  );
}

const Main = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        header: () => null,
        tabBarIcon: HomeFilledIcon,
        tabBarIconStyle: { transform: [{ scale: 0.85 }] },
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        header: () => null,
        tabBarIcon: SettingsFilledIcon,
        tabBarIconStyle: { transform: [{ scale: 0.85 }] },
      }}
    />
  </Tab.Navigator>
);
