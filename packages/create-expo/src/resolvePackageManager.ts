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

export async function installDependenciesAsync(
  projectRoot: string,
  packageManager: PackageManagerName,
  flags: { silent: boolean } = { silent: false }
) {
  const options = { cwd: projectRoot, silent: flags.silent };
  if (packageManager === 'yarn') {
    await new PackageManager.YarnPackageManager(options).installAsync();
  } else if (packageManager === 'pnpm') {
    await new PackageManager.PnpmPackageManager(options).installAsync();
  } else if (packageManager === 'bun') {
    await new PackageManager.BunPackageManager(options).installAsync();
  } else {
    await new PackageManager.NpmPackageManager(options).installAsync();
  }
}
