/**
 * Resolve the version of `expo` package in the project.
 */
export declare function resolveExpoVersion(projectRoot: string): string | null;
/**
 * Resolve the version of `expo-modules-autolinking` package in the project.
 */
export declare function resolveExpoAutolinkingVersion(projectRoot: string): string | null;
/**
 * Resolve the `expo` package version and check if it satisfies the provided semver range.
 * @returns `null` if the `expo` package is not found in the project.
 */
export declare function satisfyExpoVersion(projectRoot: string, range: string): boolean | null;
