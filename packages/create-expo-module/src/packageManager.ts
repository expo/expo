import spawnAsync from '@expo/spawn-async';

import { PackageManagerName } from './resolvePackageManager';

export async function installDependencies(
  packageManager: PackageManagerName,
  appPath: string,
  ...args: string[]
) {
  await spawnAsync(packageManager, ['install', ...args], {
    cwd: appPath,
    stdio: 'ignore',
  });
}
