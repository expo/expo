/**
 * ResolveFrom.silent that accepts transitive module IDs.
 *
 * @example
 * transitiveResolveFrom(projectRoot, ['expo/package.json', 'expo-modules-core/package.json'])
 */
export declare function transitiveResolveFrom(projectRoot: string, moduleIds: string[]): string | null;
