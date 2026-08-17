import { getConfig, getPackageJson } from '@expo/config';
import * as PackageManager from '@expo/package-manager';

import { getVersionedPackagesAsync } from '../../start/doctor/dependencies/getVersionedPackages';
import { applyPluginsAsync } from '../applyPlugins';
import { checkPackagesAsync } from '../checkPackages';
import { installAsync } from '../installAsync';
import { installExpoPackageAsync } from '../installExpoPackage';
import { checkPackagesCompatibility } from '../utils/checkPackagesCompatibility';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({ exp: { sdkVersion: '54.0.0' } })),
  getPackageJson: jest.fn(() => ({})),
}));

jest.mock('../../log');

jest.mock('../../start/doctor/dependencies/getVersionedPackages', () => ({
  getVersionedPackagesAsync: jest.fn(),
}));

jest.mock('../applyPlugins', () => ({
  applyPluginsAsync: jest.fn(),
}));

jest.mock('../checkPackages', () => ({
  checkPackagesAsync: jest.fn(),
}));

jest.mock('../installExpoPackage', () => ({
  installExpoPackageAsync: jest.fn(),
}));

jest.mock('../utils/checkPackagesCompatibility', () => ({
  checkPackagesCompatibility: jest.fn(),
}));

const projectRoot = '/path/to/project';
const packageManagerArguments = ['--ignore-scripts', '--strict-peer-dependencies=false'];

function createPackageManager() {
  return {
    name: 'pnpm',
    addAsync: jest.fn(),
    addDevAsync: jest.fn(),
  } as unknown as PackageManager.NodePackageManager;
}

