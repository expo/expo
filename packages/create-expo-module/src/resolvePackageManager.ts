import { execSync } from 'child_process';

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn';

/** Determine which package manager to use for installing dependencies based on how the process was started. */
export function resolvePackageManager(): PackageManagerName {
  // Attempt to detect if the user started the command using `yarn` or `pnpm`
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent?.startsWith('yarn')) {
    return 'yarn';
  } else if (userAgent?.startsWith('pnpm')) {
    return 'pnpm';
  } else if (userAgent?.startsWith('npm')) {
    return 'npm';
  }

  // Try availability
  if (isPackageManagerAvailable('yarn')) {
    return 'yarn';
  } else if (isPackageManagerAvailable('pnpm')) {
    return 'pnpm';
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
    case 'npm':
    default:
      return `npm run ${cmd}`;
  }
}
