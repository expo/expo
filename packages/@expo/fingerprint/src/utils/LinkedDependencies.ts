import fs from 'fs/promises';
import path from 'path';

import { toPosixPath } from './Path';

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

/**
 * The project-relative POSIX paths of the dependencies in the project's `package.json` that resolve
 * to a directory outside `node_modules`, such as a linked workspace package in a monorepo.
 */
export async function resolveLinkedDependencyPathsAsync(projectRoot: string): Promise<string[]> {
  const dependencyNames = await readDependencyNamesAsync(projectRoot);
  const linkedPaths = await Promise.all(
    dependencyNames.map((name) => resolveLinkedDependencyPathAsync(projectRoot, name))
  );
  return [...new Set(linkedPaths.filter((linkedPath) => linkedPath !== null))].sort();
}

async function readDependencyNamesAsync(projectRoot: string): Promise<string[]> {
  let packageJson: Partial<Record<(typeof DEPENDENCY_FIELDS)[number], Record<string, string>>>;
  try {
    packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    return [];
  }
  return DEPENDENCY_FIELDS.flatMap((field) => Object.keys(packageJson[field] ?? {}));
}

/**
 * Find `node_modules/<name>` the way Node resolution does, walking up from the project root.
 * Returns its real path when that path leaves `node_modules`, which means the dependency is a link.
 */
async function resolveLinkedDependencyPathAsync(
  projectRoot: string,
  name: string
): Promise<string | null> {
  for (let dir = projectRoot; ; dir = path.dirname(dir)) {
    let realPath: string | null = null;
    try {
      realPath = await fs.realpath(path.join(dir, 'node_modules', name));
    } catch {}
    if (realPath !== null) {
      const relativePath = toPosixPath(path.relative(projectRoot, realPath));
      return relativePath.split('/').includes('node_modules') ? null : relativePath;
    }
    if (path.dirname(dir) === dir) {
      return null;
    }
  }
}
