import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as React from 'react';

import { ThemeProvider, useTheme } from '../common/ThemeProvider';
import { TestStackNavigator } from './TestStackNavigator';
import { routeNames } from './constants/routeNames';

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      [routeNames.select]: '',
      [routeNames.run]: routeNames.run,
    },
  },
};

function AppContent() {
  const { name: themeName } = useTheme();
  return (
    <NavigationContainer linking={linking} theme={themeName === 'dark' ? DarkTheme : DefaultTheme}>
      <TestStackNavigator />
    </NavigationContainer>
  );
}

export default () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);
