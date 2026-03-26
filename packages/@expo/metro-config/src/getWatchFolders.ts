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
 * Recursively traverse a `node_modules` directory, resolving symlinks to collect
 * the real paths of linked packages. This produces a leaner watch list for
 * installations with isolated dependencies (e.g. pnpm) by only including
 * packages that are actually depended on, rather than every workspace package.
 *
 * Returns `null` when no symlinks are found (non-isolated installation).
 */
function collectSymlinkedPackageDirs(nodeModulesDir: string) {
  const resolvedPaths = new Set<string>();
  const visited = new Set<string>();
  let hasSymlinks = false;

  function traverse(dir: string) {
    if (visited.has(dir)) return;
    visited.add(dir);

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name[0] === '.') continue;

        const targetPath = path.join(dir, entry.name);
        if (entry.name[0] === '@' && entry.isDirectory()) {
          traverse(targetPath);
        } else if (entry.isSymbolicLink()) {
          hasSymlinks = true;
          try {
            const resolvedPath = fs.realpathSync(targetPath);
            let resolvedNodeModules = path.dirname(resolvedPath);
            if (path.basename(resolvedNodeModules)[0] === '@') {
              resolvedNodeModules = path.dirname(resolvedNodeModules);
            }
            resolvedPaths.add(resolvedNodeModules);
            traverse(path.join(resolvedPath, 'node_modules'));
          } catch {
            continue;
          }
        }
      }
    } catch {
      return;
    }
  }

  traverse(nodeModulesDir);
  return hasSymlinks ? [...resolvedPaths] : null;
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

  // Check if node_modules uses symlinks (isolated dependency installations).
  // If so, only watch the packages that are actually depended on.
  const symlinks = collectSymlinkedPackageDirs(path.join(resolvedProjectRoot, 'node_modules'));
  if (symlinks) {
    const rootSymlinks = collectSymlinkedPackageDirs(path.join(workspaceRoot, 'node_modules'));
    if (rootSymlinks) {
      symlinks.push(...rootSymlinks);
    }
    return symlinks;
  }

  const packages = resolveAllWorkspacePackageJsonPaths(workspaceRoot);
  if (!packages?.length) {
    return [];
  }

  const packagePaths = new Set(packages.map((pkg) => path.dirname(pkg)));
  return [
    path.join(workspaceRoot, 'node_modules'),
    ...packagePaths,
  ];
}
