try {
  require('react-native-gesture-handler/jestSetup');
} catch {}

try {
  require('react-native-reanimated');
  jest.mock('react-native-reanimated', () => {
    try {
      const Reanimated = require('react-native-reanimated/mock');
      Reanimated.default.call = () => {}; // Override `call` with a no-op if needed
      return Reanimated;
    } catch {
      return {};
    }
  });
} catch {}

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
