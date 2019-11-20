it(`android only`, () => {
  const { Platform } = require('@unimodules/core');
  expect(Platform.OS).toBe('android');
  expect(Platform.OS).toMatchSnapshot();
});
