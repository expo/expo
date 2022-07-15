import JsonFile from '@expo/json-file';
import assert from 'assert';
import { sync as globSync } from 'glob';
import path from 'path';

import { getWorkspaceRoot } from './getModulesPaths';

/**
 * @param workspaceProjectRoot Root file path for the yarn workspace
 * @param linkedPackages List of folders that contain linked node modules, ex: `['packages/*', 'apps/*']`
 * @returns List of valid package.json file paths, ex: `['/Users/me/app/apps/my-app/package.json', '/Users/me/app/packages/my-package/package.json']`
 */
export function globAllPackageJsonPaths(
  workspaceProjectRoot: string,
  linkedPackages: string[]
): string[] {
  return linkedPackages
    .map(glob => {
      return globSync(path.join(glob, 'package.json').replace(/\\/g, '/'), {
        cwd: workspaceProjectRoot,
        absolute: true,
        ignore: ['**/@(Carthage|Pods|node_modules)/**'],
      }).map(pkgPath => {
        try {
          JsonFile.read(pkgPath);
          return pkgPath;
        } catch {
          // Skip adding path if the package.json is invalid or cannot be read.
        }
        return null;
      });
    })
    .flat()
    .filter(Boolean)
    .map(p => path.join(p as string));
}

function getWorkspacePackagesArray({ workspaces }: any): string[] {
  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  assert(workspaces?.packages, 'Could not find a `workspaces` object in the root package.json');

  return workspaces.packages;
}

/**
 * @param workspaceProjectRoot root file path for a yarn workspace.
 * @returns list of package.json file paths that are linked to the yarn workspace.
 */
export function resolveAllWorkspacePackageJsonPaths(workspaceProjectRoot: string) {
  try {
    const rootPackageJsonFilePath = path.join(workspaceProjectRoot, 'package.json');
    // Could throw if package.json is invalid.
    const rootPackageJson = JsonFile.read(rootPackageJsonFilePath);

    // Extract the "packages" array or use "workspaces" as packages array (yarn workspaces spec).
    const packages = getWorkspacePackagesArray(rootPackageJson);

    // Glob all package.json files and return valid paths.
    return globAllPackageJsonPaths(workspaceProjectRoot, packages);
  } catch {
    return [];
  }
}

/**
 * @param projectRoot file path to app's project root
 * @returns list of node module paths to watch in Metro bundler, ex: `['/Users/me/app/node_modules/', '/Users/me/app/apps/my-app/', '/Users/me/app/packages/my-package/']`
 */
export function getWatchFolders(projectRoot: string): string[] {
  const workspaceRoot = getWorkspaceRoot(path.resolve(projectRoot));
  // Rely on default behavior in standard projects.
  if (!workspaceRoot) {
    return [];
  }

  const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);
  if (!packages.length) {
    return [];
  }

  return uniqueItems([
    path.join(workspaceRoot, 'node_modules'),
    ...packages.map(pkg => path.dirname(pkg)),
  ]);
}

function uniqueItems(items: string[]): string[] {
  return [...new Set(items)];
}
