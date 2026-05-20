// This test primarily ensures that the native code is correctly defined as optional when
// evaluating server code with a native platform target.
//
// Other tests like expo-linking will accidentally break and CI won't catch it otherwise.

let errorSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeAll(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

it('has platform defined', () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toBeDefined();

  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
});
