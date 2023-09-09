/**
 * Parse the given code and return an array of dependencies.
 */
export declare function findDependencies(projectRoot: string, code: string): string[];
/**
 * Parse the given code and return an array of local dependencies with relative paths to the projectRoot.
 */
export declare function findLocalDependencies(projectRoot: string, code: string): string[];
/**
 * Parse the given file and return an array of local dependencies.
 */
export declare function findLocalDependenciesFromFileAsync(projectRoot: string, modulePath: string): Promise<string[]>;
/**
 * Parse the given code and return an array of local dependencies with relative paths to the projectRoot.
 * For each dependency, will recursively find transitive dependencies.
 */
export declare function findLocalDependenciesFromFileRecursiveAsync(projectRoot: string, modulePath: string): Promise<string[]>;
/**
 * Get the absolute file path from the given module path.
 */
export declare function getAbsoluteModulePath(projectRoot: string, modulePath: string): string;
