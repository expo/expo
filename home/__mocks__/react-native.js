const RN = jest.requireActual('react-native');
Object.defineProperty(RN.NativeModules, 'ExponentKernel', {
  configurable: true,
  enumerable: true,
  get: () => ({
    getSessionAsync: jest.fn(),
    setSessionAsync: jest.fn(),
  }),
});

module.exports = RN;
