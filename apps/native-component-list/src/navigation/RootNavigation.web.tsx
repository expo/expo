import React from 'react';
import { createBrowserApp } from '@react-navigation/web';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainTabNavigator from './MainTabNavigator';

function CustomNavigator(props: any) {
  return (
    <SafeAreaProvider>
      <MainTabNavigator {...props} />
    </SafeAreaProvider>
  );
}
CustomNavigator.router = MainTabNavigator.router;

export default createBrowserApp(CustomNavigator, { history: 'hash' });
