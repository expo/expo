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

  it('passes packageManagerArguments through to addAsync', async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'react-native',
          packageType: 'dependencies',
          expectedVersionOrRange: 'npm:react-native-tvos@0.85-stable',
          actualVersion: '0.83.0-0',
        },
      ],
      packageManagerArguments: ['--no-save'],
      sdkVersion: '55.0.0',
    });

    expect(packageManager.addAsync).toHaveBeenCalledWith([
      '--no-save',
      'react-native@npm:react-native-tvos@0.85-stable',
    ]);
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
});
