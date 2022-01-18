import { cleanup } from '@testing-library/react-native';
import 'react-native-gesture-handler/jestSetup';

afterEach(cleanup);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});


jest.mock('react-native/Libraries/Components/Switch/Switch.js', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const React = require('react');
  function MockSwitch(props) {
    return React.createElement(View, { ...props, onPress: props.onValueChange });
  }

  return MockSwitch;
});

jest.mock('./bundle/native-modules/DevLauncherInternal');
jest.mock('./bundle/native-modules/DevMenuInternal');
jest.mock('./bundle/native-modules/DevMenuWebBrowser');
jest.mock('./bundle/native-modules/DevMenu');

const MOCK_INITIAL_METRICS = {
  frame: {
    width: 320,
    height: 640,
    x: 0,
    y: 0,
  },
  insets: {
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
};

jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: jest.fn().mockReturnValue(MOCK_INITIAL_METRICS.insets),
  };
});
