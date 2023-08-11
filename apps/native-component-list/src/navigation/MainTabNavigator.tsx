import { createDrawerNavigator } from '@react-navigation/drawer';
import * as React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screens from './MainNavigators';
import createTabNavigator from './createTabNavigator';
import { Colors } from '../constants';

const Tab = createTabNavigator();

const Drawer = createDrawerNavigator();

export default function MainTabbedNavigator(props: any) {
  const { width } = useWindowDimensions();
  const { left } = useSafeAreaInsets();
  const isMobile = width <= 640;
  const isTablet = !isMobile && width <= 960;
  const isLargeScreen = !isTablet && !isMobile;

  // Use a tab bar on all except web desktop.
  // NOTE(brentvatne): if you navigate to an example screen and then resize your
  // browser such that the navigator changes from tab to drawer or drawer to tab
  // then it will reset to the list because the navigator has changed and the state
  // of its children will be reset.
  if (Platform.OS !== 'web' || isMobile) {
    return (
      <Tab.Navigator
        // @ts-ignore: Tab.Navigator can be either bottom-tabs navigator
        // or material-bottom-tabs navigator
        // material-bottom-tabs props
        shifting
        activeTintColor={Colors.tabIconSelected}
        inactiveTintColor={Colors.tabIconDefault}
        barStyle={{
          backgroundColor: Colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Colors.tabIconDefault,
        }}
        // bottom-tabs props
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.tabIconSelected,
          tabBarInactiveTintColor: Colors.tabIconDefault,
          tabBarStyle: [
            {
              backgroundColor: Colors.tabBar,
            },
          ],
        }}>
        {Object.entries(Screens).map(([name, Screen]) => (
          <Tab.Screen
            name={name}
            key={name}
            component={Screen.navigator}
            options={Screen.navigator.navigationOptions}
          />
        ))}
      </Tab.Navigator>
    );
  }

  return (
    <Drawer.Navigator
      {...props}
      screenOptions={
        isTablet
          ? {
              drawerLabel: () => null,
            }
          : {}
      }
      drawerStyle={{ width: isLargeScreen ? undefined : 64 + left }}
      drawerType="permanent">
      {Object.entries(Screens).map(([name, Screen]) => (
        <Tab.Screen
          name={name}
          key={name}
          component={Screen.navigator}
          options={Screen.navigator.navigationOptions}
        />
      ))}
    </Drawer.Navigator>
  );
}
