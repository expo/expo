import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import { registerGlobMock } from '../../__tests__/mockHelpers';
import {
  formatArrayOfReactDelegateHandler,
  getSwiftModuleNames,
  resolveExtraBuildDependenciesAsync,
  resolveModuleAsync,
} from '../apple';

jest.mock('fast-glob');
jest.mock('fs-extra');

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
        debugOnly: false,
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
        debugOnly: false,
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
        debugOnly: false,
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
    expect(getSwiftModuleNames(pods, ['EXTest'])).toEqual(['EXTest']);
    expect(getSwiftModuleNames(pods, undefined)).toEqual(['expotest']);
  });

  it('should replace non-alphanumeric values with _', () => {
    const pods = [{ podName: 'expo-test.2', podspecDir: '/path/to/pod' }];
    expect(getSwiftModuleNames(pods, undefined)).toEqual(['expo_test_2']);
  });
});

describe(resolveModuleAsync, () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const expoRoot = path.join(__dirname, '..', '..', '..', '..', '..');

  it('should resolve podspec in ios/ folder', async () => {
    const name = 'react-native-third-party';
    const podName = 'RNThirdParty';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(glob, [`ios/${podName}.podspec`], pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['ios'] }),
      },
      { searchPaths: [expoRoot], platform: 'ios' }
    );
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      pods: [
        {
          podName: 'RNThirdParty',
          podspecDir: 'node_modules/react-native-third-party/ios',
        },
      ],
      swiftModuleNames: ['RNThirdParty'],
      flags: undefined,
      modules: [],
      appDelegateSubscribers: [],
      reactDelegateHandlers: [],
      debugOnly: false,
    });
  });

  it('should resolve multiple podspecs', async () => {
    const name = 'react-native-third-party';
    const podName = 'RNThirdParty';
    const podName2 = 'RNThirdParty2';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(glob, [`ios/${podName}.podspec`, `pod2/${podName2}.podspec`], pkgDir);

    const result = await resolveModuleAsync(
      name,
      {
        path: pkgDir,
        version: '0.0.1',
        config: new ExpoModuleConfig({ platforms: ['ios'] }),
      },
      { searchPaths: [expoRoot], platform: 'ios' }
    );
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      pods: [
        {
          podName: 'RNThirdParty',
          podspecDir: 'node_modules/react-native-third-party/ios',
        },
        {
          podName: 'RNThirdParty2',
          podspecDir: 'node_modules/react-native-third-party/pod2',
        },
      ],
      swiftModuleNames: ['RNThirdParty', 'RNThirdParty2'],
      flags: undefined,
      modules: [],
      appDelegateSubscribers: [],
      reactDelegateHandlers: [],
      debugOnly: false,
    });
  });
});

describe(resolveExtraBuildDependenciesAsync, () => {
  let mockFsReadFile;

  beforeEach(() => {
    jest.resetAllMocks();
    mockFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
  });

  it('should resolve extra build dependencies from Podfile.properties.json', async () => {
    mockFsReadFile.mockResolvedValueOnce(`{
"apple.extraPods": "[{\\"name\\":\\"test\\"}]"
}`);
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/ios');
    expect(extraBuildDeps).toEqual([{ name: 'test' }]);
  });

  it('should return null for invalid JSON', async () => {
    mockFsReadFile.mockResolvedValueOnce(`{
  "apple.extraPods": [{ name }]
}`);
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/ios');
    expect(extraBuildDeps).toBe(null);
  });

  it('should return null if no speicifed any properties', async () => {
    mockFsReadFile.mockResolvedValueOnce(``);
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/ios');
    expect(extraBuildDeps).toBe(null);
  });

  it('should return null if Podfile.properties.json not found', async () => {
    mockFsReadFile.mockRejectedValueOnce(new Error('File not found'));
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/macos');
    expect(extraBuildDeps).toBe(null);
  });
});
