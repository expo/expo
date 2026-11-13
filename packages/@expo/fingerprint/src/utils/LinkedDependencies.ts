import fs from 'fs';
import path from 'path';

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

/**
 * Create a test for a file of a dependency that the project declares and that lives outside
 * `node_modules`, such as a linked workspace package in a monorepo. The nearest `package.json`
 * above the file names its package. Lookups are cached per directory.
 */
export function createLinkedDependencyMatcher(
  projectRoot: string
): (relativePosixPath: string) => boolean {
  const dependencyNames = new Set(readDependencyNames(projectRoot));
  const packageNameCache = new Map<string, string | null>();
  return (relativePosixPath) => {
    if (dependencyNames.size === 0 || relativePosixPath.split('/').includes('node_modules')) {
      return false;
    }
    const dir = path.dirname(path.resolve(projectRoot, relativePosixPath));
    const packageName = findPackageName(dir, packageNameCache);
    return packageName !== null && dependencyNames.has(packageName);
  };
}

function readDependencyNames(projectRoot: string): string[] {
  let packageJson: Partial<Record<(typeof DEPENDENCY_FIELDS)[number], Record<string, string>>>;
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    return [];
  }
  return DEPENDENCY_FIELDS.flatMap((field) => Object.keys(packageJson[field] ?? {}));
}

function findPackageName(dir: string, cache: Map<string, string | null>): string | null {
  const cached = cache.get(dir);
  if (cached !== undefined) {
    return cached;
  }
  let packageName: string | null = null;
  try {
    // The sync read is fine: the result is cached per directory and few files reach this point.
    const { name } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    packageName = typeof name === 'string' ? name : null;
  } catch {}
  const parentDir = path.dirname(dir);
  if (packageName === null && parentDir !== dir) {
    packageName = findPackageName(parentDir, cache);
  }
  cache.set(dir, packageName);
  return packageName;
}
