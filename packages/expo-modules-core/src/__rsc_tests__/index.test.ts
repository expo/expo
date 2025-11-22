// This test primarily ensures that the native code is correctly defined as optional when
// evaluating server code with a native platform target.
//
// Other tests like expo-linking will accidentally break and CI won't catch it otherwise.

const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = jest.fn(originalError);
  console.warn = jest.fn(originalWarn);
});
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

it('has platform defined', () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toBeDefined();

  expect(console.error).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
});
