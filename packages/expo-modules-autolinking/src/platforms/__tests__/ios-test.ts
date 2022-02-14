import { formatArrayOfReactDelegateHandler, getSwiftModuleName } from '../ios';

describe(formatArrayOfReactDelegateHandler, () => {
  it('should output empty array when no one specify `reactDelegateHandlers`', () => {
    const modules = [
      {
        packageName: 'expo-constants',
        packageVersion: '10.0.1',
        podName: 'EXConstants',
        podspecDir: '/path/to/expo/packages/expo-constants/ios',
        flags: { inhibit_warnings: false },
        modules: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: [],
      },
    ];
    expect(formatArrayOfReactDelegateHandler(modules)).toBe(`[
    ]`);
  });

  it('should output array of `(packageName, handler)` tuple', () => {
    const modules = [
      {
        packageName: 'expo-constants',
        packageVersion: '10.0.1',
        podName: 'EXConstants',
        podspecDir: '/path/to/expo/packages/expo-constants/ios',
        flags: { inhibit_warnings: false },
        modules: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: ['ConstantsReactDelegateHandler', 'ConstantsReactDelegateHandler2'],
      },
      {
        packageName: 'expo-device',
        packageVersion: '4.0.1',
        podName: 'EXDevice',
        podspecDir: '/path/to/expo/packages/expo-device/ios',
        flags: { inhibit_warnings: false },
        modules: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: ['DeviceReactDelegateHandler'],
      },
    ];
    expect(formatArrayOfReactDelegateHandler(modules)).toBe(`[
      (packageName: "expo-constants", handler: ConstantsReactDelegateHandler.self),
      (packageName: "expo-constants", handler: ConstantsReactDelegateHandler2.self),
      (packageName: "expo-device", handler: DeviceReactDelegateHandler.self)
    ]`);
  });
});

describe(getSwiftModuleName, () => {
  it('should use value from module config when it exists', () => {
    expect(getSwiftModuleName('expotest', 'EXTest')).toBe('EXTest');
    expect(getSwiftModuleName('expotest', null)).toBe('expotest');
    expect(getSwiftModuleName('expotest')).toBe('expotest');
  });

  it('should replace non-alphanumeric values with _', () => {
    expect(getSwiftModuleName('expo-test.2')).toBe('expo_test_2');
  });
});
