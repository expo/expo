it(`web or node`, () => {
  const { Platform } = require('@unimodules/core');
  expect(Platform.OS).toBe('web');
  expect(Platform.OS).toMatchSnapshot();
});
