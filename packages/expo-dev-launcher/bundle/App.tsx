import { HomeFilledIcon, SettingsFilledIcon } from '@expo/styleguide-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import { AppProviders } from './components/redesign/AppProviders';
import { getLocalPackagersAsync } from './functions/getLocalPackagersAsync';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type LauncherAppProps = {
  isSimulator?: boolean;
};

async function startupScript() {
  await getLocalPackagersAsync();
}

export function App(props: LauncherAppProps) {
  return (
    <AppProviders startupScript={startupScript}>
      <Stack.Navigator initialRouteName="Authentication Screen">
        <Stack.Screen name="Main" component={Main} options={{ header: () => null }} />

        <Stack.Screen
          name="User Profile"
          component={UserProfileScreen}
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
