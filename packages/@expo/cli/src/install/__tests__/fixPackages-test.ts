import * as PackageManager from '@expo/package-manager';

import { applyPluginsAsync } from '../applyPlugins';
import { fixPackagesAsync } from '../fixPackages';
import { installExpoPackageAsync } from '../installExpoPackage';

jest.mock('../../log');
jest.mock('../applyPlugins', () => ({
  applyPluginsAsync: jest.fn(),
}));
jest.mock('../installExpoPackage', () => ({
  installExpoPackageAsync: jest.fn(),
}));
jest.mock('../../start/doctor/dependencies/getVersionedPackages', () => ({
  getOperationLog: jest.fn(() => []),
}));

describe(fixPackagesAsync, () => {
  beforeEach(() => {
    jest.mocked(applyPluginsAsync).mockClear();
    jest.mocked(installExpoPackageAsync).mockClear();
  });

  it('builds an npm-alias install spec for a TV-corrected react-native dep', async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'react-native',
          packageType: 'dependencies',
          // Produced by `findIncorrectDependencies` for a TV project.
          expectedVersionOrRange: 'npm:react-native-tvos@0.85-stable',
          actualVersion: '0.83.0-0',
        },
      ],
      packageManagerArguments: [],
      sdkVersion: '55.0.0',
    });

    expect(packageManager.addAsync).toHaveBeenCalledWith([
      'react-native@npm:react-native-tvos@0.85-stable',
    ]);
    // The plugin pass should still operate on the package name, not the install spec.
    expect(applyPluginsAsync).toHaveBeenCalledWith('/path/to/project', ['react-native']);
    // No expo upgrade required, so installExpoPackageAsync should not have been called.
    expect(installExpoPackageAsync).not.toHaveBeenCalled();
  });

  it('fixes multiple runtime dependencies with exact versions and forwarded arguments', async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'expo-sms',
          packageType: 'dependencies',
          expectedVersionOrRange: '~14.0.0',
          actualVersion: '9.0.0',
        },
        {
          packageName: 'expo-auth-session',
          packageType: 'dependencies',
          expectedVersionOrRange: '~7.0.0',
          actualVersion: '4.0.0',
        },
      ],
      packageManagerArguments: ['--no-save', '--ignore-scripts'],
      sdkVersion: '55.0.0',
    });

    expect(packageManager.addAsync).toHaveBeenCalledWith([
      '--no-save',
      '--ignore-scripts',
      'expo-sms@~14.0.0',
      'expo-auth-session@~7.0.0',
    ]);
    expect(packageManager.addDevAsync).not.toHaveBeenCalled();
    expect(applyPluginsAsync).toHaveBeenCalledWith('/path/to/project', [
      'expo-sms',
      'expo-auth-session',
    ]);
  });

  it('groups runtime and dev dependencies into separate package-manager operations', async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'expo-sms',
          packageType: 'dependencies',
          expectedVersionOrRange: '~14.0.0',
          actualVersion: '9.0.0',
        },
        {
          packageName: 'typescript',
          packageType: 'devDependencies',
          expectedVersionOrRange: '^5.9.0',
          actualVersion: '5.7.0',
        },
      ],
      packageManagerArguments: ['--ignore-scripts'],
      sdkVersion: '55.0.0',
    });

    expect(packageManager.addAsync).toHaveBeenCalledWith(['--ignore-scripts', 'expo-sms@~14.0.0']);
    expect(packageManager.addDevAsync).toHaveBeenCalledWith([
      '--ignore-scripts',
      'typescript@^5.9.0',
    ]);
    expect(applyPluginsAsync).toHaveBeenCalledWith('/path/to/project', ['expo-sms']);
  });

  it('routes through installExpoPackageAsync when expo itself is outdated', async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'expo',
          packageType: 'dependencies',
          expectedVersionOrRange: '^55.0.0',
          actualVersion: '54.0.0',
        },
        {
          packageName: 'react-native',
          packageType: 'dependencies',
          expectedVersionOrRange: 'npm:react-native-tvos@0.85-stable',
          actualVersion: '0.83.0-0',
        },
      ],
      packageManagerArguments: [],
      sdkVersion: '55.0.0',
    });

    expect(installExpoPackageAsync).toHaveBeenCalledWith('/path/to/project', {
      packageManager,
      packageManagerArguments: [],
      expoPackageToInstall: 'expo@^55.0.0',
      followUpCommandArgs: ['--fix'],
    });
    // When expo is being upgraded, we bail early and don't run addAsync directly.
    expect(packageManager.addAsync).not.toHaveBeenCalled();
  });

  it('forwards --expo-only when expo itself is outdated in Expo-only mode', async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'expo',
          packageType: 'dependencies',
          expectedVersionOrRange: '^55.0.0',
          actualVersion: '54.0.0',
        },
      ],
      packageManagerArguments: [],
      sdkVersion: '55.0.0',
      expoOnly: true,
    });

    expect(installExpoPackageAsync).toHaveBeenCalledWith('/path/to/project', {
      packageManager,
      packageManagerArguments: [],
      expoPackageToInstall: 'expo@^55.0.0',
      followUpCommandArgs: ['--fix', '--expo-only'],
    });
  });
});
