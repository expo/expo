import fs from 'fs';
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
export function resolveLinkedDependencyPaths(projectRoot: string): string[] {
  const linkedPaths = readDependencyNames(projectRoot).map((name) =>
    resolveLinkedDependencyPath(projectRoot, name)
  );
  return [...new Set(linkedPaths.filter((linkedPath) => linkedPath !== null))].sort();
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

/**
 * Find `node_modules/<name>` the way Node resolution does, walking up from the project root.
 * Returns its real path when that path leaves `node_modules`, which means the dependency is a link.
 */
function resolveLinkedDependencyPath(projectRoot: string, name: string): string | null {
  for (let dir = projectRoot; ; dir = path.dirname(dir)) {
    let realPath: string | null = null;
    try {
      // Node resolves a link with `fs.realpathSync`, so use the same algorithm.
      // The native realpath expands Windows 8.3 names such as `RUNNER~1`, which the loader keys keep.
      realPath = fs.realpathSync(path.join(dir, 'node_modules', name));
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
