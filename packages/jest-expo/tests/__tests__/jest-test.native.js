it(`native only`, () => {
  const { Platform } = require('@unimodules/core');
  expect(['ios', 'android'].includes(Platform.OS)).toBe(true);
  expect(Platform.OS).toMatchSnapshot();
});
