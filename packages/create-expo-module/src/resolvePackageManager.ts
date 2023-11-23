import { resolveCurrentPackageManager, type NodePackageManager } from '@expo/package-manager';
import { execSync } from 'child_process';

export type PackageManagerName = NodePackageManager['name'];

/** Determine which package manager to use for installing dependencies based on how the process was started. */
export function resolvePackageManager(): PackageManagerName {
  const currentManager = resolveCurrentPackageManager();
  if (currentManager) {
    return currentManager;
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

function isPackageManagerAvailable(manager: PackageManagerName): boolean {
  try {
    execSync(`${manager} --version`, { stdio: 'ignore' });
    return true;
  } catch {}
  return false;
}

export function formatRunCommand(manager: PackageManagerName, cmd: string) {
  switch (manager) {
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
