import { createBrowserApp } from '@react-navigation/web';
import * as React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import ModulesProvider from './ModulesProvider';
import Select from './screens/SelectScreen';
import RunTests from './screens/TestScreen';

const AppNavigator = createStackNavigator(
  {
    Select,
    RunTests,
  },
  {
    headerMode: 'screen',
  }
);

CustomNavigator.path = 'test-suite';

function CustomNavigator(props) {
  return (
    <SafeAreaProvider>
      <ModulesProvider>
        <AppNavigator {...props} />
      </ModulesProvider>
    </SafeAreaProvider>
  );
}
CustomNavigator.router = AppNavigator.router;

const createApp = Platform.select({
  web: input => createBrowserApp(input, { history: 'hash' }),
  default: input => createAppContainer(input),
});

export default createApp(CustomNavigator);
