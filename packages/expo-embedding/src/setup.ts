import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { detachSharedNodeModules, getPackageManager, getInstallArguments } from './dependencies';
import { exists } from './files';
import { runCommand } from './process';
import { scaffoldExpoProject } from './scaffold';

export async function prepareExpoProject(
  root: string,
  command: 'init' | 'install',
  frozen: boolean,
  platform: 'ios' | 'android' = 'ios'
): Promise<boolean> {
  const isNewExpoProject = !(await exists(join(root, 'expo/package.json')));
  if (isNewExpoProject) {
    if (frozen)
      throw new Error(
        'No Expo app exists for a frozen install. Run init locally and commit expo/package.json and its lockfile first.'
      );
    if (command !== 'init') {
      throw new Error(
        'No Expo app exists yet. Run npx expo-embedding init before installing packages.'
      );
    }
    const versions = {
      expo: '58.0.14',
      react: '19.3.0',
      'react-native': '0.88.0',
    };
    await scaffoldExpoProject(root, versions, platform);
    process.stdout.write('Created expo/ with a Main scene.\n');
  } else if (command === 'init') {
    await scaffoldExpoProject(root, {}, platform);
  }
  return isNewExpoProject;
}

export async function installDependencies(
  root: string,
  frozen: boolean,
  installRoot = join(root, 'expo')
) {
  const manager = await getPackageManager(installRoot, root);
  const args = await getInstallArguments(installRoot, manager, frozen, root);
  const backup = await detachSharedNodeModules(join(root, 'expo'), frozen);
  if (backup)
    process.stdout.write(
      `Backed up shared dependency links and any legacy linked lockfiles to ${backup}. Installing app-owned dependencies.\n`
    );
  process.stdout.write(`Installing dependencies from expo/package.json with ${manager}…\n`);
  await runCommand(manager, args, { cwd: installRoot });
  return manager;
}

export async function installPackages(
  root: string,
  manager: Awaited<ReturnType<typeof getPackageManager>>,
  packages: string[]
): Promise<void> {
  const projectRoot = join(root, 'expo');
  const requireFromApp = createRequire(join(projectRoot, 'package.json'));
  const expoRoot = dirname(requireFromApp.resolve('expo/package.json'));
  process.stdout.write(`Installing ${packages.join(', ')} in expo/…\n`);
  await runCommand(
    process.execPath,
    [join(expoRoot, 'bin/cli'), 'install', `--${manager}`, ...packages],
    { cwd: projectRoot }
  );
  process.stdout.write('Dependencies installed. Refreshing the native integration…\n');
}
