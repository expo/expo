/*
 * Optionally enable @testing-library/jest-native/extend-expect. We use this internally for the `toBeOnTheScreen` matcher()
 */
try {
  require('@testing-library/jest-native/extend-expect');
} catch {}

try {
  require('react-native-gesture-handler/jestSetup');
} catch {}

// include this section and the NativeAnimatedHelper section for mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
  try {
    const Reanimated = require('react-native-reanimated/mock');

    // The mock for `call` immediately calls the callback which is incorrect
    // So we override it with a no-op
    Reanimated.default.call = () => {};

    return Reanimated;
  } catch {
    return {};
  }
});

jest.mock('expo-linking', () => {
  const module: typeof import('expo-linking') = {
    ...jest.requireActual('expo-linking'),
    createURL(path: string) {
      return 'yourscheme://' + path;
    },
    resolveScheme() {
      return 'yourscheme';
    },
    addEventListener() {
      return { remove() {} } as any;
    },
  };

  return module;
});
