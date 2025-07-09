import { getMetroServerRoot, getMetroWorkspaceGlobs } from '@expo/config/paths';
import fs from 'fs';
import { globSync } from 'glob';
import path from 'path';

function readJsonFile(filePath: string) {
  // Read with fs
  const file = fs.readFileSync(filePath, 'utf8');
  // Parse with JSON.parse
  return JSON.parse(file);
}

function isValidJsonFile(filePath: string): boolean {
  try {
    // Throws if invalid or unable to read.
    readJsonFile(filePath);
    return true;
  } catch {
    return false;
  }
}

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
    .map((glob) => {
      // Globs should only contain `/` as separator, even on Windows.
      return globSync(path.posix.join(glob, 'package.json').replace(/\\/g, '/'), {
        cwd: workspaceProjectRoot,
        absolute: true,
        ignore: ['**/@(Carthage|Pods|node_modules)/**'],
      }).map((pkgPath) => {
        return isValidJsonFile(pkgPath) ? pkgPath : null;
      });
    })
    .flat()
    .filter(Boolean)
    .map((p) => path.join(p as string));
}

/**
 * @param workspaceProjectRoot root file path for a yarn workspace.
 * @returns list of package.json file paths that are linked to the yarn workspace.
 */
export function resolveAllWorkspacePackageJsonPaths(workspaceProjectRoot: string) {
  try {
    // Extract the "packages" array or use "workspaces" as packages array (yarn workspaces spec).
    const workspaceGlobs = getMetroWorkspaceGlobs(workspaceProjectRoot);
    if (!workspaceGlobs?.length) return [];
    // Glob all package.json files and return valid paths.
    return globAllPackageJsonPaths(workspaceProjectRoot, workspaceGlobs);
  } catch {
    return [];
  }
}

/**
 * @param projectRoot file path to app's project root
 * @returns list of node module paths to watch in Metro bundler, ex: `['/Users/me/app/node_modules/', '/Users/me/app/apps/my-app/', '/Users/me/app/packages/my-package/']`
 */
export function getWatchFolders(projectRoot: string): string[] {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const workspaceRoot = getMetroServerRoot(resolvedProjectRoot);
  // Rely on default behavior in standard projects.
  if (workspaceRoot === resolvedProjectRoot) {
    return [];
  }

  const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);
  if (!packages?.length) {
    return [];
  }

  return uniqueItems([
    path.join(workspaceRoot, 'node_modules'),
    ...packages.map((pkg) => path.dirname(pkg)),
  ]);
}

function uniqueItems(items: string[]): string[] {
  return [...new Set(items)];
}
