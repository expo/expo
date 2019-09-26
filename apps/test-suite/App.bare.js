import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';

import SelectScreen from './screens/SelectScreen';
import RunTests from './screens/TestScreen';

const MainNavigator = createStackNavigator(
  {
    Select: { screen: SelectScreen, path: 'select/:tests' },
    RunTests,
  },
  {
    headerMode: 'screen',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
  }
);

export default MainNavigator;
