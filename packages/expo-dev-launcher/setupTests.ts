import { cleanup } from '@testing-library/react-native';

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
});

afterEach(cleanup);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

jest.mock('react-native/Libraries/Components/Switch/Switch', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const React = require('react');
  function MockSwitch(props) {
    return React.createElement(View, { ...props, onPress: props.onValueChange });
  }

  // workaround to be compatible with modern `Switch` in RN 0.66 which has ESM export
  // Use `return { default: MockSwitch };` when we drop support for SDK 44
  MockSwitch.default = MockSwitch;

  return MockSwitch;
});

jest.mock('./bundle/native-modules/DevLauncherInternal');
jest.mock('./bundle/native-modules/DevLauncherAuth');
jest.mock('./bundle/native-modules/DevMenuPreferences');
jest.mock('./bundle/providers/QueryProvider');

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

jest.mock('@react-navigation/native', () => {
  const actualRequire = jest.requireActual('@react-navigation/native');
  return {
    ...actualRequire,
    useNavigation: jest.fn(),
  };
});
