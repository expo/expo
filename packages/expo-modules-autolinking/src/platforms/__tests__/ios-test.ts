import { formatArrayOfReactDelegateHandler, getSwiftModuleNames } from '../ios';

describe(formatArrayOfReactDelegateHandler, () => {
  it('should output empty array when no one specify `reactDelegateHandlers`', () => {
    const modules = [
      {
        packageName: 'expo-constants',
        packageVersion: '10.0.1',
        pods: [
          {
            podName: 'EXConstants',
            podspecDir: '/path/to/expo/packages/expo-constants/ios',
          },
        ],
        flags: { inhibit_warnings: false },
        modules: [],
        swiftModuleNames: [],
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
        pods: [
          {
            podName: 'EXConstants',
            podspecDir: '/path/to/expo/packages/expo-constants/ios',
          },
        ],
        flags: { inhibit_warnings: false },
        modules: [],
        swiftModuleNames: [],
        appDelegateSubscribers: [],
        reactDelegateHandlers: ['ConstantsReactDelegateHandler', 'ConstantsReactDelegateHandler2'],
      },
      {
        packageName: 'expo-device',
        packageVersion: '4.0.1',
        pods: [
          {
            podName: 'EXDevice',
            podspecDir: '/path/to/expo/packages/expo-device/ios',
          },
        ],
        flags: { inhibit_warnings: false },
        modules: [],
        swiftModuleNames: [],
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

describe(getSwiftModuleNames, () => {
  it('should use value from module config when it exists', () => {
    const pods = [{ podName: 'expotest', podspecDir: '/path/to/pod' }];
    expect(getSwiftModuleNames(pods, 'EXTest')).toEqual(['EXTest']);
    expect(getSwiftModuleNames(pods, undefined)).toEqual(['expotest']);
  });

  it('should replace non-alphanumeric values with _', () => {
    const pods = [{ podName: 'expo-test.2', podspecDir: '/path/to/pod' }];
    expect(getSwiftModuleNames(pods, undefined)).toEqual(['expo_test_2']);
  });
});
