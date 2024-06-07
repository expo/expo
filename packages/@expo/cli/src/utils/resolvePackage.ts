import path from 'path';
import resolveFrom from 'resolve-from';

/**
 * Resolve the path to a transitive dependency from the project.
 */
export function resolveProjectTransitiveDependency(
  projectRoot: string,
  ...deps: string[]
): string | null {
  let currentDir: string | null = projectRoot;
  for (let i = 0; i < deps.length; ++i) {
    const dep = deps[i];
    const target = i === deps.length - 1 ? dep : `${dep}/package.json`;
    const resolved = resolveFrom.silent(currentDir, target);
    if (!resolved) {
      currentDir = null;
      break;
    }
    if (i === deps.length - 1) {
      return resolved;
    }
    currentDir = path.dirname(resolved);
  }
  return null;
}
