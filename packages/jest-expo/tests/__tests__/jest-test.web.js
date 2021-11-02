it(`web or node`, () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toBe('web');
  expect(Platform.OS).toMatchSnapshot();
});
