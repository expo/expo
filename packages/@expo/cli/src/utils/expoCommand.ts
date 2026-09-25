import { resolvePackageManager, type NodePackageManager } from '@expo/package-manager';

export type PackageManagerName = NodePackageManager['name'];

/**
 * Resolve the package manager to use when suggesting follow-up `expo` commands in terminal hints,
 * e.g. `pnpm expo install --check` instead of `npx expo install --check`.
 *
 * This uses the project's lockfile (including the monorepo root), matching the package manager
 * that `expo install` picks, so the hint doesn't depend on how the current command was launched.
 */
export function resolvePackageManagerForHints(projectRoot: string): PackageManagerName {
  return resolvePackageManager(projectRoot) ?? 'npm';
}

/**
 * Format an `expo` CLI command the way the docs present it for each package manager,
 * e.g. `npx expo start`, `yarn expo start`, `pnpm expo start`, `bun expo start`.
 */
export function formatExpoCommand(packageManager: PackageManagerName, args: string): string {
  // npm is the only package manager that uses a separate binary (`npx`) to run local binaries.
  return packageManager === 'npm' ? `npx expo ${args}` : `${packageManager} expo ${args}`;
}
