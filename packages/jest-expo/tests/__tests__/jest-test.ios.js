it(`ios only`, () => {
  const { Platform } = require('@unimodules/core');
  expect(Platform.OS).toBe('ios');
  expect(Platform.OS).toMatchSnapshot();
});
