import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import * as React from 'react';
import { Platform, ScrollViewProps, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../constants';
import Screens from './MainNavigators';
import createTabNavigator from './createTabNavigator';

const Tab = createTabNavigator();

const Drawer = createDrawerNavigator();

function CustomDrawerContent({
  hideLabels,
  ...props
}: ScrollViewProps & {
  children?: React.ReactNode;
  hideLabels?: boolean;
} & DrawerContentComponentProps<DrawerContentOptions>) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} labelStyle={hideLabels ? { display: 'none' } : undefined} />
    </DrawerContentScrollView>
  );
}

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
        tabBarOptions={{
          style: {
            backgroundColor: Colors.tabBar,
          },
          activeTintColor: Colors.tabIconSelected,
          inactiveTintColor: Colors.tabIconDefault,
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
      drawerContent={(props) => <CustomDrawerContent {...props} hideLabels={isTablet} />}
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
