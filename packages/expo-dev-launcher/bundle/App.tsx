import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  ExtensionsFilledIcon,
  HomeFilledIcon,
  InfoIcon,
  SettingsFilledIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { View } from 'react-native';

import { LoadInitialData } from './components/LoadInitialData';
import { Splash } from './components/Splash';
import { AppProviders } from './providers/AppProviders';
import { CrashReportScreen } from './screens/CrashReportScreen';
import { ExtensionsStack } from './screens/ExtensionsStack';
import { HomeScreen } from './screens/HomeScreen';
import { KitchenSinkScreen } from './screens/KitchenSinkScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type LauncherAppProps = object;

export function App(props: LauncherAppProps) {
  return (
    <View style={{ direction: 'ltr', flex: 1 }}>
      <LoadInitialData loader={<Splash />}>
        <AppProviders>
          <Stack.Navigator
            initialRouteName="Main"
            screenOptions={{ presentation: 'modal', gestureEnabled: false }}
            detachInactiveScreens={false}>
            <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />

            <Stack.Screen
              name="User Profile"
              component={UserProfileScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen name="Crash Report" component={CrashReportScreen} />
          </Stack.Navigator>
        </AppProviders>
      </LoadInitialData>
    </View>
  );
}

const Main = () => {
  return (
    <Tab.Navigator detachInactiveScreens={false}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <HomeFilledIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ExtensionsStack"
        component={ExtensionsStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <ExtensionsFilledIcon focused={focused} />,
          title: 'Extensions',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <SettingsFilledIcon focused={focused} />,
        }}
      />
      {__DEV__ && (
        <Tab.Screen
          name="Kitchen Sink"
          component={KitchenSinkScreen}
          options={{
            headerShown: false,
            tabBarIcon: () => <InfoIcon />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};
