it(`secondary file testing`, () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toMatchSnapshot();
});
