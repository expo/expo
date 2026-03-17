import resolveFrom from 'resolve-from';

/**
 * ResolveFrom.silent that accepts transitive module IDs.
 *
 * @example
 * transitiveResolveFrom(projectRoot, ['expo/package.json', 'expo-modules-core/package.json'])
 */
export function transitiveResolveFrom(projectRoot: string, moduleIds: string[]): string | null {
  for (const moduleId of moduleIds) {
    const resolved = resolveFrom.silent(projectRoot, moduleId);
    if (resolved) {
      return resolved;
    }
  }
  return null;
}
