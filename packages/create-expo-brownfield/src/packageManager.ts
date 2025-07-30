import spawnAsync from '@expo/spawn-async';

import { PackageManagerName } from './resolvePackageManager';

export async function installDependencies(
  packageManager: PackageManagerName,
  appPath: string,
  ...args: string[]
) {
  try {
    return await spawnAsync(packageManager, ['install', ...args], {
      cwd: appPath,
    });
  } catch (error: any) {
    throw new Error(
      `${packageManager} install exited with non-zero code: ${error?.status}\n\nError stack:\n${error?.stderr}`
    );
  }
}
