import React from 'react';
import { NavigationNavigator } from 'react-navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function SafeAreaNavigationWrapper(InnerNavigator: NavigationNavigator) {
  function CustomNavigator(props: object) {
    return (
      <SafeAreaProvider>
        <InnerNavigator {...props} />
      </SafeAreaProvider>
    );
  }

  CustomNavigator.router = InnerNavigator.router;

  return CustomNavigator;
}