describe(installAsync, () => {
  let packageManager: PackageManager.NodePackageManager;

  beforeEach(() => {
    packageManager = createPackageManager();
    jest.mocked(PackageManager.createForProject).mockReturnValue(packageManager);
    jest.mocked(getConfig).mockReturnValue({ exp: { sdkVersion: '54.0.0' } } as any);
    jest.mocked(getPackageJson).mockReturnValue({});
    jest.mocked(getVersionedPackagesAsync).mockResolvedValue({
      packages: ['expo-camera@~16.0.0', 'react-native-reanimated@~3.17.0'],
      messages: [],
      excludedNativeModules: [],
    });
  });

  it.each([
    ['--check', { check: true, fix: false }],
    ['--fix', { check: false, fix: true }],
  ] as const)(
    'delegates %s with the selected package manager and forwarded arguments',
    async (_flag, options) => {
      const packages = ['expo-camera', 'react-native-reanimated'];

      await installAsync(
        packages,
        { ...options, projectRoot, pnpm: true },
        packageManagerArguments
      );

      expect(checkPackagesAsync).toHaveBeenCalledWith(projectRoot, {
        packages,
        options: { ...options, projectRoot, pnpm: true },
        packageManager,
        packageManagerArguments,
      });
      expect(PackageManager.createForProject).toHaveBeenCalledWith(projectRoot, {
        npm: undefined,
        yarn: undefined,
        bun: undefined,
        pnpm: true,
        silent: undefined,
        log: expect.any(Function),
      });
      expect(getVersionedPackagesAsync).not.toHaveBeenCalled();
      expect(packageManager.addAsync).not.toHaveBeenCalled();
      expect(packageManager.addDevAsync).not.toHaveBeenCalled();
      expect(checkPackagesCompatibility).not.toHaveBeenCalled();
    }
  );

  it('installs resolved dependencies with forwarded package-manager arguments', async () => {
    await installAsync(
      ['expo-camera', 'react-native-reanimated'],
      { projectRoot, pnpm: true },
      packageManagerArguments
    );

    expect(getVersionedPackagesAsync).toHaveBeenCalledWith(projectRoot, {
      packages: ['expo-camera', 'react-native-reanimated'],
      sdkVersion: '54.0.0',
      pkg: {},
    });
    expect(packageManager.addAsync).toHaveBeenCalledWith([
      ...packageManagerArguments,
      'expo-camera@~16.0.0',
      'react-native-reanimated@~3.17.0',
    ]);
    expect(packageManager.addDevAsync).not.toHaveBeenCalled();
    expect(applyPluginsAsync).toHaveBeenCalledWith(projectRoot, [
      'expo-camera@~16.0.0',
      'react-native-reanimated@~3.17.0',
    ]);
  });

  it('keeps NODE_ENV when called internally', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await installAsync([], { projectRoot });

      expect(process.env.NODE_ENV).toBe('production');
    } finally {
      if (originalNodeEnv === undefined) {
        Reflect.deleteProperty(process.env, 'NODE_ENV');
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    }
  });

  it('installs a resolved Expo canary first and forwards --fix to the follow-up command', async () => {
    jest.mocked(getVersionedPackagesAsync).mockResolvedValueOnce({
      packages: ['expo@56.0.0-canary-20260810-abcd123'],
      messages: [],
      excludedNativeModules: [],
    });

    await installAsync(
      ['expo@canary'],
      { projectRoot, fix: true, pnpm: true },
      packageManagerArguments
    );

    expect(getVersionedPackagesAsync).toHaveBeenCalledWith(projectRoot, {
      packages: ['expo@canary'],
      sdkVersion: '54.0.0',
      pkg: {},
    });
    expect(installExpoPackageAsync).toHaveBeenCalledWith(projectRoot, {
      packageManager,
      packageManagerArguments,
      expoPackageToInstall: 'expo@56.0.0-canary-20260810-abcd123',
      followUpCommandArgs: ['--fix'],
    });
    expect(checkPackagesAsync).not.toHaveBeenCalled();
    expect(packageManager.addAsync).not.toHaveBeenCalled();
    expect(packageManager.addDevAsync).not.toHaveBeenCalled();
    expect(applyPluginsAsync).not.toHaveBeenCalled();
  });

  describe('with EXPO_NO_DEPENDENCY_VALIDATION enabled', () => {
    let originalNoDependencyValidation: string | undefined;

    beforeEach(() => {
      originalNoDependencyValidation = process.env.EXPO_NO_DEPENDENCY_VALIDATION;
      process.env.EXPO_NO_DEPENDENCY_VALIDATION = '1';
    });

    afterEach(() => {
      if (originalNoDependencyValidation === undefined) {
        delete process.env.EXPO_NO_DEPENDENCY_VALIDATION;
      } else {
        process.env.EXPO_NO_DEPENDENCY_VALIDATION = originalNoDependencyValidation;
      }
    });

    it('skips automatic compatibility checking but still versions and installs packages', async () => {
      jest.mocked(getVersionedPackagesAsync).mockResolvedValueOnce({
        packages: ['react-native-reanimated@~3.17.0'],
        messages: [],
        excludedNativeModules: [],
      });

      await installAsync(
        ['react-native-reanimated'],
        { projectRoot, pnpm: true },
        packageManagerArguments
      );

      expect(checkPackagesCompatibility).not.toHaveBeenCalled();
      expect(getVersionedPackagesAsync).toHaveBeenCalledWith(projectRoot, {
        packages: ['react-native-reanimated'],
        sdkVersion: '54.0.0',
        pkg: {},
      });
      expect(packageManager.addAsync).toHaveBeenCalledWith([
        ...packageManagerArguments,
        'react-native-reanimated@~3.17.0',
      ]);
    });

    it('still delegates an explicit dependency check', async () => {
      const packages = ['expo-image'];
      const options = { projectRoot, check: true, fix: false, pnpm: true };

      await installAsync(packages, options, packageManagerArguments);

      expect(checkPackagesAsync).toHaveBeenCalledWith(projectRoot, {
        packages,
        options,
        packageManager,
        packageManagerArguments,
      });
      expect(checkPackagesCompatibility).not.toHaveBeenCalled();
      expect(getVersionedPackagesAsync).not.toHaveBeenCalled();
      expect(packageManager.addAsync).not.toHaveBeenCalled();
    });
  });

  it('installs resolved dev dependencies with forwarded package-manager arguments', async () => {
    jest.mocked(getVersionedPackagesAsync).mockResolvedValueOnce({
      packages: ['eslint@^9.0.0'],
      messages: [],
      excludedNativeModules: [],
    });

    await installAsync(['eslint'], { projectRoot, dev: true, pnpm: true }, packageManagerArguments);

    expect(packageManager.addDevAsync).toHaveBeenCalledWith([
      ...packageManagerArguments,
      'eslint@^9.0.0',
    ]);
    expect(packageManager.addAsync).not.toHaveBeenCalled();
    expect(applyPluginsAsync).toHaveBeenCalledWith(projectRoot, ['eslint@^9.0.0']);
  });
});
