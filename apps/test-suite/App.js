import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as React from 'react';

import { TestStackNavigator } from './TestStackNavigator';
import { ThemeProvider } from '../common/ThemeProvider';
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

export default () => (
  <ThemeProvider>
    <NavigationContainer linking={linking}>
      <TestStackNavigator />
    </NavigationContainer>
  </ThemeProvider>
);
