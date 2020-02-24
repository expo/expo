import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Platform } from 'react-native';
import SelectScreen from './screens/SelectScreen';
import RunTests from './screens/TestScreen';
import Colors from './constants/Colors';

// @tsapeta: This navigator is also being used by `bare-expo` app,
// so make sure it still works there once you change something here.

const AppNavigator = createStackNavigator(
  {
    Select: { screen: SelectScreen, path: 'select/:tests?' },
    RunTests: { screen: RunTests, path: '' },
  },
  {
    initialRouteName: 'Select',
    headerMode: Platform.select({ web: 'screen', default: undefined }),
    transitionConfig: global.DETOX
      ? () => ({
          transitionSpec: {
            duration: 0,
          },
        })
      : undefined,
    defaultNavigationOptions: {
      headerBackTitle: 'Select',
      headerTitleStyle: {
        color: 'black',
      },
      headerTintColor: Colors.tintColor,
      headerStyle: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        boxShadow: '',
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
