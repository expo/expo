import { cleanup } from '@testing-library/react-native';

afterEach(cleanup);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('./bundle/DevLauncherInternal');
jest.mock('./bundle/DevMenu');

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
    useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0 }),
  };
});
