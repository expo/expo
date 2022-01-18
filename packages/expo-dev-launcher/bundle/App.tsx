import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeFilledIcon, SettingsFilledIcon } from 'expo-dev-client-components';
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
  <Tab.Navigator screenOptions={{ tabBarHideOnKeyboard: true }}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        header: () => null,
        tabBarIcon: ({ focused }) => <HomeFilledIcon focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        header: () => null,
        tabBarIcon: ({ focused }) => <SettingsFilledIcon focused={focused} />,
      }}
    />
  </Tab.Navigator>
);
