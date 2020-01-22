import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createBrowserApp } from '@react-navigation/web';
import { Platform } from 'react-native';

import TestSuite from 'test-suite/AppNavigator';

// import NativeComponentList from '../native-component-list/App';

const MainNavigator = createSwitchNavigator(
  {
    TestSuite: { screen: TestSuite, path: 'test-suite' },
    // NativeComponentList: { screen: NativeComponentList, path: 'native-component-list' },
  }
);

const createApp = Platform.select({
  web: (input) => createBrowserApp(input, { history: 'hash' }),
  default: input => createAppContainer(input),
});

export default createApp(MainNavigator);
