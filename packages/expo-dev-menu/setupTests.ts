import { cleanup } from '@testing-library/react-native';

afterEach(cleanup);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native/Libraries/Components/Switch/Switch', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const React = require('react');
  const MockSwitch = React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, onPress: props.onValueChange });
  });
  return {
    __esModule: true,
    default: MockSwitch,
  };
});

jest.mock('./app/native-modules/DevMenu');
jest.mock('./app/native-modules/DevLauncher');

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
