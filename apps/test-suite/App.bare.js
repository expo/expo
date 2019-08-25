import * as React from 'react';

import { createStackNavigator, createAppContainer } from 'react-navigation';
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
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
  }
);
AppNavigator.path = 'test-suite';

const MainNavigator = createStackNavigator(
  {
    TestSuite: AppNavigator,
  },
  {
    headerMode: 'none',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
  }
);

const App = createAppContainer(MainNavigator);

export default props => (
  <ModulesProvider>
    <App uriPrefix="bareexpo://" {...props} />
  </ModulesProvider>
);
