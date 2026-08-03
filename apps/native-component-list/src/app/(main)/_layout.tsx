import { Drawer } from 'expo-router/drawer';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MainLayout() {
  const { width } = useWindowDimensions();
  const { left } = useSafeAreaInsets();
  const isMobile = width <= 640;
  const isTablet = !isMobile && width <= 960;
  const isLargeScreen = !isTablet && !isMobile;

  // Use native tabs on all except web desktop.
  // NOTE(brentvatne): if you navigate to an example screen and then resize your
  // browser such that the navigator changes from tab to drawer or drawer to tab
  // then it will reset to the list because the navigator has changed and the state
  // of its children will be reset.
  if (Platform.OS !== 'web' || isMobile) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="apis">
          <NativeTabs.Trigger.Icon sf="chevron.left.forwardslash.chevron.right" md="code" />
          <NativeTabs.Trigger.Label>APIs</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="components">
          <NativeTabs.Trigger.Icon sf="atom" md="widgets" />
          <NativeTabs.Trigger.Label>Components</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'permanent',
        drawerStyle: { width: isLargeScreen ? undefined : 64 + left },
        ...(isTablet ? { drawerLabel: () => null } : null),
      }}>
      <Drawer.Screen name="apis" options={{ title: 'APIs' }} />
      <Drawer.Screen name="components" options={{ title: 'Components' }} />
    </Drawer>
  );
}
