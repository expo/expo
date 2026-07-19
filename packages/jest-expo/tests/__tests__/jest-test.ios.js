it(`ios only`, () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toBe('ios');
  expect(Platform.OS).toMatchSnapshot();
});
