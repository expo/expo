const mockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');
Object.defineProperty(mockNativeModules.UIManager, `RCTView`, {
  get: () => ({
    NativeProps: {},
    directEventTypes: [],
  }),
});
