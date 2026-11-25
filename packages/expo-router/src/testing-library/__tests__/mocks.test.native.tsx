// `react-native-gesture-handler` reads `react-native-reanimated` at import time to build its
// Reanimated-backed gesture detectors. If the testing-library mocks leave Reanimated (or the
// `react-native-worklets` module it depends on) in a broken state, every suite that renders a
// Drawer or JS stack fails at import with "Cannot read properties of undefined".
it('lets react-native-gesture-handler load under the testing-library mocks', () => {
  expect(() => require('react-native-gesture-handler')).not.toThrow();
});
