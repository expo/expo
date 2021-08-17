it(`android only`, () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toBe('android');
  expect(Platform.OS).toMatchSnapshot();
});
