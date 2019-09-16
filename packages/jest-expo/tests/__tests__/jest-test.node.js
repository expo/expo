it(`node only`, () => {
  const { Platform } = require('@unimodules/core');
  expect(Platform.OS).toBe('web');
  expect(Platform.OS).toMatchSnapshot();
});
