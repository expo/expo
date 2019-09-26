import NativeModulesProxy from '../NativeModulesProxy';

jest.mock('react-native', () => {
  const ReactNative = require.requireActual('react-native');
  // Mock a natively defined test module
  ReactNative.NativeModules.NativeUnimoduleProxy.modulesConstants = {
    ExpoTest: { testConstant: 'test' },
  };
  ReactNative.NativeModules.NativeUnimoduleProxy.exportedMethods = {
    ...ReactNative.NativeModules.NativeUnimoduleProxy.exportedMethods,
    ExpoTest: [{ key: 0, name: 'testAsync', argumentsCount: 1 }],
  };
  return ReactNative;
});

it(`has an entry with each native module's constants and methods`, () => {
  expect(NativeModulesProxy).toHaveProperty('ExpoTest');
  expect(NativeModulesProxy.ExpoTest.testConstant).toBe('test');
  expect(typeof NativeModulesProxy.ExpoTest.testAsync).toBe('function');
});

it(`checks the number of arguments passed to bridged methods`, async () => {
  await expect(NativeModulesProxy.ExpoTest.testAsync('a')).resolves.not.toThrow();
  await expect(NativeModulesProxy.ExpoTest.testAsync()).rejects.toThrowErrorMatchingSnapshot();
  await expect(
    NativeModulesProxy.ExpoTest.testAsync('a', 'b')
  ).rejects.toThrowErrorMatchingSnapshot();
});

it(`defines event listener methods on native modules`, () => {
  expect(typeof NativeModulesProxy.ExpoTest.addListener).toBe('function');
  expect(typeof NativeModulesProxy.ExpoTest.removeListeners).toBe('function');
});
