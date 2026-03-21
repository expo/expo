try {
  require('react-native-gesture-handler/jestSetup');
} catch {}

try {
  require.resolve('react-native-worklets/src/mock');
  jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
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
