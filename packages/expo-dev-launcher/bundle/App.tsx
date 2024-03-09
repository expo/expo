import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  ExtensionsFilledIcon,
  HomeFilledIcon,
  InfoIcon,
  SettingsFilledIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Pressable, View } from 'react-native';

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
  const tabBarButton = (props: BottomTabBarButtonProps) => {
    const style: any = props.style ?? {};
    return (
      <Pressable
        {...props}
        style={({ pressed, focused }) => [style, { opacity: pressed || focused ? 0.6 : 1.0 }]}
      />
    );
  };
  return (
    <Tab.Navigator detachInactiveScreens={false}>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarButton,
          tabBarIcon: ({ focused }) => <SettingsFilledIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarButton,
          tabBarIcon: ({ focused }) => <HomeFilledIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ExtensionsStack"
        component={ExtensionsStack}
        options={{
          headerShown: false,
          tabBarButton,
          tabBarIcon: ({ focused }) => <ExtensionsFilledIcon focused={focused} />,
          title: 'Extensions',
        }}
      />
      {__DEV__ && (
        <Tab.Screen
          name="Kitchen Sink"
          component={KitchenSinkScreen}
          options={{
            headerShown: false,
            tabBarButton,
            tabBarIcon: () => <InfoIcon />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};
