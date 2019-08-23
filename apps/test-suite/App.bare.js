import { createStackNavigator } from 'react-navigation';

import SelectScreen from './screens/SelectScreen';
import RunTests from './screens/TestScreen';

const MainNavigator = createStackNavigator(
  {
    Select: { screen: SelectScreen },
    RunTests: { screen: RunTests, path: 'select/:tests' },
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
