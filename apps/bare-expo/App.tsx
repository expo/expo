import React from 'react';
import { createStackNavigator, createAppContainer } from 'react-navigation';

import { View } from 'react-native';
import { createProxy, startAsync } from './relapse/client';

import TestSuite from '../test-suite/App.bare';
// import NativeComponentList from '../native-component-list/App';

if (process.env.DETOX) {
  // @ts-ignore
  global.device = createProxy('device');
  // @ts-ignore
  global.detox = createProxy('detox');
  global.console = createProxy('console');
  // @ts-ignore
  global.expoRunner = createProxy('expoRunner');
  // @ts-ignore
  global.expoErrorDelegate = createProxy('expoErrorDelegate');
}

const MainNavigator = createStackNavigator(
  {
    None: View,
    TestSuite: { screen: TestSuite, path: 'test-suite' },
    // NativeComponentList: { screen: NativeComponentList, path: 'native-component-list' },
  },
  {
    initialRouteName: process.env.DETOX ? undefined : 'TestSuite',
    headerMode: 'none',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
  }
);

const App = createAppContainer(MainNavigator);

export default function Main() {
  if (process.env.DETOX) {
    React.useEffect(() => {
      startAsync();

      return () => stop();
    }, []);
  }

  return <App uriPrefix={'bareexpo://'} />;
}
