import * as PackageManager from '@expo/package-manager';
import { execSync } from 'child_process';

import { CLI_NAME } from './cmd';

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';

const debug = require('debug')('expo:init:resolvePackageManager') as typeof console.log;

/** Determine which package manager to use for installing dependencies based on how the process was started. */
export function resolvePackageManager(): PackageManagerName {
  // Attempt to detect if the user started the command using `yarn` or `pnpm` or `bun`
  const userAgent = process.env.npm_config_user_agent;
  debug('npm_config_user_agent:', userAgent);
  if (userAgent?.startsWith('yarn')) {
    return 'yarn';
  } else if (userAgent?.startsWith('pnpm')) {
    return 'pnpm';
  } else if (userAgent?.startsWith('bun')) {
    return 'bun';
  } else if (userAgent?.startsWith('npm')) {
    return 'npm';
  }

  // Try availability
  if (isPackageManagerAvailable('yarn')) {
    return 'yarn';
  } else if (isPackageManagerAvailable('pnpm')) {
    return 'pnpm';
  } else if (isPackageManagerAvailable('bun')) {
    return 'bun';
  }

  return 'npm';
}

export function isPackageManagerAvailable(manager: PackageManagerName): boolean {
  try {
    execSync(`${manager} --version`, { stdio: 'ignore' });
    return true;
  } catch {}
  return false;
}

export function formatRunCommand(packageManager: PackageManagerName, cmd: string) {
  switch (packageManager) {
    case 'pnpm':
      return `pnpm run ${cmd}`;
    case 'yarn':
      return `yarn ${cmd}`;
    case 'bun':
      return `bun run ${cmd}`;
    case 'npm':
    default:
      return `npm run ${cmd}`;
  }
}

export function formatSelfCommand() {
  const packageManager = resolvePackageManager();
  switch (packageManager) {
    case 'pnpm':
      return `pnpx ${CLI_NAME}`;
    case 'bun':
      return `bunx ${CLI_NAME}`;
    case 'yarn':
    case 'npm':
    default:
      return `npx ${CLI_NAME}`;
  }
}

function createPackageManager(
  packageManager: PackageManagerName,
  options?: PackageManager.PackageManagerOptions
) {
  switch (packageManager) {
    case 'yarn':
      return new PackageManager.YarnPackageManager(options);
    case 'pnpm':
      return new PackageManager.PnpmPackageManager(options);
    case 'bun':
      return new PackageManager.BunPackageManager(options);
    case 'npm':
    default:
      return new PackageManager.NpmPackageManager(options);
  }
}

export async function installDependenciesAsync(
  projectRoot: string,
  packageManager: PackageManagerName,
  flags: { silent: boolean } = { silent: false }
) {
  await createPackageManager(packageManager, {
    cwd: projectRoot,
    silent: flags.silent,
  }).installAsync();
}

export async function configurePackageManager(
  projectRoot: string,
  packageManager: PackageManagerName,
  flags: { silent: boolean } = { silent: false }
) {
  const manager = createPackageManager(packageManager, { cwd: projectRoot, ...flags });
  switch (manager.name) {
    case 'pnpm':
      await manager.runAsync(['config', '--location', 'project', 'set', 'node-linker', 'hoisted']);
      break;

    case 'yarn': {
      const yarnVersion = await manager.versionAsync();
      const majorVersion = parseInt(yarnVersion.split('.')[0], 10);

      if (majorVersion >= 2) {
        await manager.runAsync(['config', 'set', 'nodeLinker', 'node-modules']);
      }

      break;
    }
  }
}
