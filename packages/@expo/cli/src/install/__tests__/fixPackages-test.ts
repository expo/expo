import { getPackageJson } from '@expo/config';
import * as PackageManager from '@expo/package-manager';

import { applyPluginsAsync } from '../applyPlugins';
import { fixPackagesAsync } from '../fixPackages';
import { installExpoPackageAsync } from '../installExpoPackage';
import { updatePnpmCatalogAsync } from '../updatePnpmCatalog';

jest.mock('../../log');
jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getPackageJson: jest.fn(() => ({})),
}));
jest.mock('../applyPlugins', () => ({
  applyPluginsAsync: jest.fn(),
}));
jest.mock('../installExpoPackage', () => ({
  installExpoPackageAsync: jest.fn(),
}));
jest.mock('../updatePnpmCatalog', () => ({
  updatePnpmCatalogAsync: jest.fn(),
}));
jest.mock('../../start/doctor/dependencies/getVersionedPackages', () => ({
  getOperationLog: jest.fn(() => []),
}));

describe(fixPackagesAsync, () => {
  beforeEach(() => {
    jest.mocked(getPackageJson).mockReturnValue({} as ReturnType<typeof getPackageJson>);
    jest.mocked(applyPluginsAsync).mockClear();
    jest.mocked(installExpoPackageAsync).mockClear();
    jest.mocked(updatePnpmCatalogAsync).mockClear();
  });

  it('updates pnpm catalog entries without replacing manifest references', async () => {
    const packageManager = Object.assign(PackageManager.createForProject('/path/to/project'), {
      name: 'pnpm',
      installAsync: jest.fn(),
    });
    jest.mocked(getPackageJson).mockReturnValue({
      dependencies: { 'expo-sms': 'catalog:', 'expo-auth-session': 'catalog:expo' },
      devDependencies: { 'expo-calendar': 'catalog:' },
    } as ReturnType<typeof getPackageJson>);

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'expo-sms',
          packageType: 'dependencies',
          expectedVersionOrRange: '~1.0.0',
          actualVersion: '0.9.0',
        },
        {
          packageName: 'expo-auth-session',
          packageType: 'dependencies',
          expectedVersionOrRange: '~2.0.0',
          actualVersion: '1.9.0',
        },
        {
          packageName: 'expo-calendar',
          packageType: 'devDependencies',
          expectedVersionOrRange: '~3.0.0',
          actualVersion: '2.9.0',
        },
      ],
      packageManagerArguments: [],
      sdkVersion: '55.0.0',
    });

    expect(updatePnpmCatalogAsync).toHaveBeenCalledWith('/path/to/project', [
      { name: 'expo-sms', catalog: '', version: '~1.0.0' },
      { name: 'expo-auth-session', catalog: 'expo', version: '~2.0.0' },
      { name: 'expo-calendar', catalog: '', version: '~3.0.0' },
    ]);
    expect(packageManager.installAsync).toHaveBeenCalledWith([]);
    expect(packageManager.addAsync).not.toHaveBeenCalled();
    expect(packageManager.addDevAsync).not.toHaveBeenCalled();
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
      installFromCatalog: false,
    });
    // When expo is being upgraded, we bail early and don't run addAsync directly.
    expect(packageManager.addAsync).not.toHaveBeenCalled();
  });

  it('updates the catalog before reinstalling expo', async () => {
    const packageManager = Object.assign(PackageManager.createForProject('/path/to/project'), {
      name: 'pnpm',
    });
    jest.mocked(getPackageJson).mockReturnValue({
      dependencies: { expo: 'catalog:' },
    } as ReturnType<typeof getPackageJson>);

    await fixPackagesAsync('/path/to/project', {
      packageManager,
      packages: [
        {
          packageName: 'expo',
          packageType: 'dependencies',
          expectedVersionOrRange: '~57.0.25',
          actualVersion: '57.0.22',
        },
      ],
      packageManagerArguments: [],
      sdkVersion: '57.0.0',
    });

    expect(updatePnpmCatalogAsync).toHaveBeenCalledWith('/path/to/project', [
      { name: 'expo', catalog: '', version: '~57.0.25' },
    ]);
    expect(installExpoPackageAsync).toHaveBeenCalledWith(
      '/path/to/project',
      expect.objectContaining({ installFromCatalog: true })
    );
  });
});
