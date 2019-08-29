import { createAppContainer, createStackNavigator } from 'react-navigation';

import TestSuite from '../test-suite/App.bare';

// import NativeComponentList from '../native-component-list/App';

const MainNavigator = createStackNavigator(
  {
    TestSuite: { screen: TestSuite, path: 'test-suite' },
    // NativeComponentList: { screen: NativeComponentList, path: 'native-component-list' },
  },
  {
    // @ts-ignore
    headerMode: 'none',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
  }
);

export default createAppContainer(MainNavigator);
