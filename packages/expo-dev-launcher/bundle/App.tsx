import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  ExtensionsFilledIcon,
  HomeFilledIcon,
  SettingsFilledIcon,
  View,
} from 'expo-dev-client-components';
import * as React from 'react';

import { LoadInitialData } from './components/LoadInitialData';
import { Splash } from './components/Splash';
import { AppProviders } from './providers/AppProviders';
import { CrashReportScreen } from './screens/CrashReportScreen';
import { EASUpdatesBranchScreen } from './screens/EASUpdatesBranchScreen';
import { EASUpdatesScreen } from './screens/EASUpdatesScreen';
import { ExtensionsScreen } from './screens/ExtensionsScreen';
import { HomeScreen } from './screens/HomeScreen';
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
        <View style={{ height: props.insets.top }} bg="default" />
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

const ExtensionsStack = createStackNavigator();

function Extensions() {
  return (
    <ExtensionsStack.Navigator>
      <ExtensionsStack.Screen
        name="Extensions"
        component={ExtensionsScreen}
        options={{ header: () => null }}
      />
      <ExtensionsStack.Screen
        name="EASUpdates"
        options={{ headerTitle: 'EAS Update' }}
        component={EASUpdatesScreen}
      />
      <ExtensionsStack.Screen
        name="Branch"
        options={{ headerTitle: 'Branch' }}
        component={EASUpdatesBranchScreen}
      />
    </ExtensionsStack.Navigator>
  );
}

const Main = () => {
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
      {__DEV__ && (
        <Tab.Screen
          name="Extensions"
          component={Extensions}
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
    </Tab.Navigator>
  );
};
