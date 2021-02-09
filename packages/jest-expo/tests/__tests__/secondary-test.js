it(`secondary file testing`, () => {
  const { Platform } = require('@unimodules/core');
  expect(Platform.OS).toMatchSnapshot();
});
