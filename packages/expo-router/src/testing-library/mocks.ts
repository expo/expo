// The mocks below go into Jest's module registry, so they only run under Jest.
// Other test runners bring their own equivalents for these libraries, and without
// the guard importing this module throws `jest is not defined` before any of the
// testing-library API can be used.
if (typeof jest !== 'undefined') {
  try {
    require('react-native-gesture-handler/jestSetup');
  } catch {}

  // `react-native-reanimated/mock` imports the real Reanimated entry point, which loads
  // `react-native-worklets`. Its native module throws when constructed under Jest, so mock worklets
  // first with the mock the package ships. Otherwise the fallback below returns an empty object and
  // `react-native-gesture-handler` crashes reading `default.createAnimatedComponent` from it.
  try {
    require.resolve('react-native-worklets');
    jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
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
}
