import { HomeFilledIcon, SettingsFilledIcon } from '@expo/styleguide-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import { AppProviders } from './components/redesign/AppProviders';
import { LoadInitialData } from './components/redesign/LoadInitialData';
import { Splash } from './components/redesign/Splash';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type LauncherAppProps = {
  isSimulator?: boolean;
};

export function App(props: LauncherAppProps) {
  return (
    <LoadInitialData loader={<Splash />}>
      <AppProviders>
        <Stack.Navigator initialRouteName="Main" mode="modal">
          <Stack.Screen name="Main" component={Main} options={{ header: () => null }} />

          <Stack.Screen
            name="User Profile"
            component={UserProfileScreen}
            options={{ header: () => null }}
          />
        </Stack.Navigator>
      </AppProviders>
    </LoadInitialData>
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
