import * as React from 'react';

import { createStackNavigator } from 'react-navigation-stack';
import ModulesProvider from './ModulesProvider';

import Select from './screens/SelectScreen';
import RunTests from './screens/TestScreen';

RunTests.path = 'select/:tests';

const AppNavigator = createStackNavigator(
  {
    select: Select,
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

CustomNavigator.path = 'test-suite';

function CustomNavigator(props) {
  return (
    <ModulesProvider>
      <AppNavigator {...props} />
    </ModulesProvider>
  );
}
CustomNavigator.router = AppNavigator.router;

export default CustomNavigator;
