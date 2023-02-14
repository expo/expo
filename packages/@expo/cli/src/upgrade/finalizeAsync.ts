import { getConfig, PackageJSONConfig, ProjectConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';

import { installAsync } from '../install/installAsync';
import * as Log from '../log';

/**
 * Finalize an upgrade after new dependencies are installed.
 * Note, this is separated from the original upgrade command.
 * Doing so allows us to invoke `npx expo upgrade --finalize` in a new process.
 * It will include possible new changes from the newer version.
 */
export async function finalizeAsync(
  projectRoot: string,
  options: { npm?: boolean; yarn?: boolean; pnpm?: boolean }
) {
  const projectConfig = getConfig(projectRoot);
  const packageManager = PackageManager.createForProject(projectRoot, options);

  await performPackageModificationsAsync(projectRoot, projectConfig, packageManager);
}

async function performPackageModificationsAsync(
  projectRoot: string,
  projectConfig: ProjectConfig,
  packageManager: PackageManager.NodePackageManager
) {
  const modifications = getPackagesToModify(projectConfig.pkg);

  if (modifications.remove.length) {
    Log.log(`Removing packages: ${modifications.remove.join(', ')}`);
    await packageManager.removeAsync(modifications.remove);
  }

  if (modifications.add.length) {
    Log.log(`Adding packages: ${modifications.add.join(', ')}`);
    await installAsync(modifications.add, { projectRoot });
  }
}

/** Exposed for testing */
export function getPackagesToModify(pkgJson: PackageJSONConfig): {
  remove: string[];
  add: string[];
} {
  // Do some evergreen upgrades

  const pkgsToInstall: string[] = [];
  const pkgsToRemove: string[] = [];

  // Remove deprecated packages
  ['react-native-unimodules'].forEach((pkg) => {
    if (pkgJson.dependencies?.[pkg] || pkgJson.devDependencies?.[pkg]) {
      pkgsToRemove.push(pkg);
    }
  });

  if (pkgJson.dependencies?.['@react-native-community/async-storage']) {
    //@react-native-async-storage/async-storage
    pkgsToInstall.push('@react-native-async-storage/async-storage');
    pkgsToRemove.push('@react-native-community/async-storage');
  }

  if (pkgJson.dependencies?.['expo-auth-session']) {
    pkgsToInstall.push('expo-random');
  }

  // See: https://reactnative.dev/blog/2023/01/03/typescript-first#declarations-shipped-with-react-native
  if (
    pkgJson.dependencies?.['@types/react-native'] ||
    pkgJson.devDependencies?.['@types/react-native']
  ) {
    pkgsToRemove.push('@types/react-native');
  }

  return {
    remove: pkgsToRemove,
    add: pkgsToInstall,
  };
}
