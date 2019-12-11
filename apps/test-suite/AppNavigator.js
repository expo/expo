import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SelectScreen from './screens/SelectScreen';
import RunTests from './screens/TestScreen';

const AppNavigator = createStackNavigator(
  {
    Select: { screen: SelectScreen, path: 'select/:tests' },
    RunTests,
  },
  {
    headerMode: 'screen',
    transitionConfig: global.DETOX
      ? () => ({
          transitionSpec: {
            duration: 0,
          },
        })
      : undefined,
    defaultNavigationOptions: {
      headerStyle: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        boxShadow: undefined,
      },
    },
  }
);

function CustomNavigator(props) {
  return (
    <SafeAreaProvider>
      <AppNavigator {...props} />
    </SafeAreaProvider>
  );
}
CustomNavigator.router = AppNavigator.router;

export default CustomNavigator;
