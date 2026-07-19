it(`native only`, () => {
  const { Platform } = require('expo-modules-core');
  expect(['ios', 'android'].includes(Platform.OS)).toBe(true);
  expect(Platform.OS).toMatchSnapshot();
});
