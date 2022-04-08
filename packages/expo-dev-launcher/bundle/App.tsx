import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  ExtensionsFilledIcon,
  HomeFilledIcon,
  InfoIcon,
  SettingsFilledIcon,
  View,
} from 'expo-dev-client-components';
import * as React from 'react';

import { LoadInitialData } from './components/LoadInitialData';
import { Splash } from './components/Splash';
import { AppProviders } from './providers/AppProviders';
import { useUser } from './providers/UserContextProvider';
import { CrashReportScreen } from './screens/CrashReportScreen';
import { ExtensionsStack } from './screens/ExtensionsStack';
import { HomeScreen } from './screens/HomeScreen';
import { KitchenSinkScreen } from './screens/KitchenSinkScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type LauncherAppProps = {
  isSimulator?: boolean;
  insets: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
};

export function App(props: LauncherAppProps) {
  return (
    <LoadInitialData loader={<Splash />}>
      <AppProviders>
        {/* TODO -- remove this when safe area context provider is vendored */}
        <View style={{ height: props.insets?.top || 10 }} bg="default" />
        <Stack.Navigator initialRouteName="Main" mode="modal">
          <Stack.Screen name="Main" component={Main} options={{ header: () => null }} />

          <Stack.Screen
            name="User Profile"
            component={UserProfileScreen}
            options={{ header: () => null }}
          />

          <Stack.Screen name="Crash Report" component={CrashReportScreen} />
        </Stack.Navigator>
      </AppProviders>
    </LoadInitialData>
  );
}

const Main = () => {
  const { userData } = useUser();
  const showExtensionsStack = userData?.isExpoAdmin || __DEV__;

  return (
    <Tab.Navigator screenOptions={{ tabBarHideOnKeyboard: true }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          header: () => null,
          tabBarIcon: ({ focused }) => <HomeFilledIcon focused={focused} />,
        }}
      />
      {showExtensionsStack && (
        <Tab.Screen
          name="Extensions"
          component={ExtensionsStack}
          options={{
            header: () => null,
            tabBarIcon: ({ focused }) => <ExtensionsFilledIcon focused={focused} />,
          }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          header: () => null,
          tabBarIcon: ({ focused }) => <SettingsFilledIcon focused={focused} />,
        }}
      />
      {__DEV__ && (
        <Tab.Screen
          name="Kitchen Sink"
          component={KitchenSinkScreen}
          options={{
            header: () => null,
            tabBarIcon: () => <InfoIcon />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};
