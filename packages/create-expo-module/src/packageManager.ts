import { createForProject } from '@expo/package-manager';

import { PackageManagerName } from './resolvePackageManager';

export async function installDependencies(
  packageManager: PackageManagerName,
  appPath: string,
  ...args: string[]
) {
  const manager = createForProject(appPath, {
    silent: true,
    bun: packageManager === 'bun',
    npm: packageManager === 'npm',
    pnpm: packageManager === 'pnpm',
    yarn: packageManager === 'yarn',
  });

  await manager.installAsync();
}
