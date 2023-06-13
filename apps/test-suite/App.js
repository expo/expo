import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as React from 'react';

import AppNavigator from './AppNavigator';

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      select: '',
      run: 'run',
    },
  },
};
export default () => (
  <NavigationContainer linking={linking}>
    <AppNavigator />
  </NavigationContainer>
);
