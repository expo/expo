import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';

import { Log } from '../../log';
import { installExpoPackageAsync } from '../installExpoPackage';

jest.mock('../../log');

jest.mock('@expo/config', () => ({
  getProjectConfigDescriptionWithPaths: jest.fn(),
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

jest.mock('../../utils/getRunningProcess', () => ({
  getRunningProcess: jest.fn(),
}));

describe(installExpoPackageAsync, () => {
  it(`Installs expo package with the project's package manager and then runs 'npx expo install' with specified args`, async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');
    await installExpoPackageAsync('/path/to/project', {
      packageManager,
      packageManagerArguments: [],
      expoPackageToInstall: 'expo@latest',
      followUpCommandArgs: ['--fix'],
    });
    expect(packageManager.addAsync).toHaveBeenCalledWith(['expo@latest']);
    expect(spawnAsync).toHaveBeenCalledWith(
      'npx',
      ['expo', 'install', '--fix'],
      expect.objectContaining({
        cwd: '/path/to/project',
        stdio: 'inherit',
      })
    );
  });

  it(`Installs expo package with the project's package manager and does not run any follow-up 'npx expo install' commands if no arguments are specified`, async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');
    await installExpoPackageAsync('/path/to/project', {
      packageManager,
      packageManagerArguments: [],
      expoPackageToInstall: 'expo@latest',
      followUpCommandArgs: [],
    });
    expect(packageManager.addAsync).toHaveBeenCalledWith(['expo@latest']);
    expect(spawnAsync).not.toBeCalled();
  });

  it(`Does not run follow-up command if first command fails`, async () => {
    const packageManager = PackageManager.createForProject('/path/to/project');
    jest.mocked(packageManager.addAsync).mockRejectedValueOnce(new Error('Something went wrong'));

    try {
      await installExpoPackageAsync('/path/to/project', {
        packageManager,
        packageManagerArguments: [],
        expoPackageToInstall: 'expo@latest',
        followUpCommandArgs: ['--fix'],
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {}
    expect(packageManager.addAsync).toHaveBeenCalledWith(['expo@latest']);
    expect(Log.error).toHaveBeenCalledWith(
      expect.stringContaining('Cannot install the latest Expo package')
    );
    expect(spawnAsync).not.toBeCalled();
  });
});
